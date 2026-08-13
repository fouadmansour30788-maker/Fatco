import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePortal } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDateTime } from "@/lib/format";
import { FULFILLMENT_STATUS_LABEL, type FulfillmentStatus } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function MyOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePortal();
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
      <h1 className="mb-1 text-xl font-semibold">Order #{order.number}</h1>
      <p className="mb-4 text-sm text-zinc-500">
        Placed {formatDateTime(order.date)} ·{" "}
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
          <span>Total</span>
          <span>{formatMoney(order.total)}</span>
        </div>
      </div>

      <div className="card mt-4 p-4 text-sm">
        <div className="mb-1 font-semibold">Delivery / pickup</div>
        <p className="whitespace-pre-wrap text-zinc-600">{order.shippingAddress}</p>
        <div className="mb-1 mt-3 font-semibold">Payment</div>
        <p className="text-zinc-600">{order.paymentMethod}</p>
      </div>

      <Link href="/shop/orders" className="mt-4 inline-block text-brand hover:underline">
        ← All orders
      </Link>
    </div>
  );
}
