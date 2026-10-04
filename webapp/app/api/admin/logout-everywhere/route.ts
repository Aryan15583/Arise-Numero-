import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { ADMIN_COOKIE_NAME, adminCookieOptions, signAdminToken } from "@/lib/auth";
import { bumpSessionVersion } from "@/lib/admin-session";
import { getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

// ADMIN: invalidate every admin session token except the one making this
// call — useful if you suspect a device/browser you used is compromised or
// you just want to be sure nothing stale is still logged in.
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const newVersion = await bumpSessionVersion();
  const token = await signAdminToken(newVersion);

  await logAudit("admin.logout_everywhere", "All other admin sessions invalidated", getClientIp(req));

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, adminCookieOptions);
  return res;
}
