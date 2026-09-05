import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePortal } from "@/lib/session";
import { getDictionary } from "@/lib/i18n";
import { updateProfile } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requirePortal();
  const { t } = await getDictionary();

  const customer = await prisma.customer.findUnique({
    where: { id: session.sub },
    include: { vehicles: { orderBy: { createdAt: "asc" } } },
  });
  if (!customer) notFound();

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-xl font-semibold">{t.portal.profileTitle}</h1>

      <form action={updateProfile} className="card space-y-4 p-4">
        <div>
          <label className="label">{t.portal.emailLabel}</label>
          <input
            type="email"
            name="email"
            defaultValue={customer.email ?? ""}
            className="input"
          />
        </div>
        <div>
          <label className="label">{t.portal.addressLabel}</label>
          <textarea
            name="address"
            rows={2}
            defaultValue={customer.address ?? ""}
            className="input"
          />
        </div>

        {customer.vehicles.length > 0 && (
          <div className="space-y-3 border-t border-zinc-100 pt-4">
            {customer.vehicles.map((v) => (
              <div key={v.id}>
                <input type="hidden" name="vehicleId" value={v.id} />
                <label className="label">
                  {[v.make, v.model, v.year].filter(Boolean).join(" ") || "Vehicle"}
                  {v.plate ? ` · ${v.plate}` : ""} — {t.portal.vehicleMileageLabel}
                </label>
                <input
                  type="number"
                  min={0}
                  name={`mileage-${v.id}`}
                  defaultValue={v.mileage ?? ""}
                  className="input"
                />
              </div>
            ))}
          </div>
        )}

        <button type="submit" className="btn-brand w-full">
          {t.portal.saveChanges}
        </button>
      </form>

      <Link href="/portal" className="mt-4 inline-block text-sm text-brand hover:underline">
        {t.portal.backToAccount}
      </Link>
    </div>
  );
}
