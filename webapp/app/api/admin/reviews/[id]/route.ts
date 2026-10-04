import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { adminReviewStatusSchema, formatZodError } from "@/lib/validation";
import { getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

// ADMIN: approve/reject a review.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = adminReviewStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Review not found." }, { status: 404 });

  const updated = await prisma.review.update({ where: { id }, data: { status: parsed.data.status } });
  await logAudit("review.status_change", `Review ${id}: ${existing.status} → ${updated.status}`, getClientIp(req));
  return NextResponse.json(updated);
}

// ADMIN: delete a review.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;
  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Review not found." }, { status: 404 });

  await prisma.review.delete({ where: { id } });
  await logAudit("review.delete", `Deleted review ${id}`, getClientIp(req));
  return NextResponse.json({ deleted: true });
}
