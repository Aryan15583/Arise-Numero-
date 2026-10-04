import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCashfreeOrderStatus } from "@/lib/cashfree";
import { finalizeOrderAsPaid } from "@/lib/order-fulfillment";
import { serializeOrder } from "@/lib/serialize";
import { recordOrderEvent } from "@/lib/order-events";

// PUBLIC: called by the checkout page right after Cashfree's modal closes.
// Never trusts the client's own claim of success — always re-checks with
// Cashfree directly before marking anything paid. The webhook covers the
// case where the buyer closes the tab before this ever runs.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  if (["paid", "shipped", "completed"].includes(order.status)) {
    return NextResponse.json(serializeOrder(order));
  }

  try {
    const status = await getCashfreeOrderStatus(orderId);
    if (status.orderStatus === "PAID") {
      const updated = await finalizeOrderAsPaid(orderId);
      return NextResponse.json(updated);
    }
    if (status.orderStatus === "EXPIRED" || status.orderStatus === "TERMINATED") {
      const updated = await prisma.order.update({ where: { id: orderId }, data: { status: "failed" } });
      await recordOrderEvent(orderId, "failed", "Payment expired or was cancelled");
      return NextResponse.json(serializeOrder(updated));
    }
    return NextResponse.json(serializeOrder(order)); // still pending
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not verify payment status.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
