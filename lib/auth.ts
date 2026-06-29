import { SignJWT, jwtVerify } from "jose";

// Edge-safe auth core (no next/headers, no node-only APIs) so it can be used
// from middleware as well as server actions. Cookie read/write lives in
// lib/session.ts (server-only).

export const SESSION_COOKIE = "fatco_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-insecure-secret-change-me"
);

export type SessionPayload = {
  sub: string; // user id
  name: string;
  email: string;
  role: string; // OWNER | MANAGER | STAFF
};

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(
  token?: string
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      sub: String(payload.sub),
      name: String(payload.name),
      email: String(payload.email),
      role: String(payload.role),
    };
  } catch {
    return null;
  }
}

// ---- Client portal sessions (customers) — separate cookie from staff ----
export const PORTAL_COOKIE = "fatco_portal";

export type PortalPayload = {
  sub: string; // customer id
  name: string;
};

export async function signPortalSession(
  payload: PortalPayload
): Promise<string> {
  return new SignJWT({ ...payload, scope: "portal" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyPortalToken(
  token?: string
): Promise<PortalPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.scope !== "portal") return null;
    return { sub: String(payload.sub), name: String(payload.name) };
  } catch {
    return null;
  }
}
