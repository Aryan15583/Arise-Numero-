import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { serializeOrder } from "@/lib/serialize";
import { adminOrderCreateSchema, formatZodError } from "@/lib/validation";
import type { Prisma } from "@prisma/client";

// ADMIN: list orders — paginated + filterable by status/search.
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "50", 10) || 50));
  const status = searchParams.get("status")?.trim();
  const search = searchParams.get("search")?.trim();

  const where: Prisma.OrderWhereInput = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { id: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { customerEmail: { contains: search, mode: "insensitive" } },
    ];
  }

  const [rows, total] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { date: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ items: rows.map(serializeOrder), total, page, pageSize });
}

// ADMIN: manually record an order (phone / in-person sale).
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const parsed = adminOrderCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const o = parsed.data;

  const created = await prisma.order.create({
    data: {
      customerName: o.customerName,
      customerEmail: o.customerEmail || null,
      customerPhone: o.customerPhone || null,
      shippingAddress: JSON.stringify(o.shippingAddress || {}),
      items: JSON.stringify(o.items || []),
      subtotalUsd: o.subtotalUsd ?? o.totalUsd,
      discountUsd: o.discountUsd ?? 0,
      couponCode: o.couponCode || null,
      shippingUsd: o.shippingUsd ?? 0,
      totalUsd: o.totalUsd,
      status: o.status || "pending",
      paymentMethod: o.paymentMethod || "manual",
      paymentReference: o.paymentReference || null,
    },
  });

  return NextResponse.json(serializeOrder(created), { status: 201 });
}
