"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createExpense(formData: FormData) {
  const amount = Number(formData.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid amount");

  await prisma.expense.create({
    data: {
      type: String(formData.get("type") || "DIRECT"),
      category: String(formData.get("category") || "Other"),
      amount,
      vendor: opt(formData.get("vendor")),
      note: opt(formData.get("note")),
    },
  });
  revalidatePath("/expenses");
}

function opt(v: FormDataEntryValue | null): string | undefined {
  const s = v == null ? "" : String(v).trim();
  return s === "" ? undefined : s;
}
