"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createRule(formData: FormData) {
  const type = String(formData.get("type") || "");
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Name is required");
  if (type !== "PUNCH_CARD" && type !== "POINTS_PER_AMOUNT") {
    throw new Error("Invalid rule type");
  }

  await prisma.loyaltyRule.create({
    data: {
      name,
      type,
      rewardDescription: str(formData.get("rewardDescription")),
      serviceTypeId:
        type === "PUNCH_CARD" ? str(formData.get("serviceTypeId")) : undefined,
      threshold: type === "PUNCH_CARD" ? num(formData.get("threshold")) : undefined,
      rewardValue:
        type === "PUNCH_CARD" ? num(formData.get("rewardValue")) : undefined,
      pointsPerAmount:
        type === "POINTS_PER_AMOUNT"
          ? num(formData.get("pointsPerAmount"))
          : undefined,
    },
  });
  revalidatePath("/loyalty");
}

export async function toggleRule(formData: FormData) {
  const id = String(formData.get("id") || "");
  const active = formData.get("active") === "true";
  if (!id) return;
  await prisma.loyaltyRule.update({ where: { id }, data: { active: !active } });
  revalidatePath("/loyalty");
}

export async function deleteRule(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.loyaltyRule.delete({ where: { id } });
  revalidatePath("/loyalty");
}

function str(v: FormDataEntryValue | null): string | undefined {
  const s = v == null ? "" : String(v).trim();
  return s === "" ? undefined : s;
}
function num(v: FormDataEntryValue | null): number | undefined {
  const s = str(v);
  if (s === undefined) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}
