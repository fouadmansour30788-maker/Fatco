import Link from "next/link";
import { requirePortal } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDateTime } from "@/lib/format";
import { FULFILLMENT_STATUS_LABEL, type FulfillmentStatus } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function MyOrdersPage() {
  const session = await requirePortal();
  const { t } = await getDictionary();
  const orders = await prisma.transaction.findMany({
    where: { customerId: session.sub, channel: "ONLINE" },
    orderBy: { date: "desc" },
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">{t.shop.myOrdersTitle}</h1>
      {orders.length === 0 ? (
        <p className="text-zinc-500">{t.shop.noOrdersYet}</p>
      ) : (
        <div className="card divide-y divide-zinc-100">
          {orders.map((o) => (
            <div key={o.id} className="flex items-center justify-between p-4 hover:bg-zinc-50">
              <Link href={`/shop/orders/${o.id}`} className="flex-1">
                <div className="font-medium">{t.shop.orderNumber(o.number)}</div>
                <div className="text-sm text-zinc-500">{formatDateTime(o.date)}</div>
              </Link>
              <Link href={`/shop/orders/${o.id}`} className="text-end">
                <div className="font-medium">{formatMoney(o.total)}</div>
                <div className="text-sm text-zinc-500">
                  {FULFILLMENT_STATUS_LABEL[(o.fulfillmentStatus ?? "PENDING") as FulfillmentStatus]}
                </div>
              </Link>
              <Link
                href={`/portal/receipts/${o.id}`}
                className="ms-4 text-xs font-medium text-brand hover:underline"
              >
                {t.portal.viewReceipt}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
