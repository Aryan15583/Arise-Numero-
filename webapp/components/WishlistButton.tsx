"use client";

import { useWishlist } from "./WishlistContext";
import { Icon } from "./Icon";

// Heart toggle. "icon" floats over a product card's image; "full" is the labelled
// button on the product page.
export function WishlistButton({
  productId,
  productName,
  variant = "icon",
}: {
  productId: string;
  productName: string;
  variant?: "icon" | "full";
}) {
  const { has, toggle } = useWishlist();
  const saved = has(productId);
  const label = saved ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`;

  if (variant === "full") {
    return (
      <button
        type="button"
        className="btn btn-outline btn-lg wishlist-btn"
        aria-pressed={saved}
        onClick={() => toggle(productId)}
        style={saved ? { color: "var(--color-error)", borderColor: "var(--color-error)" } : undefined}
      >
        <Icon name="heart" size={18} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Wishlist"}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`wishlist-heart ${saved ? "is-saved" : ""}`}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      onClick={(e) => {
        // The card's image is inside a link — don't navigate when tapping the heart.
        e.preventDefault();
        e.stopPropagation();
        toggle(productId);
      }}
    >
      <Icon name="heart" size={18} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
