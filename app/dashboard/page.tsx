import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/format";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import LebanonMapClient from "../components/LebanonMapClient";
import { ALL_DISTRICTS } from "@/lib/lebanon";

export const dynamic = "force-dynamic";

function startOfDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function DashboardPage() {
  const since30 = startOfDaysAgo(30);

  const [
    txAll,
    tx30,
    expenses30,
    customerCount,
    lowStock,
    topCustomerGroups,
    recent,
    monthly,
    customersByDistrict,
  ] = await Promise.all([
    prisma.transaction.findMany({
      where: { status: "COMPLETED" },
      select: { total: true, cost: true },
    }),
    prisma.transaction.findMany({
      where: { status: "COMPLETED", date: { gte: since30 } },
      select: { total: true, cost: true },
    }),
    prisma.expense.findMany({
      where: { date: { gte: since30 } },
      select: { amount: true },
    }),
    prisma.customer.count(),
    prisma.item.findMany({
      where: { trackStock: true },
      orderBy: { stockQty: "asc" },
    }),
    prisma.transaction.groupBy({
      by: ["customerId"],
      where: { status: "COMPLETED", customerId: { not: null } },
      _sum: { total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),
    prisma.transaction.findMany({
      where: { status: "COMPLETED" },
      orderBy: { date: "desc" },
      take: 8,
      include: { customer: true },
    }),
    prisma.transaction.findMany({
      where: { status: "COMPLETED", date: { gte: startOfDaysAgo(180) } },
      select: { date: true, total: true },
    }),
    prisma.customer.groupBy({
      by: ["district"],
      where: { district: { not: null } },
      _count: { _all: true },
    }),
  ]);

  // Map customer counts onto Lebanese district coordinates.
  const countByDistrict = new Map(
    customersByDistrict.map((g) => [g.district as string, g._count._all])
  );
  const mapPoints = ALL_DISTRICTS.map((d) => ({
    name: d.name,
    ar: d.ar,
    governorate: d.governorate,
    lat: d.lat,
    lng: d.lng,
    count: countByDistrict.get(d.name) ?? 0,
  })).filter((p) => p.count > 0);
  const mappedCustomers = mapPoints.reduce((s, p) => s + p.count, 0);

  const revenue30 = tx30.reduce((s, t) => s + t.total, 0);
  const profit30 = tx30.reduce((s, t) => s + (t.total - t.cost), 0);
  const exp30 = expenses30.reduce((s, e) => s + e.amount, 0);
  const revenueAll = txAll.reduce((s, t) => s + t.total, 0);
  const net30 = profit30 - exp30;

  const lowStockItems = lowStock.filter((i) => i.stockQty <= i.reorderLevel);

  // Resolve top customers' names.
  const topCustomers = await Promise.all(
    topCustomerGroups.map(async (g) => {
      const c = g.customerId
        ? await prisma.customer.findUnique({ where: { id: g.customerId } })
        : null;
      return { name: c?.name ?? "—", id: g.customerId, total: g._sum.total ?? 0 };
    })
  );

  // Monthly revenue buckets (last 6 months).
  const buckets = new Map<string, number>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
  }
  for (const t of monthly) {
    const key = `${t.date.getFullYear()}-${t.date.getMonth()}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + t.total);
  }
  const maxBucket = Math.max(1, ...Array.from(buckets.values()));
  const monthLabels = Array.from(buckets.keys()).map((k) => {
    const [y, m] = k.split("-").map(Number);
    return new Date(y, m, 1).toLocaleDateString("en-GB", { month: "short" });
  });
  const bucketValues = Array.from(buckets.values());

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of sales, profit and operations"
      />
      <div className="space-y-6 p-8">
        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Revenue (30d)"
            value={formatMoney(revenue30)}
            hint={`All-time ${formatMoney(revenueAll)}`}
            accent="brand"
          />
          <StatCard
            label="Gross Profit (30d)"
            value={formatMoney(profit30)}
            hint="Sales minus item cost"
            accent="green"
          />
          <StatCard
            label="Expenses (30d)"
            value={formatMoney(exp30)}
            hint="Direct + indirect"
            accent="amber"
          />
          <StatCard
            label="Net (30d)"
            value={formatMoney(net30)}
            hint="Profit minus expenses"
            accent={net30 >= 0 ? "green" : "brand"}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Revenue trend */}
          <div className="card p-5 lg:col-span-2">
            <h2 className="mb-4 text-sm font-semibold text-zinc-700">
              Revenue — last 6 months
            </h2>
            <div className="flex h-48 items-end gap-3">
              {bucketValues.map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t bg-brand/80"
                      style={{ height: `${(v / maxBucket) * 100}%` }}
                      title={formatMoney(v)}
                    />
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    {monthLabels[i]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top customers */}
          <div className="card p-5">
            <h2 className="mb-4 text-sm font-semibold text-zinc-700">
              Top customers
            </h2>
            <ul className="space-y-3">
              {topCustomers.map((c, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-500">
                      {i + 1}
                    </span>
                    {c.id ? (
                      <Link
                        href={`/customers/${c.id}`}
                        className="hover:text-brand"
                      >
                        {c.name}
                      </Link>
                    ) : (
                      c.name
                    )}
                  </span>
                  <span className="font-medium">{formatMoney(c.total)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Customers map */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="card p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-700">
                Customers by location
              </h2>
              <span className="text-xs text-zinc-400">
                {mappedCustomers} mapped
              </span>
            </div>
            <div className="h-80 w-full overflow-hidden rounded-xl">
              {mapPoints.length > 0 ? (
                <LebanonMapClient points={mapPoints} />
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl bg-zinc-50 text-sm text-zinc-400">
                  No customer locations yet — add a governorate/district on
                  customer profiles to see them here.
                </div>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="mb-4 text-sm font-semibold text-zinc-700">
              Top regions
            </h2>
            {mapPoints.length === 0 ? (
              <p className="text-sm text-zinc-400">No location data yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {[...mapPoints]
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 8)
                  .map((p) => (
                    <li
                      key={`${p.governorate}-${p.name}`}
                      className="flex items-center justify-between border-t border-zinc-50 py-1.5 first:border-0"
                    >
                      <span>
                        {p.name}
                        <span className="ml-1 text-xs text-zinc-400">
                          {p.governorate}
                        </span>
                      </span>
                      <span className="font-medium">{p.count}</span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent transactions */}
          <div className="card p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-700">
                Recent sales & services
              </h2>
              <Link href="/sales" className="text-xs text-brand hover:underline">
                View all
              </Link>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-400">
                  <th className="pb-2 font-medium">#</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((t) => (
                  <tr key={t.id} className="border-t border-zinc-100">
                    <td className="py-2 text-zinc-500">{t.number ?? "—"}</td>
                    <td className="py-2">{t.customer?.name ?? "Walk-in"}</td>
                    <td className="py-2 text-zinc-500">{formatDate(t.date)}</td>
                    <td className="py-2 text-right font-medium">
                      {formatMoney(t.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Low stock */}
          <div className="card p-5">
            <h2 className="mb-4 text-sm font-semibold text-zinc-700">
              Low stock alerts
            </h2>
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-zinc-400">
                All items above reorder level.
              </p>
            ) : (
              <ul className="space-y-3">
                {lowStockItems.map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <Link href="/items" className="hover:text-brand">
                      {i.name}
                    </Link>
                    <span className="badge bg-amber-100 text-amber-700">
                      {i.stockQty} / {i.reorderLevel}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 border-t border-zinc-100 pt-3 text-xs text-zinc-400">
              {customerCount} customers · {txAll.length} completed sales
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
