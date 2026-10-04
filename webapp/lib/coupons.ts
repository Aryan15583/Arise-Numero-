import type { Coupon } from "@prisma/client";

export type CouponCheck = { ok: true } | { ok: false; message: string };

const BARE_DATE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

/** A bare date (what an <input type="date"> gives) means "valid through the end of that day" (UTC). */
export function parseCouponExpiry(value: string): Date {
  return new Date(BARE_DATE.test(value) ? `${value}T23:59:59.999Z` : value);
}

/**
 * Single source of truth for "can this coupon be used right now?" — used by the
 * cart validation endpoint and by every order-creation route, so what a shopper
 * is told in the cart always matches what the server enforces at checkout.
 * `subtotalUsd` is optional: omit it to skip the minimum-order check.
 */
export function checkCoupon(coupon: Coupon | null, subtotalUsd?: number, now: Date = new Date()): CouponCheck {
  if (!coupon || !coupon.active) return { ok: false, message: "Invalid or expired coupon code." };
  if (coupon.expiresAt && coupon.expiresAt.getTime() <= now.getTime()) {
    return { ok: false, message: "This coupon has expired." };
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, message: "This coupon has reached its usage limit." };
  }
  if (coupon.minOrderUsd !== null && subtotalUsd !== undefined && subtotalUsd < coupon.minOrderUsd) {
    return { ok: false, message: `This coupon needs an order of at least $${coupon.minOrderUsd.toFixed(2)} (USD).` };
  }
  return { ok: true };
}
