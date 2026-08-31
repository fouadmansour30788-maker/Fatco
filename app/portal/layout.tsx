import { headers } from "next/headers";
import { getPortalSession } from "@/lib/session";
import { getDictionary } from "@/lib/i18n";
import { notoSansArabic } from "@/lib/fonts";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import { portalLogout } from "./actions";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, { locale, t }, pathname] = await Promise.all([
    getPortalSession(),
    getDictionary(),
    headers().then((h) => h.get("x-pathname") ?? "/portal"),
  ]);
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div
      dir={dir}
      className={`min-h-screen bg-zinc-50 ${locale === "ar" ? notoSansArabic.variable : ""}`}
    >
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
              F
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight">FATCO</div>
              <div className="text-[10px] text-zinc-500">{t.portal.portalName}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher locale={locale} path={pathname} />
            {session && (
              <form action={portalLogout}>
                <button className="text-sm text-zinc-500 hover:text-brand">
                  {t.common.signOut}
                </button>
              </form>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
