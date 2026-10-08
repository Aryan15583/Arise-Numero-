import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

type Db = Prisma.TransactionClient | typeof prisma;

// A product's `rating` / `reviewCount` are a cache of its *approved* customer
// reviews — never typed in by hand. Call this whenever a review is approved,
// un-approved or deleted so cards, the product page and "Top Rated" sorting
// always show real numbers.
export async function refreshProductRating(productId: string, db: Db = prisma) {
  const stats = await db.review.aggregate({
    where: { productId, status: "approved" },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const reviewCount = stats._count.rating;
  const rating = reviewCount > 0 && stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : 0;
  await db.product.update({ where: { id: productId }, data: { rating, reviewCount } });
  return { rating, reviewCount };
}

// Store-wide average over every approved review (home/about page badges).
// Returns null when there are no approved reviews yet, so callers can hide
// the badge instead of showing an invented number.
export async function getStoreRating() {
  const stats = await prisma.review.aggregate({
    where: { status: "approved", product: { active: true } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  if (!stats._count.rating || !stats._avg.rating) return null;
  return { rating: Math.round(stats._avg.rating * 10) / 10, reviewCount: stats._count.rating };
}
