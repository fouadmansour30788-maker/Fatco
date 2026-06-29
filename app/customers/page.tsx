import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import { CUSTOMER_TYPE_LABEL, type CustomerType } from "@/lib/constants";
import PageHeader from "../components/PageHeader";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type } = await searchParams;

  const customers = await prisma.customer.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { companyName: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    include: { _count: { select: { vehicles: true, transactions: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} ${type ? type.toLowerCase() : ""} customer(s)`}
        action={{ href: "/customers/new", label: "+ New customer" }}
      />
      <div className="p-8">
        <form className="mb-4 flex flex-wrap gap-2" action="/customers">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search name, company or phone…"
            className="input max-w-xs"
          />
          <select name="type" defaultValue={type ?? ""} className="input max-w-[180px]">
            <option value="">All types</option>
            <option value="INDIVIDUAL">Individual (B2C)</option>
            <option value="BUSINESS">Business (B2B)</option>
          </select>
          <button className="btn-ghost" type="submit">
            Filter
          </button>
        </form>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Vehicles</th>
                <th className="px-4 py-3 font-medium">Visits</th>
                <th className="px-4 py-3 text-right font-medium">Points</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                    No customers found.
                  </td>
                </tr>
              )}
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-zinc-100 hover:bg-zinc-50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/customers/${c.id}`}
                      className="font-medium hover:text-brand"
                    >
                      {c.name}
                    </Link>
                    {c.companyName && (
                      <div className="text-xs text-zinc-400">{c.companyName}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${
                        c.type === "BUSINESS"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {CUSTOMER_TYPE_LABEL[c.type as CustomerType] ?? c.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-500">{c._count.vehicles}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {c._count.transactions}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {c.pointsBalance}
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
