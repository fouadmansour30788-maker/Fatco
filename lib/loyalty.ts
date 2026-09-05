import { prisma } from "./prisma";

export type LoyaltyProgress = {
  ruleId: string;
  serviceName: string;
  current: number; // progress toward the next reward (0 = just redeemed/none yet)
  threshold: number;
  rewardDescription: string;
};

// Read-only view of a customer's punch-card progress. Extracted from the
// counting logic in lib/sales.ts#applyLoyalty (which issues the reward when
// count % threshold === 0) so the portal dashboard can show the same numbers
// without duplicating the earning logic.
export async function getLoyaltyProgress(
  customerId: string
): Promise<LoyaltyProgress[]> {
  const rules = await prisma.loyaltyRule.findMany({
    where: { active: true, type: "PUNCH_CARD", threshold: { not: null } },
    include: { serviceType: true },
  });

  const out: LoyaltyProgress[] = [];
  for (const r of rules) {
    if (!r.serviceTypeId || !r.threshold) continue;
    const count = await prisma.transactionLine.count({
      where: {
        serviceTypeId: r.serviceTypeId,
        transaction: { customerId, status: "COMPLETED" },
      },
    });
    const current = count % r.threshold;
    if (count === 0) continue; // no progress yet — nothing to show
    out.push({
      ruleId: r.id,
      serviceName: r.serviceType?.name ?? r.name,
      current,
      threshold: r.threshold,
      rewardDescription: r.rewardDescription ?? r.name,
    });
  }
  return out;
}
