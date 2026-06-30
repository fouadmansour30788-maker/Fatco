import Link from "next/link";
import { computeDueReminders } from "@/lib/reminders";
import { getMessagingProvider } from "@/lib/messaging";
import { formatDate } from "@/lib/format";
import PageHeader from "@/app/components/PageHeader";
import StatCard from "@/app/components/StatCard";
import { sendReminderAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const due = await computeDueReminders();
  const provider = getMessagingProvider();
  const overdue = due.filter((d) => d.status === "overdue");
  const soon = due.filter((d) => d.status === "due-soon");

  return (
    <>
      <PageHeader
        title="Service reminders"
        subtitle="Customers due for oil changes, wheels and more"
      />
      <div className="space-y-6 p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Overdue" value={String(overdue.length)} accent="brand" />
          <StatCard label="Due soon (14d)" value={String(soon.length)} accent="amber" />
          <StatCard
            label="Messaging channel"
            value={provider.name === "whatsapp" ? "WhatsApp" : "Console (test)"}
            hint={
              provider.name === "whatsapp"
                ? "Live — sends via WhatsApp"
                : "Set WHATSAPP_TOKEN + WHATSAPP_PHONE_ID to go live"
            }
            accent={provider.name === "whatsapp" ? "green" : "zinc"}
          />
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Last done</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Reminder</th>
              </tr>
            </thead>
            <tbody>
              {due.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
                    Nothing due right now. 🎉
                  </td>
                </tr>
              )}
              {due.map((d) => (
                <tr
                  key={`${d.vehicleId}-${d.serviceTypeId}`}
                  className="border-t border-zinc-100"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/customers/${d.customerId}`}
                      className="font-medium hover:text-brand"
                    >
                      {d.customerName}
                    </Link>
                    <div className="text-xs text-zinc-400">
                      {d.customerPhone ?? "no phone"}
                      {d.whatsappOptIn ? " · opted in" : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{d.vehicleLabel}</td>
                  <td className="px-4 py-3">{d.serviceName}</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {formatDate(d.lastServiceDate)}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">
                    {d.dueDate ? formatDate(d.dueDate) : ""}
                    {d.dueMileage ? (
                      <div className="text-xs text-zinc-400">
                        or {d.dueMileage.toLocaleString()} km
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {d.status === "overdue" ? (
                      <span className="badge bg-brand/10 text-brand">
                        Overdue
                        {d.daysUntilDue != null && d.daysUntilDue < 0
                          ? ` ${Math.abs(d.daysUntilDue)}d`
                          : ""}
                      </span>
                    ) : (
                      <span className="badge bg-amber-100 text-amber-700">
                        In {d.daysUntilDue}d
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {d.notifiedAt ? (
                      <span className="text-xs text-emerald-600">
                        Sent {formatDate(d.notifiedAt)}
                      </span>
                    ) : (
                      <form action={sendReminderAction}>
                        <input type="hidden" name="vehicleId" value={d.vehicleId} />
                        <input
                          type="hidden"
                          name="serviceTypeId"
                          value={d.serviceTypeId}
                        />
                        <button
                          type="submit"
                          disabled={!d.customerPhone}
                          className="btn-brand px-3 py-1.5 text-xs disabled:opacity-40"
                        >
                          Send reminder
                        </button>
                      </form>
                    )}
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
