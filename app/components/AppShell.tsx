"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

export default function AppShell({
  user,
  allowedSections,
  children,
}: {
  user: { name: string; role: string };
  allowedSections: string[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen lg:flex">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <Sidebar
        user={user}
        allowedSections={allowedSections}
        open={open}
        onClose={() => setOpen(false)}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        {/* Mobile top bar with hamburger */}
        <header className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
              F
            </div>
            <span className="text-sm font-bold tracking-tight">FATCO</span>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
