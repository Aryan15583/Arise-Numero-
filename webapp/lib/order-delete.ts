import { prisma } from "@/lib/db";
import { returnStock } from "@/lib/inventory";
import { deleteRestocks } from "@/lib/order-rules";
import { notifyBackInStock } from "@/lib/stock-alerts";
import type { ResolvedCartLine } from "@/lib/types";

/**
 * Permanently deletes orders (their timeline events go with them). Stock held
 * by unshipped orders is returned first, in the same transaction.
 */
export async function deleteOrders(ids: string[]): Promise<{ deleted: string[]; restocked: string[] }> {
  const { deleted, restocked, productIds } = await prisma.$transaction(async (tx) => {
    const orders = await tx.order.findMany({ where: { id: { in: ids } } });
    const restocked: string[] = [];
    const productIds = new Set<string>();
    for (const o of orders) {
      if (!deleteRestocks(o)) continue;
      let items: ResolvedCartLine[] = [];
      try {
        items = JSON.parse(o.items || "[]");
      } catch {
        items = [];
      }
      await returnStock(tx, items);
      items.forEach((i) => productIds.add(i.id));
      restocked.push(o.id);
    }
    await tx.order.deleteMany({ where: { id: { in: orders.map((o) => o.id) } } });
    return { deleted: orders.map((o) => o.id), restocked, productIds };
  });
  // Returned stock can bring a sold-out product back: tell anyone waiting on it.
  for (const id of productIds) await notifyBackInStock(id);
  return { deleted, restocked };
}
