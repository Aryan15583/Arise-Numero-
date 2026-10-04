import type { MetadataRoute } from "next";
import { getSiteUrl, isIndexableSite } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // A local/dev URL means this isn't the real site — keep it out of search engines entirely.
  if (!isIndexableSite()) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/cart", "/checkout"] }],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
