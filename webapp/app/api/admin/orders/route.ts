import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { serializeOrder } from "@/lib/serialize";
import { adminOrderCreateSchema, adminOrderDeleteSchema, formatZodError } from "@/lib/validation";
import { deleteOrders } from "@/lib/order-delete";
import { notifyLowStock, orderHoldsStock, takeStock } from "@/lib/inventory";
import { logAudit } from "@/lib/audit";
import { getClientIp } from "@/lib/rate-limit";
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

  // Take stock just like a checkout order would, so cancelling or deleting it
  // later (which returns stock) keeps inventory correct.
  const stockLines = (o.items || []).flatMap((i) => {
    const line = i as { id?: unknown; name?: unknown; qty?: unknown };
    return typeof line.id === "string" && typeof line.qty === "number" && line.qty > 0
      ? [{ id: line.id, name: typeof line.name === "string" ? line.name : line.id, qty: Math.floor(line.qty) }]
      : [];
  });
  const status = o.status || "pending";
  const paymentMethod = o.paymentMethod || "manual";

  const { created, stock } = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
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
        status,
        paymentMethod,
        paymentReference: o.paymentReference || null,
      },
    });
    const stock = orderHoldsStock({ paymentMethod, status }) ? await takeStock(tx, stockLines, { strict: false }) : null;
    return { created, stock };
  });
  if (stock) await notifyLowStock(stock.lowStock);

  return NextResponse.json(serializeOrder(created), { status: 201 });
}

// ADMIN: permanently delete one or more orders (e.g. test orders, or a
// customer's "delete my data" request). Unshipped orders return their stock.
export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const parsed = adminOrderDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const { deleted, restocked } = await deleteOrders([...new Set(parsed.data.ids)]);
  if (deleted.length === 0) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  await logAudit(
    "order.delete",
    `Deleted ${deleted.length} order(s): ${deleted.join(", ")}${restocked.length ? ` (stock returned for ${restocked.join(", ")})` : ""}`,
    getClientIp(req)
  );
  return NextResponse.json({ deleted, restocked });
}
