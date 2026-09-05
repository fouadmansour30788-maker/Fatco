import { requirePortal } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/i18n";
import ProductCard from "../ProductCard";
import WishlistButton from "../WishlistButton";

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const session = await requirePortal();
  const { locale, t } = await getDictionary();

  const wishlistItems = await prisma.wishlistItem.findMany({
    where: { customerId: session.sub },
    include: { item: true },
    orderBy: { createdAt: "desc" },
  });
  const visible = wishlistItems.filter((w) => w.item.storefrontVisible && w.item.active);

  const itemIds = visible.map((w) => w.itemId);
  const ratingRows = itemIds.length
    ? await prisma.review.groupBy({
        by: ["itemId"],
        where: { itemId: { in: itemIds } },
        _avg: { rating: true },
        _count: { _all: true },
      })
    : [];
  const ratingByItem = new Map(
    ratingRows.map((r) => [r.itemId, { avg: r._avg.rating ?? 0, count: r._count._all }])
  );

  const bundleIds = visible.filter((w) => w.item.kind === "BUNDLE").map((w) => w.itemId);
  const bundleComponents = bundleIds.length
    ? await prisma.bundleComponent.findMany({
        where: { bundleItemId: { in: bundleIds } },
        include: { componentItem: true },
      })
    : [];
  const outOfStockBundleIds = new Set(
    bundleComponents
      .filter((c) => c.componentItem.trackStock && c.componentItem.stockQty <= 0)
      .map((c) => c.bundleItemId)
  );

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">{t.shop.wishlistTitle}</h1>
      {visible.length === 0 ? (
        <p className="text-zinc-500">{t.shop.wishlistEmpty}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((w) => {
            const item = w.item;
            const outOfStock =
              item.kind === "BUNDLE"
                ? outOfStockBundleIds.has(item.id)
                : item.trackStock && item.stockQty <= 0;
            const rating = ratingByItem.get(item.id);
            return (
              <ProductCard
                key={item.id}
                id={item.id}
                name={(locale === "ar" && item.nameAr) || item.name}
                category={item.category}
                imageUrl={item.imageUrl}
                salePrice={item.salePrice}
                outOfStock={outOfStock}
                outOfStockLabel={t.shop.outOfStock}
                avgRating={rating?.avg}
                reviewCount={rating?.count}
                wishlistButton={
                  <WishlistButton
                    itemId={item.id}
                    active
                    redirectTo="/shop/wishlist"
                    label={t.shop.wishlistToggle}
                  />
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
