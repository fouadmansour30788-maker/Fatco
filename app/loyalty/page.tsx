import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/format";
import PageHeader from "../components/PageHeader";
import RuleForm from "./RuleForm";
import { toggleRule, deleteRule } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoyaltyPage() {
  const [rules, services, topCustomers, availableRewards, items] =
    await Promise.all([
      prisma.loyaltyRule.findMany({
        include: { serviceType: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.serviceType.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
      }),
      prisma.customer.findMany({
        orderBy: { pointsBalance: "desc" },
        take: 8,
      }),
      prisma.reward.findMany({
        where: { status: "AVAILABLE" },
        include: { customer: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.item.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
        select: { name: true },
      }),
    ]);

  return (
    <>
      <PageHeader title="Loyalty" subtitle="Configurable rewards and points" />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-3">
        {/* Rules + editor */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-5">
            <h3 className="mb-4 text-sm font-semibold text-zinc-700">Rules</h3>
            <div className="space-y-3">
              {rules.map((r) => (
                <div
                  key={r.id}
                  className={`rounded-lg border border-zinc-100 p-4 text-sm ${
                    r.active ? "" : "opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{r.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="badge bg-brand/10 text-brand">
                        {r.type === "PUNCH_CARD" ? "Punch card" : "Points"}
                      </span>
                      <form action={toggleRule}>
                        <input type="hidden" name="id" value={r.id} />
                        <input
                          type="hidden"
                          name="active"
                          value={String(r.active)}
                        />
                        <button
                          type="submit"
                          className="rounded border border-zinc-200 px-2 py-0.5 text-xs hover:bg-zinc-50"
                        >
                          {r.active ? "Disable" : "Enable"}
                        </button>
                      </form>
                      <form action={deleteRule}>
                        <input type="hidden" name="id" value={r.id} />
                        <button
                          type="submit"
                          className="rounded border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500 hover:bg-zinc-50 hover:text-brand"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                  <p className="mt-1 text-zinc-500">{r.rewardDescription}</p>
                  {r.type === "PUNCH_CARD" && (
                    <p className="mt-1 text-xs text-zinc-400">
                      Every {r.threshold} ×{" "}
                      {r.serviceType?.name ?? "any service"} → reward worth{" "}
                      {formatMoney(r.rewardValue ?? 0)}
                    </p>
                  )}
                  {r.type === "POINTS_PER_AMOUNT" && (
                    <p className="mt-1 text-xs text-zinc-400">
                      {r.pointsPerAmount} point(s) per $1 spent
                    </p>
                  )}
                </div>
              ))}
              {rules.length === 0 && (
                <p className="text-sm text-zinc-400">No loyalty rules yet.</p>
              )}
            </div>
          </div>

          {/* Available rewards */}
          <div className="card p-5">
            <h3 className="mb-4 text-sm font-semibold text-zinc-700">
              Available rewards ({availableRewards.length})
            </h3>
            {availableRewards.length === 0 ? (
              <p className="text-sm text-zinc-400">
                No outstanding rewards. They&apos;re issued automatically when a
                customer reaches a punch-card threshold.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {availableRewards.map((rw) => (
                  <li
                    key={rw.id}
                    className="flex items-center justify-between border-t border-zinc-50 py-2 first:border-0"
                  >
                    <span>
                      <Link
                        href={`/customers/${rw.customerId}`}
                        className="font-medium hover:text-brand"
                      >
                        {rw.customer.name}
                      </Link>
                      <span className="ml-2 text-zinc-500">{rw.description}</span>
                    </span>
                    <span className="flex items-center gap-3 text-xs text-zinc-400">
                      {formatMoney(rw.value)} · {formatDate(rw.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sidebar: new rule + top holders */}
        <div className="space-y-6">
          <div className="card p-5">
            <h3 className="mb-4 text-sm font-semibold text-zinc-700">New rule</h3>
            <RuleForm
              services={services.map((s) => ({ id: s.id, name: s.name }))}
              items={items.map((i) => i.name)}
            />
          </div>

          <div className="card p-5">
            <h3 className="mb-4 text-sm font-semibold text-zinc-700">
              Top point holders
            </h3>
            <ul className="space-y-2 text-sm">
              {topCustomers.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between border-t border-zinc-50 py-2 first:border-0"
                >
                  <Link href={`/customers/${c.id}`} className="hover:text-brand">
                    {c.name}
                  </Link>
                  <span className="font-semibold text-brand">
                    {c.pointsBalance} pts
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
