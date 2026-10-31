"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { EXCHANGE_RATES } from "@/lib/currency";
import { adminFetchJson } from "@/lib/admin-api";

// The currency the admin panel shows prices in: any world currency. Prices are
// always stored in USD; this only changes how they're displayed. Defaults to
// INR and is remembered in this browser. The shop's own five currencies use
// the rates from Admin -> Settings; the rest use live daily rates.
const KEY = "ariseNumero_adminCurrency";
const DEFAULT = "INR";
const STORE_CURRENCIES = Object.keys(EXCHANGE_RATES);

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

type FxResponse = { rates: Record<string, number>; storeCurrencies: string[]; live: boolean; updatedAt: string | null };

type Ctx = {
  currency: string;
  setCurrency: (c: string) => void;
  /** Currencies with a known rate, shop currencies first. */
  available: string[];
  storeCurrencies: string[];
  live: boolean;
  updatedAt: string | null;
  /** A USD amount in the chosen currency, e.g. "₹1,336.00". */
  money: (usd: number) => string;
  /** The same USD amount in a specific currency. */
  moneyIn: (usd: number, c: string) => string;
  /** How many units of a currency one US dollar buys. */
  rateOf: (c: string) => number;
};

const AdminCurrencyContext = createContext<Ctx | null>(null);

