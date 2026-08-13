import { prisma } from "./prisma";
import { decrementInventory, applyLoyalty } from "./sales";

export type PlaceOrderInput = {
  customerId: string;
  paymentMethod: string;
  shippingAddress: string;
  notes?: string;
};

// Pure business logic for the storefront checkout flow. Mirrors recordSale in
// lib/sales.ts but defers inventory/loyalty side effects: an online order
// only touches stock + loyalty once staff mark it COMPLETED (see
// completeOrder below), matching the point at which an in-store sale would
// be rung up.
export async function placeOrder(input: PlaceOrderInput) {
  const cartItems = await prisma.cartItem.findMany({
    where: { customerId: input.customerId },
    include: { item: true },
  });
  if (cartItems.length === 0) throw new Error("Your cart is empty");

  for (const c of cartItems) {
    if (c.item.trackStock && c.qty > c.item.stockQty) {
      throw new Error(`${c.item.name}: only ${c.item.stockQty} left in stock`);
    }
  }

  const lineCreates = cartItems.map((c) => ({
    itemId: c.item.id,
    description: c.item.name,
    qty: c.qty,
    unitPrice: c.item.salePrice,
    unitCost: c.item.costPrice,
    lineTotal: round2(c.item.salePrice * c.qty),
  }));

  const subtotal = round2(lineCreates.reduce((s, l) => s + l.lineTotal, 0));
  const cost = round2(lineCreates.reduce((s, l) => s + l.unitCost * l.qty, 0));

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
      total: subtotal,
      cost,
      paymentMethod: input.paymentMethod,
      notes: input.notes,
      shippingAddress: input.shippingAddress,
      lines: { create: lineCreates },
    },
  });

  await prisma.cartItem.deleteMany({ where: { customerId: input.customerId } });

  return { id: tx.id, number, total: subtotal };
}

export async function confirmOrder(transactionId: string) {
  const tx = await requireOnlineOrder(transactionId, ["PENDING"]);
  return prisma.transaction.update({
    where: { id: tx.id },
    data: { fulfillmentStatus: "CONFIRMED" },
  });
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

  return updated;
}

export async function cancelOrder(transactionId: string) {
  const tx = await requireOnlineOrder(transactionId, ["PENDING", "CONFIRMED"]);
  return prisma.transaction.update({
    where: { id: tx.id },
    data: { status: "VOID", fulfillmentStatus: "CANCELLED" },
  });
}

async function requireOnlineOrder(transactionId: string, allowed: string[]) {
  const tx = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!tx || tx.channel !== "ONLINE") throw new Error("Order not found");
  if (!tx.fulfillmentStatus || !allowed.includes(tx.fulfillmentStatus)) {
    throw new Error(`Order can't be updated from status "${tx.fulfillmentStatus}"`);
  }
  return tx;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
