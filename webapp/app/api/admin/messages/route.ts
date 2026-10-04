import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import type { Prisma } from "@prisma/client";

// ADMIN: list contact form messages — paginated + filterable by status.
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "50", 10) || 50));
  const status = searchParams.get("status")?.trim();

  const where: Prisma.ContactMessageWhereInput = {};
  if (status) where.status = status;

  const [rows, total] = await Promise.all([
    prisma.contactMessage.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.contactMessage.count({ where }),
  ]);

  return NextResponse.json({ items: rows, total, page, pageSize });
}
