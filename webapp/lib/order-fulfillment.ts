import { prisma } from "./db";
import { serializeOrder } from "./serialize";
import { sendEmail, notifyAdmin, orderConfirmationEmail, escapeHtml } from "./email";
import { logAudit } from "./audit";
import type { OrderDTO, ResolvedCartLine } from "./types";

/**
 * Marks an order paid and decrements stock, exactly once, no matter how many
 * times it's called. Both the Cashfree webhook and the client-side
 * "check payment status after checkout" call end up here — webhooks can
 * legitimately fire more than once, and a network hiccup can make the
 * client retry the status check, so this has to be safe to call twice for
 * the same order.
 */
export async function finalizeOrderAsPaid(orderId: string): Promise<OrderDTO | null> {
  const existing = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existing) return null;

  if (["paid", "shipped", "completed"].includes(existing.status)) {
    return serializeOrder(existing);
  }

  const items: ResolvedCartLine[] = JSON.parse(existing.items || "[]");
  const oversold: string[] = [];

  const updated = await prisma.$transaction(async (tx) => {
    const order = await tx.order.update({ where: { id: orderId }, data: { status: "paid" } });
    for (const item of items) {
      await tx.product.update({ where: { id: item.id }, data: { stock: { decrement: item.qty } } });
      // Payment already cleared at this point, so — unlike the pre-payment
      // checks in the order-creation routes — we can't just reject the
      // order if a race with another order left us oversold. Clamp at zero
      // and flag it below instead of silently losing the discrepancy.
      const p = await tx.product.findUnique({ where: { id: item.id } });
      if (p && p.stock < 0) {
        await tx.product.update({ where: { id: item.id }, data: { stock: 0 } });
        oversold.push(item.name);
      }
    }
    return order;
  });

  if (oversold.length > 0) {
    await logAudit("order.oversold", `Order ${updated.id}: insufficient stock for ${oversold.join(", ")}`);
  }

  if (updated.customerEmail) {
    const { subject, html } = orderConfirmationEmail(updated);
    await sendEmail({ to: updated.customerEmail, subject, html });
  }
  await notifyAdmin(
    `New paid order — ${updated.id}${oversold.length > 0 ? " ⚠️ OVERSOLD" : ""}`,
    `<p>${escapeHtml(updated.customerName || "A customer")} paid $${updated.totalUsd.toFixed(2)} via ${escapeHtml(updated.paymentMethod)}.</p>` +
      (oversold.length > 0
        ? `<p style="color:#b91c1c"><strong>⚠️ Insufficient stock for: ${oversold.map(escapeHtml).join(", ")}.</strong> Payment already cleared, so the order was still accepted — you may need to contact the customer about a delay, backorder, or refund.</p>`
        : "")
  );

  return serializeOrder(updated);
}

export async function findOrderByPaymentReference(paymentReference: string) {
  return prisma.order.findFirst({ where: { paymentReference } });
}
