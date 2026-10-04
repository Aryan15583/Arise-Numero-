import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, decodeAdminToken } from "./auth";
import { getSessionVersion } from "./admin-session";
import { isTrustedOrigin } from "./csrf";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Guard for admin API routes. Returns null if the caller is authenticated,
 * or a ready-to-return error NextResponse if not. Checks, in order:
 *  1. The JWT is validly signed and unexpired.
 *  2. Its embedded session version matches the current one in the database
 *     — the "log out other sessions" action bumps this, which
 *     instantly invalidates every token issued before that point.
 *  3. For state-changing methods, the request's Origin/Referer matches this
 *     server's own host (CSRF defense-in-depth on top of the SameSite=Strict
 *     cookie — see lib/csrf.ts for why both layers are worth having).
 *
 * Usage:
 *   const denied = await requireAdmin(req);
 *   if (denied) return denied;
 */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const payload = await decodeAdminToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized. Please log in again." }, { status: 401 });
  }

  const currentVersion = await getSessionVersion();
  if (payload.v !== currentVersion) {
    return NextResponse.json(
      { error: "Your session was ended (other sessions were signed out). Please log in again." },
      { status: 401 }
    );
  }

  if (!SAFE_METHODS.has(req.method) && !isTrustedOrigin(req)) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }

  return null;
}
