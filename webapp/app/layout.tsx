import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { CookieBanner } from "@/components/CookieBanner";
import { Analytics } from "@/components/Analytics";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_TAGLINE, getSiteUrl, isIndexableSite } from "@/lib/seo";

const defaultTitle = `${SITE_NAME} — ${SITE_TAGLINE}`;
const indexable = isIndexableSite();

// Optional: paste the codes Google Search Console / Bing Webmaster Tools give
// you into .env (see TODO.md) instead of editing code.
const verificationOther: Record<string, string> = {};
if (process.env.BING_SITE_VERIFICATION) verificationOther["msvalidate.01"] = process.env.BING_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: defaultTitle, template: `%s — ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "crystal bracelets",
    "gemstone bracelets",
    "amethyst bracelet",
    "rose quartz bracelet",
    "lapis lazuli bracelet",
    "numerology reading",
    "life path number calculator",
    "handcrafted jewellery",
  ],
  category: "shopping",
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    title: defaultTitle,
    description: DEFAULT_DESCRIPTION,
    url: "/",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: defaultTitle }],
  },
  twitter: { card: "summary_large_image", title: defaultTitle, description: DEFAULT_DESCRIPTION, images: ["/opengraph-image"] },
  robots: indexable
    ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } }
    : { index: false, follow: false },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: Object.keys(verificationOther).length ? verificationOther : undefined,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f1eb" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1228" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="auto" data-scroll-behavior="smooth">
      <body>
        <Providers>
          <CookieBanner />
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