const formatters = new Map<string, Intl.NumberFormat>();
function formatterFor(code: string): Intl.NumberFormat {
  let f = formatters.get(code);
  if (!f) {
    try {
      f = new Intl.NumberFormat(code === "INR" ? "en-IN" : "en", { style: "currency", currency: code });
    } catch {
      f = new Intl.NumberFormat("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    formatters.set(code, f);
  }
  return f;
}

let namer: Intl.DisplayNames | null = null;
export function currencyName(code: string): string {
  try {
    namer ??= new Intl.DisplayNames(["en"], { type: "currency" });
    return namer.of(code) ?? code;
  } catch {
    return code;
  }
}

export function AdminCurrencyProvider({ children }: { children: React.ReactNode }) {
  const saved = useSyncExternalStore(subscribe, readSaved, () => "");
  const [override, setOverride] = useState<string | null>(null);
  const [fx, setFx] = useState<FxResponse>(() => ({
    rates: Object.fromEntries(STORE_CURRENCIES.map((c) => [c, EXCHANGE_RATES[c as keyof typeof EXCHANGE_RATES].rate])),
    storeCurrencies: STORE_CURRENCIES,
    live: false,
    updatedAt: null,
  }));

  useEffect(() => {
    adminFetchJson<FxResponse>("/api/admin/fx-rates")
      .then((d) => setFx(d))
      .catch(() => {
        /* keep the built-in rates */
      });
  }, []);

  const wanted = override ?? (saved || DEFAULT);
  // A saved currency we have no rate for (yet) falls back to INR.
  const currency = fx.rates[wanted] ? wanted : DEFAULT;

  const setCurrency = useCallback((c: string) => {
    setOverride(c);
    try {
      localStorage.setItem(KEY, c);
    } catch {
      /* private mode: the choice still lasts for this visit */
    }
    listeners.forEach((l) => l());
  }, []);

  const value = useMemo<Ctx>(() => {
    const moneyIn = (usd: number, c: string) => formatterFor(c).format(usd * (fx.rates[c] ?? 1));
    const others = Object.keys(fx.rates)
      .filter((c) => !fx.storeCurrencies.includes(c))
      .sort((a, b) => currencyName(a).localeCompare(currencyName(b)));
    return {
      currency,
      setCurrency,
      available: [...fx.storeCurrencies, ...others],
      storeCurrencies: fx.storeCurrencies,
      live: fx.live,
      updatedAt: fx.updatedAt,
      moneyIn,
      money: (usd) => moneyIn(usd, currency),
      rateOf: (c) => fx.rates[c] ?? 1,
    };
  }, [currency, fx, setCurrency]);

  return <AdminCurrencyContext.Provider value={value}>{children}</AdminCurrencyContext.Provider>;
}

export function useAdminCurrency(): Ctx {
  const ctx = useContext(AdminCurrencyContext);
  if (!ctx) throw new Error("useAdminCurrency must be used inside AdminCurrencyProvider");
  return ctx;
}

/** The currency picker shown in the admin sidebar: every currency we have a rate for. */
export function AdminCurrencyPicker({ variant = "sidebar" }: { variant?: "sidebar" | "toolbar" }) {
  const { currency, setCurrency, available, storeCurrencies, live } = useAdminCurrency();
  const others = available.filter((c) => !storeCurrencies.includes(c));
  return (
    <label className={variant === "toolbar" ? "admin-currency admin-currency--toolbar" : "admin-currency"}>
      <span>{variant === "toolbar" ? "Currency" : "Show prices in"}</span>
      <select className="form-input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
        <optgroup label="Shop currencies">
          {storeCurrencies.map((c) => <option key={c} value={c}>{c} — {currencyName(c)}</option>)}
        </optgroup>
        {others.length > 0 && (
          <optgroup label="All currencies (live rates)">
            {others.map((c) => <option key={c} value={c}>{c} — {currencyName(c)}</option>)}
          </optgroup>
        )}
      </select>
      {!live && variant === "sidebar" && <small>Live rates unavailable; showing shop currencies.</small>}
    </label>
  );
}

/** A USD amount in the shop's currencies (plus the chosen one), for product prices. */
export function AllCurrencies({ usd }: { usd: number }) {
  const { moneyIn, currency, storeCurrencies } = useAdminCurrency();
  const list = storeCurrencies.includes(currency) ? storeCurrencies : [currency, ...storeCurrencies];
  return (
    <span className="all-currencies">
      {list.map((c) => (
        <span key={c} className={c === currency ? "is-current" : ""}>{moneyIn(usd, c)}</span>
      ))}
    </span>
  );
}

/**
 * A compact "₹ INR ▾" button. Clicking it opens a searchable list of every
 * currency; choosing one switches the whole admin panel.
 */
export function CurrencyMenu() {
  const { currency, setCurrency, available, storeCurrencies } = useAdminCurrency();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const q = query.trim().toLowerCase();
  const matches = available.filter((c) => !q || c.toLowerCase().includes(q) || currencyName(c).toLowerCase().includes(q));
  const symbol = formatterFor(currency).formatToParts(0).find((p) => p.type === "currency")?.value ?? currency;

  function choose(c: string) {
    setCurrency(c);
    setOpen(false);
    setQuery("");
  }

  return (
    <span className="currency-menu">
      <button
        type="button"
        className="currency-menu-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Change currency"
        onClick={() => setOpen((v) => !v)}
      >
        <strong>{symbol}</strong> {currency} <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <>
          <span className="currency-menu-backdrop" onClick={() => setOpen(false)} />
          <span className="currency-menu-pop" role="dialog" aria-label="Choose currency">
            <span className="currency-menu-title">Show prices in</span>
            <input
              autoFocus
              className="form-input"
              placeholder="Search currency…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && matches[0] && choose(matches[0])}
            />
            <span className="currency-menu-list" role="listbox" aria-label="Currencies">
              {matches.map((c, i) => (
                <button
                  type="button"
                  key={c}
                  role="option"
                  aria-selected={c === currency}
                  className={`currency-menu-item ${c === currency ? "is-current" : ""} ${!q && i === storeCurrencies.length ? "is-first-other" : ""}`}
                  onClick={() => choose(c)}
                >
                  <span>{c}</span>
                  <span>{currencyName(c)}</span>
                </button>
              ))}
              {matches.length === 0 && <span className="currency-menu-empty">No match</span>}
            </span>
          </span>
        </>
      )}
    </span>
  );
}
