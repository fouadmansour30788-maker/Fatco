import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "./components/AppShell";
import { getSession } from "@/lib/session";
import { getRolePermissions } from "@/lib/permissions-server";
import { SECTIONS, sectionForPath, roleCanAccess, type Role } from "@/lib/permissions";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FATCO CRM",
  description: "Customer & operations management for FATCO — Tripoli",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  // Pages that render full-bleed without the staff sidebar.
  const noChrome = pathname === "/" || pathname.startsWith("/portal");
  const session = noChrome ? null : await getSession();

  let allowedSections: string[] = [];
  if (session) {
    const role = session.role as Role;
    const perms = await getRolePermissions();
    // Enforce configured permissions for the current section.
    const section = sectionForPath(pathname);
    if (!roleCanAccess(role, section, perms)) redirect("/dashboard");
    allowedSections = SECTIONS.filter((s) =>
      roleCanAccess(role, s.key, perms)
    ).map((s) => s.key);
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {session ? (
          <AppShell
            user={{ name: session.name, role: session.role }}
            allowedSections={allowedSections}
          >
            {children}
          </AppShell>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
