"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, useSyncExternalStore } from "react";
import { CurrencyCode, EXCHANGE_RATES as DEFAULT_RATES, COUNTRY_CURRENCY } from "@/lib/currency";
import { getPublicConfig } from "@/lib/public-config";

const CURRENCY_KEY = "ariseNumero_currency";

type RatesTable = Record<CurrencyCode, number>;

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  format: (usd: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

// The shopper's saved choice lives in localStorage, read through
// useSyncExternalStore (server renders "", client fills it in after hydration —
// no mismatch and no set-state-in-effect).
const listeners = new Set<() => void>();

function readSaved(): string {
  try {
    return localStorage.getItem(CURRENCY_KEY) ?? "";
  } catch {
    return "";
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === CURRENCY_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const savedRaw = useSyncExternalStore(subscribe, readSaved, () => "");
  const saved: CurrencyCode | null = savedRaw && savedRaw in DEFAULT_RATES ? (savedRaw as CurrencyCode) : null;
  const hasSaved = saved !== null;

  // `override` covers browsers where localStorage is unavailable, so choosing a currency still works.
  const [override, setOverride] = useState<CurrencyCode | null>(null);
  const [detected, setDetected] = useState<CurrencyCode>("USD");
  const currency = override ?? saved ?? detected;

  // Rates start from the static defaults so the page renders immediately;
  // they're replaced with the admin-configurable values from /api/config
  // as soon as that resolves (Admin -> Settings can change these without a
  // redeploy).
  const ratesRef = useRef<RatesTable>({
    USD: DEFAULT_RATES.USD.rate,
    INR: DEFAULT_RATES.INR.rate,
    EUR: DEFAULT_RATES.EUR.rate,
    GBP: DEFAULT_RATES.GBP.rate,
    AUD: DEFAULT_RATES.AUD.rate,
  });
  const [, forceRerender] = useState(0);

  useEffect(() => {
    getPublicConfig()
      .then((data) => {
        if (data?.exchangeRates) {
          ratesRef.current = { ...ratesRef.current, ...data.exchangeRates };
          forceRerender((n) => n + 1);
        }
      })
      .catch(() => {
        /* keep static defaults */
      });
  }, []);

  useEffect(() => {
    if (hasSaved) return;
    // Best-effort auto-detect. Prefer our own /api/geo (country from the host/CDN
    // headers — no third party sees the visitor's IP); if there's no such header,
    // fall back to a browser-side geo-IP lookup. Silently stays on USD on failure.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    fetch("/api/geo", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (data?.currency && data.currency in DEFAULT_RATES) {
          setDetected(data.currency as CurrencyCode);
          return;
        }
        return fetch("https://ipapi.co/json/", { signal: controller.signal })
          .then((r) => r.json())
          .then((geo) => setDetected(COUNTRY_CURRENCY[geo.country_code] || "USD"));
      })
      .catch(() => {
        /* stay on USD */
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [hasSaved]);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setOverride(c);
    try {
      localStorage.setItem(CURRENCY_KEY, c);
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l());
  }, []);

  const format = useCallback(
    (usd: number) => {
      const rate = ratesRef.current[currency] ?? 1;
      const symbol = DEFAULT_RATES[currency].symbol;
      return `${symbol}${(usd * rate).toFixed(2)}`;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currency, ratesRef.current]
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format }}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
