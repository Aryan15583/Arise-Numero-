// Admin sign-in via a one-time code emailed to a single, server-configured
// address. There is no password/PIN anywhere: whoever can read that inbox can
// sign in, nobody else can, and every code dies after one use.
//
// Design notes
//  - The recipient comes from ADMIN_LOGIN_EMAIL (default below), never from the
//    request, so the endpoint can't be used to mail codes anywhere else.
//  - Only an HMAC of the code is stored (keyed with JWT_SECRET), so a leaked
//    database doesn't leak a usable code.
//  - One row ("current") holds the only valid code. Requesting a new one
//    replaces it; success, expiry, or too many wrong guesses delete it.
//  - Cooldown + hourly send cap live in the database, so they survive restarts
//    and hold across multiple server instances (unlike the in-memory limiters).

import crypto from "node:crypto";
import { prisma } from "./db";
import { adminLoginCodeEmail, isEmailConfigured, sendEmail } from "./email";
import { logAudit } from "./audit";

const DEFAULT_ADMIN_LOGIN_EMAIL = "arisenumero@gmail.com";

const CODE_LENGTH = 8;
// 31 symbols, no 0/O/1/I/L lookalikes. 31^8 is roughly 8.5e11 combinations.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export const CODE_TTL_MINUTES = 10;
const CODE_TTL_MS = CODE_TTL_MINUTES * 60_000;
export const MAX_ATTEMPTS_PER_CODE = 5;
const RESEND_COOLDOWN_MS = 60_000;
const MAX_CODES_PER_HOUR = 6;
const ROW_ID = "current";

export function getAdminLoginEmail(): string {
  return (process.env.ADMIN_LOGIN_EMAIL || DEFAULT_ADMIN_LOGIN_EMAIL).trim().toLowerCase();
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  return `${local.slice(0, 2)}${"•".repeat(Math.max(3, local.length - 2))}@${domain}`;
}

function generateCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) out += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
  return out;
}

function formatCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

// Accept "abcd-efgh", "ABCD EFGH", pasted whitespace, etc.
function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function hashCode(code: string): Buffer {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set.");
  return crypto.createHmac("sha256", secret).update(`admin-login-code:${code}`).digest();
}

export type RequestCodeResult =
  | { ok: true; sentTo: string; expiresInSeconds: number; devHint?: string }
  | {
      ok: false;
      reason: "email_not_configured" | "cooldown" | "too_many" | "send_failed";
      message: string;
      retryAfterSeconds?: number;
    };

export async function requestAdminLoginCode(ip: string | null): Promise<RequestCodeResult> {
  const to = getAdminLoginEmail();
  const isProd = process.env.NODE_ENV === "production";

  // With no way to deliver the code, nobody could ever sign in — and the dev
  // fallback of printing the code to the console must never run in production.
  if (isProd && !isEmailConfigured()) {
    return {
      ok: false,
      reason: "email_not_configured",
      message: "Login emails aren't set up on this server yet (set SMTP_* or RESEND_API_KEY). See TODO.md.",
    };
  }

  const now = Date.now();

  const existing = await prisma.adminLoginCode.findUnique({ where: { id: ROW_ID } });
  if (existing) {
    const waitMs = existing.createdAt.getTime() + RESEND_COOLDOWN_MS - now;
    if (waitMs > 0) {
      const retryAfterSeconds = Math.ceil(waitMs / 1000);
      return {
        ok: false,
        reason: "cooldown",
        message: `A code was just sent. You can request another in ${retryAfterSeconds}s.`,
        retryAfterSeconds,
      };
    }
  }

  const sentLastHour = await prisma.auditLog.count({
    where: { action: "admin.otp.sent", createdAt: { gte: new Date(now - 60 * 60_000) } },
  });
  if (sentLastHour >= MAX_CODES_PER_HOUR) {
    return {
      ok: false,
      reason: "too_many",
      message: "Too many login codes requested in the last hour. Please try again later.",
      retryAfterSeconds: 15 * 60,
    };
  }

  const code = generateCode();
  const codeHash = hashCode(code).toString("hex");
  const expiresAt = new Date(now + CODE_TTL_MS);
  await prisma.adminLoginCode.upsert({
    where: { id: ROW_ID },
    create: { id: ROW_ID, codeHash, expiresAt },
    update: { codeHash, expiresAt, attempts: 0, createdAt: new Date(now) },
  });

  const { subject, html } = adminLoginCodeEmail({ code: formatCode(code), ttlMinutes: CODE_TTL_MINUTES, requestIp: ip });
  const result = await sendEmail({ to, subject, html });

  // In production a failed send must not leave a live code behind that nobody
  // received. (In local dev we fall back to the console below, so a typo in the
  // SMTP settings can't lock you out while you're still setting email up.)
  if (result === "failed" && isProd) {
    await prisma.adminLoginCode.deleteMany({ where: { id: ROW_ID } });
    return {
      ok: false,
      reason: "send_failed",
      message: "Couldn't send the login email. Check the server's email settings and try again.",
    };
  }

  let devHint: string | undefined;
  if (result !== "sent") {
    // Only reachable outside production: not-configured is refused up top and
    // a failed send is refused just above when isProd.
    console.log(`[admin-otp:dev] Login code for ${to}: ${formatCode(code)} (valid ${CODE_TTL_MINUTES} min, single use)`);
    devHint =
      result === "failed"
        ? "Sending the email failed (see the server log), so the code was printed in the server console instead."
        : "Email isn't configured (set SMTP_* or RESEND_API_KEY in .env), so the code was printed in the server console instead.";
  }

  await logAudit("admin.otp.sent", `code emailed to ${maskEmail(to)}`, ip);
  return { ok: true, sentTo: maskEmail(to), expiresInSeconds: CODE_TTL_MS / 1000, devHint };
}

