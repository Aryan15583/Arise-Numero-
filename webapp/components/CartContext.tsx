"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";

const CART_KEY = "ariseNumero_cart";

export type CartItem = {
  id: string;
  name: string;
  priceUsd: number;
  qty: number;
  imageUrl?: string | null;
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

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<{ name: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // `hydrated` is real state (not a ref) so its value stays tied to the
  // render it belongs to. Strict Mode's dev-only "mount, cleanup, remount"
  // double-invoke replays this effect pair against the SAME render's closure
  // before committing the next one — a ref would already read true by the
  // second pass and let the persist-effect below fire with the still-empty
  // initial `items`, wiping the saved cart. State avoids that race.
  useEffect(() => {
    setItems(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota errors */
    }
  }, [items, hydrated]);

  const showToast = useCallback((name: string) => {
    setToast({ name });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const addToCart = useCallback(
    (item: Omit<CartItem, "qty">, qty = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.id === item.id);
        if (existing) {
          return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + qty } : i));
        }
        return [...prev, { ...item, qty }];
      });
      showToast(item.name);
    },
    [showToast]
  );

  const removeFromCart = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((i) => i.id !== id);
      return prev.map((i) => (i.id === id ? { ...i, qty } : i));
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

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
          <span aria-hidden="true">✓</span> <strong>{toast.name}</strong> added to cart.{" "}
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
