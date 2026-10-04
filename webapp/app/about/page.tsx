import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About Us",
  description:
    "About Arise Numero — our story, our commitment to authentic crystals, and our passion for numerology. Handcrafted jewelry and spiritual guidance delivered worldwide.",
  path: "/about",
});

export default function AboutPage() {
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
            <div className="section-badge">✦ Our Story</div>
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/about-founder.svg" alt="Arise Numero founder handcrafting a crystal bracelet" width={500} height={600} loading="lazy" />
            </div>
            <div className="about-story-text">
              <h2 id="story-heading" className="section-title">How Arise Numero Began</h2>
              <p>
                Arise Numero was born in 2019 out of a small workshop and a large passion. Our founder, having spent
                years studying gemology and numerology across India and Southeast Asia, wanted to create something
                that combined the tactile beauty of authentic crystals with the introspective depth of numerical
                wisdom.
              </p>
              <p>
                What started as handcrafted bracelets gifted to friends and family quickly grew into an international
                brand trusted by customers in over 50 countries. Every product we sell is a continuation of that
                original vision: accessible, authentic, and meaningful.
              </p>
              <p>
                We are not a mass-production factory. Every bracelet is assembled by hand. Every numerology reading
                is written individually. We believe quality and intention matter — in the products we make and the
                services we offer.
              </p>
              <div className="about-stats" aria-label="Arise Numero by the numbers">
                <div className="stat-item"><span className="stat-num">50+</span><span className="stat-label">Countries Served</span></div>
                <div className="stat-item"><span className="stat-num">12k+</span><span className="stat-label">Happy Customers</span></div>
                <div className="stat-item"><span className="stat-num">100%</span><span className="stat-label">Authentic Crystals</span></div>
                <div className="stat-item"><span className="stat-num">4.9★</span><span className="stat-label">Average Rating</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section our-values" aria-labelledby="values-heading">
          <div className="container">
            <h2 id="values-heading" className="section-title text-center">What We Stand For</h2>
            <div className="values-grid" role="list">
              <div className="value-card" role="listitem">
                <div className="value-icon" aria-hidden="true">💎</div>
                <h3>Authenticity</h3>
                <p>We source only genuine, certified gemstones. Natural colour variations are celebrated, not hidden.</p>
              </div>
              <div className="value-card" role="listitem">
                <div className="value-icon" aria-hidden="true">🌱</div>
                <h3>Ethical Sourcing</h3>
                <p>We work exclusively with suppliers who adhere to fair labour practices and responsible mining standards.</p>
              </div>
              <div className="value-card" role="listitem">
                <div className="value-icon" aria-hidden="true">🔍</div>
                <h3>Transparency</h3>
                <p>Our readings are clearly labelled as entertainment and self-insight tools. We never make false claims.</p>
              </div>
              <div className="value-card" role="listitem">
                <div className="value-icon" aria-hidden="true">🌍</div>
                <h3>Accessibility</h3>
                <p>We ship to 50+ countries, support multiple currencies, and offer a free numerology calculator to all visitors.</p>
              </div>
              <div className="value-card" role="listitem">
                <div className="value-icon" aria-hidden="true">🔒</div>
                <h3>Privacy &amp; Security</h3>
                <p>We handle your personal data with the highest care, complying with GDPR, CCPA, and international standards.</p>
              </div>
              <div className="value-card" role="listitem">
                <div className="value-icon" aria-hidden="true">♿</div>
                <h3>Inclusivity</h3>
                <p>Our website is built to WCAG 2.1 AA accessibility standards — everyone can shop and explore with ease.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section meet-team" aria-labelledby="team-heading">
          <div className="container">
            <h2 id="team-heading" className="section-title text-center">Meet the Team</h2>
            <div className="team-grid" role="list">
              <article className="team-card" role="listitem">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/team-founder.svg" alt="Portrait of Arise Numero founder" className="team-img" width={200} height={200} loading="lazy" />
                <h3 className="team-name">Ananya Rao</h3>
                <p className="team-role">Founder &amp; Lead Artisan</p>
                <p className="team-bio">Gemologist, crystal artisan, and numerology practitioner with 12 years of experience.</p>
              </article>
              <article className="team-card" role="listitem">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/team-numerologist.svg" alt="Portrait of Arise Numero lead numerologist" className="team-img" width={200} height={200} loading="lazy" />
                <h3 className="team-name">Riya Sharma</h3>
                <p className="team-role">Lead Numerologist</p>
                <p className="team-bio">Certified numerologist with over 8 years of practice, specialising in life path forecasts.</p>
              </article>
              <article className="team-card" role="listitem">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/team-ops.svg" alt="Portrait of Arise Numero operations manager" className="team-img" width={200} height={200} loading="lazy" />
                <h3 className="team-name">Kiran Mehta</h3>
                <p className="team-role">Operations &amp; Customer Care</p>
                <p className="team-bio">Ensures every order ships on time and every customer query is resolved with care.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section certifications" aria-labelledby="cert-heading">
          <div className="container">
            <h2 id="cert-heading" className="section-title text-center">Our Commitments</h2>
            <div className="cert-grid" role="list">
              <div className="cert-item" role="listitem"><span className="cert-icon" aria-hidden="true">🔐</span><h3>SSL / TLS Encrypted</h3><p>All communication between your browser and our servers is encrypted via HTTPS.</p></div>
              <div className="cert-item" role="listitem"><span className="cert-icon" aria-hidden="true">💳</span><h3>Card Data Never Stored</h3><p>We don&apos;t collect raw card numbers on this site. Pay by Cash on Delivery, Bank Transfer, or PayPal.</p></div>
              <div className="cert-item" role="listitem"><span className="cert-icon" aria-hidden="true">🇪🇺</span><h3>GDPR Compliant</h3><p>We meet European Union data protection standards. Cookie consent, data access rights, and full transparency.</p></div>
              <div className="cert-item" role="listitem"><span className="cert-icon" aria-hidden="true">🇺🇸</span><h3>CCPA Compliant</h3><p>California residents can request, delete, or opt out of data sale at any time.</p></div>
              <div className="cert-item" role="listitem"><span className="cert-icon" aria-hidden="true">♿</span><h3>WCAG 2.1 AA</h3><p>Designed to meet Web Content Accessibility Guidelines 2.1 Level AA.</p></div>
              <div className="cert-item" role="listitem"><span className="cert-icon" aria-hidden="true">↩️</span><h3>EU Distance Selling</h3><p>14-day return window on non-customised products, in compliance with EU consumer law.</p></div>
            </div>
          </div>
        </section>

        <section className="section about-cta" aria-labelledby="about-cta-heading">
          <div className="container text-center">
            <h2 id="about-cta-heading" className="section-title">Ready to Explore?</h2>
            <p>Browse our crystal bracelet collection or discover your numerology blueprint with our free calculator.</p>
            <div className="hero-cta-group" style={{ justifyContent: "center" }}>
              <Link href="/shop" className="btn btn-primary btn-lg">Shop Bracelets</Link>
              <Link href="/numerology" className="btn btn-outline btn-lg">Free Reading</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
