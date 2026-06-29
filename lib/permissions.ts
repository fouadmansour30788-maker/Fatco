// Central role/section access rules. Pure & edge-safe so middleware, the
// sidebar, and server actions can all share one source of truth.

export type Role = "OWNER" | "MANAGER" | "STAFF";

// Section access by URL prefix. A path with no matching rule is open to any
// authenticated user (dashboard, customers, items, sales).
export const SECTION_ACCESS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/staff", roles: ["OWNER"] },
  { prefix: "/expenses", roles: ["OWNER", "MANAGER"] },
  { prefix: "/reports", roles: ["OWNER", "MANAGER"] },
  { prefix: "/loyalty", roles: ["OWNER", "MANAGER"] },
  { prefix: "/offers", roles: ["OWNER", "MANAGER"] },
];

export function canAccess(role: string, pathname: string): boolean {
  const rule = SECTION_ACCESS.find(
    (r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/")
  );
  if (!rule) return true; // open section
  return rule.roles.includes(role as Role);
}

export const ROLE_LABEL: Record<Role, string> = {
  OWNER: "Owner",
  MANAGER: "Manager",
  STAFF: "Staff",
};
