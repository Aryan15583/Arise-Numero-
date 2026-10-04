import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { serializeBooking } from "@/lib/serialize";
import type { Prisma } from "@prisma/client";

// ADMIN: list bookings — paginated + filterable by status.
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "50", 10) || 50));
  const status = searchParams.get("status")?.trim();

  const where: Prisma.BookingWhereInput = {};
  if (status) where.status = status;

  const [rows, total] = await Promise.all([
    prisma.booking.findMany({ where, orderBy: { submittedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.booking.count({ where }),
  ]);

  return NextResponse.json({ items: rows.map(serializeBooking), total, page, pageSize });
}
