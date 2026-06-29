import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/format";
import {
  EXPENSE_TYPES,
  EXPENSE_CATEGORIES,
} from "@/lib/constants";
import PageHeader from "../components/PageHeader";
import { createExpense } from "./actions";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const expenses = await prisma.expense.findMany({
    orderBy: { date: "desc" },
    take: 100,
  });
  const direct = expenses
    .filter((e) => e.type === "DIRECT")
    .reduce((s, e) => s + e.amount, 0);
  const indirect = expenses
    .filter((e) => e.type === "INDIRECT")
    .reduce((s, e) => s + e.amount, 0);

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle={`Direct ${formatMoney(direct)} · Indirect ${formatMoney(
          indirect
        )} · Total ${formatMoney(direct + indirect)}`}
      />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-3">
        <form action={createExpense} className="card h-fit space-y-3 p-5">
          <h3 className="text-sm font-semibold text-zinc-700">Record expense</h3>
          <div>
            <label className="label">Type</label>
            <select name="type" className="input" defaultValue="DIRECT">
              {EXPENSE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select name="category" className="input">
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Amount</label>
            <input name="amount" type="number" step="any" required className="input" />
          </div>
          <div>
            <label className="label">Vendor</label>
            <input name="vendor" className="input" />
          </div>
          <div>
            <label className="label">Note</label>
            <input name="note" className="input" />
          </div>
          <button type="submit" className="btn-brand w-full">
            Add expense
          </button>
        </form>

        <div className="card overflow-hidden lg:col-span-2">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-t border-zinc-100">
                  <td className="px-4 py-3 text-zinc-500">{formatDate(e.date)}</td>
                  <td className="px-4 py-3">{e.category}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${
                        e.type === "DIRECT"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {e.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{e.vendor ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatMoney(e.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
