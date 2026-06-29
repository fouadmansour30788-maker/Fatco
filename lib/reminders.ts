import { prisma } from "./prisma";
import { getMessagingProvider, type SendResult } from "./messaging";

const DAY = 24 * 60 * 60 * 1000;
const DUE_SOON_DAYS = 14;

export type DueReminder = {
  vehicleId: string;
  vehicleLabel: string;
  vehicleMileage: number | null;
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  whatsappOptIn: boolean;
  serviceTypeId: string;
  serviceName: string;
  lastServiceDate: Date | null;
  dueDate: Date | null;
  dueMileage: number | null;
  status: "overdue" | "due-soon";
  daysUntilDue: number | null; // negative = overdue
  notifiedAt: Date | null;
};

function vehicleLabel(v: {
  make: string | null;
  model: string | null;
  year: number | null;
  plate: string | null;
}) {
  const base = [v.make, v.model, v.year].filter(Boolean).join(" ") || "Vehicle";
  return v.plate ? `${base} · ${v.plate}` : base;
}

// Compute every service that is overdue or due within DUE_SOON_DAYS, based on
// each reminder-enabled service type's interval and the vehicle's last service.
export async function computeDueReminders(): Promise<DueReminder[]> {
  const now = Date.now();

  const serviceTypes = await prisma.serviceType.findMany({
    where: {
      active: true,
      OR: [
        { reminderIntervalDays: { not: null } },
        { reminderIntervalKm: { not: null } },
      ],
    },
  });
  if (serviceTypes.length === 0) return [];
  const stIds = serviceTypes.map((s) => s.id);
  const stById = new Map(serviceTypes.map((s) => [s.id, s]));

  const vehicles = await prisma.vehicle.findMany({ include: { customer: true } });

  // Last performance of each tracked service per vehicle (max transaction date).
  const lines = await prisma.transactionLine.findMany({
    where: {
      serviceTypeId: { in: stIds },
      transaction: { status: "COMPLETED", vehicleId: { not: null } },
    },
    include: { transaction: true },
  });
  type Last = { date: Date; mileage: number | null };
  const lastMap = new Map<string, Last>(); // key vehicleId|serviceTypeId
  for (const l of lines) {
    const vId = l.transaction.vehicleId;
    if (!vId || !l.serviceTypeId) continue;
    const key = `${vId}|${l.serviceTypeId}`;
    const date = l.transaction.date;
    const prev = lastMap.get(key);
    if (!prev || date > prev.date) {
      lastMap.set(key, { date, mileage: l.transaction.mileageAtService ?? null });
    }
  }

  // Open SENT reminders → so we can show "already reminded".
  const sentReminders = await prisma.serviceReminder.findMany({
    where: { status: "SENT" },
  });
  const sentMap = new Map<string, Date>();
  for (const r of sentReminders) {
    if (r.serviceTypeId && r.lastNotifiedAt) {
      sentMap.set(`${r.vehicleId}|${r.serviceTypeId}`, r.lastNotifiedAt);
    }
  }

  const out: DueReminder[] = [];
  for (const v of vehicles) {
    for (const st of serviceTypes) {
      const key = `${v.id}|${st.id}`;
      const last = lastMap.get(key);
      if (!last) continue; // never serviced → nothing to base a reminder on

      const dueDate =
        st.reminderIntervalDays != null
          ? new Date(last.date.getTime() + st.reminderIntervalDays * DAY)
          : null;
      const dueMileage =
        st.reminderIntervalKm != null && last.mileage != null
          ? last.mileage + st.reminderIntervalKm
          : null;

      const overdueByDate = dueDate != null && dueDate.getTime() <= now;
      const overdueByMileage =
        dueMileage != null && v.mileage != null && v.mileage >= dueMileage;
      const daysUntilDue =
        dueDate != null ? Math.round((dueDate.getTime() - now) / DAY) : null;
      const dueSoonByDate =
        dueDate != null && !overdueByDate && (daysUntilDue ?? 99) <= DUE_SOON_DAYS;

      if (!overdueByDate && !overdueByMileage && !dueSoonByDate) continue;

      out.push({
        vehicleId: v.id,
        vehicleLabel: vehicleLabel(v),
        vehicleMileage: v.mileage,
        customerId: v.customerId,
        customerName: v.customer.name,
        customerPhone: v.customer.phone,
        whatsappOptIn: v.customer.whatsappOptIn,
        serviceTypeId: st.id,
        serviceName: st.name,
        lastServiceDate: last.date,
        dueDate,
        dueMileage,
        status: overdueByDate || overdueByMileage ? "overdue" : "due-soon",
        daysUntilDue,
        notifiedAt: sentMap.get(key) ?? null,
      });
    }
  }

  // Most overdue first.
  out.sort((a, b) => (a.daysUntilDue ?? 0) - (b.daysUntilDue ?? 0));
  return out;
}

export function formatReminderMessage(r: {
  customerName: string;
  vehicleLabel: string;
  serviceName: string;
}): string {
  const first = r.customerName.split(" ")[0];
  return `Hi ${first}, this is FATCO (Tripoli). Your ${r.vehicleLabel} is due for ${r.serviceName.toLowerCase()}. Visit us to keep it running smoothly. 🚗`;
}

// Send one reminder and record it. Uses the active messaging provider.
export async function sendReminder(
  vehicleId: string,
  serviceTypeId: string
): Promise<SendResult & { provider: string }> {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: { customer: true },
  });
  const serviceType = await prisma.serviceType.findUnique({
    where: { id: serviceTypeId },
  });
  const provider = getMessagingProvider();

  if (!vehicle || !serviceType) {
    return { ok: false, error: "Not found", provider: provider.name };
  }
  if (!vehicle.customer.phone) {
    return { ok: false, error: "Customer has no phone", provider: provider.name };
  }

  const message = formatReminderMessage({
    customerName: vehicle.customer.name,
    vehicleLabel: vehicleLabel(vehicle),
    serviceName: serviceType.name,
  });

  const result = await provider.send(vehicle.customer.phone, message);

  if (result.ok) {
    const existing = await prisma.serviceReminder.findFirst({
      where: { vehicleId, serviceTypeId, status: { in: ["PENDING", "SENT"] } },
    });
    if (existing) {
      await prisma.serviceReminder.update({
        where: { id: existing.id },
        data: { status: "SENT", lastNotifiedAt: new Date() },
      });
    } else {
      await prisma.serviceReminder.create({
        data: {
          vehicleId,
          serviceTypeId,
          status: "SENT",
          lastNotifiedAt: new Date(),
        },
      });
    }
  }

  return { ...result, provider: provider.name };
}
