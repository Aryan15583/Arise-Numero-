import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { adminCouponUpdateSchema, formatZodError } from "@/lib/validation";
import { getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

// ADMIN: update a coupon.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (!existing) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = adminCouponUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const c = parsed.data;

  const updated = await prisma.coupon.update({
    where: { code },
    data: {
      discountPercent: c.discountPercent !== undefined ? c.discountPercent : existing.discountPercent,
      description: c.description !== undefined ? c.description : existing.description,
      active: c.active !== undefined ? c.active : existing.active,
    },
  });

  await logAudit("coupon.update", `Updated coupon ${code}`, getClientIp(req));
  return NextResponse.json(updated);
}

// ADMIN: delete a coupon.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (!existing) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });

  await prisma.coupon.delete({ where: { code } });
  await logAudit("coupon.delete", `Deleted coupon ${code}`, getClientIp(req));
  return NextResponse.json({ deleted: true });
}
