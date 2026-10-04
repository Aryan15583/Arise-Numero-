import { NextRequest, NextResponse } from "next/server";
import { verifyCashfreeWebhookSignature } from "@/lib/cashfree";
import { finalizeOrderAsPaid } from "@/lib/order-fulfillment";
import { prisma } from "@/lib/db";
import { recordOrderEvent } from "@/lib/order-events";

const MAX_WEBHOOK_AGE_SECONDS = 5 * 60;

// Cashfree calls this when a payment succeeds/fails, independently of the
// buyer's browser (so it still works if they close the tab right after
// paying). Must read the raw body — the signature is computed over the
// exact bytes Cashfree sent, not a reserialized copy.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-webhook-signature");
  const timestamp = req.headers.get("x-webhook-timestamp");

  if (!signature || !timestamp || !verifyCashfreeWebhookSignature(rawBody, timestamp, signature)) {
    console.warn("Cashfree webhook: invalid or missing signature");
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  // A valid signature only proves Cashfree signed this payload at some
  // point — without a freshness check, a captured request could be replayed
  // indefinitely. finalizeOrderAsPaid() is already idempotent so a replay
  // can't double-fulfil an order, but rejecting stale requests outright
  // means a leaked/logged webhook body stops being useful to a replayer
  // after a few minutes.
  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > MAX_WEBHOOK_AGE_SECONDS) {
    console.warn("Cashfree webhook: stale timestamp, rejecting");
    return NextResponse.json({ error: "Stale request." }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const orderId: string | undefined = event?.data?.order?.order_id;
  const paymentStatus: string | undefined = event?.data?.payment?.payment_status;

  if (!orderId) {
    return NextResponse.json({ ok: true }); // Nothing actionable, but acknowledge so Cashfree doesn't retry forever.
  }

  if (paymentStatus === "SUCCESS") {
    await finalizeOrderAsPaid(orderId);
  } else if (paymentStatus === "FAILED" || paymentStatus === "USER_DROPPED") {
    const failed = await prisma.order
      .updateMany({ where: { id: orderId, status: "pending" }, data: { status: "failed" } })
      .catch(() => ({ count: 0 }));
    if (failed.count > 0) await recordOrderEvent(orderId, "failed", "Payment failed or was abandoned").catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
