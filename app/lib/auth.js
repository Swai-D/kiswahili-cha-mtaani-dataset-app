import crypto from "crypto";

const COOKIE_NAME = "mtaani_auth";

function getSecret() {
  return process.env.SESSION_SECRET || "dev-secret-change-me";
}

// Deterministic token derived from the app password + secret.
// Not a full session system, but enough for a single/small-household-user
// internal data collection tool. Rotate SESSION_SECRET or APP_PASSWORD to
// invalidate all existing sessions.
export function expectedToken() {
  const password = process.env.APP_PASSWORD || "";
  return crypto.createHash("sha256").update(password + getSecret()).digest("hex");
}

export function isValidPassword(password) {
  return password && password === process.env.APP_PASSWORD;
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
