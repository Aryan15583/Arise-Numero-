import { prisma } from "./db";
import { serializeOrder } from "./serialize";
import { sendEmail, notifyAdmin, orderConfirmationEmail, escapeHtml } from "./email";
import { logAudit } from "./audit";
import { notifyLowStock, takeStock } from "./inventory";
import { recordOrderEvent } from "./order-events";
import type { OrderDTO, ResolvedCartLine } from "./types";

const PAID_STATUSES = ["paid", "shipped", "completed"];

/**
 * Marks an order paid and takes stock, exactly once, no matter how many
 * times it's called. Both the Cashfree webhook and the client-side
 * "check payment status after checkout" call end up here — webhooks can
 * legitimately fire more than once, and a network hiccup can make the
 * client retry the status check, so this has to be safe to call twice for
 * the same order — including two calls landing at the very same moment.
 */
export async function finalizeOrderAsPaid(orderId: string): Promise<OrderDTO | null> {
  const existing = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existing) return null;

  if (PAID_STATUSES.includes(existing.status)) {
    return serializeOrder(existing);
  }

  const items: ResolvedCartLine[] = JSON.parse(existing.items || "[]");

  const outcome = await prisma.$transaction(async (tx) => {
    // Atomic claim: only the call that actually flips the status proceeds. A
    // concurrent duplicate (webhook + status check) matches zero rows and
    // backs off, so stock and coupon usage are never taken twice.
    const claimed = await tx.order.updateMany({
      where: { id: orderId, status: { notIn: PAID_STATUSES } },
      data: { status: "paid" },
    });
    if (claimed.count === 0) return null;

    // Payment already cleared, so — unlike the pre-payment checks in the
    // order-creation routes — we can't reject the order if a race with another
    // order left us short. Clamp at zero and flag it below instead of losing it.
    const stock = await takeStock(tx, items, { strict: false });

    if (existing.couponCode) {
      await tx.coupon.updateMany({ where: { code: existing.couponCode }, data: { usedCount: { increment: 1 } } });
    }
    await recordOrderEvent(orderId, "paid", "Payment received", tx);
    return stock;
  });

  const fresh = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  if (!outcome) return serializeOrder(fresh); // another call finalized it first

  if (outcome.oversold.length > 0) {
    await logAudit("order.oversold", `Order ${fresh.id}: insufficient stock for ${outcome.oversold.join(", ")}`);
  }

  if (fresh.customerEmail) {
    const { subject, html } = orderConfirmationEmail(fresh);
    await sendEmail({ to: fresh.customerEmail, subject, html });
  }
  await notifyAdmin(
    `New paid order — ${fresh.id}${outcome.oversold.length > 0 ? " ⚠️ OVERSOLD" : ""}`,
    `<p>${escapeHtml(fresh.customerName || "A customer")} paid $${fresh.totalUsd.toFixed(2)} via ${escapeHtml(fresh.paymentMethod)}.</p>` +
      (outcome.oversold.length > 0
        ? `<p style="color:#b91c1c"><strong>⚠️ Insufficient stock for: ${outcome.oversold.map(escapeHtml).join(", ")}.</strong> Payment already cleared, so the order was still accepted — you may need to contact the customer about a delay, backorder, or refund.</p>`
        : "")
  );
  await notifyLowStock(outcome.lowStock);

  return serializeOrder(fresh);
}

export async function findOrderByPaymentReference(paymentReference: string) {
  return prisma.order.findFirst({ where: { paymentReference } });
}
