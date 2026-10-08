// A product with no price yet (0) is shown as "Price on request": visible in
// the shop with its own page, but it can't be added to the cart or ordered
// until a price is set in Admin → Products.
export function isPriced(p: { priceUsd: number }): boolean {
  return p.priceUsd > 0;
}
