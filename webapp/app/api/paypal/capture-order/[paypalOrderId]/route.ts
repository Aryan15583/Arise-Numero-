import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { finalizeOrderAsPaid } from "@/lib/order-fulfillment";
import { recordOrderEvent } from "@/lib/order-events";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { notifyAdmin, escapeHtml } from "@/lib/email";

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

// Only what the checkout page needs: never echo the customer's personal details.
function publicResult(order: { id: string; totalUsd: number; status: string }) {
  return { order: { id: order.id, totalUsd: order.totalUsd, status: order.status } };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ paypalOrderId: string }> }) {
  const ip = getClientIp(req);
  if (!rateLimit(ip, "paypal-capture", 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });
  }

  const { paypalOrderId } = await params;
  if (!/^[A-Z0-9]{8,40}$/i.test(paypalOrderId)) {
    return NextResponse.json({ error: "No matching order found for this payment." }, { status: 404 });
  }

  try {
    const orderRow = await prisma.order.findFirst({ where: { paymentReference: paypalOrderId } });
    if (!orderRow) return NextResponse.json({ error: "No matching order found for this payment." }, { status: 404 });

    if (["paid", "shipped", "completed"].includes(orderRow.status)) {
      return NextResponse.json(publicResult(orderRow));
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

    // Never trust that the right amount was paid: compare what PayPal actually
    // captured with the total we calculated on the server.
    const captured = capData?.purchase_units?.[0]?.payments?.captures?.[0]?.amount;
    const amountOk =
      captured?.currency_code === "USD" && Math.abs(Number(captured?.value) - orderRow.totalUsd) < 0.01;
    if (!amountOk) {
      await recordOrderEvent(orderRow.id, "pending", "Payment amount did not match the order total. Needs review");
      await logAudit("order.payment_mismatch", `Order ${orderRow.id}: expected USD ${orderRow.totalUsd.toFixed(2)}, PayPal captured ${captured?.currency_code} ${captured?.value}`, ip);
      await notifyAdmin(
        `Payment mismatch on order ${orderRow.id}`,
        `<p>PayPal captured <strong>${escapeHtml(String(captured?.currency_code))} ${escapeHtml(String(captured?.value))}</strong> but the order total is <strong>USD ${orderRow.totalUsd.toFixed(2)}</strong>. The order was NOT marked paid. Please check it in PayPal and the admin panel.</p>`
      );
      return NextResponse.json(
        { error: "We couldn't confirm your payment amount. Please contact us with your order reference." },
        { status: 402 }
      );
    }

    const updated = await finalizeOrderAsPaid(orderRow.id);
    return NextResponse.json(publicResult(updated ?? orderRow));
  } catch (err) {
    console.error("capture-order error:", err);
    return NextResponse.json({ error: "Could not confirm the payment. Please try again." }, { status: 502 });
  }
}
