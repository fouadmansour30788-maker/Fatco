import Link from "next/link";
import { requirePortal } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import { updateCartQty, removeFromCart } from "../actions";

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const session = await requirePortal();
  const cartItems = await prisma.cartItem.findMany({
    where: { customerId: session.sub },
    include: { item: true },
    orderBy: { createdAt: "asc" },
  });

  const total = cartItems.reduce((s, c) => s + c.item.salePrice * c.qty, 0);
  const hasStockIssue = cartItems.some(
    (c) => c.item.trackStock && c.qty > c.item.stockQty
  );

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Your cart</h1>
      {cartItems.length === 0 ? (
        <p className="text-zinc-500">
          Your cart is empty.{" "}
          <Link href="/shop" className="text-brand hover:underline">
            Browse products
          </Link>
          .
        </p>
      ) : (
        <>
          <div className="card divide-y divide-zinc-100">
            {cartItems.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-[10rem] flex-1">
                  <div className="font-medium">{c.item.name}</div>
                  <div className="text-sm text-zinc-500">
                    {formatMoney(c.item.salePrice)} each
                  </div>
                  {c.item.trackStock && c.qty > c.item.stockQty && (
                    <div className="text-xs text-red-500">
                      Only {c.item.stockQty} in stock
                    </div>
                  )}
                </div>
                <form action={updateCartQty} className="flex items-center gap-2">
                  <input type="hidden" name="cartItemId" value={c.id} />
                  <input
                    type="number"
                    name="qty"
                    defaultValue={c.qty}
                    min={0}
                    step="any"
                    className="input w-20"
                  />
                  <button type="submit" className="btn-ghost">
                    Update
                  </button>
                </form>
                <form action={removeFromCart}>
                  <input type="hidden" name="cartItemId" value={c.id} />
                  <button type="submit" className="text-sm text-red-500 hover:underline">
                    Remove
                  </button>
                </form>
                <div className="w-24 text-right font-medium">
                  {formatMoney(c.item.salePrice * c.qty)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-lg font-semibold">Total: {formatMoney(total)}</div>
            {hasStockIssue ? (
              <button disabled className="btn-brand cursor-not-allowed opacity-50">
                Checkout
              </button>
            ) : (
              <Link href="/shop/checkout" className="btn-brand">
                Checkout
              </Link>
            )}
          </div>
          {hasStockIssue && (
            <p className="mt-2 text-sm text-red-500">
              Update quantities before checking out — some items exceed available stock.
            </p>
          )}
        </>
      )}
    </div>
  );
}
