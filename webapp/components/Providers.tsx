"use client";

import { CartProvider } from "./CartContext";
import { CurrencyProvider } from "./CurrencyContext";
import { WishlistProvider } from "./WishlistContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CurrencyProvider>
      <WishlistProvider>
        <CartProvider>{children}</CartProvider>
      </WishlistProvider>
    </CurrencyProvider>
  );
}
