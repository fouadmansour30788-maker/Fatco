"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { setStoreContent, type StoreContent } from "@/lib/storeContent";

export async function saveStoreContent(formData: FormData) {
  const data: StoreContent = {
    heroImageUrl: str(formData.get("heroImageUrl")),
    heroHeadline: str(formData.get("heroHeadline")),
    heroHeadlineAr: str(formData.get("heroHeadlineAr")),
    heroSubtitle: str(formData.get("heroSubtitle")),
    heroSubtitleAr: str(formData.get("heroSubtitleAr")),
    heroCtaLabel: str(formData.get("heroCtaLabel")),
    heroCtaHref: str(formData.get("heroCtaHref")),
    footerPhone: str(formData.get("footerPhone")),
    footerEmail: str(formData.get("footerEmail")),
    footerAddress: str(formData.get("footerAddress")),
    footerAddressAr: str(formData.get("footerAddressAr")),
    footerFacebookUrl: str(formData.get("footerFacebookUrl")),
    footerInstagramUrl: str(formData.get("footerInstagramUrl")),
    footerWhatsappUrl: str(formData.get("footerWhatsappUrl")),
  };
  await setStoreContent(data);
  revalidatePath("/store");
  revalidatePath("/shop");
  redirect("/store");
}

function str(v: FormDataEntryValue | null): string {
  return v == null ? "" : String(v).trim();
}
