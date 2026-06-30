"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

const MANAGE: ("OWNER" | "MANAGER")[] = ["OWNER", "MANAGER"];

export async function createOffer(formData: FormData) {
  await requireRole(MANAGE);
  const data = parseOffer(formData);
  await prisma.offer.create({ data: { ...data, active: true } });
  revalidatePath("/offers");
  redirect("/offers");
}

export async function updateOffer(formData: FormData) {
  await requireRole(MANAGE);
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing offer id");
  const data = parseOffer(formData);
  await prisma.offer.update({
    where: { id },
    data: { ...data, active: formData.get("active") === "on" },
  });
  revalidatePath("/offers");
  redirect("/offers");
}

export async function toggleOffer(formData: FormData) {
  await requireRole(MANAGE);
  const id = String(formData.get("id") || "");
  const active = formData.get("active") === "true";
  if (!id) return;
  await prisma.offer.update({ where: { id }, data: { active: !active } });
  revalidatePath("/offers");
}

export async function deleteOffer(formData: FormData) {
  await requireRole(MANAGE);
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.offer.delete({ where: { id } });
  revalidatePath("/offers");
}

function parseOffer(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Name is required");
  const discountType = String(formData.get("discountType") || "PERCENT");
  if (discountType !== "PERCENT" && discountType !== "AMOUNT") {
    throw new Error("Invalid discount type");
  }
  const discountValue = Number(formData.get("discountValue"));
  if (!Number.isFinite(discountValue) || discountValue < 0) {
    throw new Error("Invalid discount value");
  }
  return {
    name,
    description: str(formData.get("description")),
    discountType,
    discountValue,
    startDate: date(formData.get("startDate")),
    endDate: date(formData.get("endDate")),
  };
}

function str(v: FormDataEntryValue | null): string | undefined {
  const s = v == null ? "" : String(v).trim();
  return s === "" ? undefined : s;
}
function date(v: FormDataEntryValue | null): Date | null {
  const s = str(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
