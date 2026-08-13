"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPortalSession, requirePortal } from "@/lib/session";
import { placeOrder } from "@/lib/orders";

export async function addToCart(formData: FormData) {
  const session = await getPortalSession();
  const itemId = String(formData.get("itemId") || "");
  if (!session) {
    redirect(`/portal/login?next=${encodeURIComponent(`/shop/${itemId}`)}`);
  }

  const qty = Number(formData.get("qty") || 1);
  if (!itemId || !Number.isFinite(qty) || qty <= 0) return;

  await prisma.cartItem.upsert({
    where: { customerId_itemId: { customerId: session.sub, itemId } },
    update: { qty: { increment: qty } },
    create: { customerId: session.sub, itemId, qty },
  });
  revalidatePath("/shop/cart");
}

export async function updateCartQty(formData: FormData) {
  const session = await requirePortal();
  const cartItemId = String(formData.get("cartItemId") || "");
  const qty = Number(formData.get("qty") || 0);
  if (!cartItemId) return;

  if (!Number.isFinite(qty) || qty <= 0) {
    await prisma.cartItem.deleteMany({
      where: { id: cartItemId, customerId: session.sub },
    });
  } else {
    await prisma.cartItem.updateMany({
      where: { id: cartItemId, customerId: session.sub },
      data: { qty },
    });
  }
  revalidatePath("/shop/cart");
}

export async function removeFromCart(formData: FormData) {
  const session = await requirePortal();
  const cartItemId = String(formData.get("cartItemId") || "");
  if (!cartItemId) return;
  await prisma.cartItem.deleteMany({
    where: { id: cartItemId, customerId: session.sub },
  });
  revalidatePath("/shop/cart");
}

export async function placeOrderAction(formData: FormData) {
  const session = await requirePortal();
  const shippingAddress = String(formData.get("shippingAddress") || "").trim();
  const paymentMethod = String(formData.get("paymentMethod") || "CASH");
  const notes = String(formData.get("notes") || "").trim() || undefined;
  if (!shippingAddress) throw new Error("Delivery/pickup address is required");

  const order = await placeOrder({
    customerId: session.sub,
    paymentMethod,
    shippingAddress,
    notes,
  });
  revalidatePath("/shop/orders");
  redirect(`/shop/orders/${order.id}`);
}
