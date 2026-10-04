"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { CurrencyCode, EXCHANGE_RATES as DEFAULT_RATES, COUNTRY_CURRENCY } from "@/lib/currency";

const CURRENCY_KEY = "ariseNumero_currency";

type RatesTable = Record<CurrencyCode, number>;

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  format: (usd: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");
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
    fetch("/api/config")
      .then((r) => r.json())
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
    const saved = typeof window !== "undefined" ? localStorage.getItem(CURRENCY_KEY) : null;
    if (saved && saved in DEFAULT_RATES) {
      setCurrencyState(saved as CurrencyCode);
      return;
    }
    // Best-effort auto-detect. Prefer our own /api/geo (country from the host/CDN
    // headers — no third party sees the visitor's IP); if there's no such header,
    // fall back to a browser-side geo-IP lookup. Silently stays on USD on failure.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    fetch("/api/geo", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (data?.currency && data.currency in DEFAULT_RATES) {
          setCurrencyState(data.currency as CurrencyCode);
          return;
        }
        return fetch("https://ipapi.co/json/", { signal: controller.signal })
          .then((r) => r.json())
          .then((geo) => setCurrencyState(COUNTRY_CURRENCY[geo.country_code] || "USD"));
      })
      .catch(() => {
        /* stay on USD */
      })
      .finally(() => clearTimeout(timeout));
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, []);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(CURRENCY_KEY, c);
    } catch {
      /* ignore */
    }
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
