import { prisma } from "./prisma";

export type SaleLineInput = {
  kind: "item" | "service" | "custom";
  refId?: string; // item id or service-type id
  description: string;
  qty: number;
  unitPrice: number;
};

export type RecordSaleInput = {
  customerId?: string;
  vehicleId?: string;
  paymentMethod?: string;
  mileage?: number;
  discount?: number;
  notes?: string;
  lines: SaleLineInput[];
  redeemRewardIds?: string[];
};

// Pure business logic for recording a sale/service: persists the transaction,
// decrements inventory, redeems any selected loyalty rewards, and applies
// loyalty earning. No framework imports so it can be unit-tested directly.
export async function recordSale(input: RecordSaleInput) {
  const lines = input.lines.filter((l) => l.qty > 0 && l.description);
  if (lines.length === 0) throw new Error("Add at least one line item");

  const itemIds = lines
    .filter((l) => l.kind === "item" && l.refId)
    .map((l) => l.refId!);
  const items = itemIds.length
    ? await prisma.item.findMany({ where: { id: { in: itemIds } } })
    : [];
  const itemById = new Map(items.map((i) => [i.id, i]));

  const lineCreates = lines.map((l) => {
    const item = l.kind === "item" && l.refId ? itemById.get(l.refId) : undefined;
    return {
      itemId: item?.id,
      serviceTypeId: l.kind === "service" ? l.refId : undefined,
      description: l.description,
      qty: l.qty,
      unitPrice: l.unitPrice,
      unitCost: item?.costPrice ?? 0,
      lineTotal: round2(l.unitPrice * l.qty),
    };
  });

  const subtotal = round2(lineCreates.reduce((s, l) => s + l.lineTotal, 0));
  const cost = round2(lineCreates.reduce((s, l) => s + l.unitCost * l.qty, 0));

  // Resolve rewards being redeemed (must belong to the customer & be available).
  const redeemIds = input.redeemRewardIds ?? [];
  const redeemRewards =
    redeemIds.length && input.customerId
      ? await prisma.reward.findMany({
          where: {
            id: { in: redeemIds },
            customerId: input.customerId,
            status: "AVAILABLE",
          },
        })
      : [];
  const rewardDiscount = round2(
    redeemRewards.reduce((s, r) => s + r.value, 0)
  );

  const discount = round2((input.discount ?? 0) + rewardDiscount);
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
      vehicleId: input.vehicleId,
      status: "COMPLETED",
      subtotal,
      discount,
      total,
      cost,
      paymentMethod: input.paymentMethod,
      notes: input.notes,
      mileageAtService: input.mileage,
      lines: { create: lineCreates },
    },
  });

  // Inventory: decrement tracked items + movement records.
  await decrementInventory(lineCreates, `TX-${number}`);

  if (input.vehicleId && input.mileage) {
    await prisma.vehicle.update({
      where: { id: input.vehicleId },
      data: { mileage: input.mileage },
    });
  }

  // Performing a service resets its reminder cycle: close any open reminders for
  // this vehicle + service type.
  if (input.vehicleId) {
    const servicedTypeIds = lineCreates
      .map((l) => l.serviceTypeId)
      .filter((x): x is string => Boolean(x));
    if (servicedTypeIds.length) {
      await prisma.serviceReminder.updateMany({
        where: {
          vehicleId: input.vehicleId,
          serviceTypeId: { in: servicedTypeIds },
          status: { in: ["PENDING", "SENT"] },
        },
        data: { status: "DONE" },
      });
    }
  }

  // Mark redeemed rewards + log them.
  for (const r of redeemRewards) {
    await prisma.reward.update({
      where: { id: r.id },
      data: { status: "REDEEMED", redeemedTxId: tx.id, redeemedAt: new Date() },
    });
    await prisma.loyaltyLedger.create({
      data: {
        customerId: input.customerId!,
        transactionId: tx.id,
        type: "REDEEM",
        points: 0,
        note: `Redeemed: ${r.description}`,
      },
    });
  }

  // Loyalty earning + new reward issuing.
  if (input.customerId) {
    await applyLoyalty({
      customerId: input.customerId,
      transactionId: tx.id,
      total,
      serviceTypeIds: lineCreates
        .map((l) => l.serviceTypeId)
        .filter((x): x is string => Boolean(x)),
    });
  }

  return { id: tx.id, number, total, rewardDiscount };
}

// Decrements stock for tracked items and records an InventoryMovement per
// line. Shared by recordSale (in-store POS) and lib/orders.ts (online orders,
// applied when an order is marked COMPLETED). `reference` is a free-text tag
// (e.g. "TX-1234") stored on the movement for traceability.
export async function decrementInventory(
  lines: { itemId?: string; qty: number; unitCost: number }[],
  reference: string
) {
  const itemIds = lines
    .filter((l): l is typeof l & { itemId: string } => Boolean(l.itemId))
    .map((l) => l.itemId);
  const items = itemIds.length
    ? await prisma.item.findMany({ where: { id: { in: itemIds } } })
    : [];
  const itemById = new Map(items.map((i) => [i.id, i]));

  for (const l of lines) {
    if (!l.itemId) continue;
    const item = itemById.get(l.itemId);
    if (!item?.trackStock) continue;
    await prisma.item.update({
      where: { id: l.itemId },
      data: { stockQty: { decrement: l.qty } },
    });
    await prisma.inventoryMovement.create({
      data: {
        itemId: l.itemId,
        type: "SALE",
        qty: -l.qty,
        unitCost: l.unitCost,
        reference,
      },
    });
  }
}

export async function applyLoyalty(opts: {
  customerId: string;
  transactionId: string;
  total: number;
  serviceTypeIds: string[];
}) {
  const rules = await prisma.loyaltyRule.findMany({ where: { active: true } });

  let earned = 0;
  for (const r of rules) {
    if (r.type === "POINTS_PER_AMOUNT" && r.pointsPerAmount) {
      earned += Math.round(opts.total * r.pointsPerAmount);
    }
  }
  if (earned > 0) {
    await prisma.loyaltyLedger.create({
      data: {
        customerId: opts.customerId,
        transactionId: opts.transactionId,
        type: "EARN",
        points: earned,
        note: "Spend & Earn",
      },
    });
    await prisma.customer.update({
      where: { id: opts.customerId },
      data: { pointsBalance: { increment: earned } },
    });
  }

  // Punch-card rules → auto-issue a redeemable reward when threshold reached.
  for (const r of rules) {
    if (r.type !== "PUNCH_CARD" || !r.threshold || !r.serviceTypeId) continue;
    if (!opts.serviceTypeIds.includes(r.serviceTypeId)) continue;
    const count = await prisma.transactionLine.count({
      where: {
        serviceTypeId: r.serviceTypeId,
        transaction: { customerId: opts.customerId, status: "COMPLETED" },
      },
    });
    if (count > 0 && count % r.threshold === 0) {
      await prisma.reward.create({
        data: {
          customerId: opts.customerId,
          ruleId: r.id,
          description: r.rewardDescription ?? r.name,
          value: r.rewardValue ?? 0,
          status: "AVAILABLE",
          issuedTxId: opts.transactionId,
        },
      });
      await prisma.loyaltyLedger.create({
        data: {
          customerId: opts.customerId,
          transactionId: opts.transactionId,
          type: "ADJUST",
          points: 0,
          note: `🎁 Reward earned: ${r.rewardDescription ?? r.name}`,
        },
      });
    }
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
