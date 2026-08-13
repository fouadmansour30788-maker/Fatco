import { requirePortal } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import { STOREFRONT_PAYMENT_METHODS } from "@/lib/constants";
import { placeOrderAction } from "../actions";

export const dynamic = "force-dynamic";

const PAYMENT_LABEL: Record<string, string> = {
  CASH: "Cash on pickup/delivery",
  CARD: "Card on pickup/delivery",
  TRANSFER: "Bank transfer",
};

export default async function CheckoutPage() {
  const session = await requirePortal();
  const [cartItems, customer] = await Promise.all([
    prisma.cartItem.findMany({
      where: { customerId: session.sub },
      include: { item: true },
    }),
    prisma.customer.findUnique({ where: { id: session.sub } }),
  ]);

  if (cartItems.length === 0) {
    return <p className="text-zinc-500">Your cart is empty.</p>;
  }

  const total = cartItems.reduce((s, c) => s + c.item.salePrice * c.qty, 0);
  const defaultAddress = [
    customer?.address,
    customer?.subDistrict,
    customer?.district,
    customer?.governorate,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-xl font-semibold">Checkout</h1>

      <div className="card mb-4 p-4">
        {cartItems.map((c) => (
          <div key={c.id} className="flex justify-between py-1 text-sm">
            <span>
              {c.item.name} × {c.qty}
            </span>
            <span>{formatMoney(c.item.salePrice * c.qty)}</span>
          </div>
        ))}
        <div className="mt-2 flex justify-between border-t border-zinc-100 pt-2 font-semibold">
          <span>Total</span>
          <span>{formatMoney(total)}</span>
        </div>
      </div>

      <form action={placeOrderAction} className="card space-y-4 p-4">
        <div>
          <label className="label">Delivery / pickup address</label>
          <textarea
            name="shippingAddress"
            required
            rows={3}
            defaultValue={defaultAddress}
            className="input"
          />
        </div>
        <div>
          <label className="label">Payment method</label>
          <select name="paymentMethod" defaultValue="CASH" className="input">
            {STOREFRONT_PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_LABEL[m]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Notes (optional)</label>
          <textarea name="notes" rows={2} className="input" />
        </div>
        <button type="submit" className="btn-brand w-full">
          Place order
        </button>
      </form>
    </div>
  );
}
