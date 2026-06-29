import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import PageHeader from "../components/PageHeader";

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  const offers = await prisma.offer.findMany({ orderBy: { createdAt: "desc" } });
  const now = new Date();

  return (
    <>
      <PageHeader title="Offers" subtitle="Promotions and time-bound discounts" />
      <div className="p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((o) => {
            const live =
              o.active &&
              (!o.startDate || o.startDate <= now) &&
              (!o.endDate || o.endDate >= now);
            return (
              <div key={o.id} className="card p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{o.name}</h3>
                  <span
                    className={`badge ${
                      live
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {live ? "Live" : "Inactive"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-500">{o.description}</p>
                <div className="mt-3 text-2xl font-bold text-brand">
                  {o.discountType === "PERCENT"
                    ? `${o.discountValue}%`
                    : `$${o.discountValue}`}{" "}
                  <span className="text-sm font-normal text-zinc-400">off</span>
                </div>
                <div className="mt-2 text-xs text-zinc-400">
                  {formatDate(o.startDate)} → {formatDate(o.endDate)}
                </div>
              </div>
            );
          })}
          {offers.length === 0 && (
            <p className="text-sm text-zinc-400">No offers yet.</p>
          )}
        </div>
      </div>
    </>
  );
}
