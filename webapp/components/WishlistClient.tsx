"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductCard } from "./ProductCard";
import { useWishlist } from "./WishlistContext";
import type { ProductDTO } from "@/lib/types";

export function WishlistClient() {
  const { ids } = useWishlist();
  const [products, setProducts] = useState<ProductDTO[] | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    fetch(`/api/products?ids=${encodeURIComponent(key)}`)
      .then((r) => r.json())
      .then((list: ProductDTO[]) => {
        if (!cancelled) setProducts(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (ids.length === 0) {
    return (
      <div className="cart-empty">
        <div className="cart-empty-icon" aria-hidden="true">♡</div>
        <h2>Your wishlist is empty</h2>
        <p>Tap the heart on any bracelet to save it here for later.</p>
        <Link href="/shop" className="btn btn-primary">Browse Bracelets</Link>
      </div>
    );
  }

  if (products === null) return <p className="text-muted" role="status">Loading your saved bracelets…</p>;

  // Keep the order they were saved in; items that were hidden/removed since just drop out.
  const ordered = ids.map((id) => products.find((p) => p.id === id)).filter((p): p is ProductDTO => !!p);

  return (
    <div className="product-grid" role="list" aria-label="Saved bracelets">
      {ordered.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
