import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { adminCouponCreateSchema, formatZodError } from "@/lib/validation";
import { getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

// ADMIN: list all coupons.
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const rows = await prisma.coupon.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(rows);
}

// ADMIN: create a coupon.
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const parsed = adminCouponCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const code = parsed.data.code.trim().toUpperCase();

  const exists = await prisma.coupon.findUnique({ where: { code } });
  if (exists) return NextResponse.json({ error: "This coupon code already exists." }, { status: 409 });

  const created = await prisma.coupon.create({
    data: {
      code,
      discountPercent: parsed.data.discountPercent,
      description: parsed.data.description || null,
      active: parsed.data.active !== false,
    },
  });

  await logAudit("coupon.create", `Created coupon ${code} (${created.discountPercent}%)`, getClientIp(req));
  return NextResponse.json(created, { status: 201 });
}
