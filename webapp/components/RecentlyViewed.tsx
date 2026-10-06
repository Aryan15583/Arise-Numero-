"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "./ProductCard";
import type { ProductDTO } from "@/lib/types";

const KEY = "an_recently_viewed";
const MAX_STORED = 8;
const MAX_SHOWN = 4;

// Remembers the products this visitor opened (on this device only) and shows
// the previous ones under the product page. Prices/stock are always fetched
// fresh — only the ids are stored.
export function RecentlyViewed({ currentId }: { currentId: string }) {
  const [products, setProducts] = useState<ProductDTO[]>([]);

  useEffect(() => {
    let stored: string[] = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(parsed)) stored = parsed.filter((v): v is string => typeof v === "string");
    } catch {
      /* storage blocked or corrupt — start fresh */
    }
    const previous = stored.filter((id) => id !== currentId);
    try {
      localStorage.setItem(KEY, JSON.stringify([currentId, ...previous].slice(0, MAX_STORED)));
    } catch {
      /* ignore */
    }

    const wanted = previous.slice(0, MAX_SHOWN);
    if (wanted.length === 0) return;
    let cancelled = false;
    fetch(`/api/products?ids=${wanted.map(encodeURIComponent).join(",")}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: ProductDTO[]) => {
        if (cancelled || !Array.isArray(rows)) return;
        const byId = new Map(rows.map((p) => [p.id, p]));
        setProducts(wanted.map((id) => byId.get(id)).filter((p): p is ProductDTO => !!p));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [currentId]);

  if (products.length === 0) return null;

  return (
    <section className="section related-products" aria-labelledby="recent-heading">
      <div className="container">
        <h2 id="recent-heading" className="section-title">Recently Viewed</h2>
        <div className="product-grid" role="list" aria-label="Recently viewed bracelets">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
