import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { absoluteUrl, productPath } from "@/lib/seo";

// Built from the live catalogue on each request (not at build time), so a
// product added or hidden in the admin panel shows up without a redeploy.
export const dynamic = "force-dynamic";

const STATIC_PAGES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/shop", priority: 0.9, changeFrequency: "daily" },
  { path: "/numerology", priority: 0.7, changeFrequency: "monthly" },
  { path: "/booking", priority: 0.7, changeFrequency: "monthly" },
  { path: "/about", priority: 0.5, changeFrequency: "yearly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.5, changeFrequency: "yearly" },
  { path: "/returns", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, select: { id: true, updatedAt: true }, orderBy: { sortOrder: "asc" } }),
    prisma.category.findMany({ where: { active: true }, select: { slug: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return [
    ...STATIC_PAGES.map((p) => ({
      url: absoluteUrl(p.path),
      changeFrequency: p.changeFrequency,
      priority: p.priority,
    })),
    ...categories.map((c) => ({
      url: absoluteUrl(`/shop?cat=${encodeURIComponent(c.slug)}`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: absoluteUrl(productPath(p.id)),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
