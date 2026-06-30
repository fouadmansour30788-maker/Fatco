import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import {
  ROLE_LABEL,
  type Role,
  CONFIGURABLE_SECTIONS,
} from "@/lib/permissions";
import { getRolePermissions } from "@/lib/permissions-server";
import { formatDate } from "@/lib/format";
import PageHeader from "@/app/components/PageHeader";
import {
  createUser,
  updateUserRole,
  toggleUserActive,
  deleteUser,
  resetPassword,
  updateRolePermissions,
} from "./actions";

export const dynamic = "force-dynamic";

const ROLES: Role[] = ["OWNER", "MANAGER", "STAFF"];

export default async function StaffPage() {
  const session = await requireRole(["OWNER"]);
  const [users, perms] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ active: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
    }),
    getRolePermissions(),
  ]);

  return (
    <>
      <PageHeader
        title="Staff"
        subtitle="Manage users and their access (owners only)"
      />
      <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-3">
        {/* Create user */}
        <form action={createUser} className="card h-fit space-y-3 p-5">
          <h3 className="text-sm font-semibold text-zinc-700">Add user</h3>
          <div>
            <label className="label">Full name</label>
            <input name="name" required className="input" />
          </div>
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" required className="input" />
          </div>
          <div>
            <label className="label">Temporary password</label>
            <input name="password" type="text" required minLength={6} className="input" />
          </div>
          <div>
            <label className="label">Role</label>
            <select name="role" className="input" defaultValue="STAFF">
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-brand w-full">
            Create user
          </button>
          <p className="text-xs text-zinc-400">
            Owners manage everyone. Managers can access all sections except Staff.
            Staff handle customers, items and sales.
          </p>
        </form>

        {/* Users list */}
        <div className="card overflow-hidden lg:col-span-2">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === session.sub;
                return (
                  <tr key={u.id} className="border-t border-zinc-100 align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {u.name}
                        {isSelf && (
                          <span className="ml-2 text-xs text-zinc-400">(you)</span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400">{u.email}</div>
                      <div className="text-xs text-zinc-300">
                        Since {formatDate(u.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <form action={updateUserRole} className="flex items-center gap-1">
                        <input type="hidden" name="id" value={u.id} />
                        <select
                          name="role"
                          defaultValue={u.role}
                          className="rounded border border-zinc-300 px-2 py-1 text-xs"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABEL[r]}
                            </option>
                          ))}
                        </select>
                        <button className="rounded bg-zinc-100 px-2 py-1 text-xs hover:bg-zinc-200">
                          Save
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          u.active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-zinc-100 text-zinc-500"
                        }`}
                      >
                        {u.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        {!isSelf && (
                          <form action={toggleUserActive}>
                            <input type="hidden" name="id" value={u.id} />
                            <button className="text-xs text-zinc-500 hover:text-brand">
                              {u.active ? "Disable" : "Enable"}
                            </button>
                          </form>
                        )}
                        <form action={resetPassword} className="flex items-center gap-1">
                          <input type="hidden" name="id" value={u.id} />
                          <input
                            name="password"
                            type="text"
                            placeholder="new password"
                            minLength={6}
                            className="w-28 rounded border border-zinc-200 px-2 py-1 text-xs"
                          />
                          <button className="text-xs text-zinc-500 hover:text-brand">
                            Reset
                          </button>
                        </form>
                        {!isSelf && (
                          <form action={deleteUser}>
                            <input type="hidden" name="id" value={u.id} />
                            <button className="text-xs text-zinc-400 hover:text-brand">
                              Delete
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roles & permissions configuration */}
      <div className="px-8 pb-10">
        <form action={updateRolePermissions} className="card p-5">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-700">
              Roles &amp; permissions
            </h3>
            <button type="submit" className="btn-brand">
              Save permissions
            </button>
          </div>
          <p className="mb-4 text-xs text-zinc-400">
            Choose which sections Managers and Staff can open. Owners always have
            full access; the dashboard is always visible; only owners can manage
            staff.
          </p>
          <div className="overflow-hidden rounded-lg border border-zinc-100">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Section</th>
                  <th className="px-4 py-3 text-center font-medium">Manager</th>
                  <th className="px-4 py-3 text-center font-medium">Staff</th>
                </tr>
              </thead>
              <tbody>
                {CONFIGURABLE_SECTIONS.map((s) => (
                  <tr key={s.key} className="border-t border-zinc-100">
                    <td className="px-4 py-2.5">{s.label}</td>
                    <td className="px-4 py-2.5 text-center">
                      <input
                        type="checkbox"
                        name={`perm:MANAGER:${s.key}`}
                        defaultChecked={perms.MANAGER.includes(s.key)}
                        className="h-4 w-4 accent-brand"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <input
                        type="checkbox"
                        name={`perm:STAFF:${s.key}`}
                        defaultChecked={perms.STAFF.includes(s.key)}
                        className="h-4 w-4 accent-brand"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </form>
      </div>
    </>
  );
}
