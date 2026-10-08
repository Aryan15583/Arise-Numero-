import { NextRequest, NextResponse } from "next/server";
import type { Order } from "@prisma/client";
import { prisma } from "@/lib/db";
import { serializeOrder } from "@/lib/serialize";
import { getSiteConfig } from "@/lib/site-config";
import { sendEmail, notifyAdmin, orderConfirmationEmail, escapeHtml } from "@/lib/email";
import { orderCreateSchema, formatZodError } from "@/lib/validation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { CouponError, OutOfStockError } from "@/lib/errors";
import { checkCoupon } from "@/lib/coupons";
import { notifyLowStock, takeStock } from "@/lib/inventory";
import { recordOrderEvent } from "@/lib/order-events";
import type { ResolvedCartLine } from "@/lib/types";

function computeTotals(
  items: ResolvedCartLine[],
  discountPercent: number,
  shippingMethod: string,
  config: { standardShippingUsd: number; expressShippingUsd: number; freeShippingThresholdUsd: number }
) {
  const subtotal = items.reduce((sum, i) => sum + i.priceUsd * i.qty, 0);
  const discount = +(subtotal * (discountPercent / 100)).toFixed(2);
  const afterDiscount = subtotal - discount;
  let shipping = shippingMethod === "express" ? config.expressShippingUsd : config.standardShippingUsd;
  if (afterDiscount === 0) shipping = 0;
  else if (shippingMethod !== "express" && afterDiscount >= config.freeShippingThresholdUsd) shipping = 0;
  const total = +(afterDiscount + shipping).toFixed(2);
  return { subtotal: +subtotal.toFixed(2), discount, shipping, total };
}

// PUBLIC: place a real order (Cash on Delivery / Bank Transfer). Prices are
// always re-resolved from OUR database — never trusted from the client —
// same principle the PayPal/Cashfree integrations use.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip, "orders-create", 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = orderCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { items, couponCode, paymentMethod, shippingMethod, customer, shipping } = parsed.data;

  const resolved: ResolvedCartLine[] = [];
  for (const line of items) {
    const product = await prisma.product.findUnique({ where: { id: line.id } });
    if (!product || !product.active) {
      return NextResponse.json({ error: `Product "${line.id}" is not available.` }, { status: 400 });
    }
    if (product.priceUsd <= 0) {
      return NextResponse.json({ error: `"${product.name}" is price on request — please contact us to order it.` }, { status: 400 });
    }
    if (product.stock < line.qty) {
      return NextResponse.json({ error: `Only ${product.stock} left in stock for "${product.name}".` }, { status: 409 });
    }
    resolved.push({ id: product.id, name: product.name, priceUsd: product.priceUsd, qty: line.qty, imageUrl: product.imageUrl });
  }

  // A coupon the shopper was shown must be honoured or clearly refused — never
  // silently dropped, which would raise the total after they'd seen a discount.
  let discountPercent = 0;
  let appliedCouponCode: string | null = null;
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.trim().toUpperCase() } });
    const rawSubtotal = resolved.reduce((sum, i) => sum + i.priceUsd * i.qty, 0);
    const check = checkCoupon(coupon, rawSubtotal);
    if (!coupon || !check.ok) {
      return NextResponse.json({ error: check.ok ? "Invalid coupon code." : check.message }, { status: 400 });
    }
    discountPercent = coupon.discountPercent;
    appliedCouponCode = coupon.code;
  }

  const config = await getSiteConfig();
  const { subtotal, discount, shipping: shippingCost, total } = computeTotals(
    resolved,
    discountPercent,
    shippingMethod || "standard",
    config
  );
  if (total <= 0) return NextResponse.json({ error: "Order total must be greater than zero." }, { status: 400 });

  let result: { order: Order; lowStock: { name: string; left: number }[] };
  try {
    result = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          customerName: customer.name,
          customerEmail: customer.email,
          customerPhone: customer.phone || null,
          shippingAddress: JSON.stringify(shipping || {}),
          items: JSON.stringify(resolved),
          subtotalUsd: subtotal,
          discountUsd: discount,
          couponCode: appliedCouponCode,
          shippingUsd: shippingCost,
          totalUsd: total,
          status: "pending",
          paymentMethod: paymentMethod || "cod",
        },
      });

      // Re-check stock inside the transaction (closes the race window against
      // another order placed since the pre-check above). strict: throws and
      // rolls everything back — no charge has happened yet for COD/bank transfer.
      const stock = await takeStock(tx, resolved, { strict: true });

      if (appliedCouponCode) {
        const fresh = await tx.coupon.findUnique({ where: { code: appliedCouponCode } });
        const recheck = checkCoupon(fresh);
        if (!fresh || !recheck.ok) throw new CouponError(recheck.ok ? "Invalid coupon code." : recheck.message);
        await tx.coupon.update({ where: { code: appliedCouponCode }, data: { usedCount: { increment: 1 } } });
      }

      await recordOrderEvent(created.id, "pending", "Order placed", tx);
      return { order: created, lowStock: stock.lowStock };
    });
  } catch (err) {
    if (err instanceof OutOfStockError) return NextResponse.json({ error: err.message }, { status: 409 });
    if (err instanceof CouponError) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }

  const { order, lowStock } = result;

  const { subject, html } = orderConfirmationEmail(order, { bankInstructions: config.bankTransferInstructions });
  await sendEmail({ to: order.customerEmail!, subject, html });
  await notifyAdmin(
    `New order — ${order.id}`,
    `<p>${escapeHtml(order.customerName)} placed an order for $${order.totalUsd.toFixed(2)} (${escapeHtml(order.paymentMethod)}).</p>`
  );
  await notifyLowStock(lowStock);

  return NextResponse.json(
    {
      ...serializeOrder(order),
      // Only ever sent to the person who chose bank transfer (never via /api/config).
      bankInstructions: order.paymentMethod === "bank_transfer" ? config.bankTransferInstructions || null : null,
    },
    { status: 201 }
  );
}
