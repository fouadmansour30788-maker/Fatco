import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  PORTAL_COOKIE,
  signSession,
  signPortalSession,
  verifySessionToken,
  verifyPortalToken,
  type SessionPayload,
  type PortalPayload,
} from "./auth";
import type { Role } from "./permissions";

// Server-only session helpers (use next/headers cookies).

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export async function setSession(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

// Guard for server actions / pages. Redirects away if the current user is not
// signed in or lacks one of the allowed roles. Returns the session otherwise.
export async function requireRole(
  roles: Role[]
): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!roles.includes(session.role as Role)) redirect("/");
  return session;
}

// ---- Client portal session helpers ----

export async function getPortalSession(): Promise<PortalPayload | null> {
  const store = await cookies();
  return verifyPortalToken(store.get(PORTAL_COOKIE)?.value);
}

export async function setPortalSession(payload: PortalPayload): Promise<void> {
  const token = await signPortalSession(payload);
  const store = await cookies();
  store.set(PORTAL_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearPortalSession(): Promise<void> {
  const store = await cookies();
  store.delete(PORTAL_COOKIE);
}

export async function requirePortal(): Promise<PortalPayload> {
  const session = await getPortalSession();
  if (!session) redirect("/portal/login");
  return session;
}
