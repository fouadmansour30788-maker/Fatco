import { getPortalSession } from "@/lib/session";
import { portalLogout } from "./actions";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getPortalSession();

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
              F
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight">FATCO</div>
              <div className="text-[10px] text-zinc-500">Customer Portal</div>
            </div>
          </div>
          {session && (
            <form action={portalLogout}>
              <button className="text-sm text-zinc-500 hover:text-brand">
                Sign out
              </button>
            </form>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
