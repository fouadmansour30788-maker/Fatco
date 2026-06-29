"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordSale, type SaleLineInput } from "@/lib/sales";

export async function createSale(formData: FormData) {
  let lines: SaleLineInput[] = [];
  try {
    lines = JSON.parse(String(formData.get("lines") || "[]"));
  } catch {
    throw new Error("Invalid line data");
  }

  let redeemRewardIds: string[] = [];
  try {
    redeemRewardIds = JSON.parse(String(formData.get("redeemRewardIds") || "[]"));
  } catch {
    redeemRewardIds = [];
  }

  await recordSale({
    customerId: opt(formData.get("customerId")),
    vehicleId: opt(formData.get("vehicleId")),
    paymentMethod: opt(formData.get("paymentMethod")),
    mileage: num(formData.get("mileage")),
    discount: num(formData.get("discount")) ?? 0,
    notes: opt(formData.get("notes")),
    lines,
    redeemRewardIds,
  });

  revalidatePath("/sales");
  revalidatePath("/");

  const customerId = opt(formData.get("customerId"));
  redirect(customerId ? `/customers/${customerId}` : "/sales");
}

function opt(v: FormDataEntryValue | null): string | undefined {
  const s = v == null ? "" : String(v).trim();
  return s === "" ? undefined : s;
}
function num(v: FormDataEntryValue | null): number | undefined {
  const s = opt(v);
  if (s === undefined) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}
