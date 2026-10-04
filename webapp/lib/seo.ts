import type { Metadata } from "next";

export const SITE_NAME = "Arise Numero";
export const SITE_TAGLINE = "Authentic Crystal Bracelets & Numerology Readings";
export const DEFAULT_DESCRIPTION =
  "Handcrafted crystal bracelets made with real gemstones — amethyst, rose quartz, lapis lazuli and more — plus personalised numerology readings. Ships worldwide.";

/** Canonical origin of the site, no trailing slash. Set NEXT_PUBLIC_SITE_URL in production. */
export function getSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").trim();
  return raw.replace(/\/+$/, "");
}

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * False while the configured site URL is a local address, so a dev/preview
 * build can never get itself indexed by accident. A real domain (staging
 * included) is treated as indexable — set NEXT_PUBLIC_SITE_URL to opt in.
 */
export function isIndexableSite(): boolean {
  try {
    const host = new URL(getSiteUrl()).hostname;
    const local = host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1" || host.endsWith(".localhost");
    return !local;
  } catch {
    return false;
  }
}

export function productPath(id: string): string {
  return `/product/${encodeURIComponent(id)}`;
}

/** Collapse whitespace and cut at a word boundary — for meta descriptions (~155 chars). */
export function truncate(text: string | null | undefined, max = 155): string {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:—-]+$/, "")}…`;
}

/**
 * Serialises JSON-LD for inlining in a <script> tag. Escaping "<" stops
 * admin-entered text (product names/descriptions) from ever closing the tag
 * early and injecting markup.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME} — ${SITE_TAGLINE}` };

/**
 * Per-page metadata: title (the root layout template appends " — Arise
 * Numero"), description, canonical URL, and matching Open Graph/Twitter tags.
 * Next replaces — not merges — nested openGraph/twitter objects, so each page
 * has to restate them or social previews would lose their title/image.
 */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  image?: { url: string; width?: number; height?: number; alt?: string };
}): Metadata {
  const { title, description, path, noindex, image = OG_IMAGE } = opts;
  const socialTitle = `${title} — ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      title: socialTitle,
      description,
      url: path,
      images: [image],
    },
    twitter: { card: "summary_large_image", title: socialTitle, description, images: [image.url] },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
