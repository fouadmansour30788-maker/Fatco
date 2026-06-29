import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { ROLE_LABEL, type Role } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import PageHeader from "../components/PageHeader";
import {
  createUser,
  updateUserRole,
  toggleUserActive,
  deleteUser,
  resetPassword,
} from "./actions";

export const dynamic = "force-dynamic";

const ROLES: Role[] = ["OWNER", "MANAGER", "STAFF"];

export default async function StaffPage() {
  const session = await requireRole(["OWNER"]);
  const users = await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });

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
    </>
  );
}