export type VerifyCodeResult =
  | { ok: true }
  | { ok: false; reason: "no_code" | "expired" | "wrong" | "locked"; message: string; attemptsLeft?: number };

export async function verifyAdminLoginCode(input: string): Promise<VerifyCodeResult> {
  const candidate = normalizeCode(input);

  const row = await prisma.adminLoginCode.findUnique({ where: { id: ROW_ID } });
  if (!row) {
    return { ok: false, reason: "no_code", message: "No active code. Request a new one." };
  }
  if (row.expiresAt.getTime() <= Date.now()) {
    await prisma.adminLoginCode.deleteMany({ where: { id: ROW_ID } });
    return { ok: false, reason: "expired", message: "That code has expired. Request a new one." };
  }

  // Count the attempt *before* comparing, so a burst of parallel guesses can't
  // all squeeze in under the cap. (updateMany rather than update: if a parallel
  // request just consumed the code, this simply matches nothing instead of
  // throwing. The re-read below can only ever see *more* attempts than this
  // request made, never fewer, so the cap stays strict.)
  const bumped = await prisma.adminLoginCode.updateMany({ where: { id: ROW_ID }, data: { attempts: { increment: 1 } } });
  const counted = bumped.count === 1 ? await prisma.adminLoginCode.findUnique({ where: { id: ROW_ID } }) : null;
  if (!counted) {
    return { ok: false, reason: "no_code", message: "No active code. Request a new one." };
  }
  if (counted.attempts > MAX_ATTEMPTS_PER_CODE) {
    await prisma.adminLoginCode.deleteMany({ where: { id: ROW_ID } });
    return { ok: false, reason: "locked", message: "Too many wrong attempts. Request a new code." };
  }

  const matches =
    candidate.length === CODE_LENGTH &&
    crypto.timingSafeEqual(Buffer.from(counted.codeHash, "hex"), hashCode(candidate));

  if (matches) {
    // Single use: only the request that actually deletes the row wins, so two
    // simultaneous submissions of the same valid code can't both sign in.
    const deleted = await prisma.adminLoginCode.deleteMany({ where: { id: ROW_ID, codeHash: counted.codeHash } });
    if (deleted.count === 1) return { ok: true };
    return { ok: false, reason: "no_code", message: "That code was already used. Request a new one." };
  }

  const attemptsLeft = MAX_ATTEMPTS_PER_CODE - counted.attempts;
  if (attemptsLeft <= 0) {
    await prisma.adminLoginCode.deleteMany({ where: { id: ROW_ID } });
    return { ok: false, reason: "locked", message: "Too many wrong attempts. That code is cancelled — request a new one." };
  }
  return {
    ok: false,
    reason: "wrong",
    message: `Incorrect code. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left.`,
    attemptsLeft,
  };
}
