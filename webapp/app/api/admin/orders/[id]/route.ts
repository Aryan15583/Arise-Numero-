import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { serializeOrder } from "@/lib/serialize";
import { adminOrderStatusSchema, formatZodError } from "@/lib/validation";
import { getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { notifyLowStock, orderHoldsStock, returnStock, takeStock } from "@/lib/inventory";
import { notifyBackInStock } from "@/lib/stock-alerts";
import { recordOrderEvent } from "@/lib/order-events";
import { orderStatusEmail, sendEmail } from "@/lib/email";
import type { ResolvedCartLine } from "@/lib/types";

// ADMIN: single order detail.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;
  const row = await prisma.order.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json(serializeOrder(row));
}

// ADMIN: update an order's status and/or tracking details. Besides saving, this
//  - puts stock back when an order is cancelled (and takes it again if a
//    cancelled order is revived), so inventory never drifts,
//  - appends an entry to the customer-visible timeline,
//  - emails the customer about paid / shipped / completed / cancelled.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = adminOrderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { status, trackingNumber, carrier, message, notifyCustomer } = parsed.data;

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  let items: ResolvedCartLine[] = [];
  try {
    items = JSON.parse(existing.items || "[]");
  } catch {
    items = [];
  }

  const holdsBefore = orderHoldsStock(existing);
  const holdsAfter = orderHoldsStock({ paymentMethod: existing.paymentMethod, status });
  const newTracking = trackingNumber === undefined ? existing.trackingNumber : trackingNumber || null;
  const newCarrier = carrier === undefined ? existing.carrier : carrier || null;
  const trackingChanged = newTracking !== existing.trackingNumber || newCarrier !== existing.carrier;
  const statusChanged = status !== existing.status;

  const { order, stock } = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id },
      data: { status, trackingNumber: newTracking, carrier: newCarrier },
    });

    let stockResult = null;
    if (holdsBefore && !holdsAfter) await returnStock(tx, items);
    else if (!holdsBefore && holdsAfter) stockResult = await takeStock(tx, items, { strict: false });

    if (statusChanged || trackingChanged) {
      const notes: string[] = [];
      if (message) notes.push(message);
      if (newTracking && (status === "shipped" || trackingChanged)) {
        notes.push(`Tracking: ${newCarrier ? `${newCarrier} ` : ""}${newTracking}`);
      }
      await recordOrderEvent(id, status, notes.join(" · ") || null, tx);
    }
    return { order: updated, stock: stockResult };
  });

  let emailSent = false;
  if ((statusChanged || trackingChanged) && notifyCustomer !== false && order.customerEmail) {
    const template = orderStatusEmail(order, status, message);
    if (template) {
      emailSent = (await sendEmail({ to: order.customerEmail, ...template })) === "sent";
    }
  }
  if (stock) await notifyLowStock(stock.lowStock);
  // A cancellation can bring a sold-out product back — tell anyone waiting on it.
  if (holdsBefore && !holdsAfter) {
    for (const productId of new Set(items.map((i) => i.id))) await notifyBackInStock(productId);
  }

  const stockNote = holdsBefore && !holdsAfter ? " (stock returned)" : !holdsBefore && holdsAfter ? " (stock taken)" : "";
  await logAudit(
    "order.status_change",
    `Order ${id}: ${existing.status} → ${order.status}${stockNote}${trackingChanged ? ", tracking updated" : ""}`,
    getClientIp(req)
  );

  return NextResponse.json({
    ...serializeOrder(order),
    emailSent,
    warning:
      stock && stock.oversold.length > 0
        ? `Not enough stock for: ${stock.oversold.join(", ")} — stock was set to 0.`
        : undefined,
  });
}
