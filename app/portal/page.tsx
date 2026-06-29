import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePortal } from "@/lib/session";
import { formatMoney, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PortalDashboard() {
  const session = await requirePortal();

  const customer = await prisma.customer.findUnique({
    where: { id: session.sub },
    include: {
      vehicles: { orderBy: { createdAt: "asc" } },
      transactions: {
        where: { status: "COMPLETED" },
        orderBy: { date: "desc" },
        include: { lines: true, vehicle: true },
      },
      rewards: { where: { status: "AVAILABLE" }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!customer) notFound();

  const totalSpent = customer.transactions.reduce((s, t) => s + t.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Hi {customer.name.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-zinc-500">Your FATCO account</p>
      </div>

      {/* Points + rewards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="text-3xl font-bold text-brand">
            {customer.pointsBalance}
          </div>
          <div className="text-xs text-zinc-500">Loyalty points</div>
        </div>
        <div className="card p-5">
          <div className="text-3xl font-bold">{formatMoney(totalSpent)}</div>
          <div className="text-xs text-zinc-500">Total spent with us</div>
        </div>
      </div>

      {customer.rewards.length > 0 && (
        <div className="card border-emerald-200 bg-emerald-50 p-5">
          <h2 className="mb-2 text-sm font-semibold text-emerald-700">
            🎁 Rewards waiting for you
          </h2>
          <ul className="space-y-1 text-sm text-emerald-900">
            {customer.rewards.map((r) => (
              <li key={r.id} className="flex justify-between">
                <span>{r.description}</span>
                <span className="font-medium">{formatMoney(r.value)} value</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-emerald-700">
            Show this screen on your next visit to redeem.
          </p>
        </div>
      )}

      {/* Vehicles */}
      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">My vehicles</h2>
        {customer.vehicles.length === 0 ? (
          <p className="text-sm text-zinc-400">No vehicles on file.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {customer.vehicles.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2"
              >
                <span>
                  {[v.make, v.model, v.year].filter(Boolean).join(" ") || "Vehicle"}
                  {v.plate && (
                    <span className="ml-2 text-xs text-zinc-400">{v.plate}</span>
                  )}
                </span>
                <span className="text-xs text-zinc-400">
                  {v.mileage ? `${v.mileage.toLocaleString()} km` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* History */}
      <div className="card p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">
          Service history
        </h2>
        {customer.transactions.length === 0 ? (
          <p className="text-sm text-zinc-400">No visits recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {customer.transactions.map((t) => (
              <div key={t.id} className="rounded-lg border border-zinc-100 p-4">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-zinc-500">{formatDate(t.date)}</span>
                  <span className="font-semibold">{formatMoney(t.total)}</span>
                </div>
                {t.vehicle && (
                  <div className="mb-1 text-xs text-zinc-400">
                    {[t.vehicle.make, t.vehicle.model].filter(Boolean).join(" ")}{" "}
                    {t.vehicle.plate}
                  </div>
                )}
                <ul className="text-sm text-zinc-600">
                  {t.lines.map((l) => (
                    <li key={l.id} className="flex justify-between py-0.5">
                      <span>
                        {l.description}
                        {l.qty > 1 && (
                          <span className="text-zinc-400"> ×{l.qty}</span>
                        )}
                      </span>
                      <span>{formatMoney(l.lineTotal)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
