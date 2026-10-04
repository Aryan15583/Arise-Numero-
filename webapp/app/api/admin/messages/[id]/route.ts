import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { adminMessageStatusSchema, formatZodError } from "@/lib/validation";

// ADMIN: update a message's status (mark read/replied).
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = adminMessageStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Message not found." }, { status: 404 });

  const updated = await prisma.contactMessage.update({ where: { id }, data: { status: parsed.data.status } });
  return NextResponse.json(updated);
}

// ADMIN: delete a message.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;
  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Message not found." }, { status: 404 });

  await prisma.contactMessage.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
