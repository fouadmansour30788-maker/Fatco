import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatMoney, formatDate } from "@/lib/format";
import { CUSTOMER_TYPE_LABEL, type CustomerType } from "@/lib/constants";
import PageHeader from "../../components/PageHeader";
import { addVehicle, generatePortalPin } from "../actions";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      vehicles: { orderBy: { createdAt: "asc" } },
      transactions: {
        orderBy: { date: "desc" },
        include: { lines: true, vehicle: true },
      },
      loyaltyEntries: { orderBy: { createdAt: "desc" }, take: 10 },
      rewards: {
        where: { status: "AVAILABLE" },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) notFound();

  const totalSpent = customer.transactions.reduce((s, t) => s + t.total, 0);

  return (
    <>
      <PageHeader
        title={customer.name}
        subtitle={
          CUSTOMER_TYPE_LABEL[customer.type as CustomerType] ?? customer.type
        }
      />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6">
          <div className="card p-5 text-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Contact
            </h3>
            <dl className="space-y-2">
              <Row label="Phone" value={customer.phone ?? "—"} />
              <Row label="Email" value={customer.email ?? "—"} />
              <Row label="Company" value={customer.companyName ?? "—"} />
              <Row label="Address" value={customer.address ?? "—"} />
              <Row
                label="WhatsApp"
                value={customer.whatsappOptIn ? "Opted in" : "Not opted in"}
              />
            </dl>
          </div>

          <div className="card p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Summary
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-semibold text-brand">
                  {customer.pointsBalance}
                </div>
                <div className="text-xs text-zinc-500">Loyalty points</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">
                  {formatMoney(totalSpent)}
                </div>
                <div className="text-xs text-zinc-500">Total spent</div>
              </div>
            </div>
            {customer.rewards.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-zinc-100 pt-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  🎁 {customer.rewards.length} reward(s) available
                </div>
                {customer.rewards.map((rw) => (
                  <div
                    key={rw.id}
                    className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
                  >
                    <span>{rw.description}</span>
                    <span className="font-medium">{formatMoney(rw.value)}</span>
                  </div>
                ))}
                <Link
                  href="/sales/new"
                  className="block text-center text-xs text-brand hover:underline"
                >
                  Redeem on a new sale →
                </Link>
              </div>
            )}
          </div>

          {/* Client portal access */}
          <div className="card p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Client portal
            </h3>
            {customer.portalPin ? (
              <div className="text-sm">
                <p className="text-zinc-500">
                  Phone &amp; PIN to share for{" "}
                  <span className="font-medium text-zinc-700">
                    {process.env.NEXT_PUBLIC_APP_URL ?? ""}/portal
                  </span>
                </p>
                <div className="mt-2 flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
                  <span className="text-zinc-600">{customer.phone ?? "—"}</span>
                  <span className="font-mono text-lg font-semibold tracking-widest text-brand">
                    {customer.portalPin}
                  </span>
                </div>
                <form action={generatePortalPin} className="mt-2">
                  <input type="hidden" name="customerId" value={customer.id} />
                  <button className="text-xs text-zinc-400 hover:text-brand">
                    Regenerate PIN
                  </button>
                </form>
              </div>
            ) : (
              <form action={generatePortalPin}>
                <input type="hidden" name="customerId" value={customer.id} />
                <p className="mb-2 text-sm text-zinc-500">
                  {customer.phone
                    ? "Give this customer access to view their history & points."
                    : "Add a phone number first to enable portal access."}
                </p>
                <button
                  className="btn-ghost w-full"
                  disabled={!customer.phone}
                  type="submit"
                >
                  Generate portal PIN
                </button>
              </form>
            )}
          </div>

          {/* Vehicles */}
          <div className="card p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Vehicles ({customer.vehicles.length})
            </h3>
            <ul className="space-y-2 text-sm">
              {customer.vehicles.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-100 px-3 py-2"
                >
                  <span>
                    {[v.make, v.model, v.year].filter(Boolean).join(" ") ||
                      "Vehicle"}
                    {v.plate && (
                      <span className="ml-2 text-xs text-zinc-400">
                        {v.plate}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {v.mileage ? `${v.mileage.toLocaleString()} km` : ""}
                  </span>
                </li>
              ))}
              {customer.vehicles.length === 0 && (
                <li className="text-zinc-400">No vehicles yet.</li>
              )}
            </ul>

            <form
              action={addVehicle}
              className="mt-4 grid grid-cols-2 gap-2 border-t border-zinc-100 pt-4"
            >
              <input type="hidden" name="customerId" value={customer.id} />
              <input name="make" className="input" placeholder="Make" />
              <input name="model" className="input" placeholder="Model" />
              <input name="plate" className="input" placeholder="Plate" />
              <input
                name="mileage"
                type="number"
                className="input"
                placeholder="Mileage"
              />
              <button className="btn-ghost col-span-2" type="submit">
                + Add vehicle
              </button>
            </form>
          </div>
        </div>

        {/* Right column: history */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-5">
            <h3 className="mb-4 text-sm font-semibold text-zinc-700">
              Service &amp; purchase history
            </h3>
            {customer.transactions.length === 0 ? (
              <p className="text-sm text-zinc-400">No transactions yet.</p>
            ) : (
              <div className="space-y-4">
                {customer.transactions.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-lg border border-zinc-100 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium">
                        #{t.number ?? "—"} ·{" "}
                        <span className="text-zinc-500">
                          {formatDate(t.date)}
                        </span>
                      </span>
                      <span className="font-semibold">
                        {formatMoney(t.total)}
                      </span>
                    </div>
                    {t.vehicle && (
                      <div className="mb-2 text-xs text-zinc-400">
                        {[t.vehicle.make, t.vehicle.model]
                          .filter(Boolean)
                          .join(" ")}{" "}
                        {t.vehicle.plate}
                      </div>
                    )}
                    <ul className="text-sm text-zinc-600">
                      {t.lines.map((l) => (
                        <li
                          key={l.id}
                          className="flex justify-between border-t border-zinc-50 py-1"
                        >
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

          <div className="card p-5">
            <h3 className="mb-4 text-sm font-semibold text-zinc-700">
              Loyalty activity
            </h3>
            {customer.loyaltyEntries.length === 0 ? (
              <p className="text-sm text-zinc-400">No loyalty activity.</p>
            ) : (
              <ul className="text-sm">
                {customer.loyaltyEntries.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between border-t border-zinc-50 py-2"
                  >
                    <span className="text-zinc-600">
                      {e.note ?? e.type} ·{" "}
                      <span className="text-zinc-400">
                        {formatDate(e.createdAt)}
                      </span>
                    </span>
                    <span
                      className={
                        e.points >= 0 ? "text-emerald-600" : "text-brand"
                      }
                    >
                      {e.points >= 0 ? "+" : ""}
                      {e.points}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-400">{label}</dt>
      <dd className="text-right font-medium text-zinc-700">{value}</dd>
    </div>
  );
}
