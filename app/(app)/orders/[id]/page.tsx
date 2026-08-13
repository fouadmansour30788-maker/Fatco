import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDateTime } from "@/lib/format";
import { FULFILLMENT_STATUS_LABEL } from "@/lib/constants";
import PageHeader from "@/app/components/PageHeader";
import { confirmOrderAction, completeOrderAction, cancelOrderAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.transaction.findUnique({
    where: { id },
    include: { customer: true, lines: { include: { item: true } } },
  });
  if (!order || order.channel !== "ONLINE") notFound();

  const status = order.fulfillmentStatus ?? "PENDING";

  return (
    <>
      <PageHeader
        title={`Order #${order.number ?? "—"}`}
        subtitle={`Placed ${formatDateTime(order.date)} · ${FULFILLMENT_STATUS_LABEL[status as keyof typeof FULFILLMENT_STATUS_LABEL]}`}
      />
      <div className="grid max-w-4xl gap-6 p-8 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold">Items</h3>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-zinc-500">
              <tr>
                <th className="py-2 font-medium">Item</th>
                <th className="py-2 text-right font-medium">Qty</th>
                <th className="py-2 text-right font-medium">Price</th>
                <th className="py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((l) => (
                <tr key={l.id} className="border-t border-zinc-100">
                  <td className="py-2">{l.description}</td>
                  <td className="py-2 text-right text-zinc-500">{l.qty}</td>
                  <td className="py-2 text-right text-zinc-500">
                    {formatMoney(l.unitPrice)}
                  </td>
                  <td className="py-2 text-right font-medium">
                    {formatMoney(l.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-end border-t border-zinc-100 pt-3">
            <div className="text-right">
              <div className="text-xs text-zinc-500">Total</div>
              <div className="text-lg font-semibold">{formatMoney(order.total)}</div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="mb-2 text-sm font-semibold">Customer</h3>
            {order.customer ? (
              <Link href={`/customers/${order.customer.id}`} className="text-brand hover:underline">
                {order.customer.name}
              </Link>
            ) : (
              <span className="text-zinc-400">—</span>
            )}
            {order.customer?.phone && (
              <div className="mt-1 text-sm text-zinc-500">{order.customer.phone}</div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="mb-2 text-sm font-semibold">Delivery / pickup</h3>
            <p className="whitespace-pre-wrap text-sm text-zinc-600">
              {order.shippingAddress || "—"}
            </p>
            <h3 className="mb-1 mt-4 text-sm font-semibold">Payment</h3>
            <p className="text-sm text-zinc-600">{order.paymentMethod ?? "—"}</p>
            {order.notes && (
              <>
                <h3 className="mb-1 mt-4 text-sm font-semibold">Notes</h3>
                <p className="text-sm text-zinc-600">{order.notes}</p>
              </>
            )}
          </div>

          <div className="card p-6">
            <h3 className="mb-3 text-sm font-semibold">Actions</h3>
            <div className="flex flex-col gap-2">
              {status === "PENDING" && (
                <>
                  <form action={confirmOrderAction}>
                    <input type="hidden" name="id" value={order.id} />
                    <button type="submit" className="btn-brand w-full">
                      Confirm order
                    </button>
                  </form>
                  <form action={cancelOrderAction}>
                    <input type="hidden" name="id" value={order.id} />
                    <button type="submit" className="btn-ghost w-full">
                      Cancel order
                    </button>
                  </form>
                </>
              )}
              {status === "CONFIRMED" && (
                <>
                  <form action={completeOrderAction}>
                    <input type="hidden" name="id" value={order.id} />
                    <button type="submit" className="btn-brand w-full">
                      Mark completed &amp; charge
                    </button>
                  </form>
                  <form action={cancelOrderAction}>
                    <input type="hidden" name="id" value={order.id} />
                    <button type="submit" className="btn-ghost w-full">
                      Cancel order
                    </button>
                  </form>
                </>
              )}
              {(status === "COMPLETED" || status === "CANCELLED") && (
                <p className="text-sm text-zinc-400">No further actions.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
