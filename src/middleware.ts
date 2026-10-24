import { NextResponse, type NextRequest } from "next/server";

/**
 * VAPETIVE — edge gate for authenticated surfaces.
 *
 * Cookie-presence check only (no DB at the edge): it returns a hard 307
 * before any streaming starts, which keeps protected routes out of caches
 * and preserves correct status codes even when a Suspense boundary (e.g.
 * the (site) loading skeleton) would otherwise soften an in-page redirect
 * into a 200. The real session validation still happens server-side in the
 * account gate / admin layout — this is layer one.
 */

const PUBLIC_ACCOUNT_PATHS = new Set([
  "/account/sign-in",
  "/account/register",
  "/account/forgot-password",
  "/account/reset-password",
  "/account/verify",
]);

// Edge modules cannot import src/server/env.ts (node deps) — this MUST stay
// in sync with SESSION_COOKIE there. If you change one, change both.
function sessionCookieName(): string {
  return process.env.APP_ENV === "production" ? "__Host-session" : "vapetive_session";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (request.cookies.has(sessionCookieName())) {
    return NextResponse.next();
  }

  const signIn = request.nextUrl.clone();
  signIn.pathname = "/account/sign-in";
  signIn.search = `?next=${encodeURIComponent(pathname)}`;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.redirect(signIn);
  }
  if (pathname === "/account" || (pathname.startsWith("/account/") && !PUBLIC_ACCOUNT_PATHS.has(pathname))) {
    return NextResponse.redirect(signIn);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
