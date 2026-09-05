"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePortal } from "@/lib/session";

// Deliberately narrow scope: customers can edit their own email, address, and
// their vehicles' mileage. Phone and name stay staff-only (the portal-login
// identity and WhatsApp key) to avoid account-lockout/impersonation risk.
export async function updateProfile(formData: FormData) {
  const session = await requirePortal();
  const email = String(formData.get("email") || "").trim() || null;
  const address = String(formData.get("address") || "").trim() || null;

  await prisma.customer.update({
    where: { id: session.sub },
    data: { email, address },
  });

  const vehicleIds = formData.getAll("vehicleId").map(String);
  for (const vehicleId of vehicleIds) {
    const raw = formData.get(`mileage-${vehicleId}`);
    const mileage = raw != null && raw !== "" ? Number(raw) : null;
    if (mileage != null && Number.isFinite(mileage) && mileage >= 0) {
      await prisma.vehicle.updateMany({
        where: { id: vehicleId, customerId: session.sub },
        data: { mileage },
      });
    }
  }

  revalidatePath("/portal");
  revalidatePath("/portal/profile");
  redirect("/portal");
}
