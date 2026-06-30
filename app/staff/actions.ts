"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { type Role, CONFIGURABLE_SECTIONS } from "@/lib/permissions";
import { setRolePermissions } from "@/lib/permissions-server";

const ROLES: Role[] = ["OWNER", "MANAGER", "STAFF"];

// Save the Manager/Staff section permissions matrix.
export async function updateRolePermissions(formData: FormData) {
  await requireRole(["OWNER"]);
  const collect = (role: "MANAGER" | "STAFF") =>
    CONFIGURABLE_SECTIONS.filter(
      (s) => formData.get(`perm:${role}:${s.key}`) === "on"
    ).map((s) => s.key);
  await setRolePermissions({
    MANAGER: collect("MANAGER"),
    STAFF: collect("STAFF"),
  });
  revalidatePath("/staff");
  revalidatePath("/dashboard");
}

export async function createUser(formData: FormData) {
  await requireRole(["OWNER"]);

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "STAFF") as Role;

  if (!name || !email || !password) throw new Error("All fields are required");
  if (password.length < 6) throw new Error("Password must be at least 6 characters");
  if (!ROLES.includes(role)) throw new Error("Invalid role");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("A user with that email already exists");

  await prisma.user.create({
    data: { name, email, role, passwordHash: await bcrypt.hash(password, 10) },
  });
  revalidatePath("/staff");
}

export async function updateUserRole(formData: FormData) {
  await requireRole(["OWNER"]);
  const id = String(formData.get("id") || "");
  const role = String(formData.get("role") || "") as Role;
  if (!id || !ROLES.includes(role)) return;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return;
  // Don't allow demoting the last active owner.
  if (user.role === "OWNER" && role !== "OWNER" && (await activeOwnerCount()) <= 1) {
    throw new Error("Cannot demote the last owner");
  }
  await prisma.user.update({ where: { id }, data: { role } });
  revalidatePath("/staff");
}

export async function toggleUserActive(formData: FormData) {
  const session = await requireRole(["OWNER"]);
  const id = String(formData.get("id") || "");
  if (!id) return;
  if (id === session.sub) throw new Error("You cannot deactivate yourself");

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return;
  if (user.active && user.role === "OWNER" && (await activeOwnerCount()) <= 1) {
    throw new Error("Cannot deactivate the last owner");
  }
  await prisma.user.update({ where: { id }, data: { active: !user.active } });
  revalidatePath("/staff");
}

export async function resetPassword(formData: FormData) {
  await requireRole(["OWNER"]);
  const id = String(formData.get("id") || "");
  const password = String(formData.get("password") || "");
  if (!id) return;
  if (password.length < 6) throw new Error("Password must be at least 6 characters");
  await prisma.user.update({
    where: { id },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });
  revalidatePath("/staff");
}

export async function deleteUser(formData: FormData) {
  const session = await requireRole(["OWNER"]);
  const id = String(formData.get("id") || "");
  if (!id) return;
  if (id === session.sub) throw new Error("You cannot delete yourself");

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return;
  if (user.role === "OWNER" && (await activeOwnerCount()) <= 1) {
    throw new Error("Cannot delete the last owner");
  }
  await prisma.user.delete({ where: { id } });
  revalidatePath("/staff");
}

async function activeOwnerCount() {
  return prisma.user.count({ where: { role: "OWNER", active: true } });
}
