import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { Icon } from "@/components/Icon";
import { ProductCard } from "@/components/ProductCard";
import { GuideDisclaimer } from "@/components/guides/GuideDisclaimer";
import { MUKHI_GUIDES, RUDRAKSHA_PATH } from "@/lib/guides/rudraksha";
import { prisma } from "@/lib/db";
import { serializeProduct } from "@/lib/serialize";
import { SITE_NAME, absoluteUrl, breadcrumbJsonLd, pageMetadata, productPath } from "@/lib/seo";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Rudraksha Guide: 1 to 14 Mukhi Meanings & Benefits",
  description:
    "What each Rudraksha mukhi means, from 1 to 14 Mukhi: ruling deity, planet and traditional benefits, plus how to wear, energise and care for your Rudraksha.",
  path: RUDRAKSHA_PATH,
});

export default async function RudrakshaGuidePage() {
  const rows = await prisma.product.findMany({
    where: { active: true, productType: { in: ["rudraksha", "certificates"] } },
    orderBy: [{ productType: "desc" }, { sortOrder: "asc" }],
  });
  const products = rows.map(serializeProduct);
  const inStock = new Set(rows.filter((r) => r.productType === "rudraksha").map((r) => r.id));

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Rudraksha Guide: 1 to 14 Mukhi Meanings & Benefits",
    url: absoluteUrl(RUDRAKSHA_PATH),
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: absoluteUrl("/assets/brand/icon-512.png") } },
  };

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Guides", path: "/guides" }, { name: "Rudraksha", path: RUDRAKSHA_PATH }])} />
      <Header />
      <main id="main-content">
        <nav className="breadcrumb container" aria-label="Breadcrumb">
          <ol role="list">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/guides">Guides</Link></li>
            <li aria-current="page">Rudraksha</li>
          </ol>
        </nav>

        <section className="guide-hero guide-hero--rudraksha" aria-labelledby="rudraksha-heading">
          <div className="container guide-hero-inner guide-hero-inner--single">
            <div className="guide-hero-text">
              <p className="eyebrow eyebrow--light">Sacred Beads</p>
              <h1 id="rudraksha-heading" className="guide-title">Rudraksha Guide: <em>Mukhi Meanings</em></h1>
              <p className="guide-lead">
                Rudraksha beads are the dried seeds of the Elaeocarpus tree, revered in Hindu tradition as the tears of
                Lord Shiva. Each bead has natural lines, or mukhis, on its surface, and the number of mukhis is
                traditionally believed to give it its own deity, planet and energy.
              </p>
              <div className="guide-hero-actions">
                <a href="#shop-rudraksha" className="btn btn-primary btn-lg">Shop Rudraksha</a>
                <a href="#mukhi-meanings" className="btn btn-outline btn-outline--light btn-lg">Find Your Mukhi</a>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="mukhi-meanings" aria-labelledby="mukhi-heading">
          <div className="container">
            <div className="section-header">
              <p className="eyebrow">1 to 14 Mukhi</p>
              <h2 id="mukhi-heading" className="section-title">What each mukhi means</h2>
              <p className="section-subtitle">The traditional associations of each Rudraksha, as described in Vedic texts and practice.</p>
            </div>
            <div className="mukhi-grid" role="list">
              {MUKHI_GUIDES.map((m) => {
                const available = m.productId && inStock.has(m.productId);
                return (
                  <article key={m.mukhi} className={`mukhi-card ${available ? "mukhi-card--available" : ""}`} role="listitem">
                    <div className="mukhi-card-head">
                      <span className="mukhi-num">{m.mukhi}</span>
                      <div>
                        <h3>{m.mukhi} Mukhi Rudraksha</h3>
                        <p className="mukhi-meta">{m.deity} · {m.planet}</p>
                      </div>
                    </div>
                    <p>{m.meaning}</p>
                    {available ? (
                      <Link href={productPath(m.productId!)} className="mukhi-link">
                        <Icon name="bag" size={16} /> In stock: shop now
                      </Link>
                    ) : (
                      <Link href="/contact" className="mukhi-link mukhi-link--muted">Ask about availability</Link>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section guide-cleanse" aria-label="Wearing Rudraksha">
          <div className="container guide-two-col">
            <div className="guide-panel">
              <h2>How to wear Rudraksha</h2>
              <ul className="guide-check-list">
                <li><Icon name="check" size={18} /> Traditionally first worn on a Monday, Lord Shiva&apos;s day, after a morning bath.</li>
                <li><Icon name="check" size={18} /> Hold it in your palm and chant <em>Om Namah Shivaya</em> 108 times to energise it.</li>
                <li><Icon name="check" size={18} /> Wear it on a red or black thread, or set in silver or gold, so it touches the skin.</li>
                <li><Icon name="check" size={18} /> Many people remove it while sleeping and keep it in a clean, sacred place.</li>
              </ul>
            </div>
            <div className="guide-panel">
              <h2>Caring for your bead</h2>
              <ul className="guide-check-list">
                <li><Icon name="check" size={18} /> Rinse it occasionally in clean water and let it dry naturally.</li>
                <li><Icon name="check" size={18} /> Every few months, apply a little sandalwood or mustard oil to keep it from drying out.</li>
                <li><Icon name="check" size={18} /> Keep it away from soap, perfume and chemicals.</li>
                <li><Icon name="check" size={18} /> Re-energise it with the mantra whenever it feels dull.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="genuine-heading">
          <div className="container guide-band-light">
            <div>
              <p className="eyebrow">Buy with confidence</p>
              <h2 id="genuine-heading" className="section-title">How to tell a genuine Rudraksha</h2>
              <p>
                Natural mukhis run clearly from top to bottom, and the bead should feel solid and dense. Because rarer
                mukhis are often imitated, the most reliable reassurance is a lab certificate of authenticity. Every
                Rudraksha we sell is natural, and you can add a certificate to your order.
              </p>
            </div>
            <Link href="/shop?type=certificates" className="btn btn-outline btn-lg">View Certificates</Link>
          </div>
        </section>

        {products.length > 0 && (
          <section className="section" id="shop-rudraksha" aria-labelledby="shop-rudraksha-heading">
            <div className="container">
              <div className="section-header">
                <p className="eyebrow">Shop</p>
                <h2 id="shop-rudraksha-heading" className="section-title">Natural Rudraksha</h2>
              </div>
              <div className="product-grid" role="list">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          </section>
        )}

        <section className="section guide-band" aria-labelledby="rud-reading-heading">
          <div className="container guide-band-inner">
            <div>
              <p className="eyebrow eyebrow--light">Personal guidance</p>
              <h2 id="rud-reading-heading" className="section-title">Pair your Rudraksha with your numbers</h2>
              <p>Discover your Life Path free, or book a personal numerology reading to understand your full chart and the year ahead.</p>
            </div>
            <div className="guide-band-actions">
              <Link href="/numerology" className="btn btn-primary btn-lg">Free Calculator</Link>
              <Link href="/booking" className="btn btn-outline btn-outline--light btn-lg">See Reading Plans</Link>
            </div>
          </div>
        </section>

        <GuideDisclaimer>
          Rudraksha meanings are shared from spiritual and religious tradition for interest. They are not medical
          claims and are not a substitute for professional advice.
        </GuideDisclaimer>
      </main>
      <Footer />
    </>
  );
}
