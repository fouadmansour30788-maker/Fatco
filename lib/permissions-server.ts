import { cache } from "react";
import { prisma } from "./prisma";
import { DEFAULT_PERMISSIONS, type RolePermissions } from "./permissions";

const KEY = "role_permissions";

// Loads the configured Manager/Staff permissions, falling back to defaults.
// Cached per request.
export const getRolePermissions = cache(
  async (): Promise<RolePermissions> => {
    try {
      const row = await prisma.setting.findUnique({ where: { key: KEY } });
      if (!row) return clone(DEFAULT_PERMISSIONS);
      const v = JSON.parse(row.value);
      return {
        MANAGER: Array.isArray(v.MANAGER) ? v.MANAGER : DEFAULT_PERMISSIONS.MANAGER,
        STAFF: Array.isArray(v.STAFF) ? v.STAFF : DEFAULT_PERMISSIONS.STAFF,
      };
    } catch {
      return clone(DEFAULT_PERMISSIONS);
    }
  }
);

export async function setRolePermissions(perms: RolePermissions): Promise<void> {
  await prisma.setting.upsert({
    where: { key: KEY },
    update: { value: JSON.stringify(perms) },
    create: { key: KEY, value: JSON.stringify(perms) },
  });
}

function clone(p: RolePermissions): RolePermissions {
  return { MANAGER: [...p.MANAGER], STAFF: [...p.STAFF] };
}
