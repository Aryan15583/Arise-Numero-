import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, adminCookieOptions, signAdminToken } from "@/lib/auth";
import { getSessionVersion } from "@/lib/admin-session";
import { verifyAdminLoginCode } from "@/lib/admin-otp";
import { adminLoginSchema, formatZodError } from "@/lib/validation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isLockedOut, recordLoginFailure, recordLoginSuccess } from "@/lib/login-lockout";
import { isTrustedOrigin } from "@/lib/csrf";
import { logAudit } from "@/lib/audit";

// Step 2 of sign-in: exchange the emailed one-time code for a session cookie.
// (Step 1 — emailing the code — is /api/admin/login/request.)
export async function POST(req: NextRequest) {
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }

  const ip = getClientIp(req);

  if (!rateLimit(ip, "admin-login", 8, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Please wait a minute and try again." }, { status: 429 });
  }

  const lockout = isLockedOut(ip);
  if (lockout.locked) {
    return NextResponse.json(
      { error: `Too many failed attempts. Try again in ${Math.ceil((lockout.retryAfterSeconds || 0) / 60)} minute(s).` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const result = await verifyAdminLoginCode(parsed.data.code);
  if (!result.ok) {
    recordLoginFailure(ip);
    await logAudit("admin.login.failure", result.reason, ip);
    return NextResponse.json({ error: result.message, attemptsLeft: result.attemptsLeft }, { status: 401 });
  }

  recordLoginSuccess(ip);
  await logAudit("admin.login.success", "one-time code", ip);

  const version = await getSessionVersion();
  const token = await signAdminToken(version);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, adminCookieOptions);
  return res;
}
