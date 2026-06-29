import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { headers } from "next/headers";
import Sidebar from "./components/Sidebar";
import { getSession } from "@/lib/session";

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

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {session ? (
          <div className="flex min-h-screen">
            <Sidebar user={{ name: session.name, role: session.role }} />
            <main className="flex-1 overflow-x-hidden">{children}</main>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
