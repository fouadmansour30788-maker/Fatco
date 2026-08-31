import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/i18n";
import CategorySidebar from "./CategorySidebar";
import ProductCard from "./ProductCard";

export const dynamic = "force-dynamic";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const { locale, t } = await getDictionary();

  const [items, categoryRows] = await Promise.all([
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
  ]);
  const categories = categoryRows
    .filter((c): c is typeof c & { category: string } => Boolean(c.category))
    .map((c) => ({ name: c.category, count: c._count._all }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // A bundle has no stock of its own — it's out of stock if any of its real
  // components is. Fetch components for every bundle in this result set once.
  const bundleIds = items.filter((i) => i.kind === "BUNDLE").map((i) => i.id);
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
    <div className="grid gap-6 sm:grid-cols-[12rem_1fr]">
      <CategorySidebar
        categories={categories}
        active={category}
        categoriesLabel={t.shop.categories}
        allProductsLabel={t.shop.allProducts}
      />

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
            {items.map((item) => {
              const outOfStock =
                item.kind === "BUNDLE"
                  ? outOfStockBundleIds.has(item.id)
                  : item.trackStock && item.stockQty <= 0;
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
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
