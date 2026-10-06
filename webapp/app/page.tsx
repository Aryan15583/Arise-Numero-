import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { serializeProduct } from "@/lib/serialize";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { JsonLd } from "@/components/JsonLd";
import { DEFAULT_DESCRIPTION, SITE_NAME, absoluteUrl, getSiteUrl } from "@/lib/seo";
import { getSocialLinks } from "@/lib/social";
import { getStoreRating } from "@/lib/ratings";
import { starString } from "@/lib/stars";

const profileLinks = getSocialLinks().filter((s) => s.label !== "WhatsApp").map((s) => s.href);

export const metadata: Metadata = { alternates: { canonical: "/" } };

// Featured products, prices and stock badges come from the database, so a
// build-time snapshot would ignore every admin edit until the next deploy.
export const revalidate = 60;

const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${getSiteUrl()}/#organization`,
      name: SITE_NAME,
      url: getSiteUrl(),
      logo: absoluteUrl("/opengraph-image"),
      description: DEFAULT_DESCRIPTION,
      ...(profileLinks.length ? { sameAs: profileLinks } : {}),
    },
    {
      "@type": "WebSite",
      "@id": `${getSiteUrl()}/#website`,
      url: getSiteUrl(),
      name: SITE_NAME,
      publisher: { "@id": `${getSiteUrl()}/#organization` },
    },
  ],
};

export default async function HomePage() {
  const [featured, storeRating, testimonials] = await Promise.all([
    prisma.product.findMany({
      where: { active: true, featured: true },
      orderBy: { sortOrder: "asc" },
      take: 4,
    }),
    getStoreRating(),
    // Real, moderator-approved 4–5 star reviews — never invented quotes.
    prisma.review.findMany({
      where: { status: "approved", rating: { gte: 4 }, product: { active: true } },
      orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
      take: 3,
      include: { product: { select: { name: true } } },
    }),
  ]);
  const products = featured.map(serializeProduct);

  return (
    <>
      <JsonLd data={siteJsonLd} />
      <Header />
      <main id="main-content">
        <section className="hero" aria-labelledby="hero-heading">
          <div className="hero-bg" aria-hidden="true"></div>
          <div className="container hero-content">
            <div className="hero-badge" aria-label="New collection available">✦ New Collection Available</div>
            <h1 id="hero-heading" className="hero-title">
              Wear the Universe.
              <br />
              <span className="accent">Know Your Numbers.</span>
            </h1>
            <p className="hero-subtitle">
              Handcrafted authentic crystal bracelets &amp; personalized numerology readings delivered worldwide.
            </p>
            <div className="hero-cta-group">
              <Link href="/shop" className="btn btn-primary btn-lg" aria-label="Shop crystal bracelets">
                Shop Bracelets
              </Link>
              <Link href="/numerology" className="btn btn-outline btn-lg" aria-label="Try free numerology calculator">
                Free Reading
              </Link>
            </div>
            <div className="hero-trust" aria-label="Trust indicators">
              <span>🔒 Secure Checkout</span>
              <span>🌍 Ships Worldwide</span>
              <span>↩️ 14-Day Returns</span>
              <span>💎 Authentic Crystals</span>
            </div>
          </div>
        </section>

        <section className="trust-bar" aria-label="Trust and credibility indicators">
          <div className="container trust-bar-inner">
            <div className="trust-item"><span className="trust-icon" aria-hidden="true">🔐</span><span>SSL Secured</span></div>
            <div className="trust-item"><span className="trust-icon" aria-hidden="true">💳</span><span>Secure Payments</span></div>
            <div className="trust-item"><span className="trust-icon" aria-hidden="true">🌍</span><span>Worldwide Shipping</span></div>
            <div className="trust-item"><span className="trust-icon" aria-hidden="true">↩️</span><span>14-Day Returns</span></div>
            {storeRating && (
              <div className="trust-item"><span className="trust-icon" aria-hidden="true">⭐</span><span>{storeRating.rating}/5 Rating</span></div>
            )}
          </div>
        </section>

        <section className="section featured-products" aria-labelledby="featured-heading">
          <div className="container">
            <div className="section-header">
              <h2 id="featured-heading" className="section-title">Featured Bracelets</h2>
              <p className="section-subtitle">Each piece is handcrafted with authentic gemstones and natural variations</p>
            </div>
            <div className="product-grid" role="list" aria-label="Featured crystal bracelets">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <div className="section-cta">
              <Link href="/shop" className="btn btn-outline btn-lg" aria-label="View all crystal bracelets in the shop">
                View All Bracelets
              </Link>
            </div>
          </div>
        </section>

        <section className="section numerology-teaser" aria-labelledby="numerology-heading">
          <div className="container numerology-teaser-inner">
            <div className="numerology-text">
              <div className="section-badge">✦ Free Tool</div>
              <h2 id="numerology-heading" className="section-title">Discover Your Life Path Number</h2>
              <p>
                Enter your date of birth for an instant free reading. Uncover the numeric patterns that shape your
                personality, relationships, and life purpose.
              </p>
              <p className="disclaimer-inline">
                <em>For self-insight and entertainment purposes only. Not a substitute for professional advice.</em>
              </p>
              <Link href="/numerology" className="btn btn-primary btn-lg" aria-label="Try free numerology calculator">
                Try Free Calculator
              </Link>
            </div>
            <div className="numerology-widget-preview" aria-hidden="true">
              <div className="number-display">7</div>
              <p className="number-label">The Seeker</p>
            </div>
          </div>
        </section>

        <section className="section why-us" aria-labelledby="why-heading">
          <div className="container">
            <h2 id="why-heading" className="section-title text-center">Why Choose Arise Numero</h2>
            <div className="features-grid" role="list">
              <div className="feature-card" role="listitem">
                <span className="feature-icon" aria-hidden="true">💎</span>
                <h3>100% Authentic Crystals</h3>
                <p>Every bracelet uses certified genuine gemstones, ethically sourced with natural colour and texture variations.</p>
              </div>
              <div className="feature-card" role="listitem">
                <span className="feature-icon" aria-hidden="true">🌍</span>
                <h3>Ships to 50+ Countries</h3>
                <p>International shipping with full customs/duties transparency. Tracked parcels to your door.</p>
              </div>
              <div className="feature-card" role="listitem">
                <span className="feature-icon" aria-hidden="true">↩️</span>
                <h3>14-Day Return Policy</h3>
                <p>Compliant with EU Distance Selling Directive. No-questions return window on non-customised orders.</p>
              </div>
              <div className="feature-card" role="listitem">
                <span className="feature-icon" aria-hidden="true">🔐</span>
                <h3>Secure Payments</h3>
                <p>We never store your card data on our servers. Cash on delivery and bank transfer also available.</p>
              </div>
            </div>
          </div>
        </section>

        {testimonials.length > 0 && (
          <section className="section testimonials" aria-labelledby="testimonials-heading">
            <div className="container">
              <h2 id="testimonials-heading" className="section-title text-center">What Our Customers Say</h2>
              <div className="testimonial-grid" role="list">
                {testimonials.map((t) => (
                  <blockquote className="testimonial-card" role="listitem" key={t.id}>
                    <p>&ldquo;{t.comment}&rdquo;</p>
                    <footer>
                      <cite>— {t.authorName}, on {t.product.name}</cite>
                      <div className="testimonial-stars" aria-label={`${t.rating} stars`}>{starString(t.rating)}</div>
                    </footer>
                  </blockquote>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
