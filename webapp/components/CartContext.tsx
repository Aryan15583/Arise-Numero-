"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";

const CART_KEY = "ariseNumero_cart";

// The server rejects more than 10 of one product per order (and more than is in
// stock), so the cart enforces the same ceiling instead of letting shoppers build
// a cart that checkout will refuse.
export const MAX_QTY_PER_LINE = 10;

export type CartItem = {
  id: string;
  name: string;
  priceUsd: number;
  qty: number;
  imageUrl?: string | null;
  /** Stock when it was added — undefined for carts saved before this field existed. */
  stock?: number;
};

type CartContextValue = {
  items: CartItem[];
  totalCount: number;
  subtotalUsd: number;
  addToCart: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function lineLimit(stock?: number): number {
  return Math.max(1, Math.min(MAX_QTY_PER_LINE, stock ?? MAX_QTY_PER_LINE));
}

// ── Storage ────────────────────────────────────────────────────────────────
// The cart lives in localStorage and is read through useSyncExternalStore: the
// server (and the first client render) see an empty cart, then React swaps in the
// real one after hydration — no mismatch, no "load then persist" effects, and so
// none of the old race where persisting the still-empty initial state could wipe a
// saved cart. `cached` also keeps the cart working if localStorage is unavailable.

const listeners = new Set<() => void>();
let cached: string | null = null;

function readRaw(): string {
  if (cached === null) {
    try {
      cached = localStorage.getItem(CART_KEY) ?? "[]";
    } catch {
      cached = "[]";
    }
  }
  return cached;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Another tab changed the cart: forget our copy and re-read.
  const onStorage = (e: StorageEvent) => {
    if (e.key === CART_KEY) {
      cached = null;
      onChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function parseCart(raw: string): CartItem[] {
  try {
    const value = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (i): i is CartItem =>
          !!i && typeof i.id === "string" && typeof i.name === "string" && Number.isFinite(i.priceUsd) && Number.isFinite(i.qty)
      )
      .map((i) => ({ ...i, qty: Math.min(MAX_QTY_PER_LINE, Math.max(1, Math.round(i.qty))) }));
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  cached = JSON.stringify(items);
  try {
    localStorage.setItem(CART_KEY, cached);
  } catch {
    /* quota / private mode — the in-memory copy still works for this session */
  }
  listeners.forEach((l) => l());
}

// ── Provider ───────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "[]");
  const items = useMemo(() => parseCart(raw), [raw]);

  const [toast, setToast] = useState<{ name: string; cappedAt?: number } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((name: string, cappedAt?: number) => {
    setToast({ name, cappedAt });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const addToCart = useCallback(
    (item: Omit<CartItem, "qty">, qty = 1) => {
      const current = parseCart(readRaw());
      const existing = current.find((i) => i.id === item.id);
      const limit = lineLimit(item.stock ?? existing?.stock);
      const capped = (existing?.qty ?? 0) + qty > limit;

      writeCart(
        existing
          ? current.map((i) =>
              i.id === item.id ? { ...i, stock: item.stock ?? i.stock, qty: Math.min(limit, i.qty + qty) } : i
            )
          : [...current, { ...item, qty: Math.min(limit, qty) }]
      );
      showToast(item.name, capped ? limit : undefined);
    },
    [showToast]
  );

  const removeFromCart = useCallback((id: string) => {
    writeCart(parseCart(readRaw()).filter((i) => i.id !== id));
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    const current = parseCart(readRaw());
    if (qty <= 0) return writeCart(current.filter((i) => i.id !== id));
    writeCart(current.map((i) => (i.id === id ? { ...i, qty: Math.min(qty, lineLimit(i.stock)) } : i)));
  }, []);

  const clearCart = useCallback(() => writeCart([]), []);

  const totalCount = items.reduce((sum, i) => sum + i.qty, 0);
  const subtotalUsd = items.reduce((sum, i) => sum + i.priceUsd * i.qty, 0);

  return (
    <CartContext.Provider
      value={{ items, totalCount, subtotalUsd, addToCart, removeFromCart, updateQty, clearCart }}
    >
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: "var(--bg-surface)",
            border: "1.5px solid var(--brand-gold)",
            borderRadius: 12,
            padding: "14px 20px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            fontSize: "0.9rem",
            color: "var(--text-primary)",
            maxWidth: 320,
          }}
        >
          {toast.cappedAt ? (
            <>
              <span aria-hidden="true">ⓘ</span> Only {toast.cappedAt} of <strong>{toast.name}</strong> can be ordered at once —
              your cart has {toast.cappedAt}.{" "}
            </>
          ) : (
            <>
              <span aria-hidden="true">✓</span> <strong>{toast.name}</strong> added to cart.{" "}
            </>
          )}
          <Link href="/cart" style={{ color: "var(--brand-gold)", fontWeight: 600 }}>
            View cart →
          </Link>
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
