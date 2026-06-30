"use server";

import { revalidatePath } from "next/cache";
import { sendReminder } from "@/lib/reminders";

export async function sendReminderAction(formData: FormData) {
  const vehicleId = String(formData.get("vehicleId") || "");
  const serviceTypeId = String(formData.get("serviceTypeId") || "");
  if (!vehicleId || !serviceTypeId) return;
  await sendReminder(vehicleId, serviceTypeId);
  revalidatePath("/reminders");
}
