// A product with no price yet (0) is shown as "Price on request": visible in
// the shop with its own page, but it can't be added to the cart or ordered
// until a price is set in Admin → Products.
export function isPriced(p: { priceUsd: number }): boolean {
  return p.priceUsd > 0;
}

type ShippingRates = { standardShippingUsd: number; expressShippingUsd: number; freeShippingThresholdUsd: number };

/**
 * The one place an order's money is worked out, on the server, from database
 * prices. Every checkout path (COD/bank, Cashfree, PayPal) must use this so
 * the amount charged always matches what the checkout page showed.
 */
export function computeOrderTotals(
  items: { priceUsd: number; qty: number }[],
  discountPercent: number,
  shippingMethod: string,
  rates: ShippingRates
) {
  const subtotal = items.reduce((sum, i) => sum + i.priceUsd * i.qty, 0);
  const discount = +(subtotal * (discountPercent / 100)).toFixed(2);
  const afterDiscount = subtotal - discount;
  let shipping = shippingMethod === "express" ? rates.expressShippingUsd : rates.standardShippingUsd;
  if (afterDiscount === 0) shipping = 0;
  else if (shippingMethod !== "express" && afterDiscount >= rates.freeShippingThresholdUsd) shipping = 0;
  const total = +(afterDiscount + shipping).toFixed(2);
  return { subtotal: +subtotal.toFixed(2), discount, shipping, total };
}
