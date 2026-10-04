import type { Prisma } from "@prisma/client";
import { escapeHtml, notifyAdmin } from "./email";
import { OutOfStockError } from "./errors";

type Tx = Prisma.TransactionClient;

export type StockLine = { id: string; name: string; qty: number };
export type StockResult = {
  /** Products that just dropped to/below their low-stock threshold. */
  lowStock: { name: string; left: number }[];
  /** Lines that asked for more than was left (only possible when not strict). */
  oversold: string[];
};

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
 * Takes stock for an order inside a transaction.
 *  - strict: not enough stock throws OutOfStockError, rolling the whole transaction back
 *    (used before any money has changed hands).
 *  - not strict: clamps at zero and reports the shortfall (used after payment has
 *    already cleared, when rejecting is no longer an option).
 */
export async function takeStock(tx: Tx, lines: StockLine[], opts: { strict: boolean }): Promise<StockResult> {
  const result: StockResult = { lowStock: [], oversold: [] };

  for (const line of lines) {
    const product = await tx.product.findUnique({
      where: { id: line.id },
      select: { stock: true, lowStockThreshold: true },
    });
    if (!product) continue; // product deleted since the order was priced — nothing to take

    const short = product.stock < line.qty;
    if (short && opts.strict) {
      throw new OutOfStockError(`Only ${product.stock} left in stock for "${line.name}".`);
    }
    if (short) result.oversold.push(line.name);

    const left = short ? 0 : product.stock - line.qty;
    await tx.product.update({ where: { id: line.id }, data: { stock: left } });

    if (product.stock > product.lowStockThreshold && left <= product.lowStockThreshold) {
      result.lowStock.push({ name: line.name, left });
    }
  }
  return result;
}

/** Puts stock back (cancelled order). */
export async function returnStock(tx: Tx, lines: StockLine[]): Promise<void> {
  for (const line of lines) {
    await tx.product.updateMany({ where: { id: line.id }, data: { stock: { increment: line.qty } } });
  }
}

/** Emails the admin once when an order pushes a product to/below its low-stock threshold. */
export async function notifyLowStock(items: { name: string; left: number }[]): Promise<void> {
  if (items.length === 0) return;
  const rows = items
    .map((i) => `<li>${escapeHtml(i.name)} — ${i.left} left${i.left === 0 ? " <strong>(OUT OF STOCK)</strong>" : ""}</li>`)
    .join("");
  await notifyAdmin(
    `Low stock: ${items.map((i) => i.name).join(", ")}`,
    `<p>An order just pushed these products to or below their low-stock threshold:</p><ul>${rows}</ul><p>Restock from Admin → Stock Levels.</p>`
  );
}
