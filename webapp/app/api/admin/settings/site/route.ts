import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getSiteConfig, setSiteConfig } from "@/lib/site-config";
import { adminSiteConfigSchema, formatZodError } from "@/lib/validation";
import { getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

// ADMIN: view/edit store-wide settings (shipping rates, free-shipping
// threshold, currency exchange rates, store name/support email) without a
// redeploy — these used to be hardcoded constants in the frontend.
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const config = await getSiteConfig();
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const parsed = adminSiteConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const updated = await setSiteConfig(parsed.data);
  await logAudit("settings.update", `Changed: ${Object.keys(parsed.data).join(", ")}`, getClientIp(req));
  return NextResponse.json(updated);
}
