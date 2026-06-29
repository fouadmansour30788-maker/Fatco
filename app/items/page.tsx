import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import PageHeader from "../components/PageHeader";
import { adjustStock } from "./actions";

export const dynamic = "force-dynamic";

export default async function ItemsPage() {
  const items = await prisma.item.findMany({
    orderBy: [{ active: "desc" }, { category: "asc" }, { name: "asc" }],
  });

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
                      <div className="font-medium">{i.name}</div>
                      {i.sku && (
                        <div className="text-xs text-zinc-400">{i.sku}</div>
                      )}
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
                        <span className="text-xs text-zinc-400">service</span>
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
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/items/${i.id}`}
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
