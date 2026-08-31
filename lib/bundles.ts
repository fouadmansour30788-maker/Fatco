import { prisma } from "./prisma";

export type ExpandedLine = {
  itemId: string;
  serviceTypeId?: string;
  description: string;
  qty: number;
  unitPrice: number;
  unitCost: number;
  lineTotal: number;
};

// Expands one BUNDLE-kind line (a customer buying `qty` of a kit) into one
// TransactionLine-shaped entry per real component, so checkout/POS/reporting
// never need their own bundle-awareness downstream — decrementInventory and
// order/receipt rendering just see ordinary item lines. unitPrice is
// allocated proportionally by each component's cost basis so the lines still
// sum exactly to bundleSalePrice * qty (the last line absorbs rounding).
export async function expandBundleLine(
  bundleItem: { id: string; name: string; salePrice: number },
  qty: number
): Promise<ExpandedLine[]> {
  const components = await prisma.bundleComponent.findMany({
    where: { bundleItemId: bundleItem.id },
    include: { componentItem: true },
  });
  if (components.length === 0) {
    throw new Error(`"${bundleItem.name}" has no components configured`);
  }

  const totalCostBasis = components.reduce(
    (s, c) => s + c.componentItem.costPrice * c.qty,
    0
  );
  const bundleTotal = round2(bundleItem.salePrice * qty);

  let allocated = 0;
  return components.map((c, i) => {
    const compQty = c.qty * qty;
    const share =
      totalCostBasis > 0
        ? (c.componentItem.costPrice * c.qty) / totalCostBasis
        : 1 / components.length;
    const isLast = i === components.length - 1;
    const lineTotal = isLast
      ? round2(bundleTotal - allocated)
      : round2(bundleTotal * share);
    allocated += lineTotal;
    return {
      itemId: c.componentItem.id,
      description: `${bundleItem.name} — ${c.componentItem.name}`,
      qty: compQty,
      unitPrice: compQty > 0 ? round2(lineTotal / compQty) : 0,
      unitCost: c.componentItem.costPrice,
      lineTotal,
    };
  });
}

// A bundle is purchasable if every tracked component has enough stock for
// the requested quantity (untracked components, e.g. labor, always pass).
export async function checkBundleAvailability(
  bundleItemId: string,
  qty: number
): Promise<{ ok: boolean; shortItem?: string; available?: number }> {
  const components = await prisma.bundleComponent.findMany({
    where: { bundleItemId },
    include: { componentItem: true },
  });
  for (const c of components) {
    const item = c.componentItem;
    if (!item.trackStock) continue;
    if (c.qty * qty > item.stockQty) {
      return { ok: false, shortItem: item.name, available: item.stockQty };
    }
  }
  return { ok: true };
}

// A bundle reads as "out of stock" on the storefront if any tracked
// component currently has zero stock, independent of requested quantity.
export async function isBundleOutOfStock(bundleItemId: string): Promise<boolean> {
  const components = await prisma.bundleComponent.findMany({
    where: { bundleItemId },
    include: { componentItem: true },
  });
  return components.some(
    (c) => c.componentItem.trackStock && c.componentItem.stockQty <= 0
  );
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
