"use server";

import { redirect } from "next/navigation";
import { setLocaleCookie, type Locale } from "@/lib/i18n";

// Only allow same-site relative paths, matching app/portal/actions.ts's guard.
function isSafeRedirect(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

export async function setLocaleAction(formData: FormData) {
  const locale: Locale = formData.get("locale") === "ar" ? "ar" : "en";
  const redirectTo = String(formData.get("redirectTo") || "/");
  await setLocaleCookie(locale);
  redirect(isSafeRedirect(redirectTo) ? redirectTo : "/");
}
