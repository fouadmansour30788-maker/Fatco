"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  Wrench,
  Gift,
  Tag,
  Receipt,
  BarChart3,
  Bell,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { logout } from "../login/actions";
import { sectionForPath } from "@/lib/permissions";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/items", label: "Items & Inventory", icon: Package },
  { href: "/sales", label: "Sales & Services", icon: Wrench },
  { href: "/reminders", label: "Reminders", icon: Bell },
  { href: "/loyalty", label: "Loyalty", icon: Gift },
  { href: "/offers", label: "Offers", icon: Tag },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/staff", label: "Staff", icon: ShieldCheck },
];

export default function Sidebar({
  user,
  allowedSections,
  open = false,
  onClose,
}: {
  user: { name: string; role: string };
  allowedSections: string[];
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const allowed = new Set(allowedSections);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center gap-2 border-b border-zinc-200 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand font-bold text-white">
          F
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight">FATCO</div>
          <div className="text-[11px] text-zinc-500">CRM</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV.filter(({ href }) => allowed.has(sectionForPath(href) ?? "")).map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand/10 text-brand"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-200 p-3">
        <div className="mb-2 px-1">
          <div className="truncate text-sm font-medium text-zinc-700">
            {user.name}
          </div>
          <div className="text-[11px] uppercase tracking-wide text-zinc-400">
            {user.role}
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </form>
        <div className="mt-2 px-1 text-[11px] text-zinc-400">
          Ahmad Fawzi Fathalla EST. · Tripoli
        </div>
      </div>
    </aside>
  );
}
