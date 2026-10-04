import { SignJWT, jwtVerify } from "jose";

// jose (not jsonwebtoken) so the same verification code can run in both
// Node.js API routes and the Edge middleware that protects /admin pages.

export const ADMIN_COOKIE_NAME = "arisenumero_admin";
const COOKIE_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 hours, matches original design

const KNOWN_PLACEHOLDER_SECRETS = new Set([
  "change_this_to_a_long_random_string",
  "dev_only_change_this_to_a_long_random_string_before_deploying",
]);

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET is not set. Copy .env.example to .env and set a long random JWT_SECRET."
    );
  }
  // Fail loudly rather than silently signing production admin sessions with
  // a secret anyone can read out of this repo's own .env.example.
  if (process.env.NODE_ENV === "production" && KNOWN_PLACEHOLDER_SECRETS.has(secret)) {
    throw new Error(
      "JWT_SECRET is still set to a placeholder value. Generate a real one before deploying: " +
        `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
    );
  }
  return new TextEncoder().encode(secret);
}

export type AdminTokenPayload = { role: "admin"; v: number };

/**
 * `version` ties this token to the current value of the admin_session_version
 * setting (see lib/require-admin.ts). Bumping that value — done by the
 * "log out other sessions" action — instantly
 * invalidates every previously issued token without needing a server-side
 * session store, because any token whose `v` no longer matches is rejected.
 */
export async function signAdminToken(version: number): Promise<string> {
  return new SignJWT({ role: "admin", v: version })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());
}

// Lightweight check (signature + expiry only, no DB) — safe to run on the
// Edge runtime, used by middleware.ts to gate page navigation. The
// authoritative check (which also verifies session version against the
// database) lives in lib/require-admin.ts and runs for every API call.
export async function verifyAdminToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function decodeAdminToken(token: string | undefined | null): Promise<AdminTokenPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.role !== "admin" || typeof payload.v !== "number") return null;
    return { role: "admin", v: payload.v };
  } catch {
    return null;
  }
}

export const adminCookieOptions = {
  httpOnly: true,
  // Strict rather than Lax: this cookie only needs to be sent for requests
  // that originate from the admin panel itself (fetch() calls from pages
  // already on /admin/*), never as a result of navigating in from an
  // external link, so there's no legitimate cross-site case to support.
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: COOKIE_MAX_AGE_SECONDS,
};
