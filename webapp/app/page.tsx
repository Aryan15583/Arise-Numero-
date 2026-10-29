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
import { PRODUCT_TYPES } from "@/lib/product-types";
import { Icon } from "@/components/Icon";

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
  const [featured, storeRating, testimonials, typeRows] = await Promise.all([
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
    // One tile per product type that has products, using its first product's photo.
    prisma.product.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      select: { productType: true, imageUrl: true },
    }),
  ]);
  const typeTiles = PRODUCT_TYPES.map((t) => {
    const rows = typeRows.filter((r) => r.productType === t.slug);
    return { ...t, count: rows.length, image: rows.find((r) => r.imageUrl)?.imageUrl || "/assets/placeholder.svg" };
  }).filter((t) => t.count > 0);
  const products = featured.map(serializeProduct);

  return (
    <>
      <JsonLd data={siteJsonLd} />
      <Header />
      <main id="main-content">
        <section className="hero hero--split" aria-labelledby="hero-heading">
          <div className="hero-bg" aria-hidden="true"></div>
          <div className="container hero-split">
            <div className="hero-content">
              <p className="eyebrow eyebrow--light">Natural crystals · Numerology</p>
              <h1 id="hero-heading" className="hero-title">
                Wear the Universe.
                <br />
                <span className="accent">Know Your Numbers.</span>
              </h1>
              <p className="hero-subtitle">
                Authentic crystals, gemstone jewellery &amp; personalised numerology readings, chosen by hand and delivered worldwide.
              </p>
              <div className="hero-cta-group">
                <Link href="/shop" className="btn btn-primary btn-lg">
                  Shop the Collection <Icon name="arrowRight" size={18} />
                </Link>
                <Link href="/numerology" className="btn btn-outline btn-outline--light btn-lg">
                  Free Reading
                </Link>
              </div>
              <ul className="hero-trust" aria-label="Why shop with us">
                <li><Icon name="gem" size={16} /> Authentic stones</li>
                <li><Icon name="globe" size={16} /> Ships worldwide</li>
                <li><Icon name="returns" size={16} /> 14-day returns</li>
              </ul>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="hero-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/products/hero-still-life.jpg" alt="" width={1200} height={1350} fetchPriority="high" />
              </div>
            </div>
          </div>
        </section>

        <section className="trust-bar" aria-label="Shopping with Arise Numero">
          <div className="container trust-bar-inner">
            <div className="trust-item"><Icon name="lock" /><span>Secure checkout</span></div>
            <div className="trust-item"><Icon name="card" /><span>UPI, cards &amp; cash on delivery</span></div>
            <div className="trust-item"><Icon name="truck" /><span>Tracked worldwide shipping</span></div>
            <div className="trust-item"><Icon name="returns" /><span>14-day returns</span></div>
            {storeRating && (
              <div className="trust-item"><Icon name="star" /><span>{storeRating.rating.toFixed(1)}/5 from customers</span></div>
            )}
          </div>
        </section>

        <section data-reveal className="section shop-categories" aria-labelledby="categories-heading">
          <div className="container">
            <div className="section-header">
              <p className="eyebrow">The Collection</p>
              <h2 id="categories-heading" className="section-title">Shop by Category</h2>
              <p className="section-subtitle">Bracelets, pendants, rings, crystal pencils and more — all natural stones</p>
            </div>
            <div className="category-tiles" role="list">
              {typeTiles.map((t) => (
                <Link key={t.slug} href={`/shop?type=${t.slug}`} className="category-tile" role="listitem">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.image} alt="" loading="lazy" width={300} height={300} />
                  <span className="category-tile-body">
                    <span className="category-tile-name">{t.name}</span>
                    <span className="category-tile-count">
                      {t.count} piece{t.count === 1 ? "" : "s"} <Icon name="arrowRight" size={14} />
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {products.length > 0 && (
          <section data-reveal className="section featured-products" aria-labelledby="featured-heading">
            <div className="container">
              <div className="section-header">
                <p className="eyebrow">Curated</p>
              <h2 id="featured-heading" className="section-title">Featured Pieces</h2>
                <p className="section-subtitle">Each piece is handcrafted with authentic gemstones and natural variations</p>
              </div>
              <div className="product-grid" role="list" aria-label="Featured products">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <div className="section-cta">
                <Link href="/shop" className="btn btn-outline btn-lg" aria-label="View all products in the shop">
                  View All Products
                </Link>
              </div>
            </div>
          </section>
        )}

        <section data-reveal className="section numerology-teaser" aria-labelledby="numerology-heading">
          <div className="container numerology-teaser-inner">
            <div className="numerology-text">
              <p className="eyebrow eyebrow--light">Free tool</p>
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

        <section data-reveal className="section why-us" aria-labelledby="why-heading">
          <div className="container">
            <div className="section-header">
              <p className="eyebrow">Our promise</p>
              <h2 id="why-heading" className="section-title">Why Choose Arise Numero</h2>
            </div>
            <div className="features-grid" role="list">
              <div className="feature-card" role="listitem">
                <span className="feature-icon"><Icon name="gem" size={26} /></span>
                <h3>100% Authentic Crystals</h3>
                <p>Every piece uses genuine natural gemstones, ethically sourced with natural colour and texture variations.</p>
              </div>
              <div className="feature-card" role="listitem">
                <span className="feature-icon"><Icon name="globe" size={26} /></span>
                <h3>Ships to 50+ Countries</h3>
                <p>International shipping with full customs/duties transparency. Tracked parcels to your door.</p>
              </div>
              <div className="feature-card" role="listitem">
                <span className="feature-icon"><Icon name="returns" size={26} /></span>
                <h3>14-Day Return Policy</h3>
                <p>Compliant with EU Distance Selling Directive. No-questions return window on non-customised orders.</p>
              </div>
              <div className="feature-card" role="listitem">
                <span className="feature-icon"><Icon name="lock" size={26} /></span>
                <h3>Secure Payments</h3>
                <p>We never store your card data on our servers. Cash on delivery and bank transfer also available.</p>
              </div>
            </div>
          </div>
        </section>

        {testimonials.length > 0 && (
          <section data-reveal className="section testimonials" aria-labelledby="testimonials-heading">
            <div className="container">
              <div className="section-header">
                <p className="eyebrow">Kind words</p>
                <h2 id="testimonials-heading" className="section-title">What Our Customers Say</h2>
              </div>
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
