import { prisma } from "./prisma";
import { decrementInventory, applyLoyalty } from "./sales";
import { expandBundleLine, checkBundleAvailability } from "./bundles";
import { getMessagingProvider } from "./messaging";

export type PlaceOrderInput = {
  customerId: string;
  paymentMethod: string;
  shippingAddress: string;
  notes?: string;
  redeemRewardId?: string;
};

// Pure business logic for the storefront checkout flow. Mirrors recordSale in
// lib/sales.ts but defers inventory/loyalty side effects: an online order
// only touches stock + loyalty once staff mark it COMPLETED (see
// completeOrder below), matching the point at which an in-store sale would
// be rung up. A selected reward, however, is redeemed immediately at
// placement (same timing as an in-store sale) since the discount must be
// reflected in the order total right away.
export async function placeOrder(input: PlaceOrderInput) {
  const cartItems = await prisma.cartItem.findMany({
    where: { customerId: input.customerId },
    include: { item: true },
  });
  if (cartItems.length === 0) throw new Error("Your cart is empty");

  for (const c of cartItems) {
    if (c.item.kind === "BUNDLE") {
      const avail = await checkBundleAvailability(c.item.id, c.qty);
      if (!avail.ok) {
        throw new Error(
          `${c.item.name}: ${avail.shortItem} only has ${avail.available} in stock`
        );
      }
    } else if (c.item.trackStock && c.qty > c.item.stockQty) {
      throw new Error(`${c.item.name}: only ${c.item.stockQty} left in stock`);
    }
  }

  const lineGroups = await Promise.all(
    cartItems.map((c) =>
      c.item.kind === "BUNDLE"
        ? expandBundleLine(c.item, c.qty)
        : Promise.resolve([
            {
              itemId: c.item.id,
              description: c.item.name,
              qty: c.qty,
              unitPrice: c.item.salePrice,
              unitCost: c.item.costPrice,
              lineTotal: round2(c.item.salePrice * c.qty),
            },
          ])
    )
  );
  const lineCreates = lineGroups.flat();

  const subtotal = round2(lineCreates.reduce((s, l) => s + l.lineTotal, 0));
  const cost = round2(lineCreates.reduce((s, l) => s + l.unitCost * l.qty, 0));

  // Resolve the reward being redeemed, if any (must belong to the customer &
  // be available) — same validation recordSale applies to in-store sales.
  const reward = input.redeemRewardId
    ? await prisma.reward.findFirst({
        where: {
          id: input.redeemRewardId,
          customerId: input.customerId,
          status: "AVAILABLE",
        },
      })
    : null;
  const discount = reward?.value ?? 0;
  const total = round2(Math.max(0, subtotal - discount));

  const last = await prisma.transaction.findFirst({
    where: { number: { not: null } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const number = (last?.number ?? 1000) + 1;

  const tx = await prisma.transaction.create({
    data: {
      number,
      customerId: input.customerId,
      status: "DRAFT",
      channel: "ONLINE",
      fulfillmentStatus: "PENDING",
      subtotal,
      discount,
      total,
      cost,
      paymentMethod: input.paymentMethod,
      notes: input.notes,
      shippingAddress: input.shippingAddress,
      lines: { create: lineCreates },
    },
  });

  await prisma.cartItem.deleteMany({ where: { customerId: input.customerId } });

  if (reward) {
    await prisma.reward.update({
      where: { id: reward.id },
      data: { status: "REDEEMED", redeemedTxId: tx.id, redeemedAt: new Date() },
    });
    await prisma.loyaltyLedger.create({
      data: {
        customerId: input.customerId,
        transactionId: tx.id,
        type: "REDEEM",
        points: 0,
        note: `Redeemed: ${reward.description}`,
      },
    });
  }

  await notifyOrderStatus(tx.id, "received");

  return { id: tx.id, number, total, rewardDiscount: discount };
}

export async function confirmOrder(transactionId: string) {
  const tx = await requireOnlineOrder(transactionId, ["PENDING"]);
  const updated = await prisma.transaction.update({
    where: { id: tx.id },
    data: { fulfillmentStatus: "CONFIRMED" },
  });
  await notifyOrderStatus(tx.id, "confirmed");
  return updated;
}

export async function completeOrder(transactionId: string) {
  const tx = await requireOnlineOrder(transactionId, ["PENDING", "CONFIRMED"]);
  const lines = await prisma.transactionLine.findMany({
    where: { transactionId: tx.id },
  });

  await decrementInventory(
    lines.map((l) => ({
      itemId: l.itemId ?? undefined,
      qty: l.qty,
      unitCost: l.unitCost,
    })),
    `ORDER-${tx.number}`
  );

  const updated = await prisma.transaction.update({
    where: { id: tx.id },
    data: { status: "COMPLETED", fulfillmentStatus: "COMPLETED" },
  });

  if (tx.customerId) {
    await applyLoyalty({
      customerId: tx.customerId,
      transactionId: tx.id,
      total: tx.total,
      serviceTypeIds: [], // storefront orders are retail items only, no services
    });
  }

  await notifyOrderStatus(tx.id, "completed");

  return updated;
}

export async function cancelOrder(transactionId: string) {
  const tx = await requireOnlineOrder(transactionId, ["PENDING", "CONFIRMED"]);
  const updated = await prisma.transaction.update({
    where: { id: tx.id },
    data: { status: "VOID", fulfillmentStatus: "CANCELLED" },
  });

  // A cancelled online order shouldn't burn a reward that was redeemed at
  // checkout — revert it so the customer can use it on a future order/sale.
  const redeemedReward = await prisma.reward.findFirst({
    where: { redeemedTxId: tx.id, status: "REDEEMED" },
  });
  if (redeemedReward) {
    await prisma.reward.update({
      where: { id: redeemedReward.id },
      data: { status: "AVAILABLE", redeemedTxId: null, redeemedAt: null },
    });
  }

  return updated;
}

async function requireOnlineOrder(transactionId: string, allowed: string[]) {
  const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!tx || tx.channel !== "ONLINE") throw new Error("Order not found");
  if (!tx.fulfillmentStatus || !allowed.includes(tx.fulfillmentStatus)) {
    throw new Error(`Order can't be updated from status "${tx.fulfillmentStatus}"`);
  }
  return tx;
}

// Sends an automatic status update via the active messaging provider (see
// lib/messaging.ts — same provider service reminders and back-in-stock
// alerts use). Silently skipped when there's no phone on file; never throws,
// since a notification failure shouldn't block the order lifecycle action.
async function notifyOrderStatus(
  transactionId: string,
  stage: "received" | "confirmed" | "completed"
) {
  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { customer: true },
  });
  if (!tx?.customer?.phone) return;

  const messages: Record<typeof stage, string> = {
    received: `Hi ${tx.customer.name.split(" ")[0]}, FATCO received your order #${tx.number}. We'll notify you once it's confirmed.`,
    confirmed: `Hi ${tx.customer.name.split(" ")[0]}, your FATCO order #${tx.number} is confirmed and being prepared.`,
    completed: `Hi ${tx.customer.name.split(" ")[0]}, your FATCO order #${tx.number} is ready/completed. Thanks for shopping with us!`,
  };

  await getMessagingProvider().send(tx.customer.phone, messages[stage]);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
