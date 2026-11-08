import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkCoupon } from "@/lib/coupons";
import { recordOrderEvent } from "@/lib/order-events";
import type { ResolvedCartLine } from "@/lib/types";
import { computeOrderTotals } from "@/lib/pricing";
import { getSiteConfig } from "@/lib/site-config";
import { paypalCreateOrderSchema, formatZodError } from "@/lib/validation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const PAYPAL_MODE = process.env.PAYPAL_MODE === "live" ? "live" : "sandbox";
const PAYPAL_BASE = PAYPAL_MODE === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!clientId || !secret) throw new Error("PayPal is not configured on this server.");

  const basicAuth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const resp = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basicAuth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!resp.ok) throw new Error(`PayPal auth failed: ${resp.status}`);
  const data = await resp.json();
  return data.access_token as string;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip, "paypal-create-order", 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }

  // Same validation as the other checkout routes: nothing unchecked reaches the database.
  const parsed = paypalCreateOrderSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { items, shippingMethod, customer, shipping } = parsed.data;
  const couponCode = parsed.data.couponCode ? parsed.data.couponCode.toUpperCase() : undefined;

  try {

    const resolved: ResolvedCartLine[] = [];
    for (const line of items) {
      const p = await prisma.product.findUnique({ where: { id: line.id } });
      if (!p || !p.active) return NextResponse.json({ error: `Product "${line.id}" is not available.` }, { status: 400 });
      if (p.priceUsd <= 0) {
        return NextResponse.json({ error: `"${p.name}" is price on request — please contact us to order it.` }, { status: 400 });
      }
      const qty = line.qty;
      if (p.stock < qty) {
        return NextResponse.json({ error: `Only ${p.stock} left in stock for "${p.name}".` }, { status: 409 });
      }
      resolved.push({ id: p.id, name: p.name, priceUsd: p.priceUsd, qty, imageUrl: p.imageUrl });
    }

    let discountPercent = 0;
    let appliedCouponCode: string | null = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.trim() } });
      const rawSubtotal = resolved.reduce((sum, i) => sum + i.priceUsd * i.qty, 0);
      const check = checkCoupon(coupon, rawSubtotal);
      if (!coupon || !check.ok) {
        return NextResponse.json({ error: check.ok ? "Invalid coupon code." : check.message }, { status: 400 });
      }
      discountPercent = coupon.discountPercent;
      appliedCouponCode = coupon.code;
    }

    // Shipping is included here exactly as on the other checkout routes, so
    // PayPal charges the same total the checkout page showed.
    const config = await getSiteConfig();
    const { subtotal, discount, shipping: shippingCost, total } = computeOrderTotals(
      resolved,
      discountPercent,
      shippingMethod || "standard",
      config
    );
    if (total <= 0) return NextResponse.json({ error: "Order total must be greater than zero." }, { status: 400 });

    const accessToken = await getAccessToken();
    const ppResp = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          { description: "Arise Numero — Crystal Bracelet Order", amount: { currency_code: "USD", value: total.toFixed(2) } },
        ],
        application_context: { brand_name: "Arise Numero", shipping_preference: "NO_SHIPPING", user_action: "PAY_NOW" },
      }),
    });
    if (!ppResp.ok) {
      console.error("PayPal create order failed:", await ppResp.text());
      return NextResponse.json({ error: "Could not start PayPal checkout." }, { status: 502 });
    }
    const ppOrder = await ppResp.json();

    // Record a pending order now so it shows up in the admin panel even if
    // the buyer abandons payment on PayPal's page.
    const created = await prisma.order.create({
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
        paymentMethod: "paypal",
        paymentReference: ppOrder.id,
      },
    });
    await recordOrderEvent(created.id, "pending", "Awaiting payment");

    return NextResponse.json({ paypalOrderId: ppOrder.id, totalUsd: total });
  } catch (err) {
    console.error("create-order error:", err);
    return NextResponse.json({ error: "Could not start PayPal checkout. Please try again." }, { status: 502 });
  }
}
