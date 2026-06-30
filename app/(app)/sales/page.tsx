import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/format";
import { PAYMENT_METHODS, TRANSACTION_STATUSES } from "@/lib/constants";
import PageHeader from "@/app/components/PageHeader";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 200;

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    from?: string;
    to?: string;
    payment?: string;
    status?: string;
  }>;
}) {
  const { q, from, to, payment, status } = await searchParams;

  const dateFilter: { gte?: Date; lte?: Date } = {};
  if (from) dateFilter.gte = new Date(`${from}T00:00:00`);
  if (to) dateFilter.lte = new Date(`${to}T23:59:59.999`);

  const where = {
    ...(status ? { status } : {}),
    ...(payment ? { paymentMethod: payment } : {}),
    ...(from || to ? { date: dateFilter } : {}),
    ...(q
      ? {
          OR: [
            {
              customer: {
                name: { contains: q, mode: "insensitive" as const },
              },
            },
            ...(/^\d+$/.test(q) ? [{ number: Number(q) }] : []),
          ],
        }
      : {}),
  };

  const [agg, transactions] = await Promise.all([
    prisma.transaction.aggregate({
      where,
      _sum: { total: true, cost: true },
      _count: { _all: true },
    }),
    prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      take: PAGE_SIZE,
      include: { customer: true, vehicle: true },
    }),
  ]);

  const count = agg._count._all;
  const total = agg._sum.total ?? 0;
  const profit = total - (agg._sum.cost ?? 0);
  const filtered = Boolean(q || from || to || payment || status);

  return (
    <>
      <PageHeader
        title="Sales & Services"
        subtitle={`${count.toLocaleString()} sale(s) · ${formatMoney(
          total
        )} revenue · ${formatMoney(profit)} gross profit${
          count > transactions.length ? ` · showing ${transactions.length}` : ""
        }`}
        action={{ href: "/sales/new", label: "+ New sale" }}
      />
      <div className="p-8">
        {/* Filters */}
        <form
          className="mb-4 flex flex-wrap items-end gap-2"
          action="/sales"
        >
          <div>
            <label className="label">Search</label>
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Customer or sale #"
              className="input w-48"
            />
          </div>
          <div>
            <label className="label">From</label>
            <input name="from" type="date" defaultValue={from ?? ""} className="input" />
          </div>
          <div>
            <label className="label">To</label>
            <input name="to" type="date" defaultValue={to ?? ""} className="input" />
          </div>
          <div>
            <label className="label">Payment</label>
            <select name="payment" defaultValue={payment ?? ""} className="input">
              <option value="">All</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select name="status" defaultValue={status ?? ""} className="input">
              <option value="">All</option>
              {TRANSACTION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-brand" type="submit">
            Filter
          </button>
          {filtered && (
            <Link href="/sales" className="btn-ghost">
              Clear
            </Link>
          )}
        </form>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Cost</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Profit</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-zinc-400">
                    No sales match these filters.
                  </td>
                </tr>
              )}
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
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${
                        t.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-700"
                          : t.status === "VOID"
                          ? "bg-zinc-100 text-zinc-500"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {t.status}
                    </span>
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
