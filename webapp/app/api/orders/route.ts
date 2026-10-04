import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeOrder } from "@/lib/serialize";
import { getSiteConfig } from "@/lib/site-config";
import { sendEmail, notifyAdmin, orderConfirmationEmail, escapeHtml } from "@/lib/email";
import { orderCreateSchema, formatZodError } from "@/lib/validation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { OutOfStockError } from "@/lib/errors";
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
    if (product.stock < line.qty) {
      return NextResponse.json({ error: `Only ${product.stock} left in stock for "${product.name}".` }, { status: 409 });
    }
    resolved.push({ id: product.id, name: product.name, priceUsd: product.priceUsd, qty: line.qty, imageUrl: product.imageUrl });
  }

  let discountPercent = 0;
  let appliedCouponCode: string | null = null;
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
    if (coupon && coupon.active) {
      discountPercent = coupon.discountPercent;
      appliedCouponCode = coupon.code;
    }
  }

  const config = await getSiteConfig();
  const { subtotal, discount, shipping: shippingCost, total } = computeTotals(
    resolved,
    discountPercent,
    shippingMethod || "standard",
    config
  );
  if (total <= 0) return NextResponse.json({ error: "Order total must be greater than zero." }, { status: 400 });

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
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

      // Re-check stock inside the transaction (closes the race window
      // against another order placed between the pre-check above and now)
      // and roll back the whole order — no charge has happened yet for
      // COD, so it's safe to just reject rather than oversell silently.
      for (const item of resolved) {
        const product = await tx.product.findUnique({ where: { id: item.id } });
        if (!product || product.stock < item.qty) {
          throw new OutOfStockError(`Only ${product?.stock ?? 0} left in stock for "${item.name}".`);
        }
        await tx.product.update({ where: { id: item.id }, data: { stock: { decrement: item.qty } } });
      }

      return created;
    });
  } catch (err) {
    if (err instanceof OutOfStockError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }

  const { subject, html } = orderConfirmationEmail(order);
  await sendEmail({ to: order.customerEmail!, subject, html });
  await notifyAdmin(
    `New order — ${order.id}`,
    `<p>${escapeHtml(order.customerName)} placed an order for $${order.totalUsd.toFixed(2)} (${escapeHtml(order.paymentMethod)}).</p>`
  );

  return NextResponse.json(serializeOrder(order), { status: 201 });
}
