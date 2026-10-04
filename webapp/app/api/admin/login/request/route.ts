import { NextRequest, NextResponse } from "next/server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { isLockedOut } from "@/lib/login-lockout";
import { isTrustedOrigin } from "@/lib/csrf";
import { requestAdminLoginCode } from "@/lib/admin-otp";

// PUBLIC (but takes no input): emails a fresh one-time login code to the single
// admin address configured on the server. The caller can't choose a recipient.
export async function POST(req: NextRequest) {
  // Stops other websites from making a visitor's browser trigger login emails.
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }

  const ip = getClientIp(req);

  if (!rateLimit(ip, "admin-otp-request", 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute and try again." }, { status: 429 });
  }

  // An IP that burned through wrong codes shouldn't be able to keep minting new ones.
  const lockout = isLockedOut(ip);
  if (lockout.locked) {
    return NextResponse.json(
      { error: `Too many failed attempts. Try again in ${Math.ceil((lockout.retryAfterSeconds || 0) / 60)} minute(s).` },
      { status: 429 }
    );
  }

  const result = await requestAdminLoginCode(ip);
  if (!result.ok) {
    const status =
      result.reason === "email_not_configured" ? 503 : result.reason === "send_failed" ? 502 : 429;
    return NextResponse.json({ error: result.message, retryAfterSeconds: result.retryAfterSeconds }, { status });
  }

  return NextResponse.json({
    ok: true,
    sentTo: result.sentTo,
    expiresInSeconds: result.expiresInSeconds,
    devHint: process.env.NODE_ENV === "production" ? undefined : result.devHint,
  });
}
