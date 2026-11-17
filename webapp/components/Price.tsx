"use client";

import { useCurrency } from "./CurrencyContext";

/** A USD amount shown in the visitor's chosen currency, for use inside server components. */
export function Price({ usd }: { usd: number }) {
  const { format } = useCurrency();
  return <>{format(usd)}</>;
}
