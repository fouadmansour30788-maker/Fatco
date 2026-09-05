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

export async function requestBackInStockAlert(formData: FormData) {
  const session = await getPortalSession();
  const itemId = String(formData.get("itemId") || "");
  if (!session) {
    redirect(`/portal/login?next=${encodeURIComponent(`/shop/${itemId}`)}`);
  }
  if (!itemId) return;

  await prisma.backInStockAlert.upsert({
    where: { itemId_customerId: { itemId, customerId: session.sub } },
    update: {},
    create: { itemId, customerId: session.sub },
  });
  revalidatePath(`/shop/${itemId}`);
}

export async function placeOrderAction(formData: FormData) {
  const session = await requirePortal();
  const shippingAddress = String(formData.get("shippingAddress") || "").trim();
  const paymentMethod = String(formData.get("paymentMethod") || "CASH");
  const notes = String(formData.get("notes") || "").trim() || undefined;
  const redeemRewardId = String(formData.get("redeemRewardId") || "") || undefined;
  if (!shippingAddress) throw new Error("Delivery/pickup address is required");

  const order = await placeOrder({
    customerId: session.sub,
    paymentMethod,
    shippingAddress,
    notes,
    redeemRewardId,
  });
  revalidatePath("/shop/orders");
  redirect(`/shop/orders/${order.id}`);
}

export async function toggleWishlist(formData: FormData) {
  const session = await getPortalSession();
  const itemId = String(formData.get("itemId") || "");
  const redirectTo = String(formData.get("redirectTo") || `/shop/${itemId}`);
  if (!session) {
    redirect(`/portal/login?next=${encodeURIComponent(redirectTo)}`);
  }
  if (!itemId) return;

  const existing = await prisma.wishlistItem.findUnique({
    where: { customerId_itemId: { customerId: session.sub, itemId } },
  });
  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.wishlistItem.create({ data: { customerId: session.sub, itemId } });
  }
  revalidatePath(redirectTo);
  revalidatePath("/shop/wishlist");
}

export async function submitReview(formData: FormData) {
  const session = await requirePortal();
  const itemId = String(formData.get("itemId") || "");
  const rating = Number(formData.get("rating") || 0);
  const comment = String(formData.get("comment") || "").trim() || undefined;
  if (!itemId || !Number.isInteger(rating) || rating < 1 || rating > 5) return;

  // Never trust the client-rendered form gate alone — re-verify the customer
  // actually has a completed purchase of this item before allowing a review.
  const purchased = await prisma.transactionLine.findFirst({
    where: {
      itemId,
      transaction: { customerId: session.sub, status: "COMPLETED" },
    },
  });
  if (!purchased) return;

  await prisma.review.upsert({
    where: { customerId_itemId: { customerId: session.sub, itemId } },
    update: { rating, comment },
    create: { customerId: session.sub, itemId, rating, comment },
  });
  revalidatePath(`/shop/${itemId}`);
}
