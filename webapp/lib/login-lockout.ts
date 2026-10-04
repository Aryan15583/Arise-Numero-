// Consecutive-failure lockout for admin login, on top of the general
// sliding-window rate limiter in lib/rate-limit.ts. The rate limiter caps
// *volume* (8 attempts/minute); this caps *persistence* — 5 wrong codes in a
// row locks that IP out for 15 minutes regardless of how slowly the
// attempts are spread out, which the sliding window alone wouldn't catch.
// Process-local, same scaling caveat as rate-limit.ts — see TODO.md.

const MAX_CONSECUTIVE_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

type Entry = { failures: number; lockedUntil: number | null };

const attempts = new Map<string, Entry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of attempts) {
    if ((entry.lockedUntil === null || entry.lockedUntil < now) && entry.failures === 0) {
      attempts.delete(key);
    }
  }
}, 10 * 60 * 1000).unref();

export function isLockedOut(ip: string): { locked: boolean; retryAfterSeconds?: number } {
  const entry = attempts.get(ip);
  if (!entry?.lockedUntil) return { locked: false };
  const now = Date.now();
  if (entry.lockedUntil > now) {
    return { locked: true, retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000) };
  }
  // Lockout window passed — reset.
  attempts.delete(ip);
  return { locked: false };
}

export function recordLoginFailure(ip: string): void {
  const entry = attempts.get(ip) || { failures: 0, lockedUntil: null };
  entry.failures += 1;
  if (entry.failures >= MAX_CONSECUTIVE_FAILURES) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS;
  }
  attempts.set(ip, entry);
}

export function recordLoginSuccess(ip: string): void {
  attempts.delete(ip);
}
