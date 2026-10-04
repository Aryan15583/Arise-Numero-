import { NextRequest } from "next/server";

/**
 * Origin-header CSRF check for cookie-authenticated, state-changing admin
 * requests (OWASP's recommended "Verifying Origin With Standard Headers"
 * pattern — see cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
 *
 * The admin session cookie is SameSite=Strict (see lib/auth.ts), which
 * already blocks the browser from attaching it to cross-site requests in
 * every modern browser. This is defense-in-depth for older/misconfigured
 * clients and for anything that bypasses SameSite: reject any state-
 * changing request whose Origin (or, failing that, Referer) header doesn't
 * match this server's own origin. A same-origin fetch() call always sends
 * one of these headers, so legitimate admin-panel requests are unaffected.
 */
export function isTrustedOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");
  if (!host) return false;

  const candidate = origin || referer;
  if (!candidate) {
    // No Origin/Referer at all (e.g. some non-browser tooling, or very old
    // browsers). We can't verify same-origin, so we don't trust it for a
    // state-changing cookie-authenticated request.
    return false;
  }

  try {
    const candidateHost = new URL(candidate).host;
    return candidateHost === host;
  } catch {
    return false;
  }
}
