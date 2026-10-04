"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

// Wishlist = a list of product ids kept in this browser's localStorage (no
// account needed). useSyncExternalStore is the idiomatic way to read browser-only
// storage: the server renders an empty list, the client swaps in the real one
// after hydration with no mismatch, and changes in other tabs sync automatically.

const KEY = "ariseNumero_wishlist";
const listeners = new Set<() => void>();

function readRaw(): string {
  try {
    return localStorage.getItem(KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function write(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* quota / private mode — ignore */
  }
  listeners.forEach((l) => l());
}

type WishlistValue = {
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
};

const WishlistContext = createContext<WishlistValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, readRaw, () => "[]");

  const ids = useMemo<string[]>(() => {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, 100) : [];
    } catch {
      return [];
    }
  }, [raw]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);
  const toggle = useCallback(
    (id: string) => {
      const current = (() => {
        try {
          const p = JSON.parse(readRaw());
          return Array.isArray(p) ? (p as string[]) : [];
        } catch {
          return [] as string[];
        }
      })();
      write(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
    },
    []
  );
  const remove = useCallback((id: string) => {
    try {
      const p = JSON.parse(readRaw());
      write((Array.isArray(p) ? (p as string[]) : []).filter((x) => x !== id));
    } catch {
      write([]);
    }
  }, []);

  return <WishlistContext.Provider value={{ ids, has, toggle, remove }}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
