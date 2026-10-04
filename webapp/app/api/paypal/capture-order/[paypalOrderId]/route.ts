import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeOrder } from "@/lib/serialize";
import { finalizeOrderAsPaid } from "@/lib/order-fulfillment";
import { recordOrderEvent } from "@/lib/order-events";

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

export async function POST(req: NextRequest, { params }: { params: Promise<{ paypalOrderId: string }> }) {
  const { paypalOrderId } = await params;
  try {
    const orderRow = await prisma.order.findFirst({ where: { paymentReference: paypalOrderId } });
    if (!orderRow) return NextResponse.json({ error: "No matching order found for this payment." }, { status: 404 });

    // Idempotency: a flaky network can make the client retry this call
    // after a capture that actually succeeded. PayPal rejects a second
    // capture of the same order, which — before this check existed — made
    // this route incorrectly flip an already-paid order's status back to
    // "failed" and double-decrement stock. If we've already recorded this
    // as paid, just hand back the existing order instead of hitting PayPal
    // again.
    if (["paid", "shipped", "completed"].includes(orderRow.status)) {
      return NextResponse.json({ order: serializeOrder(orderRow), payerName: null, payerEmail: null });
    }

    const accessToken = await getAccessToken();
    const capResp = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    });
    const capData = await capResp.json();

    if (!capResp.ok || capData.status !== "COMPLETED") {
      await prisma.order.update({ where: { id: orderRow.id }, data: { status: "failed" } });
      await recordOrderEvent(orderRow.id, "failed", "Payment was not completed");
      console.error("PayPal capture failed:", capData);
      return NextResponse.json({ error: "Payment was not completed." }, { status: 402 });
    }

    const updated = await finalizeOrderAsPaid(orderRow.id);

    const payer = capData.payer || {};
    return NextResponse.json({
      order: updated,
      payerName: payer.name ? `${payer.name.given_name || ""} ${payer.name.surname || ""}`.trim() : null,
      payerEmail: payer.email_address || null,
    });
  } catch (err) {
    console.error("capture-order error:", err);
    const message = err instanceof Error ? err.message : "Could not capture payment.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
