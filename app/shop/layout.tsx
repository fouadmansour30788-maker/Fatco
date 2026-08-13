import Link from "next/link";
import { ShoppingCart, User } from "lucide-react";
import { getPortalSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getPortalSession();
  const cartCount = session
    ? await prisma.cartItem
        .aggregate({ where: { customerId: session.sub }, _sum: { qty: true } })
        .then((r) => r._sum.qty ?? 0)
    : 0;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/shop" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
              F
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight">FATCO</div>
              <div className="text-[10px] text-zinc-500">Online Store</div>
            </div>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {session ? (
              <>
                <Link href="/shop/orders" className="text-zinc-600 hover:text-brand">
                  My orders
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
                Sign in
              </Link>
            )}
            <Link
              href="/shop/cart"
              className="relative flex items-center gap-1 text-zinc-600 hover:text-brand"
            >
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
