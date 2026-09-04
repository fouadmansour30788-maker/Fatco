import { cache } from "react";
import { prisma } from "./prisma";

const KEY = "store_content";

export type StoreContent = {
  heroImageUrl: string;
  heroHeadline: string;
  heroHeadlineAr: string;
  heroSubtitle: string;
  heroSubtitleAr: string;
  heroCtaLabel: string;
  heroCtaHref: string;
  footerPhone: string;
  footerEmail: string;
  footerAddress: string;
  footerAddressAr: string;
  footerFacebookUrl: string;
  footerInstagramUrl: string;
  footerWhatsappUrl: string;
};

const DEFAULTS: StoreContent = {
  heroImageUrl: "",
  heroHeadline: "",
  heroHeadlineAr: "",
  heroSubtitle: "",
  heroSubtitleAr: "",
  heroCtaLabel: "",
  heroCtaHref: "",
  footerPhone: "",
  footerEmail: "",
  footerAddress: "",
  footerAddressAr: "",
  footerFacebookUrl: "",
  footerInstagramUrl: "",
  footerWhatsappUrl: "",
};

// Single-record store content (hero + footer), same Setting-JSON pattern as
// lib/permissions-server.ts's role permissions. Cached per request.
export const getStoreContent = cache(async (): Promise<StoreContent> => {
  try {
    const row = await prisma.setting.findUnique({ where: { key: KEY } });
    if (!row) return { ...DEFAULTS };
    const v = JSON.parse(row.value);
    return { ...DEFAULTS, ...v };
  } catch {
    return { ...DEFAULTS };
  }
});

export async function setStoreContent(data: StoreContent): Promise<void> {
  await prisma.setting.upsert({
    where: { key: KEY },
    update: { value: JSON.stringify(data) },
    create: { key: KEY, value: JSON.stringify(data) },
  });
}
