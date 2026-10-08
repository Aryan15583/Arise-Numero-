import { prisma } from "./db";
import { backInStockEmail, sendEmail } from "./email";
import { absoluteUrl, productPath } from "./seo";

/**
 * Emails everyone waiting on a product once it has stock again. Each sign-up is
 * emailed at most once (notifiedAt). Call after any change that can raise stock
 * from zero; it does nothing while the product is still sold out or hidden.
 */
export async function notifyBackInStock(productId: string): Promise<number> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, stock: true, active: true },
  });
  if (!product || !product.active || product.stock <= 0) return 0;

  const waiting = await prisma.stockAlert.findMany({ where: { productId, notifiedAt: null }, take: 500 });
  if (waiting.length === 0) return 0;

  // Claim the rows first so two restocks in quick succession can't double-send.
  const claimed = await prisma.stockAlert.updateMany({
    where: { id: { in: waiting.map((w) => w.id) }, notifiedAt: null },
    data: { notifiedAt: new Date() },
  });
  if (claimed.count === 0) return 0;

  const { subject, html } = backInStockEmail({
    productName: product.name,
    productUrl: absoluteUrl(productPath(product.id)),
  });
  for (const alert of waiting) {
    await sendEmail({ to: alert.email, subject, html });
  }
  return waiting.length;
}
