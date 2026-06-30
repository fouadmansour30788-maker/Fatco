import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "../components/AppShell";
import { getSession } from "@/lib/session";
import { getRolePermissions } from "@/lib/permissions-server";
import {
  SECTIONS,
  sectionForPath,
  roleCanAccess,
  type Role,
} from "@/lib/permissions";

// Layout for all authenticated back-office routes. Living in its own route
// group means Next.js mounts it fresh when navigating in from the public
// landing/login pages, so the sidebar reliably appears (a shared root layout
// is NOT re-rendered across client navigations).
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();
  if (!session) redirect("/login");

  const role = session.role as Role;
  const perms = await getRolePermissions();

  const pathname = (await headers()).get("x-pathname") ?? "";
  const section = sectionForPath(pathname);
  if (!roleCanAccess(role, section, perms)) redirect("/dashboard");

  const allowedSections = SECTIONS.filter((s) =>
    roleCanAccess(role, s.key, perms)
  ).map((s) => s.key);

  return (
    <AppShell
      user={{ name: session.name, role: session.role }}
      allowedSections={allowedSections}
    >
      {children}
    </AppShell>
  );
}
