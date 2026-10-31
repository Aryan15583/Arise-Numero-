import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getSiteConfig } from "@/lib/site-config";

// ADMIN: exchange rates (per 1 USD) for every world currency, so the admin
// panel can show prices in any currency. Live rates come from the free
// ExchangeRate-API open endpoint (no key; updates daily) and are cached for
// 12 hours. The five currencies the shop sells in always use the rates from
// Admin -> Settings, so the admin sees exactly what customers see. If the
// live source is unreachable, those five still work.
const LIVE_URL = process.env.FX_RATES_URL || "https://open.er-api.com/v6/latest/USD";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const config = await getSiteConfig();
  let live: Record<string, number> = {};
  let updatedAt: string | null = null;
  try {
    const res = await fetch(LIVE_URL, { next: { revalidate: 43200 }, signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    if (res.ok && data?.rates && typeof data.rates === "object") {
      live = Object.fromEntries(
        Object.entries(data.rates as Record<string, unknown>).filter(
          ([code, rate]) => /^[A-Z]{3}$/.test(code) && typeof rate === "number" && rate > 0
        ) as [string, number][]
      );
      updatedAt = typeof data.time_last_update_utc === "string" ? data.time_last_update_utc : null;
    }
  } catch {
    /* fall back to the store rates below */
  }

  return NextResponse.json({
    rates: { ...live, ...config.exchangeRates },
    storeCurrencies: Object.keys(config.exchangeRates),
    live: Object.keys(live).length > 0,
    updatedAt,
  });
}
