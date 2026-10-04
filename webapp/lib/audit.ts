import { prisma } from "./db";

/**
 * Append-only log of security-relevant admin actions: logins (success and
 * failure), login-code requests, session invalidation, and catalog/order/settings
 * mutations. Never log secrets (login codes, tokens, full card/payment details) —
 * `detail` is meant for a human skimming for suspicious activity, not a
 * full change record.
 *
 * Failures here are swallowed (logging must never block the action it's
 * describing), but the caller's write already happened by the time this
 * runs in every call site, so a lost audit row doesn't lose the underlying
 * change — only the visibility into it.
 */
export async function logAudit(action: string, detail?: string, ip?: string | null): Promise<void> {
  try {
    await prisma.auditLog.create({ data: { action, detail: detail || null, ip: ip || null } });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}
