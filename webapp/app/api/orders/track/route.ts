import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trackOrderSchema, formatZodError } from "@/lib/validation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import type { ResolvedCartLine } from "@/lib/types";

// PUBLIC: order tracking. Needs BOTH the order id (an unguessable random id from
// the confirmation email) and the email on the order. Any mismatch — wrong id,
// wrong email, no such order — gets the identical response, so this can't be
// used to find out which orders or emails exist. Only returns what the customer
// already knows (no phone, no full street address, no payment references).
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!rateLimit(ip, "order-track", 10, 60_000)) {
    return NextResponse.json({ error: "Too many lookups. Please wait a minute and try again." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = trackOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    include: { events: { orderBy: { createdAt: "asc" } } },
  });

  const sameEmail =
    !!order?.customerEmail && order.customerEmail.trim().toLowerCase() === parsed.data.email.trim().toLowerCase();
  if (!order || !sameEmail) {
    return NextResponse.json({ error: "We couldn't find an order matching those details." }, { status: 404 });
  }

  let items: ResolvedCartLine[] = [];
  let address: { city?: string; country?: string } = {};
  try {
    items = JSON.parse(order.items || "[]");
  } catch {
    items = [];
  }
  try {
    address = JSON.parse(order.shippingAddress || "{}");
  } catch {
    address = {};
  }

  return NextResponse.json({
    id: order.id,
    status: order.status,
    placedAt: order.date.toISOString(),
    paymentMethod: order.paymentMethod,
    items: items.map((i) => ({ name: i.name, qty: i.qty, priceUsd: i.priceUsd, imageUrl: i.imageUrl })),
    subtotalUsd: order.subtotalUsd,
    discountUsd: order.discountUsd,
    couponCode: order.couponCode,
    shippingUsd: order.shippingUsd,
    totalUsd: order.totalUsd,
    trackingNumber: order.trackingNumber,
    carrier: order.carrier,
    shipTo: [address.city, address.country].filter(Boolean).join(", ") || null,
    events: order.events.map((e) => ({ status: e.status, note: e.note, at: e.createdAt.toISOString() })),
  });
}
