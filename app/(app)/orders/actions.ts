"use server";

import { revalidatePath } from "next/cache";
import { confirmOrder, completeOrder, cancelOrder } from "@/lib/orders";

export async function confirmOrderAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  await confirmOrder(id);
  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
}

export async function completeOrderAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  await completeOrder(id);
  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
}

export async function cancelOrderAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  await cancelOrder(id);
  revalidatePath("/orders");
  revalidatePath(`/orders/${id}`);
}
