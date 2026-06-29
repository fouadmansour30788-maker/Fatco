"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { setPortalSession, clearPortalSession } from "@/lib/session";

export type PortalLoginState = { error?: string };

const digits = (s: string) => s.replace(/\D/g, "");

export async function portalLogin(
  _prev: PortalLoginState,
  formData: FormData
): Promise<PortalLoginState> {
  const phone = digits(String(formData.get("phone") || ""));
  const pin = String(formData.get("pin") || "").trim();
  if (!phone || !pin) return { error: "Enter your phone number and PIN." };

  // Match the PIN, then verify the phone (normalised to digits).
  const candidates = await prisma.customer.findMany({ where: { portalPin: pin } });
  const match = candidates.find((c) => c.phone && digits(c.phone) === phone);
  if (!match) return { error: "Phone number or PIN is incorrect." };

  await setPortalSession({ sub: match.id, name: match.name });
  redirect("/portal");
}

export async function portalLogout() {
  await clearPortalSession();
  redirect("/portal/login");
}
