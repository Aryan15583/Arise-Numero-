import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

// ADMIN: permanently remove a subscriber (e.g. a "delete my data" request).
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;
  const existing = await prisma.subscriber.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Subscriber not found." }, { status: 404 });

  await prisma.subscriber.delete({ where: { id } });
  await logAudit("subscriber.delete", "Removed a newsletter subscriber", getClientIp(req));
  return NextResponse.json({ deleted: true });
}
