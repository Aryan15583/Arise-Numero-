"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { EXCHANGE_RATES, type CurrencyCode } from "@/lib/currency";
import { getPublicConfig } from "@/lib/public-config";

// The currency the admin panel shows prices in. Prices are always stored in
// USD; this only changes how they're displayed. Defaults to INR and is
// remembered in this browser. Rates come from Admin -> Settings.
const KEY = "ariseNumero_adminCurrency";
const DEFAULT: CurrencyCode = "INR";
export const ADMIN_CURRENCIES = Object.keys(EXCHANGE_RATES) as CurrencyCode[];

const listeners = new Set<() => void>();
function readSaved(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}
function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

type Ctx = {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  /** A USD amount in the chosen currency, e.g. "₹1,336.00". */
  money: (usd: number) => string;
  /** The same USD amount in a specific currency. */
  moneyIn: (usd: number, c: CurrencyCode) => string;
};

const AdminCurrencyContext = createContext<Ctx | null>(null);

export function AdminCurrencyProvider({ children }: { children: React.ReactNode }) {
  const saved = useSyncExternalStore(subscribe, readSaved, () => "");
  const [override, setOverride] = useState<CurrencyCode | null>(null);
  const currency: CurrencyCode = override ?? (saved in EXCHANGE_RATES ? (saved as CurrencyCode) : DEFAULT);

  const [rates, setRates] = useState<Record<string, number>>(() =>
    Object.fromEntries(ADMIN_CURRENCIES.map((c) => [c, EXCHANGE_RATES[c].rate]))
  );
  useEffect(() => {
    getPublicConfig().then((cfg) => {
      if (cfg?.exchangeRates) setRates((r) => ({ ...r, ...cfg.exchangeRates }));
    });
  }, []);

  const setCurrency = useCallback((c: CurrencyCode) => {
    setOverride(c);
    try {
      localStorage.setItem(KEY, c);
    } catch {
      /* private mode: the choice still lasts for this visit */
    }
    listeners.forEach((l) => l());
  }, []);

  const value = useMemo<Ctx>(() => {
    const moneyIn = (usd: number, c: CurrencyCode) => {
      const amount = usd * (rates[c] ?? 1);
      const number = amount.toLocaleString(c === "INR" ? "en-IN" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return `${amount < 0 ? "−" : ""}${EXCHANGE_RATES[c].symbol}${number.replace("-", "")}`;
    };
    return { currency, setCurrency, moneyIn, money: (usd) => moneyIn(usd, currency) };
  }, [currency, rates, setCurrency]);

  return <AdminCurrencyContext.Provider value={value}>{children}</AdminCurrencyContext.Provider>;
}

export function useAdminCurrency(): Ctx {
  const ctx = useContext(AdminCurrencyContext);
  if (!ctx) throw new Error("useAdminCurrency must be used inside AdminCurrencyProvider");
  return ctx;
}

/** The currency picker shown in the admin sidebar. */
export function AdminCurrencyPicker() {
  const { currency, setCurrency } = useAdminCurrency();
  return (
    <label className="admin-currency">
      <span>Show prices in</span>
      <select className="form-input" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}>
        {ADMIN_CURRENCIES.map((c) => (
          <option key={c} value={c}>{EXCHANGE_RATES[c].symbol} {c}</option>
        ))}
      </select>
    </label>
  );
}

/** A USD amount shown in every currency at once (for product prices). */
export function AllCurrencies({ usd }: { usd: number }) {
  const { moneyIn, currency } = useAdminCurrency();
  return (
    <span className="all-currencies">
      {ADMIN_CURRENCIES.map((c) => (
        <span key={c} className={c === currency ? "is-current" : ""}>{moneyIn(usd, c)}</span>
      ))}
    </span>
  );
}
