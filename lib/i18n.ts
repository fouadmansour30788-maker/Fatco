import { cookies } from "next/headers";
import en from "./i18n/dictionaries/en";
import ar from "./i18n/dictionaries/ar";

export type Locale = "en" | "ar";

const COOKIE = "fatco_lang";
const DICTS = { en, ar };

// Public-page language preference only (staff back-office stays English).
// Cookie-based rather than /[locale]/... routing — see plan for the tradeoff.
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return store.get(COOKIE)?.value === "ar" ? "ar" : "en";
}

export async function setLocaleCookie(locale: Locale): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

export async function getDictionary(): Promise<{
  locale: Locale;
  t: (typeof DICTS)["en"];
}> {
  const locale = await getLocale();
  return { locale, t: DICTS[locale] };
}
