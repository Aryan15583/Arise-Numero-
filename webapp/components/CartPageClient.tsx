"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { lineLimit, useCart } from "./CartContext";
import { useCurrency } from "./CurrencyContext";
import { getPublicConfig } from "@/lib/public-config";
import { Icon } from "./Icon";

export function CartPageClient() {
  const { items, removeFromCart, updateQty, subtotalUsd } = useCart();
  const { format } = useCurrency();
  const [couponInput, setCouponInput] = useState("");
  const [couponFeedback, setCouponFeedback] = useState<{ message: string; ok: boolean } | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [applying, setApplying] = useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(50);

  useEffect(() => {
    getPublicConfig().then((d) => {
      if (d) setFreeShippingThreshold(d.freeShippingThresholdUsd ?? 50);
    });
  }, []);

  type CouponResult = { valid: boolean; discountPercent?: number; message?: string };

  async function fetchCouponCheck(code: string): Promise<CouponResult> {
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, subtotalUsd }),
    });
    return res.json();
  }

  function showCouponResult(code: string, data: CouponResult, restoring: boolean) {
    if (data.valid) {
      if (restoring) setCouponInput(code.toUpperCase());
      setDiscountPercent(data.discountPercent ?? 0);
      setCouponFeedback({ message: `✓ Coupon applied! ${data.discountPercent}% off your order.`, ok: true });
      sessionStorage.setItem("ariseNumero_coupon", code.toUpperCase());
    } else {
      setDiscountPercent(0);
      sessionStorage.removeItem("ariseNumero_coupon");
      setCouponFeedback({ message: `✕ ${data.message || "Invalid coupon code."}`, ok: false });
    }
  }

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setApplying(true);
    try {
      showCouponResult(code, await fetchCouponCheck(code), false);
    } catch {
      setCouponFeedback({ message: "✕ Could not validate coupon. Please try again.", ok: false });
    } finally {
      setApplying(false);
    }
  }

  // A coupon applied earlier lives in sessionStorage; without this, refreshing the
  // cart page showed no discount even though checkout would still apply it. Re-check
  // it (against the current subtotal) once the saved cart has loaded.
  const hasItems = items.length > 0;
  useEffect(() => {
    if (!hasItems) return;
    const saved = sessionStorage.getItem("ariseNumero_coupon");
    if (!saved) return;
    fetchCouponCheck(saved)
      .then((data) => showCouponResult(saved, data, true))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasItems, Math.round(subtotalUsd * 100)]);

  const discount = subtotalUsd * (discountPercent / 100);
  const afterDiscount = subtotalUsd - discount;

  if (items.length === 0) {
    return (
      <div className="container cart-layout">
        <section className="cart-main" aria-labelledby="cart-heading">
          <h1 id="cart-heading" className="page-title">Your Cart</h1>
          <div className="cart-empty">
            <div className="cart-empty-icon"><Icon name="bag" size={40} /></div>
            <h2>Your cart is empty</h2>
            <p>Add some beautiful crystal bracelets to get started.</p>
            <Link href="/shop" className="btn btn-primary" aria-label="Continue shopping for bracelets">
              Continue Shopping
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="container cart-layout">
      <section className="cart-main" aria-labelledby="cart-heading">
        <h1 id="cart-heading" className="page-title">Your Cart</h1>

        <table className="cart-table" aria-label="Cart items">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Price</th>
              <th scope="col">Quantity</th>
              <th scope="col">Subtotal</th>
              <th scope="col"><span className="sr-only">Remove</span></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr className="cart-row" key={item.id}>
                <td className="cart-product-cell">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageUrl || "/assets/placeholder.svg"} alt="" className="cart-item-img" width={80} height={80} />
                  <div className="cart-item-info">
                    <span className="cart-item-name">{item.name}</span>
                    <span className="cart-item-meta">Crystal Bracelet</span>
                  </div>
                </td>
                <td className="cart-price">{format(item.priceUsd)}</td>
                <td className="cart-qty-cell">
                  <div className="quantity-control">
                    <button className="qty-btn qty-minus" aria-label={`Decrease quantity of ${item.name}`} onClick={() => updateQty(item.id, item.qty - 1)}>−</button>
                    <input
                      type="number"
                      className="qty-input cart-qty"
                      value={item.qty}
                      min={1}
                      max={lineLimit(item.stock)}
                      aria-label={`Quantity of ${item.name}`}
                      onChange={(e) => updateQty(item.id, Math.max(1, Math.min(lineLimit(item.stock), parseInt(e.target.value) || 1)))}
                    />
                    <button
                      className="qty-btn qty-plus"
                      aria-label={`Increase quantity of ${item.name}`}
                      disabled={item.qty >= lineLimit(item.stock)}
                      onClick={() => updateQty(item.id, item.qty + 1)}
                    >
                      +
                    </button>
                  </div>
                  {item.qty >= lineLimit(item.stock) && (
                    <p className="qty-limit" role="status">
                      {item.stock !== undefined && item.stock < 10 ? `Only ${item.stock} in stock` : "Max 10 per order"}
                    </p>
                  )}
                </td>
                <td className="cart-subtotal">{format(item.priceUsd * item.qty)}</td>
                <td className="cart-remove-cell">
                  <button className="cart-remove-btn" aria-label={`Remove ${item.name} from cart`} onClick={() => removeFromCart(item.id)}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="cart-actions">
          <Link href="/shop" className="btn btn-ghost" aria-label="Continue shopping">← Continue Shopping</Link>
        </div>

        <div className="coupon-section" aria-label="Coupon code section">
          <h2 className="coupon-title">Have a Coupon?</h2>
          <div className="coupon-form" role="form" aria-label="Apply coupon code">
            <label htmlFor="coupon-input" className="sr-only">Coupon code</label>
            <input
              type="text"
              id="coupon-input"
              className="coupon-input form-input"
              placeholder="Enter coupon code"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
            />
            <button className="btn btn-primary" onClick={applyCoupon} disabled={applying}>
              {applying ? "Checking…" : "Apply"}
            </button>
          </div>
          {couponFeedback && (
            <p className={`coupon-feedback ${couponFeedback.ok ? "success" : "error"}`} role="status">
              {couponFeedback.message}
            </p>
          )}
        </div>
      </section>

      <aside className="cart-summary" aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="summary-title">Order Summary</h2>

        {freeShippingThreshold > 0 && (
          <div className="free-ship-progress" aria-live="polite">
            {afterDiscount >= freeShippingThreshold ? (
              <p className="free-ship-text"><Icon name="celebrate" size={16} /> You&apos;ve unlocked <strong>free shipping</strong>!</p>
            ) : (
              <p className="free-ship-text">
                Add <strong>{format(freeShippingThreshold - afterDiscount)}</strong> more for <strong>free shipping</strong>
              </p>
            )}
            <div
              className="free-ship-bar"
              role="progressbar"
              aria-label="Progress toward free shipping"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.min(100, Math.round((afterDiscount / freeShippingThreshold) * 100))}
            >
              <span style={{ width: `${Math.min(100, (afterDiscount / freeShippingThreshold) * 100)}%` }} />
            </div>
          </div>
        )}

        <dl className="summary-breakdown" aria-label="Cost breakdown">
          <div className="summary-row">
            <dt>Subtotal</dt>
            <dd aria-live="polite">{format(subtotalUsd)}</dd>
          </div>
          {discountPercent > 0 && (
            <div className="summary-row">
              <dt>Discount ({discountPercent}%)</dt>
              <dd className="summary-discount">−{format(discount)}</dd>
            </div>
          )}
          <div className="summary-row">
            <dt>Shipping</dt>
            <dd>{afterDiscount >= freeShippingThreshold ? "Free" : "Calculated at checkout"}</dd>
          </div>
          <div className="summary-row summary-total">
            <dt>Estimated Total</dt>
            <dd><strong>{format(afterDiscount)}</strong></dd>
          </div>
        </dl>

        <p className="summary-currency-note">Prices shown in your selected currency. Final amount is charged in USD.</p>

        <Link href="/checkout" className="btn btn-primary btn-lg btn-full checkout-btn" aria-label="Proceed to secure checkout">
          <Icon name="lock" size={16} /> Proceed to Checkout
        </Link>

        <p className="security-note"><Icon name="lock" size={16} /> Pay by Cash on Delivery, Bank Transfer, UPI/GPay, or card (Visa/Mastercard) at checkout.</p>

        <p className="cart-policy-note">
          <Link href="/returns">14-day returns</Link> · <Link href="/returns#shipping">Shipping info</Link>
        </p>
      </aside>
    </div>
  );
}
