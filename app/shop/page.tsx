import Link from "next/link";
import { Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;

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
    prisma.item.findMany({
      where: { storefrontVisible: true, active: true },
      select: { category: true },
      distinct: ["category"],
    }),
  ]);
  const categories = categoryRows
    .map((c) => c.category)
    .filter((c): c is string => Boolean(c))
    .sort();

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Shop FATCO</h1>

      <form action="/shop" className="mb-6 flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search products…"
          className="input min-w-[200px] flex-1"
        />
        <select name="category" defaultValue={category ?? ""} className="input">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button className="btn-brand" type="submit">
          Search
        </button>
        {(q || category) && (
          <Link href="/shop" className="btn-ghost">
            Clear
          </Link>
        )}
      </form>

      {items.length === 0 ? (
        <p className="text-zinc-500">No products match your search.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => {
            const outOfStock = item.trackStock && item.stockQty <= 0;
            return (
              <Link
                key={item.id}
                href={`/shop/${item.id}`}
                className="card overflow-hidden transition-shadow hover:shadow-md"
              >
                <div className="flex aspect-square items-center justify-center bg-zinc-100">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="text-zinc-300" size={40} />
                  )}
                </div>
                <div className="p-3">
                  {item.category && (
                    <div className="text-xs text-zinc-400">{item.category}</div>
                  )}
                  <div className="line-clamp-2 text-sm font-medium">{item.name}</div>
                  <div className="mt-1 font-semibold">{formatMoney(item.salePrice)}</div>
                  {outOfStock && (
                    <div className="mt-1 text-xs text-red-500">Out of stock</div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
