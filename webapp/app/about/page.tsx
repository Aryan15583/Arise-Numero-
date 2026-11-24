import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { pageMetadata } from "@/lib/seo";
import { getStoreRating } from "@/lib/ratings";
import { Icon } from "@/components/Icon";

// The average-rating stat comes from approved reviews in the database.
export const revalidate = 60;

export const metadata = pageMetadata({
  title: "About Us",
  description:
    "About Arise Numero — our story, our commitment to authentic crystals, and our passion for numerology. Handcrafted jewelry and spiritual guidance delivered worldwide.",
  path: "/about",
});

export default async function AboutPage() {
  const storeRating = await getStoreRating();
  return (
    <>
      <Header />
      <main id="main-content">
        <nav className="breadcrumb container" aria-label="Breadcrumb">
          <ol role="list">
            <li><Link href="/">Home</Link></li>
            <li aria-current="page">About</li>
          </ol>
        </nav>

        <section className="page-hero" aria-labelledby="about-hero-heading">
          <div className="container">
            <p className="eyebrow">Our Story</p>
            <h1 id="about-hero-heading" className="page-title">Born from a Love of Crystals &amp; Numbers</h1>
            <p className="page-subtitle" style={{ marginInline: "auto" }}>
              Arise Numero was founded on the belief that beautiful, authentic gemstones and the ancient wisdom of
              numerology can help people connect more deeply with themselves.
            </p>
          </div>
        </section>

        <section className="section about-story" aria-labelledby="story-heading">
          <div className="container about-story-inner">
            <div className="about-story-img">
              <picture>
                <source type="image/webp" srcSet="/assets/about/crystal-collection-900.webp 900w, /assets/about/crystal-collection-1672.webp 1672w" sizes="(max-width: 1200px) 100vw, 1200px" />
                <img
                  src="/assets/about/crystal-collection-1672.jpg"
                  srcSet="/assets/about/crystal-collection-900.jpg 900w, /assets/about/crystal-collection-1672.jpg 1672w"
                  sizes="(max-width: 1200px) 100vw, 1200px"
                  alt="Amethyst, clear quartz, rose quartz and citrine points with polished gemstones and crystal bracelets, set before a numerology wheel"
                  width={1672}
                  height={941}
                  loading="lazy"
                />
              </picture>
            </div>
            <div className="about-story-text">
              <h2 id="story-heading" className="section-title">How Arise Numero Began</h2>
              <p>
                Arise Numero began with a simple idea: to bring together the tactile beauty of authentic crystals and
                the introspective depth of numerology, in a way that feels personal rather than mass-produced.
              </p>
              <p>
                We started with handcrafted gemstone bracelets and have grown into a small collection of crystal
                jewellery, rudraksha and gifts, alongside personal numerology readings. Every product we offer follows
                the same vision: accessible, authentic, and meaningful.
              </p>
              <p>
                We are not a mass-production factory. Every piece is chosen and checked by hand. Every numerology reading
                is written individually. We believe quality and intention matter — in the products we make and the
                services we offer.
              </p>
              <div className="about-stats" aria-label="Arise Numero at a glance">
                <div className="stat-item"><span className="stat-num">100%</span><span className="stat-label">Natural Gemstones</span></div>
                <div className="stat-item"><span className="stat-num">14-day</span><span className="stat-label">Easy Returns</span></div>
                <div className="stat-item"><span className="stat-num">Free</span><span className="stat-label">Numerology Calculator</span></div>
                {storeRating && (
                  <div className="stat-item"><span className="stat-num">{storeRating.rating.toFixed(1)}★</span><span className="stat-label">Average Rating</span></div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="section our-values" aria-labelledby="values-heading">
          <div className="container">
            <h2 id="values-heading" className="section-title text-center">What We Stand For</h2>
            <div className="values-grid" role="list">
              <div className="value-card" role="listitem">
                <div className="value-icon"><Icon name="gem" size={26} /></div>
                <h3>Authenticity</h3>
                <p>We sell only genuine, natural gemstones, and authenticity certificates are available. Natural colour variations are celebrated, not hidden.</p>
              </div>
              <div className="value-card" role="listitem">
                <div className="value-icon"><Icon name="leaf" size={26} /></div>
                <h3>Careful Sourcing</h3>
                <p>We buy from suppliers we know and trust, and check every piece by hand before it reaches you.</p>
              </div>
              <div className="value-card" role="listitem">
                <div className="value-icon"><Icon name="search" size={26} /></div>
                <h3>Transparency</h3>
                <p>Our readings are clearly labelled as entertainment and self-insight tools. We never make false claims.</p>
              </div>
              <div className="value-card" role="listitem">
                <div className="value-icon"><Icon name="globe" size={26} /></div>
                <h3>Worldwide Reach</h3>
                <p>We ship worldwide, show prices in your currency, and offer a free numerology calculator to every visitor.</p>
              </div>
              <div className="value-card" role="listitem">
                <div className="value-icon"><Icon name="lock" size={26} /></div>
                <h3>Privacy &amp; Security</h3>
                <p>We collect only the data we need, never sell it, and you can ask us to see, correct or delete it at any time.</p>
              </div>
              <div className="value-card" role="listitem">
                <div className="value-icon"><Icon name="accessibility" size={26} /></div>
                <h3>Inclusivity</h3>
                <p>We design our website to be easy for everyone to use, with readable contrast, keyboard navigation and screen-reader support.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section certifications" aria-labelledby="cert-heading">
          <div className="container">
            <div className="section-header">
              <p className="eyebrow">Peace of mind</p>
              <h2 id="cert-heading" className="section-title">Our Commitments</h2>
            </div>
            <div className="cert-grid" role="list">
              <div className="cert-item" role="listitem"><span className="cert-icon"><Icon name="lock" size={26} /></span><h3>SSL / TLS Encrypted</h3><p>All communication between your browser and our servers is encrypted via HTTPS.</p></div>
              <div className="cert-item" role="listitem"><span className="cert-icon"><Icon name="card" size={26} /></span><h3>Card Data Never Stored</h3><p>We don&apos;t collect raw card numbers on this site. Payments are handled by secure payment partners, or pay by Cash on Delivery or bank transfer.</p></div>
              <div className="cert-item" role="listitem"><span className="cert-icon"><Icon name="shield" size={26} /></span><h3>Your Data, Your Choice</h3><p>Optional cookies stay off until you allow them, and you can ask to see, correct or delete your data at any time.</p></div>
              <div className="cert-item" role="listitem"><span className="cert-icon"><Icon name="shield" size={26} /></span><h3>Never Sold</h3><p>We never sell your personal data. It is shared only with the services that deliver your order. See our <Link href="/privacy">Privacy Policy</Link>.</p></div>
              <div className="cert-item" role="listitem"><span className="cert-icon"><Icon name="accessibility" size={26} /></span><h3>Accessible Design</h3><p>Built with accessibility in mind: readable colours, keyboard navigation and screen-reader labels.</p></div>
              <div className="cert-item" role="listitem"><span className="cert-icon"><Icon name="returns" size={26} /></span><h3>14-Day Returns</h3><p>Return unworn, non-customised items within 14 days of delivery. See our <Link href="/returns">Returns Policy</Link>.</p></div>
            </div>
          </div>
        </section>

        <section className="section about-cta" aria-labelledby="about-cta-heading">
          <div className="container text-center">
            <h2 id="about-cta-heading" className="section-title">Ready to Explore?</h2>
            <p>Browse our crystals and gemstone jewellery, or discover your numerology blueprint with our free calculator.</p>
            <div className="hero-cta-group" style={{ justifyContent: "center" }}>
              <Link href="/shop" className="btn btn-primary btn-lg">Shop the Collection</Link>
              <Link href="/numerology" className="btn btn-outline btn-lg">Free Reading</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
