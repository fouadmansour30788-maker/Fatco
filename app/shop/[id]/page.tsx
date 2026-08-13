import Link from "next/link";
import { notFound } from "next/navigation";
import { Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import { getPortalSession } from "@/lib/session";
import { addToCart } from "../actions";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, session] = await Promise.all([
    prisma.item.findUnique({ where: { id } }),
    getPortalSession(),
  ]);
  if (!item || !item.storefrontVisible || !item.active) notFound();

  const outOfStock = item.trackStock && item.stockQty <= 0;
  const lowStock =
    !outOfStock && item.trackStock && item.stockQty <= item.reorderLevel;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="card flex aspect-square items-center justify-center overflow-hidden bg-zinc-100">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <Package className="text-zinc-300" size={64} />
        )}
      </div>
      <div>
        {item.category && <div className="text-xs text-zinc-400">{item.category}</div>}
        <h1 className="text-xl font-semibold">{item.name}</h1>
        <div className="mt-2 text-2xl font-bold">{formatMoney(item.salePrice)}</div>

        {item.description && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-zinc-600">
            {item.description}
          </p>
        )}

        <div className="mt-4">
          {outOfStock ? (
            <span className="badge bg-red-100 text-red-700">Out of stock</span>
          ) : lowStock ? (
            <span className="badge bg-amber-100 text-amber-700">Low stock</span>
          ) : (
            <span className="badge bg-emerald-100 text-emerald-700">In stock</span>
          )}
        </div>

        <div className="mt-6">
          {!session ? (
            <Link href={`/portal/login?next=/shop/${item.id}`} className="btn-brand">
              Sign in to buy
            </Link>
          ) : outOfStock ? (
            <button disabled className="btn-ghost cursor-not-allowed opacity-50">
              Out of stock
            </button>
          ) : (
            <form action={addToCart} className="flex items-center gap-2">
              <input type="hidden" name="itemId" value={item.id} />
              <input
                type="number"
                name="qty"
                defaultValue={1}
                min={1}
                step="any"
                className="input w-20"
              />
              <button type="submit" className="btn-brand">
                Add to cart
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
