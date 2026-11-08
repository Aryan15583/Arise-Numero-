import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCashfreeOrderStatus } from "@/lib/cashfree";
import { finalizeOrderAsPaid } from "@/lib/order-fulfillment";
import { recordOrderEvent } from "@/lib/order-events";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// PUBLIC: the checkout page polls this after a Cashfree payment. Anyone who
// knows an order ID can call it, so it only ever returns the order's id,
// status and total, never the customer's name, email, phone or address.
function publicStatus(order: { id: string; status: string; totalUsd: number }) {
  return { id: order.id, status: order.status, totalUsd: order.totalUsd };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const ip = getClientIp(req);
  // The checkout polls up to 5 times per payment; this leaves plenty of room
  // while stopping anyone from hammering Cashfree's API through us.
  if (!rateLimit(ip, "cashfree-order-status", 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  const { orderId } = await params;
  if (!/^[a-z0-9]{20,40}$/.test(orderId)) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentMethod !== "cashfree") {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (["paid", "shipped", "completed"].includes(order.status)) {
    return NextResponse.json(publicStatus(order));
  }

  try {
    const status = await getCashfreeOrderStatus(orderId);
    if (status.orderStatus === "PAID") {
      const updated = await finalizeOrderAsPaid(orderId);
      return NextResponse.json(publicStatus(updated ?? order));
    }
    if (status.orderStatus === "EXPIRED" || status.orderStatus === "TERMINATED") {
      const updated = await prisma.order.update({ where: { id: orderId }, data: { status: "failed" } });
      await recordOrderEvent(orderId, "failed", "Payment expired or was cancelled");
      return NextResponse.json(publicStatus(updated));
    }
    return NextResponse.json(publicStatus(order)); // still pending
  } catch (err) {
    console.error("Cashfree order-status check failed:", err);
    return NextResponse.json({ error: "Could not verify payment status. Please try again." }, { status: 502 });
  }
}
