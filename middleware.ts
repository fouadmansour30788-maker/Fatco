import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE,
  PORTAL_COOKIE,
  verifySessionToken,
  verifyPortalToken,
} from "@/lib/auth";

const PUBLIC_PATHS = ["/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Expose the path to server components (root layout uses it to decide chrome).
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  const pass = () => NextResponse.next({ request: { headers: requestHeaders } });

  // ---- Client portal (customers) — separate auth from staff ----
  if (pathname === "/portal" || pathname.startsWith("/portal/")) {
    const isPortalPublic = pathname === "/portal/login";
    const portal = await verifyPortalToken(req.cookies.get(PORTAL_COOKIE)?.value);
    if (!portal && !isPortalPublic) {
      return redirectTo(req, "/portal/login");
    }
    if (portal && isPortalPublic) {
      return redirectTo(req, "/portal");
    }
    return pass();
  }

  // ---- Staff / back office ----
  // "/" is the public marketing landing page.
  const isPublic =
    pathname === "/" ||
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);

  if (!session && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }
  if (session && pathname === "/login") {
    return redirectTo(req, "/dashboard");
  }
  // Section-level permission enforcement happens in the root layout (it can read
  // the configurable permissions from the DB; middleware runs on the edge).

  return pass();
}

function redirectTo(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
