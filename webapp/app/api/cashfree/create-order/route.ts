import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createCashfreeOrder, isCashfreeConfigured } from "@/lib/cashfree";
import { getSiteConfig } from "@/lib/site-config";
import { cashfreeCreateOrderSchema, formatZodError } from "@/lib/validation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { checkCoupon } from "@/lib/coupons";
import { recordOrderEvent } from "@/lib/order-events";
import type { ResolvedCartLine } from "@/lib/types";
import { computeOrderTotals } from "@/lib/pricing";

// PUBLIC: start a Cashfree payment session (UPI / GPay / Mastercard / Visa /
// netbanking / wallets — all through Cashfree's hosted checkout).
export async function POST(req: NextRequest) {
  if (!isCashfreeConfigured()) {
    return NextResponse.json({ error: "Cashfree is not configured on this server yet." }, { status: 503 });
  }

  const ip = getClientIp(req);
  if (!rateLimit(ip, "cashfree-create-order", 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = cashfreeCreateOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { items, couponCode, shippingMethod, customer, shipping } = parsed.data;

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
  const { subtotal, discount, shipping: shippingCost, total } = computeOrderTotals(
    resolved,
    discountPercent,
    shippingMethod || "standard",
    config
  );
  if (total <= 0) return NextResponse.json({ error: "Order total must be greater than zero." }, { status: 400 });

  const totalInr = +(total * config.exchangeRates.INR).toFixed(2);

  const order = await prisma.order.create({
    data: {
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      shippingAddress: JSON.stringify(shipping || {}),
      items: JSON.stringify(resolved),
      subtotalUsd: subtotal,
      discountUsd: discount,
      couponCode: appliedCouponCode,
      shippingUsd: shippingCost,
      totalUsd: total,
      status: "pending",
      paymentMethod: "cashfree",
    },
  });
  await recordOrderEvent(order.id, "pending", "Awaiting payment");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;

  try {
    const cfOrder = await createCashfreeOrder({
      orderId: order.id,
      orderAmountUsd: total,
      amountInInr: totalInr,
      customerId: order.id,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      returnUrl: `${siteUrl}/checkout?cf_order_id=${order.id}`,
      notifyUrl: `${siteUrl}/api/cashfree/webhook`,
    });

    await prisma.order.update({ where: { id: order.id }, data: { paymentReference: cfOrder.orderId } });

    return NextResponse.json({ paymentSessionId: cfOrder.paymentSessionId, orderId: order.id, totalInr });
  } catch (err) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "failed" } });
    await recordOrderEvent(order.id, "failed", "Could not start payment");
    // Log the provider's error for us; show the customer a plain message.
    console.error("Cashfree create-order failed:", err);
    return NextResponse.json({ error: "Could not start the payment. Please try again." }, { status: 502 });
  }
}
