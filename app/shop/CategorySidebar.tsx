import Link from "next/link";

export default function CategorySidebar({
  categories,
  active,
  categoriesLabel,
  allProductsLabel,
}: {
  categories: { name: string; count: number }[];
  active?: string;
  categoriesLabel: string;
  allProductsLabel: string;
}) {
  return (
    <nav className="flex gap-2 overflow-x-auto pb-2 sm:w-48 sm:shrink-0 sm:flex-col sm:overflow-visible sm:pb-0">
      <div className="hidden text-xs font-semibold uppercase tracking-wide text-zinc-400 sm:block">
        {categoriesLabel}
      </div>
      <Link
        href="/shop"
        className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${
          !active ? "bg-brand/10 text-brand" : "text-zinc-600 hover:bg-zinc-100"
        }`}
      >
        {allProductsLabel}
      </Link>
      {categories.map((c) => (
        <Link
          key={c.name}
          href={`/shop?category=${encodeURIComponent(c.name)}`}
          className={`flex shrink-0 items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
            active === c.name
              ? "bg-brand/10 text-brand"
              : "text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          <span>{c.name}</span>
          <span className="text-xs text-zinc-400">{c.count}</span>
        </Link>
      ))}
    </nav>
  );
}
