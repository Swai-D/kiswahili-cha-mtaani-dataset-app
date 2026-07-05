import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "./lib/auth";

// Note: middleware runs on the Edge runtime, so we compare against a token
// value that was computed with Node's crypto at login time (in the /api/auth
// route) and simply stored/compared here. We re-derive it the same way using
// Web Crypto to stay Edge-compatible.
async function expectedTokenEdge() {
  const password = process.env.APP_PASSWORD || "";
  const secret = process.env.SESSION_SECRET || "dev-secret-change-me";
  const data = new TextEncoder().encode(password + secret);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico";

  if (isPublic) return NextResponse.next();

  const cookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const expected = await expectedTokenEdge();

  if (cookie && cookie === expected) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
