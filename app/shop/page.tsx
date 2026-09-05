import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/i18n";
import { getStoreContent } from "@/lib/storeContent";
import { getPortalSession } from "@/lib/session";
import CategorySidebar from "./CategorySidebar";
import CategoryDrawer from "./CategoryDrawer";
import ProductCard from "./ProductCard";
import WishlistButton from "./WishlistButton";
import Hero from "./Hero";

export const dynamic = "force-dynamic";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const { locale, t } = await getDictionary();
  const isHome = !q && !category;
  const session = await getPortalSession();

  const [items, categoryRows, storeContent, topLines] = await Promise.all([
    prisma.item.findMany({
      where: {
        storefrontVisible: true,
        active: true,
        ...(category ? { category } : {}),
        ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
      },
      orderBy: { name: "asc" },
    }),
    prisma.item.groupBy({
      by: ["category"],
      where: { storefrontVisible: true, active: true },
      _count: { _all: true },
    }),
    isHome ? getStoreContent() : Promise.resolve(null),
    isHome
      ? prisma.transactionLine.groupBy({
          by: ["itemId"],
          where: {
            itemId: { not: null },
            transaction: { status: "COMPLETED" },
            item: { storefrontVisible: true, active: true },
          },
          _sum: { qty: true },
          orderBy: { _sum: { qty: "desc" } },
          take: 4,
        })
      : Promise.resolve([]),
  ]);
  const categories = categoryRows
    .filter((c): c is typeof c & { category: string } => Boolean(c.category))
    .map((c) => ({ name: c.category, count: c._count._all }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const topSellerIds = topLines.map((l) => l.itemId!);
  const topSellers = topSellerIds.length
    ? await prisma.item
        .findMany({ where: { id: { in: topSellerIds } } })
        .then((found) => {
          const byId = new Map(found.map((i) => [i.id, i]));
          return topSellerIds.map((id) => byId.get(id)).filter((i) => i !== undefined);
        })
    : [];

  // A bundle has no stock of its own — it's out of stock if any of its real
  // components is. Fetch components for every bundle in this result set once.
  const bundleIds = [...items, ...topSellers]
    .filter((i) => i.kind === "BUNDLE")
    .map((i) => i.id);
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
  const isOutOfStock = (item: (typeof items)[number]) =>
    item.kind === "BUNDLE"
      ? outOfStockBundleIds.has(item.id)
      : item.trackStock && item.stockQty <= 0;

  // Batched rating aggregate + wishlist membership across the whole grid, to
  // avoid an N+1 query per card.
  const allIds = [...items, ...topSellers].map((i) => i.id);
  const [ratingRows, wishlistRows] = await Promise.all([
    allIds.length
      ? prisma.review.groupBy({
          by: ["itemId"],
          where: { itemId: { in: allIds } },
          _avg: { rating: true },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    session && allIds.length
      ? prisma.wishlistItem.findMany({
          where: { customerId: session.sub, itemId: { in: allIds } },
          select: { itemId: true },
        })
      : Promise.resolve([]),
  ]);
  const ratingByItem = new Map(
    ratingRows.map((r) => [r.itemId, { avg: r._avg.rating ?? 0, count: r._count._all }])
  );
  const wishlistedIds = new Set(wishlistRows.map((w) => w.itemId));

  const renderCard = (item: (typeof items)[number], redirectTo: string) => {
    const rating = ratingByItem.get(item.id);
    return (
      <ProductCard
        key={item.id}
        id={item.id}
        name={(locale === "ar" && item.nameAr) || item.name}
        category={item.category}
        imageUrl={item.imageUrl}
        salePrice={item.salePrice}
        outOfStock={isOutOfStock(item)}
        outOfStockLabel={t.shop.outOfStock}
        avgRating={rating?.avg}
        reviewCount={rating?.count}
        wishlistButton={
          <WishlistButton
            itemId={item.id}
            active={wishlistedIds.has(item.id)}
            redirectTo={redirectTo}
            label={t.shop.wishlistToggle}
          />
        }
      />
    );
  };

  return (
    <div>
      {isHome && storeContent && <Hero content={storeContent} locale={locale} />}

      {isHome && topSellers.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 text-lg font-semibold">{t.shop.topSellers}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {topSellers.map((item) => renderCard(item, "/shop"))}
          </div>
        </div>
      )}

      <div className="sm:grid sm:gap-6 sm:grid-cols-[12rem_1fr]">
        <CategoryDrawer label={t.shop.openMenu}>
          <CategorySidebar
            categories={categories}
            active={category}
            categoriesLabel={t.shop.categories}
            allProductsLabel={t.shop.allProducts}
          />
        </CategoryDrawer>

        <div>
          <h1 className="mb-4 text-xl font-semibold">{category ?? t.shop.title}</h1>

          <form action="/shop" className="mb-6 flex flex-wrap gap-2">
            {category && <input type="hidden" name="category" value={category} />}
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder={t.shop.searchPlaceholder}
              className="input min-w-[200px] flex-1"
            />
            <button className="btn-brand" type="submit">
              {t.shop.search}
            </button>
            {(q || category) && (
              <Link href="/shop" className="btn-ghost">
                {t.shop.clear}
              </Link>
            )}
          </form>

          {items.length === 0 ? (
            <p className="text-zinc-500">{t.shop.noResults}</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => renderCard(item, "/shop"))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
