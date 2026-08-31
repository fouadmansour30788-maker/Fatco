import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import PageHeader from "@/app/components/PageHeader";
import { adjustStock, toggleStorefrontVisible } from "./actions";

export const dynamic = "force-dynamic";

export default async function ItemsPage() {
  const [items, waitingCounts] = await Promise.all([
    prisma.item.findMany({
      orderBy: [{ active: "desc" }, { category: "asc" }, { name: "asc" }],
    }),
    prisma.backInStockAlert.groupBy({
      by: ["itemId"],
      where: { status: "PENDING" },
      _count: { _all: true },
    }),
  ]);
  const waitingByItem = new Map(
    waitingCounts.map((w) => [w.itemId, w._count._all])
  );

  const stockValue = items.reduce(
    (s, i) => s + (i.trackStock ? i.stockQty * i.costPrice : 0),
    0
  );
  const lowCount = items.filter(
    (i) => i.trackStock && i.stockQty <= i.reorderLevel
  ).length;

  return (
    <>
      <PageHeader
        title="Items & Inventory"
        subtitle={`${items.length} items · stock value ${formatMoney(
          stockValue
        )} · ${lowCount} low`}
        action={{ href: "/items/new", label: "+ New item" }}
      />
      <div className="p-8">
        <div className="mb-4 flex justify-end">
          <Link href="/items/bundles/new" className="btn-ghost">
            + New bundle / kit
          </Link>
        </div>
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 text-right font-medium">Cost</th>
                <th className="px-4 py-3 text-right font-medium">Sale</th>
                <th className="px-4 py-3 text-right font-medium">Margin</th>
                <th className="px-4 py-3 text-center font-medium">Stock</th>
                <th className="px-4 py-3 text-center font-medium">Adjust</th>
                <th className="px-4 py-3 text-center font-medium">Store</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => {
                const margin =
                  i.salePrice > 0
                    ? ((i.salePrice - i.costPrice) / i.salePrice) * 100
                    : 0;
                const low = i.trackStock && i.stockQty <= i.reorderLevel;
                return (
                  <tr
                    key={i.id}
                    className={`border-t border-zinc-100 ${
                      i.active ? "" : "opacity-50"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {i.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={i.imageUrl}
                            alt=""
                            className="h-8 w-8 rounded object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 shrink-0 rounded bg-zinc-100" />
                        )}
                        <div>
                          <div className="flex items-center gap-1.5 font-medium">
                            {i.name}
                            {i.kind === "BUNDLE" && (
                              <span className="badge bg-violet-100 text-violet-700">
                                Kit
                              </span>
                            )}
                            {(waitingByItem.get(i.id) ?? 0) > 0 && (
                              <span className="badge bg-amber-100 text-amber-700">
                                {waitingByItem.get(i.id)} waiting
                              </span>
                            )}
                          </div>
                          {i.sku && (
                            <div className="text-xs text-zinc-400">{i.sku}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {i.category ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-500">
                      {formatMoney(i.costPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatMoney(i.salePrice)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-500">
                      {margin.toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      {i.trackStock ? (
                        <span
                          className={`badge ${
                            low
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {i.stockQty}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">
                          {i.kind === "BUNDLE" ? "kit" : "service"}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {i.trackStock && (
                        <form
                          action={adjustStock}
                          className="flex items-center justify-center gap-1"
                        >
                          <input type="hidden" name="itemId" value={i.id} />
                          <input
                            name="delta"
                            type="number"
                            step="any"
                            placeholder="±"
                            className="w-16 rounded border border-zinc-300 px-2 py-1 text-xs"
                          />
                          <button
                            type="submit"
                            className="rounded bg-zinc-100 px-2 py-1 text-xs hover:bg-zinc-200"
                          >
                            Apply
                          </button>
                        </form>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <form action={toggleStorefrontVisible}>
                        <input type="hidden" name="id" value={i.id} />
                        <input
                          type="hidden"
                          name="next"
                          value={i.storefrontVisible ? "0" : "1"}
                        />
                        <button
                          type="submit"
                          className={`badge ${
                            i.storefrontVisible
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {i.storefrontVisible ? "Listed ✓" : "List online"}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={i.kind === "BUNDLE" ? `/items/bundles/${i.id}` : `/items/${i.id}`}
                        className="text-xs text-brand hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
