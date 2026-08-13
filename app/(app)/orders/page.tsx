import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDateTime } from "@/lib/format";
import { FULFILLMENT_STATUSES, FULFILLMENT_STATUS_LABEL } from "@/lib/constants";
import PageHeader from "@/app/components/PageHeader";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-sky-100 text-sky-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-zinc-100 text-zinc-500",
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const where = {
    channel: "ONLINE",
    ...(status ? { fulfillmentStatus: status } : {}),
  };

  const [counts, orders] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["fulfillmentStatus"],
      where: { channel: "ONLINE" },
      _count: { _all: true },
    }),
    prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      take: 200,
      include: { customer: true },
    }),
  ]);

  const countByStatus = Object.fromEntries(
    counts.map((c) => [c.fulfillmentStatus ?? "PENDING", c._count._all])
  );
  const totalCount = counts.reduce((s, c) => s + c._count._all, 0);

  return (
    <>
      <PageHeader
        title="Online Orders"
        subtitle={`${totalCount.toLocaleString()} order(s) placed via the storefront`}
      />
      <div className="p-8">
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/orders"
            className={`badge ${!status ? "bg-brand/10 text-brand" : "bg-zinc-100 text-zinc-500"}`}
          >
            All ({totalCount})
          </Link>
          {FULFILLMENT_STATUSES.map((s) => (
            <Link
              key={s}
              href={`/orders?status=${s}`}
              className={`badge ${status === s ? "bg-brand/10 text-brand" : "bg-zinc-100 text-zinc-500"}`}
            >
              {FULFILLMENT_STATUS_LABEL[s]} ({countByStatus[s] ?? 0})
            </Link>
          ))}
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Placed</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
                    No online orders yet.
                  </td>
                </tr>
              )}
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                  <td className="px-4 py-3 text-zinc-500">{o.number ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-500">{formatDateTime(o.date)}</td>
                  <td className="px-4 py-3">{o.customer?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-500">{o.paymentMethod ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${STATUS_BADGE[o.fulfillmentStatus ?? "PENDING"]}`}
                    >
                      {FULFILLMENT_STATUS_LABEL[
                        (o.fulfillmentStatus ?? "PENDING") as keyof typeof FULFILLMENT_STATUS_LABEL
                      ]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatMoney(o.total)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/orders/${o.id}`} className="text-brand hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
