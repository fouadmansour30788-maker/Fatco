import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/format";
import PageHeader from "../components/PageHeader";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { date: "desc" },
    take: 100,
    include: { customer: true, vehicle: true },
  });

  const total = transactions.reduce((s, t) => s + t.total, 0);
  const profit = transactions.reduce((s, t) => s + (t.total - t.cost), 0);

  return (
    <>
      <PageHeader
        title="Sales & Services"
        subtitle={`${transactions.length} recent · ${formatMoney(
          total
        )} revenue · ${formatMoney(profit)} gross profit`}
        action={{ href: "/sales/new", label: "+ New sale" }}
      />
      <div className="p-8">
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 text-right font-medium">Cost</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Profit</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                  <td className="px-4 py-3 text-zinc-500">{t.number ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-500">{formatDate(t.date)}</td>
                  <td className="px-4 py-3">
                    {t.customer ? (
                      <Link
                        href={`/customers/${t.customer.id}`}
                        className="hover:text-brand"
                      >
                        {t.customer.name}
                      </Link>
                    ) : (
                      "Walk-in"
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {t.vehicle
                      ? [t.vehicle.make, t.vehicle.model].filter(Boolean).join(" ")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {t.paymentMethod ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-zinc-400">
                    {formatMoney(t.cost)}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatMoney(t.total)}
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-600">
                    {formatMoney(t.total - t.cost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-zinc-400">
          Use <span className="font-medium">+ New sale</span> to record a service —
          it updates inventory and awards loyalty automatically.
        </p>
      </div>
    </>
  );
}
