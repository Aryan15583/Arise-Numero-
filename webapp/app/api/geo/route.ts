import { NextRequest, NextResponse } from "next/server";
import { COUNTRY_CURRENCY } from "@/lib/currency";

// Headers a CDN/host adds with the visitor's country. Reading them here means
// the visitor's IP is never sent to a third-party geo-IP service from their
// browser (the old approach, which also failed whenever that service rate-limited).
const COUNTRY_HEADERS = ["cf-ipcountry", "x-vercel-ip-country", "cloudfront-viewer-country", "x-country-code"];

// PUBLIC: suggests a display currency from the CDN/host country header. Never an
// error — null means "no header available" (e.g. local dev, or hosting without a
// CDN), and the client falls back to its own geo-IP lookup.
export async function GET(req: NextRequest) {
  let country: string | null = null;

  for (const name of COUNTRY_HEADERS) {
    const value = req.headers.get(name)?.trim().toUpperCase();
    // XX = unknown, T1 = Tor (Cloudflare's placeholders)
    if (value && /^[A-Z]{2}$/.test(value) && value !== "XX" && value !== "T1") {
      country = value;
      break;
    }
  }

  return NextResponse.json(
    { currency: (country && COUNTRY_CURRENCY[country]) || null },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
