// Pure order rules, safe to use in both server code and admin pages.

/**
 * Whether an order currently holds (has taken) stock. COD/bank-transfer orders
 * take stock the moment they're placed; PayPal/Cashfree orders only once paid.
 * Used so cancelling puts stock back exactly once, and reviving a cancelled
 * order takes it again.
 */
export function orderHoldsStock(order: { paymentMethod: string | null; status: string }): boolean {
  const online = order.paymentMethod === "paypal" || order.paymentMethod === "cashfree";
  if (online) return ["paid", "shipped", "completed"].includes(order.status);
  return !["cancelled", "failed"].includes(order.status);
}

/**
 * Whether deleting this order should put its items back on the shelf: only
 * when it is still holding stock and hasn't been shipped (shipped and
 * completed items have physically left).
 */
export function deleteRestocks(order: { paymentMethod: string | null; status: string }): boolean {
  return orderHoldsStock(order) && !["shipped", "completed"].includes(order.status);
}
