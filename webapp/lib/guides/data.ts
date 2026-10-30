import { prisma } from "@/lib/db";
import { serializeProduct } from "@/lib/serialize";

/** Active products in the given stones, featured first. */
export async function getStoneProducts(stones: string[], limit = 8) {
  if (!stones.length) return [];
  const rows = await prisma.product.findMany({
    where: { active: true, category: { in: stones } },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
  });
  // Spread the picks across the stones instead of filling up with the first one.
  const byStone = stones.map((s) => rows.filter((r) => r.category === s));
  const picked: typeof rows = [];
  for (let i = 0; picked.length < Math.min(limit, rows.length); i++) {
    for (const list of byStone) if (list[i] && picked.length < limit) picked.push(list[i]);
  }
  return picked.map(serializeProduct);
}

/** One photo per stone (its first product with an image), for guide cards. */
export async function getStoneImages(): Promise<Record<string, string>> {
  const rows = await prisma.product.findMany({
    where: { active: true, category: { not: null }, imageUrl: { not: null } },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
    select: { category: true, imageUrl: true },
  });
  const out: Record<string, string> = {};
  for (const r of rows) if (r.category && r.imageUrl && !out[r.category]) out[r.category] = r.imageUrl;
  return out;
}
