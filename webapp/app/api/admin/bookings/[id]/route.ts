import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { serializeBooking } from "@/lib/serialize";
import { adminBookingStatusSchema, formatZodError } from "@/lib/validation";

// ADMIN: update booking status.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = adminBookingStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const existing = await prisma.booking.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  const updated = await prisma.booking.update({ where: { id }, data: { status: parsed.data.status } });
  return NextResponse.json(serializeBooking(updated));
}

// ADMIN: delete a booking.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;
  const existing = await prisma.booking.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  await prisma.booking.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
