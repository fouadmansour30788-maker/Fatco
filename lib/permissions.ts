// Central role/section model. Pure & edge-safe (no DB) so middleware, the
// sidebar, and server code can share it. The actual allow-lists for MANAGER and
// STAFF are configurable and stored in the DB (see lib/permissions-server.ts);
// this file only defines the sections, defaults, and the matching logic.

export type Role = "OWNER" | "MANAGER" | "STAFF";

export const ROLE_LABEL: Record<Role, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  STAFF: "Staff",
};

export type Section = {
  key: string;
  label: string;
  prefix: string;
};

// All app sections, by URL prefix.
export const SECTIONS: Section[] = [
  { key: "dashboard", label: "Dashboard", prefix: "/dashboard" },
  { key: "customers", label: "Customers", prefix: "/customers" },
  { key: "items", label: "Items & Inventory", prefix: "/items" },
  { key: "sales", label: "Sales & Services", prefix: "/sales" },
  { key: "orders", label: "Online Orders", prefix: "/orders" },
  { key: "reminders", label: "Reminders", prefix: "/reminders" },
  { key: "loyalty", label: "Loyalty", prefix: "/loyalty" },
  { key: "offers", label: "Offers", prefix: "/offers" },
  { key: "expenses", label: "Expenses", prefix: "/expenses" },
  { key: "reports", label: "Reports", prefix: "/reports" },
  { key: "staff", label: "Staff", prefix: "/staff" },
];

// Sections whose Manager/Staff access can be toggled by the owner.
// (dashboard is always allowed; staff is always owner-only.)
export const CONFIGURABLE_SECTIONS = SECTIONS.filter(
  (s) => s.key !== "dashboard" && s.key !== "staff"
);

export type RolePermissions = { MANAGER: string[]; STAFF: string[] };

export const DEFAULT_PERMISSIONS: RolePermissions = {
  MANAGER: CONFIGURABLE_SECTIONS.map((s) => s.key),
  STAFF: ["customers", "items", "sales", "orders", "reminders"],
};

export function sectionForPath(pathname: string): string | null {
  const s = SECTIONS.find(
    (s) => pathname === s.prefix || pathname.startsWith(s.prefix + "/")
  );
  return s?.key ?? null;
}

// Can `role` access `sectionKey` given the configured permissions?
export function roleCanAccess(
  role: Role,
  sectionKey: string | null,
  perms: RolePermissions
): boolean {
  if (!sectionKey) return true; // unknown path (e.g. "/") — let it through
  if (sectionKey === "dashboard") return true;
  if (sectionKey === "staff") return role === "OWNER";
  if (role === "OWNER") return true;
  const list = role === "MANAGER" ? perms.MANAGER : perms.STAFF;
  return list.includes(sectionKey);
}
