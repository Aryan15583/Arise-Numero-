// Client-side: the public /api/config payload, fetched once per page load and
// shared by every component that needs it (currency rates, shipping threshold,
// announcement bar…) instead of each one making its own request.
export type PublicConfig = {
  paypalClientId: string | null;
  cashfreeEnabled: boolean;
  cashfreeMode: "sandbox" | "production";
  storeName: string;
  standardShippingUsd: number;
  expressShippingUsd: number;
  freeShippingThresholdUsd: number;
  exchangeRates: Record<string, number>;
  announcementText: string;
  announcementLink: string;
};

let pending: Promise<PublicConfig | null> | null = null;

export function getPublicConfig(): Promise<PublicConfig | null> {
  if (!pending) {
    pending = fetch("/api/config")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
    // Don't cache a failure forever — let the next caller retry.
    pending.then((c) => {
      if (!c) pending = null;
    });
  }
  return pending;
}
