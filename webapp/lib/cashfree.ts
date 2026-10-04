// Cashfree Payment Gateway (PG) integration — covers UPI, GPay, Mastercard/
// Visa cards, netbanking, and wallets through one hosted checkout, chosen
// explicitly instead of Razorpay. Inert until CASHFREE_APP_ID and
// CASHFREE_SECRET_KEY are set in .env — see PROGRESS.md / TODO.md for how
// to get sandbox keys (instant, no KYC) and go live later (KYC required).
//
// Docs: https://docs.cashfree.com/reference/pg-new-apis-endpoint (API version
// pinned below). Cashfree does version and occasionally adjust field names —
// if a call starts failing after they ship an API change, this is the one
// file to check against their current reference.

import crypto from "node:crypto";

const API_VERSION = "2023-08-01";

function isConfigured() {
  return !!(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);
}

function baseUrl() {
  return process.env.CASHFREE_MODE === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

function headers() {
  return {
    "x-client-id": process.env.CASHFREE_APP_ID!,
    "x-client-secret": process.env.CASHFREE_SECRET_KEY!,
    "x-api-version": API_VERSION,
    "Content-Type": "application/json",
  };
}

export type CashfreeOrderResult = {
  cfOrderId: string;
  orderId: string;
  paymentSessionId: string;
};

export async function createCashfreeOrder(params: {
  orderId: string;
  orderAmountUsd: number; // Cashfree processes INR; caller supplies the amount already in the target currency (see route — we settle in INR).
  amountInInr: number;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  returnUrl: string;
  notifyUrl: string;
}): Promise<CashfreeOrderResult> {
  if (!isConfigured()) {
    throw new Error("Cashfree is not configured on this server. Set CASHFREE_APP_ID / CASHFREE_SECRET_KEY in .env.");
  }

  const resp = await fetch(`${baseUrl()}/orders`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      order_id: params.orderId,
      order_amount: params.amountInInr,
      order_currency: "INR",
      customer_details: {
        customer_id: params.customerId,
        customer_name: params.customerName,
        customer_email: params.customerEmail,
        customer_phone: params.customerPhone,
      },
      order_meta: {
        return_url: params.returnUrl,
        notify_url: params.notifyUrl,
      },
    }),
  });

  const data = await resp.json();
  if (!resp.ok) {
    console.error("Cashfree create order failed:", data);
    throw new Error(data?.message || "Could not start Cashfree checkout.");
  }

  return {
    cfOrderId: data.cf_order_id,
    orderId: data.order_id,
    paymentSessionId: data.payment_session_id,
  };
}

export type CashfreeOrderStatus = {
  orderStatus: string; // ACTIVE, PAID, EXPIRED, TERMINATED
};

export async function getCashfreeOrderStatus(orderId: string): Promise<CashfreeOrderStatus> {
  if (!isConfigured()) {
    throw new Error("Cashfree is not configured on this server.");
  }
  const resp = await fetch(`${baseUrl()}/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: headers(),
  });
  const data = await resp.json();
  if (!resp.ok) {
    console.error("Cashfree get order failed:", data);
    throw new Error(data?.message || "Could not fetch order status from Cashfree.");
  }
  return { orderStatus: data.order_status };
}

export function isCashfreeConfigured(): boolean {
  return isConfigured();
}

/**
 * Verifies the `x-webhook-signature` header Cashfree sends with every
 * webhook POST. `rawBody` must be the exact, unparsed request body string —
 * signing is over `timestamp + rawBody`, so parsing/reserializing JSON
 * before verifying will break it.
 */
export function verifyCashfreeWebhookSignature(rawBody: string, timestamp: string, signature: string): boolean {
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(timestamp + rawBody).digest("base64");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
