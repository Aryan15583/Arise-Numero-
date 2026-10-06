"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "./CartContext";
import { useCurrency } from "./CurrencyContext";
import { WishlistButton } from "./WishlistButton";
import type { ProductDTO } from "@/lib/types";
import { reviewsLabel, starString } from "@/lib/stars";

export function ProductCard({ product }: { product: ProductDTO }) {
  const { addToCart } = useCart();
  const { format } = useCurrency();
  const [added, setAdded] = useState(false);

  const isOut = product.stock === 0;
  const isLow = !isOut && product.stock <= product.lowStockThreshold;

  function handleAdd() {
    addToCart({ id: product.id, name: product.name, priceUsd: product.priceUsd, imageUrl: product.imageUrl, stock: product.stock });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <article className="product-card" role="listitem">
      <Link href={`/product/${encodeURIComponent(product.id)}`} className="product-img-link" aria-label={`View ${product.name} details`}>
        <div className="product-img-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl || "/assets/placeholder.svg"}
            alt={`Handcrafted ${product.name} crystal bracelet`}
            className="product-img"
            loading="lazy"
            width={400}
            height={400}
          />
          {product.badge && (
            <div
              className={`product-badge ${product.badge === "New" ? "product-badge--new" : ""} ${
                product.badge === "Sale" ? "product-badge--sale" : ""
              }`}
              aria-label={product.badge}
            >
              {product.badge}
            </div>
          )}
          {isOut && (
            <div className="stock-warning" aria-label="Out of stock" role="status">
              Out of stock
            </div>
          )}
          {isLow && (
            <div className="stock-warning" aria-label={`Low stock: only ${product.stock} left`} role="status">
              Only {product.stock} left!
            </div>
          )}
        </div>
      </Link>
      <WishlistButton productId={product.id} productName={product.name} />
      <div className="product-info">
        <h3 className="product-name">
          <Link href={`/product/${encodeURIComponent(product.id)}`}>{product.name}</Link>
        </h3>
        <p className="product-material">{product.material}</p>
        {product.reviewCount > 0 ? (
          <div className="product-rating" aria-label={`Rating: ${product.rating} out of 5 stars, ${reviewsLabel(product.reviewCount)}`}>
            <span aria-hidden="true">{starString(product.rating)}</span>
            <span className="rating-count">({product.reviewCount})</span>
          </div>
        ) : (
          <div className="product-rating product-rating-empty">No reviews yet</div>
        )}
        <div className="product-price-row">
          <span>
            <span className="product-price">{format(product.priceUsd)}</span>
            {product.originalPriceUsd && (
              <>
                {" "}
                <span className="price-original">{format(product.originalPriceUsd)}</span>
              </>
            )}
          </span>
          <button
            className="btn btn-primary btn-sm add-to-cart"
            onClick={handleAdd}
            disabled={isOut}
            aria-label={`Add ${product.name} to cart`}
          >
            {added ? "✓ Added!" : isOut ? "Out of Stock" : "Add to Cart"}
          </button>
        </div>
      </div>
    </article>
  );
}
