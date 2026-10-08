import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";

// ADMIN: newsletter subscribers — paginated, searchable by email.
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10) || 20));
  const search = searchParams.get("search")?.trim();

  const where: Prisma.SubscriberWhereInput = search ? { email: { contains: search, mode: "insensitive" } } : {};
  const [rows, total, activeCount] = await Promise.all([
    prisma.subscriber.findMany({
      where,
      orderBy: { subscribedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { id: true, email: true, source: true, subscribedAt: true, unsubscribedAt: true },
    }),
    prisma.subscriber.count({ where }),
    prisma.subscriber.count({ where: { unsubscribedAt: null } }),
  ]);

  return NextResponse.json({
    items: rows.map((r) => ({
      id: r.id,
      email: r.email,
      source: r.source,
      subscribedAt: r.subscribedAt.toISOString(),
      unsubscribedAt: r.unsubscribedAt ? r.unsubscribedAt.toISOString() : null,
    })),
    total,
    activeCount,
    page,
    pageSize,
  });
}
