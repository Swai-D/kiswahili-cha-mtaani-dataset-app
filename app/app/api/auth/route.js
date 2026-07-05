import { NextResponse } from "next/server";
import { isValidPassword, expectedToken, AUTH_COOKIE_NAME } from "../../../lib/auth";

export async function POST(request) {
  const { password } = await request.json();

  if (!isValidPassword(password)) {
    return NextResponse.json({ ok: false, error: "Password si sahihi." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE_NAME, expectedToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180, // siku 180
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
