import Link from "next/link";
import { Droplet, CircleDot, Gift, Bell, ArrowRight } from "lucide-react";
import Car3DClient from "./components/Car3DClient";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "FATCO — Oil, Tyres & Car Care · Tripoli",
  description:
    "FATCO (Ahmad Fawzi Fathalla EST.) — oil changes, tyres and car services in Tripoli. Track your service history and loyalty rewards.",
};

const SERVICES = [
  { icon: Droplet, title: "Oil changes", desc: "Quality oils & filters, done fast." },
  { icon: CircleDot, title: "Tyres & wheels", desc: "Fitting, balancing and alignment." },
  { icon: Gift, title: "Loyalty rewards", desc: "Earn points — every 5th oil change free." },
  { icon: Bell, title: "Smart reminders", desc: "We tell you when you're due." },
];

export default async function LandingPage() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      {/* Top bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand font-bold">
            F
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold tracking-tight">FATCO</div>
            <div className="text-[11px] text-zinc-400">Ahmad Fawzi Fathalla EST.</div>
          </div>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href="/portal/login"
            className="rounded-lg px-3 py-2 text-zinc-300 hover:text-white"
          >
            Customer portal
          </Link>
          {session ? (
            <Link href="/dashboard" className="btn-brand">
              Open dashboard
            </Link>
          ) : (
            <Link href="/login" className="btn-brand">
              Staff sign in
            </Link>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-6 px-6 pb-10 pt-6 lg:grid-cols-2 lg:pt-12">
        {/* glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-brand/30 blur-[120px]" />

        <div className="relative z-10">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
            Tripoli · Lebanon
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Keep your car
            <span className="text-brand"> running smoothly</span>
          </h1>
          <p className="mt-4 max-w-md text-zinc-300">
            Oil, tyres and full car care — for individuals and fleets. Track every
            service, collect loyalty rewards, and never miss a change again.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/portal/login" className="btn-brand">
              My account <ArrowRight size={16} />
            </Link>
            <Link
              href={session ? "/dashboard" : "/login"}
              className="btn inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/5"
            >
              {session ? "Open dashboard" : "Staff sign in"}
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
          {SERVICES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition-colors hover:border-brand/40"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand/15 text-brand">
                <Icon size={20} />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-brand/20 to-transparent p-8 sm:p-12">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Already a FATCO customer?
          </h2>
          <p className="mt-2 max-w-lg text-zinc-300">
            View your full service history, loyalty points and rewards in the
            customer portal. Ask our team for your access PIN.
          </p>
          <Link href="/portal/login" className="btn-brand mt-6 inline-flex">
            Go to customer portal <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 py-6 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} FATCO — Ahmad Fawzi Fathalla EST. · Tripoli,
        Lebanon
      </footer>
    </div>
  );
}
