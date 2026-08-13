"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function createItem(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Name is required");

  await prisma.item.create({
    data: {
      name,
      sku: str(formData.get("sku")),
      category: str(formData.get("category")),
      unit: str(formData.get("unit")) ?? "pcs",
      costPrice: num(formData.get("costPrice")) ?? 0,
      salePrice: num(formData.get("salePrice")) ?? 0,
      stockQty: num(formData.get("stockQty")) ?? 0,
      reorderLevel: num(formData.get("reorderLevel")) ?? 0,
      trackStock: formData.get("trackStock") === "on",
      description: str(formData.get("description")),
      imageUrl: str(formData.get("imageUrl")),
      storefrontVisible: formData.get("storefrontVisible") === "on",
    },
  });
  revalidatePath("/items");
  redirect("/items");
}

export async function updateItem(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing item id");
  await prisma.item.update({
    where: { id },
    data: {
      name: String(formData.get("name") || "").trim(),
      sku: str(formData.get("sku")),
      category: str(formData.get("category")),
      unit: str(formData.get("unit")) ?? "pcs",
      costPrice: num(formData.get("costPrice")) ?? 0,
      salePrice: num(formData.get("salePrice")) ?? 0,
      reorderLevel: num(formData.get("reorderLevel")) ?? 0,
      trackStock: formData.get("trackStock") === "on",
      active: formData.get("active") === "on",
      description: str(formData.get("description")),
      imageUrl: str(formData.get("imageUrl")),
      storefrontVisible: formData.get("storefrontVisible") === "on",
    },
  });
  revalidatePath("/items");
  redirect("/items");
}

// Stock in/out adjustment that also writes an inventory movement record.
export async function adjustStock(formData: FormData) {
  const id = String(formData.get("itemId") || "");
  const delta = num(formData.get("delta")) ?? 0;
  const note = str(formData.get("note"));
  if (!id || delta === 0) return;

  await prisma.$transaction([
    prisma.item.update({
      where: { id },
      data: { stockQty: { increment: delta } },
    }),
    prisma.inventoryMovement.create({
      data: {
        itemId: id,
        type: delta > 0 ? "PURCHASE" : "ADJUSTMENT",
        qty: delta,
        note: note ?? "Manual adjustment",
      },
    }),
  ]);
  revalidatePath("/items");
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
