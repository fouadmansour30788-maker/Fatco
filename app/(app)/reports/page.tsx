import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import PageHeader from "@/app/components/PageHeader";
import StatCard from "@/app/components/StatCard";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [tx, expenses, categoryLines] = await Promise.all([
    prisma.transaction.findMany({
      where: { status: "COMPLETED" },
      select: { total: true, cost: true },
    }),
    prisma.expense.findMany({ select: { amount: true, type: true } }),
    prisma.transactionLine.findMany({
      include: { item: true },
    }),
  ]);

  const revenue = tx.reduce((s, t) => s + t.total, 0);
  const cogs = tx.reduce((s, t) => s + t.cost, 0);
  const grossProfit = revenue - cogs;
  const directExp = expenses
    .filter((e) => e.type === "DIRECT")
    .reduce((s, e) => s + e.amount, 0);
  const indirectExp = expenses
    .filter((e) => e.type === "INDIRECT")
    .reduce((s, e) => s + e.amount, 0);
  const netProfit = grossProfit - directExp - indirectExp;

  // Revenue by item category.
  const byCategory = new Map<string, number>();
  for (const l of categoryLines) {
    const cat = l.item?.category ?? "Other";
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + l.lineTotal);
  }
  const catRows = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]);
  const catMax = Math.max(1, ...catRows.map((r) => r[1]));

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Profit & loss overview (all-time)"
      />
      <div className="space-y-6 p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Revenue" value={formatMoney(revenue)} accent="brand" />
          <StatCard label="Gross profit" value={formatMoney(grossProfit)} hint={`COGS ${formatMoney(cogs)}`} accent="green" />
          <StatCard label="Expenses" value={formatMoney(directExp + indirectExp)} hint={`Direct ${formatMoney(directExp)} · Indirect ${formatMoney(indirectExp)}`} accent="amber" />
          <StatCard label="Net profit" value={formatMoney(netProfit)} accent={netProfit >= 0 ? "green" : "brand"} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-700">
              Profit &amp; loss
            </h3>
            <table className="w-full text-sm">
              <tbody>
                <PLRow label="Revenue" value={revenue} />
                <PLRow label="Cost of goods sold" value={-cogs} muted />
                <PLRow label="Gross profit" value={grossProfit} bold />
                <PLRow label="Direct expenses" value={-directExp} muted />
                <PLRow label="Indirect expenses" value={-indirectExp} muted />
                <PLRow label="Net profit" value={netProfit} bold accent />
              </tbody>
            </table>
          </div>

          <div className="card p-6">
            <h3 className="mb-4 text-sm font-semibold text-zinc-700">
              Revenue by category
            </h3>
            <div className="space-y-3">
              {catRows.map(([cat, val]) => (
                <div key={cat}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{cat}</span>
                    <span className="font-medium">{formatMoney(val)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-100">
                    <div
                      className="h-2 rounded-full bg-brand"
                      style={{ width: `${(val / catMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function PLRow({
  label,
  value,
  bold,
  muted,
  accent,
}: {
  label: string;
  value: number;
  bold?: boolean;
  muted?: boolean;
  accent?: boolean;
}) {
  return (
    <tr className={bold ? "border-t border-zinc-200" : ""}>
      <td className={`py-2 ${bold ? "font-semibold" : muted ? "text-zinc-500" : ""}`}>
        {label}
      </td>
      <td
        className={`py-2 text-right ${
          bold ? "font-semibold" : ""
        } ${accent ? (value >= 0 ? "text-emerald-600" : "text-brand") : ""}`}
      >
        {formatMoney(value)}
      </td>
    </tr>
  );
}
