import Link from "next/link";
import { notFound } from "next/navigation";
import { Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/format";
import { getPortalSession } from "@/lib/session";
import { getDictionary } from "@/lib/i18n";
import { addToCart, requestBackInStockAlert, submitReview } from "../actions";
import ProductCard from "../ProductCard";
import QtyStepper from "../QtyStepper";
import WishlistButton from "../WishlistButton";
import { StarRatingInput, StarDisplay } from "../StarRating";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, session, { locale, t }] = await Promise.all([
    prisma.item.findUnique({
      where: { id },
      include: {
        bundleComponents: { include: { componentItem: true } },
      },
    }),
    getPortalSession(),
    getDictionary(),
  ]);
  if (!item || !item.storefrontVisible || !item.active) notFound();

  const isBundle = item.kind === "BUNDLE";
  const outOfStock = isBundle
    ? item.bundleComponents.some(
        (c) => c.componentItem.trackStock && c.componentItem.stockQty <= 0
      )
    : item.trackStock && item.stockQty <= 0;
  const lowStock =
    !isBundle && !outOfStock && item.trackStock && item.stockQty <= item.reorderLevel;

  const [existingAlert, related, wishlisted, ratingAgg, reviews, purchased, myReview] =
    await Promise.all([
      session
        ? prisma.backInStockAlert.findUnique({
            where: { itemId_customerId: { itemId: item.id, customerId: session.sub } },
          })
        : null,
      item.category
        ? prisma.item.findMany({
            where: {
              storefrontVisible: true,
              active: true,
              category: item.category,
              id: { not: item.id },
            },
            take: 4,
            orderBy: { name: "asc" },
          })
        : [],
      session
        ? prisma.wishlistItem.findUnique({
            where: { customerId_itemId: { customerId: session.sub, itemId: item.id } },
          })
        : null,
      prisma.review.aggregate({
        where: { itemId: item.id },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.review.findMany({
        where: { itemId: item.id },
        include: { customer: true },
        orderBy: { createdAt: "desc" },
      }),
      session
        ? prisma.transactionLine.findFirst({
            where: {
              itemId: item.id,
              transaction: { customerId: session.sub, status: "COMPLETED" },
            },
          })
        : null,
      session
        ? prisma.review.findUnique({
            where: { customerId_itemId: { customerId: session.sub, itemId: item.id } },
          })
        : null,
    ]);

  const name = (locale === "ar" && item.nameAr) || item.name;
  const description = (locale === "ar" && item.descriptionAr) || item.description;

  return (
    <div>
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
        <Link href="/shop" className="hover:text-brand">
          {t.shop.breadcrumbHome}
        </Link>
        {item.category && (
          <>
            <span>/</span>
            <Link
              href={`/shop?category=${encodeURIComponent(item.category)}`}
              className="hover:text-brand"
            >
              {item.category}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-zinc-700">{name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative">
          <div className="card flex aspect-square items-center justify-center overflow-hidden bg-zinc-100">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageUrl}
                alt={name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Package className="text-zinc-300" size={64} />
            )}
          </div>
          {session && (
            <div className="absolute end-3 top-3">
              <WishlistButton
                itemId={item.id}
                active={Boolean(wishlisted)}
                redirectTo={`/shop/${item.id}`}
                label={t.shop.wishlistToggle}
              />
            </div>
          )}
        </div>
        <div>
          {item.category && <div className="text-xs text-zinc-400">{item.category}</div>}
          <h1 className="text-xl font-semibold">{name}</h1>
          {(item.sku || item.unit) && (
            <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-zinc-400">
              {item.sku && (
                <span>
                  {t.shop.sku}: {item.sku}
                </span>
              )}
              {item.unit && (
                <span>
                  {t.shop.unitLabel}: {item.unit}
                </span>
              )}
            </div>
          )}
          {ratingAgg._count._all > 0 && (
            <div className="mt-1 flex items-center gap-2 text-sm">
              <StarDisplay value={ratingAgg._avg.rating ?? 0} />
              <span className="text-zinc-500">
                {t.shop.reviewCount(ratingAgg._count._all)}
              </span>
            </div>
          )}
          <div className="mt-2 text-2xl font-bold">{formatMoney(item.salePrice)}</div>

          {description && (
            <p className="mt-4 whitespace-pre-wrap text-sm text-zinc-600">{description}</p>
          )}

          {isBundle && item.bundleComponents.length > 0 && (
            <div className="mt-4 rounded-lg border border-zinc-100 bg-zinc-50 p-3">
              <div className="mb-1 text-xs font-semibold text-zinc-500">{t.shop.includes}</div>
              <ul className="text-sm text-zinc-600">
                {item.bundleComponents.map((c) => (
                  <li key={c.id}>
                    {c.qty}× {(locale === "ar" && c.componentItem.nameAr) || c.componentItem.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4">
            {outOfStock ? (
              <span className="badge bg-red-100 text-red-700">{t.shop.outOfStock}</span>
            ) : lowStock ? (
              <>
                <span className="badge bg-amber-100 text-amber-700">{t.shop.lowStock}</span>
                {item.trackStock && (
                  <p className="mt-1 text-xs text-amber-600">
                    {t.shop.onlyInStock(item.stockQty)}
                  </p>
                )}
              </>
            ) : (
              <span className="badge bg-emerald-100 text-emerald-700">{t.shop.inStock}</span>
            )}
          </div>

          <div className="mt-6">
            {!session ? (
              <Link href={`/portal/login?next=/shop/${item.id}`} className="btn-brand">
                {outOfStock ? t.shop.signInToGetNotified : t.shop.signInToBuy}
              </Link>
            ) : outOfStock ? (
              existingAlert ? (
                <button disabled className="btn-ghost cursor-default opacity-75">
                  {t.shop.notifyRequested}
                </button>
              ) : (
                <form action={requestBackInStockAlert}>
                  <input type="hidden" name="itemId" value={item.id} />
                  <button type="submit" className="btn-brand">
                    {t.shop.notifyMe}
                  </button>
                </form>
              )
            ) : (
              <form action={addToCart} className="flex items-center gap-3">
                <input type="hidden" name="itemId" value={item.id} />
                <QtyStepper
                  max={!isBundle && item.trackStock ? item.stockQty : undefined}
                />
                <button type="submit" className="btn-brand">
                  {t.shop.addToCart}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-4 text-lg font-semibold">{t.shop.relatedTitle}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((r) => (
              <ProductCard
                key={r.id}
                id={r.id}
                name={(locale === "ar" && r.nameAr) || r.name}
                category={r.category}
                imageUrl={r.imageUrl}
                salePrice={r.salePrice}
                outOfStock={r.kind !== "BUNDLE" && r.trackStock && r.stockQty <= 0}
                outOfStockLabel={t.shop.outOfStock}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 max-w-2xl">
        <h2 className="mb-4 text-lg font-semibold">{t.shop.reviewsTitle}</h2>

        {session && purchased && (
          <form action={submitReview} className="card mb-6 space-y-3 p-4">
            <input type="hidden" name="itemId" value={item.id} />
            <div>
              <label className="label">{t.shop.yourRating}</label>
              <StarRatingInput defaultValue={myReview?.rating} />
            </div>
            <div>
              <label className="label">{t.shop.yourReview}</label>
              <textarea
                name="comment"
                rows={3}
                defaultValue={myReview?.comment ?? ""}
                className="input"
              />
            </div>
            <button type="submit" className="btn-brand">
              {t.shop.submitReview}
            </button>
          </form>
        )}
        {session && !purchased && (
          <p className="mb-6 text-sm text-zinc-400">{t.shop.mustPurchaseToReview}</p>
        )}

        {reviews.length === 0 ? (
          <p className="text-sm text-zinc-400">{t.shop.noReviewsYet}</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {r.customer.name.split(" ")[0]}
                  </span>
                  <span className="text-xs text-zinc-400">{formatDate(r.createdAt)}</span>
                </div>
                <StarDisplay value={r.rating} size="text-sm" />
                {r.comment && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">
                    {r.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
