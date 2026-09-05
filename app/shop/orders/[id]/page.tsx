import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePortal } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDateTime } from "@/lib/format";
import { FULFILLMENT_STATUS_LABEL, type FulfillmentStatus } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function MyOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePortal();
  const { t } = await getDictionary();
  const { id } = await params;
  const order = await prisma.transaction.findUnique({
    where: { id },
    include: { lines: true },
  });
  if (!order || order.channel !== "ONLINE" || order.customerId !== session.sub) {
    notFound();
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-1 text-xl font-semibold">{t.shop.orderNumber(order.number)}</h1>
      <p className="mb-4 text-sm text-zinc-500">
        {t.shop.placedOn(formatDateTime(order.date))} ·{" "}
        {FULFILLMENT_STATUS_LABEL[(order.fulfillmentStatus ?? "PENDING") as FulfillmentStatus]}
      </p>

      <div className="card p-4">
        {order.lines.map((l) => (
          <div key={l.id} className="flex justify-between py-1 text-sm">
            <span>
              {l.description} × {l.qty}
            </span>
            <span>{formatMoney(l.lineTotal)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-zinc-100 pt-2 font-semibold">
          <span>{t.shop.total}</span>
          <span>{formatMoney(order.total)}</span>
        </div>
      </div>

      <div className="card mt-4 p-4 text-sm">
        <div className="mb-1 font-semibold">{t.shop.deliveryPickup}</div>
        <p className="whitespace-pre-wrap text-zinc-600">{order.shippingAddress}</p>
        <div className="mb-1 mt-3 font-semibold">{t.shop.payment}</div>
        <p className="text-zinc-600">{order.paymentMethod}</p>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <Link href="/shop/orders" className="text-brand hover:underline">
          {t.shop.allOrders}
        </Link>
        <Link href={`/portal/receipts/${order.id}`} className="text-brand hover:underline">
          {t.portal.viewReceipt}
        </Link>
      </div>
    </div>
  );
}
