import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { NumerologyCalculator } from "@/components/NumerologyCalculator";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Free Numerology Calculator & Readings",
  description:
    "Free numerology calculator at Arise Numero. Discover your Life Path number, Expression number, and Soul Urge number. Book a personalized reading.",
  path: "/numerology",
});

export default function NumerologyPage() {
  return (
    <>
      <Header />
      <main id="main-content">
        <nav className="breadcrumb container" aria-label="Breadcrumb">
          <ol role="list">
            <li><Link href="/">Home</Link></li>
            <li aria-current="page">Numerology</li>
          </ol>
        </nav>

        <section className="page-hero numerology-hero" aria-labelledby="num-hero-heading">
          <div className="container">
            <div className="section-badge">✦ Free Tool</div>
            <h1 id="num-hero-heading" className="page-title">Numerology Calculator</h1>
            <p className="page-subtitle" style={{ marginInline: "auto" }}>
              Discover the numbers that shape your life. Enter your details for an instant free reading.
            </p>
            <div className="entertainment-disclaimer" role="note" style={{ textAlign: "left", marginInline: "auto", maxWidth: 640 }}>
              <span aria-hidden="true">ℹ️</span>
              <p>
                <strong>For entertainment &amp; self-insight purposes only.</strong> Numerology readings do not constitute
                legal, financial, medical, or professional psychological advice.
              </p>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="calc-heading">
          <div className="container">
            <h2 id="calc-heading" className="section-title text-center">Free Life Path Calculator</h2>
            <NumerologyCalculator />
          </div>
        </section>

        <section className="section how-it-works" id="how-it-works" aria-labelledby="how-heading">
          <div className="container">
            <h2 id="how-heading" className="section-title text-center">How Numerology Works</h2>
            <div className="how-grid" role="list">
              <div className="how-card" role="listitem">
                <div className="how-num" aria-hidden="true">1</div>
                <h3>Enter Your Details</h3>
                <p>Provide your full birth name and date of birth. These are the two core inputs used in all traditional numerological calculations.</p>
              </div>
              <div className="how-card" role="listitem">
                <div className="how-num" aria-hidden="true">2</div>
                <h3>Numbers Are Calculated</h3>
                <p>Using the Pythagorean system, each letter and digit is assigned a numeric value and reduced to a single digit (or master number).</p>
              </div>
              <div className="how-card" role="listitem">
                <div className="how-num" aria-hidden="true">3</div>
                <h3>Meanings Are Revealed</h3>
                <p>Each number carries symbolic meaning across personality, relationships, career paths, and personal cycles.</p>
              </div>
              <div className="how-card" role="listitem">
                <div className="how-num" aria-hidden="true">4</div>
                <h3>Go Deeper</h3>
                <p>Book a personalised one-to-one reading for a comprehensive report covering all your core numbers with expert interpretation.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section readings-cta-section" aria-labelledby="readings-cta-heading">
          <div className="container readings-cta-inner">
            <div>
              <h2 id="readings-cta-heading" className="section-title">Personalised Numerology Readings</h2>
              <p>
                Go beyond the free calculator with a comprehensive, handcrafted report from our experienced numerologist.
                Includes all core numbers, personal year forecast, and compatibility insights.
              </p>
              <ul className="reading-includes">
                <li>✓ Full Core Numbers Report (20+ pages)</li>
                <li>✓ Personal Year &amp; Monthly Forecast</li>
                <li>✓ Relationship Compatibility Overview</li>
                <li>✓ Career &amp; Life Purpose Guidance</li>
                <li>✓ Delivered within 3–5 business days</li>
              </ul>
              <div className="reading-price-note">From <strong className="reading-price">$49.99</strong></div>
              <Link href="/booking" className="btn btn-primary btn-lg">Book a Reading →</Link>
            </div>
            <div className="readings-cta-visual" aria-hidden="true">
              <div className="number-display">11</div>
              <p className="number-label">Master Number</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
