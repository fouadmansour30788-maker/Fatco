import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import PageHeader from "@/app/components/PageHeader";
import { toggleOffer, deleteOffer } from "./actions";

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  const offers = await prisma.offer.findMany({ orderBy: { createdAt: "desc" } });
  const now = new Date();

  return (
    <>
      <PageHeader
        title="Offers"
        subtitle="Create and manage promotions"
        action={{ href: "/offers/new", label: "+ New offer" }}
      />
      <div className="p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((o) => {
            const live =
              o.active &&
              (!o.startDate || o.startDate <= now) &&
              (!o.endDate || o.endDate >= now);
            const status = !o.active
              ? { label: "Disabled", cls: "bg-zinc-100 text-zinc-500" }
              : live
              ? { label: "Live", cls: "bg-emerald-100 text-emerald-700" }
              : o.startDate && o.startDate > now
              ? { label: "Scheduled", cls: "bg-blue-100 text-blue-700" }
              : { label: "Expired", cls: "bg-amber-100 text-amber-700" };
            return (
              <div key={o.id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{o.name}</h3>
                  <span className={`badge ${status.cls}`}>{status.label}</span>
                </div>
                <p className="mt-1 text-sm text-zinc-500">{o.description}</p>
                <div className="mt-3 text-2xl font-bold text-brand">
                  {o.discountType === "PERCENT"
                    ? `${o.discountValue}%`
                    : `$${o.discountValue}`}{" "}
                  <span className="text-sm font-normal text-zinc-400">off</span>
                </div>
                <div className="mt-2 text-xs text-zinc-400">
                  {o.startDate || o.endDate
                    ? `${formatDate(o.startDate)} → ${formatDate(o.endDate)}`
                    : "No date limit"}
                </div>

                <div className="mt-4 flex items-center gap-3 border-t border-zinc-100 pt-3 text-xs">
                  <Link
                    href={`/offers/${o.id}`}
                    className="font-medium text-brand hover:underline"
                  >
                    Edit
                  </Link>
                  <form action={toggleOffer}>
                    <input type="hidden" name="id" value={o.id} />
                    <input type="hidden" name="active" value={String(o.active)} />
                    <button className="text-zinc-500 hover:text-zinc-800">
                      {o.active ? "Disable" : "Enable"}
                    </button>
                  </form>
                  <form action={deleteOffer} className="ml-auto">
                    <input type="hidden" name="id" value={o.id} />
                    <button className="text-zinc-400 hover:text-brand">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
          {offers.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-400">
              No offers yet.{" "}
              <Link href="/offers/new" className="text-brand hover:underline">
                Create your first offer
              </Link>
              .
            </div>
          )}
        </div>
      </div>
    </>
  );
}
