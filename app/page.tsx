import Link from "next/link";
import { headers } from "next/headers";
import { Droplet, CircleDot, Gift, Bell, ArrowRight, ShoppingCart } from "lucide-react";
import Car3DClient from "./components/Car3DClient";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { getDictionary } from "@/lib/i18n";
import { notoSansArabic } from "@/lib/fonts";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "FATCO — Oil, Tyres & Car Care · Tripoli",
  description:
    "FATCO (Ahmad Fawzi Fathalla EST.) — oil changes, tyres and car services in Tripoli. Track your service history and loyalty rewards.",
};

const SERVICE_ICONS = [Droplet, CircleDot, Gift, Bell];

export default async function LandingPage() {
  const [{ locale, t }, pathname] = await Promise.all([
    getDictionary(),
    headers().then((h) => h.get("x-pathname") ?? "/"),
  ]);
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div
      dir={dir}
      className={`min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white ${
        locale === "ar" ? notoSansArabic.variable : ""
      }`}
    >
      {/* Top bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand font-bold">
            F
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight">FATCO</div>
            <div className="text-[11px] text-zinc-400">{t.common.brandTagline}</div>
          </div>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/portal/login"
            className="rounded-lg px-3 py-2 text-zinc-300 hover:text-white"
          >
            {t.common.customerPortal}
          </Link>
          <Link href="/login" className="rounded-lg px-3 py-2 text-zinc-300 hover:text-white">
            {t.common.staffLogin}
          </Link>
          <Link href="/shop" className="btn-brand">
            <ShoppingCart size={16} /> {t.common.shopOnline}
          </Link>
          <LanguageSwitcher
            locale={locale}
            path={pathname}
            className="text-zinc-300 hover:text-white"
          />
        </nav>
      </header>

      {/* Hero */}
      <section className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-6 px-6 pb-10 pt-6 lg:grid-cols-2 lg:pt-12">
        {/* glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-brand/30 blur-[120px]" />

        <div className="relative z-10">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
            {t.landing.location}
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            {t.landing.heroTitle1}
            <span className="text-brand"> {t.landing.heroTitleHighlight}</span>
          </h1>
          <p className="mt-4 max-w-md text-zinc-300">{t.landing.heroSubtitle}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/shop" className="btn-brand">
              <ShoppingCart size={16} /> {t.common.shopOnline}
            </Link>
            <Link
              href="/portal/login"
              className="btn inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
            >
              {t.common.customerPortal} <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="btn inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
            >
              {t.common.staffLogin}
            </Link>
          </div>
        </div>

        {/* 3D car */}
        <div className="relative z-10 h-[340px] w-full sm:h-[420px] lg:h-[460px]">
          <Car3DClient />
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.landing.services.map((service, i) => {
            const Icon = SERVICE_ICONS[i];
            return (
              <div
                key={service.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition-colors hover:border-brand/40"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand/15 text-brand">
                  <Icon size={20} />
                </div>
                <h3 className="font-semibold">{service.title}</h3>
                <p className="mt-1 text-sm text-zinc-400">{service.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-brand/20 to-transparent p-8 sm:p-12">
          <h2 className="text-2xl font-bold sm:text-3xl">{t.landing.ctaTitle}</h2>
          <p className="mt-2 max-w-lg text-zinc-300">{t.landing.ctaSubtitle}</p>
          <Link href="/portal/login" className="btn-brand mt-6 inline-flex">
            {t.landing.ctaButton} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-zinc-500">
        {t.landing.footer(new Date().getFullYear())}
      </footer>
    </div>
  );
}
