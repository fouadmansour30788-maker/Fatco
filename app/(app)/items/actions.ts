"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { notifyBackInStock } from "@/lib/backInStock";

export async function createItem(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Name is required");

  await prisma.item.create({
    data: {
      name,
      nameAr: str(formData.get("nameAr")),
      sku: str(formData.get("sku")),
      category: str(formData.get("category")),
      unit: str(formData.get("unit")) ?? "pcs",
      costPrice: num(formData.get("costPrice")) ?? 0,
      salePrice: num(formData.get("salePrice")) ?? 0,
      stockQty: num(formData.get("stockQty")) ?? 0,
      reorderLevel: num(formData.get("reorderLevel")) ?? 0,
      trackStock: formData.get("trackStock") === "on",
      description: str(formData.get("description")),
      descriptionAr: str(formData.get("descriptionAr")),
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
      nameAr: str(formData.get("nameAr")),
      sku: str(formData.get("sku")),
      category: str(formData.get("category")),
      unit: str(formData.get("unit")) ?? "pcs",
      costPrice: num(formData.get("costPrice")) ?? 0,
      salePrice: num(formData.get("salePrice")) ?? 0,
      reorderLevel: num(formData.get("reorderLevel")) ?? 0,
      trackStock: formData.get("trackStock") === "on",
      active: formData.get("active") === "on",
      description: str(formData.get("description")),
      descriptionAr: str(formData.get("descriptionAr")),
      imageUrl: str(formData.get("imageUrl")),
      storefrontVisible: formData.get("storefrontVisible") === "on",
    },
  });
  revalidatePath("/items");
  redirect("/items");
}

// Stock in/out adjustment that also writes an inventory movement record. If
// this brings a previously-out-of-stock item back above zero, fires
// back-in-stock notifications to anyone who asked (see lib/backInStock.ts).
export async function adjustStock(formData: FormData) {
  const id = String(formData.get("itemId") || "");
  const delta = num(formData.get("delta")) ?? 0;
  const note = str(formData.get("note"));
  if (!id || delta === 0) return;

  const before = await prisma.item.findUnique({
    where: { id },
    select: { stockQty: true },
  });
  if (!before) return;

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

  const wasOut = before.stockQty <= 0;
  const nowIn = before.stockQty + delta > 0;
  if (wasOut && nowIn) await notifyBackInStock(id);
}

// One-click toggle from the items list — no need to open the edit form just
// to link/unlink an item from the storefront.
export async function toggleStorefrontVisible(formData: FormData) {
  const id = String(formData.get("id") || "");
  const next = formData.get("next") === "1";
  if (!id) return;
  await prisma.item.update({
    where: { id },
    data: { storefrontVisible: next },
  });
  revalidatePath("/items");
  revalidatePath("/shop");
}

type BundleComponentInput = { itemId: string; qty: number };

function parseComponents(formData: FormData): BundleComponentInput[] {
  let components: BundleComponentInput[] = [];
  try {
    components = JSON.parse(String(formData.get("components") || "[]"));
  } catch {
    throw new Error("Invalid component data");
  }
  components = components.filter((c) => c.itemId && c.qty > 0);
  if (components.length === 0) throw new Error("Add at least one component");
  return components;
}

export async function createBundle(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Name is required");
  const components = parseComponents(formData);

  await prisma.item.create({
    data: {
      name,
      nameAr: str(formData.get("nameAr")),
      sku: str(formData.get("sku")),
      kind: "BUNDLE",
      trackStock: false,
      salePrice: num(formData.get("salePrice")) ?? 0,
      description: str(formData.get("description")),
      descriptionAr: str(formData.get("descriptionAr")),
      imageUrl: str(formData.get("imageUrl")),
      storefrontVisible: formData.get("storefrontVisible") === "on",
      bundleComponents: {
        create: components.map((c) => ({ componentItemId: c.itemId, qty: c.qty })),
      },
    },
  });
  revalidatePath("/items");
  redirect("/items");
}

export async function updateBundle(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing bundle id");
  const components = parseComponents(formData);

  await prisma.$transaction([
    prisma.bundleComponent.deleteMany({ where: { bundleItemId: id } }),
    prisma.item.update({
      where: { id },
      data: {
        name: String(formData.get("name") || "").trim(),
        nameAr: str(formData.get("nameAr")),
        sku: str(formData.get("sku")),
        salePrice: num(formData.get("salePrice")) ?? 0,
        description: str(formData.get("description")),
        descriptionAr: str(formData.get("descriptionAr")),
        imageUrl: str(formData.get("imageUrl")),
        active: formData.get("active") === "on",
        storefrontVisible: formData.get("storefrontVisible") === "on",
        bundleComponents: {
          create: components.map((c) => ({ componentItemId: c.itemId, qty: c.qty })),
        },
      },
    }),
  ]);
  revalidatePath("/items");
  redirect("/items");
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
