// Ported verbatim from the original main.js currency switcher.

export type CurrencyCode = "USD" | "INR" | "EUR" | "GBP" | "AUD";

export const EXCHANGE_RATES: Record<CurrencyCode, { rate: number; symbol: string; name: string }> = {
  USD: { rate: 1, symbol: "$", name: "USD" },
  INR: { rate: 83.5, symbol: "₹", name: "INR" },
  EUR: { rate: 0.92, symbol: "€", name: "EUR" },
  GBP: { rate: 0.79, symbol: "£", name: "GBP" },
  AUD: { rate: 1.53, symbol: "A$", name: "AUD" },
};

export const COUNTRY_CURRENCY: Record<string, CurrencyCode> = {
  IN: "INR",
  US: "USD",
  GB: "GBP",
  AU: "AUD",
  CA: "USD",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  BE: "EUR",
  AT: "EUR",
  IE: "EUR",
  PT: "EUR",
  GR: "EUR",
  FI: "EUR",
  PL: "EUR",
  SE: "EUR",
  DK: "EUR",
  NZ: "AUD",
  SG: "USD",
  AE: "USD",
  SA: "USD",
  ZA: "USD",
};

export function formatPrice(usdValue: number, currency: CurrencyCode): string {
  const curr = EXCHANGE_RATES[currency] || EXCHANGE_RATES.USD;
  const converted = (usdValue * curr.rate).toFixed(2);
  return `${curr.symbol}${converted}`;
}
