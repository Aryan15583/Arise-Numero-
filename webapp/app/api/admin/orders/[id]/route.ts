import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { serializeOrder } from "@/lib/serialize";
import { adminOrderStatusSchema, formatZodError } from "@/lib/validation";
import { getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

// ADMIN: single order detail.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;
  const row = await prisma.order.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json(serializeOrder(row));
}

// ADMIN: update order status.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = adminOrderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const updated = await prisma.order.update({ where: { id }, data: { status: parsed.data.status } });
  await logAudit("order.status_change", `Order ${id}: ${existing.status} → ${updated.status}`, getClientIp(req));
  return NextResponse.json(serializeOrder(updated));
}
