"use client";

import { CartProvider } from "./CartContext";
import { CurrencyProvider } from "./CurrencyContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CurrencyProvider>
      <CartProvider>{children}</CartProvider>
    </CurrencyProvider>
  );
}
