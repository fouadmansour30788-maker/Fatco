import Link from "next/link";
import { headers } from "next/headers";
import { ShoppingCart, User, Heart } from "lucide-react";
import { getPortalSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/i18n";
import { getStoreContent } from "@/lib/storeContent";
import { notoSansArabic } from "@/lib/fonts";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import Footer from "./Footer";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, { locale, t }, pathname, storeContent] = await Promise.all([
    getPortalSession(),
    getDictionary(),
    headers().then((h) => h.get("x-pathname") ?? "/shop"),
    getStoreContent(),
  ]);
  const cartCount = session
    ? await prisma.cartItem
        .aggregate({ where: { customerId: session.sub }, _sum: { qty: true } })
        .then((r) => r._sum.qty ?? 0)
    : 0;
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div
      dir={dir}
      className={`flex min-h-screen flex-col bg-zinc-50 ${locale === "ar" ? notoSansArabic.variable : ""}`}
    >
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/shop" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
              F
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight">FATCO</div>
              <div className="text-[10px] text-zinc-500">{t.shop.storeName}</div>
            </div>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {session ? (
              <>
                <Link href="/shop/orders" className="text-zinc-600 hover:text-brand">
                  {t.common.myOrders}
                </Link>
                <Link
                  href="/portal"
                  className="flex items-center gap-1 text-zinc-600 hover:text-brand"
                >
                  <User size={16} /> {session.name.split(" ")[0]}
                </Link>
              </>
            ) : (
              <Link href="/portal/login?next=/shop" className="text-zinc-600 hover:text-brand">
                {t.common.signIn}
              </Link>
            )}
            {session && (
              <Link
                href="/shop/wishlist"
                aria-label={t.shop.wishlistTitle}
                className="text-zinc-600 hover:text-brand"
              >
                <Heart size={18} />
              </Link>
            )}
            <Link
              href="/shop/cart"
              className="relative flex items-center gap-1 text-zinc-600 hover:text-brand"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -end-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            <LanguageSwitcher locale={locale} path={pathname} />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      <Footer
        content={storeContent}
        locale={locale}
        t={{ ...t.shop, ...t.common, ...t.landing }}
      />
    </div>
  );
}
