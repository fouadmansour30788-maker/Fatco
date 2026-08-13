import Link from "next/link";
import { requirePortal } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDateTime } from "@/lib/format";
import { FULFILLMENT_STATUS_LABEL, type FulfillmentStatus } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function MyOrdersPage() {
  const session = await requirePortal();
  const orders = await prisma.transaction.findMany({
    where: { customerId: session.sub, channel: "ONLINE" },
    orderBy: { date: "desc" },
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">My orders</h1>
      {orders.length === 0 ? (
        <p className="text-zinc-500">You haven&apos;t placed any orders yet.</p>
      ) : (
        <div className="card divide-y divide-zinc-100">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/shop/orders/${o.id}`}
              className="flex items-center justify-between p-4 hover:bg-zinc-50"
            >
              <div>
                <div className="font-medium">Order #{o.number}</div>
                <div className="text-sm text-zinc-500">{formatDateTime(o.date)}</div>
              </div>
              <div className="text-right">
                <div className="font-medium">{formatMoney(o.total)}</div>
                <div className="text-sm text-zinc-500">
                  {FULFILLMENT_STATUS_LABEL[(o.fulfillmentStatus ?? "PENDING") as FulfillmentStatus]}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
