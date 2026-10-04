import { NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/site-config";
import { isCashfreeConfigured } from "@/lib/cashfree";

// PUBLIC, non-secret runtime config the frontend needs. Client IDs are
// meant to be public (they identify the app to the payment provider, they
// don't authenticate anything by themselves) — never put secret keys here.
export async function GET() {
  const config = await getSiteConfig();
  return NextResponse.json({
    paypalClientId: process.env.PAYPAL_CLIENT_ID || null,
    cashfreeEnabled: isCashfreeConfigured(),
    cashfreeMode: process.env.CASHFREE_MODE === "production" ? "production" : "sandbox",
    storeName: config.storeName,
    standardShippingUsd: config.standardShippingUsd,
    expressShippingUsd: config.expressShippingUsd,
    freeShippingThresholdUsd: config.freeShippingThresholdUsd,
    exchangeRates: config.exchangeRates,
  });
}
