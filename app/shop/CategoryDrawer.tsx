"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

// Wraps the (server-rendered) CategorySidebar so only the open/close chrome
// is client-side. Static column on desktop, slide-in drawer on mobile — same
// mechanics as the staff back-office's AppShell/Sidebar drawer.
export default function CategoryDrawer({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // A single wrapping element matters here: this component is placed
  // directly inside a CSS Grid in app/shop/page.tsx. A Fragment would let
  // Grid treat each top-level child (button/backdrop/panel) as its own grid
  // item instead of one, breaking the two-column layout.
  return (
    <div>
      {/* Wrapped rather than putting sm:hidden directly on the button:
          btn-ghost is unlayered CSS (plain @apply in globals.css), and
          unlayered rules always beat Tailwind's layered utilities — including
          responsive variants — regardless of source order. */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-ghost mb-4"
        >
          <Menu size={16} /> {label}
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 sm:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <div
        className={`fixed inset-y-0 start-0 z-40 w-64 overflow-y-auto bg-white p-4 shadow-lg transition-transform duration-200 sm:static sm:z-auto sm:w-48 sm:shrink-0 sm:translate-x-0 sm:bg-transparent sm:p-0 sm:shadow-none ${
          open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="mb-4 flex ms-auto text-zinc-500 hover:text-brand sm:hidden"
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}
