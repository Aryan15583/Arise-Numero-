import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms of Service",
  description:
    "Arise Numero Terms of Service — the rules and conditions governing use of our website, purchase of products, and numerology reading services.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <Header />
      <main id="main-content">
        <nav className="breadcrumb container" aria-label="Breadcrumb">
          <ol role="list"><li><Link href="/">Home</Link></li><li aria-current="page">Terms of Service</li></ol>
        </nav>

        <div className="container legal-page">
          <aside className="legal-toc" aria-labelledby="toc-heading">
            <h2 id="toc-heading" className="toc-title">Contents</h2>
            <nav aria-label="Terms sections">
              <ol className="toc-list" role="list">
                <li><a href="#acceptance">1. Acceptance of Terms</a></li>
                <li><a href="#products">2. Products &amp; Services</a></li>
                <li><a href="#numerology-terms">3. Numerology Services</a></li>
                <li><a href="#orders">4. Orders &amp; Pricing</a></li>
                <li><a href="#payment-terms">5. Payment</a></li>
                <li><a href="#shipping-terms">6. Shipping &amp; Delivery</a></li>
                <li><a href="#returns-terms">7. Returns &amp; Refunds</a></li>
                <li><a href="#ip">8. Intellectual Property</a></li>
                <li><a href="#liability">9. Limitation of Liability</a></li>
                <li><a href="#governing">10. Governing Law</a></li>
                <li><a href="#contact-terms">11. Contact</a></li>
              </ol>
            </nav>
          </aside>

          <article className="legal-content" aria-labelledby="terms-heading">
            <header className="legal-header">
              <h1 id="terms-heading" className="legal-title">Terms of Service</h1>
              <p className="legal-meta">Last updated: <time dateTime="2025-01-01">1 January 2025</time></p>
            </header>

            <p>Please read these Terms of Service carefully before using the Arise Numero website or placing an order. By accessing our website or purchasing our products or services, you agree to be bound by these Terms.</p>

            <section id="acceptance"><h2>1. Acceptance of Terms</h2>
              <p>By using our website, you confirm that you are at least 18 years of age (or the legal age of majority in your jurisdiction) and agree to these Terms and our <Link href="/privacy">Privacy Policy</Link>.</p>
            </section>

            <section id="products"><h2>2. Products &amp; Services</h2>
              <p>Arise Numero offers handcrafted crystal bracelets made with authentic gemstones, plus a free numerology calculator and paid personalised readings. Product images are representative; colour, texture, and pattern may vary from the images shown as natural characteristics of authentic crystals, not defects.</p>
            </section>

            <section id="numerology-terms"><h2>3. Numerology Services — Important Disclaimer</h2>
              <div className="legal-disclaimer-box" role="note">
                <p><strong>IMPORTANT:</strong> All numerology readings provided by Arise Numero, whether free or paid, are intended for <strong>entertainment and self-insight purposes only</strong>. They do not constitute legal, financial, medical, psychological, or any other form of professional advice.</p>
                <p>By purchasing or using a numerology reading, you acknowledge that you will not make significant life decisions based solely on the reading and will seek appropriately qualified professionals for legal, medical, financial, or psychological matters.</p>
              </div>
            </section>

            <section id="orders"><h2>4. Orders &amp; Pricing</h2>
              <p>All prices are displayed in your selected currency and are subject to change without notice. We reserve the right to cancel or refuse any order at our discretion. An order confirmation email constitutes acceptance of your order.</p>
            </section>

            <section id="payment-terms"><h2>5. Payment</h2>
              <p>We do not collect card numbers on this site. Orders can be paid by Cash on Delivery, Bank Transfer, or PayPal where configured. By placing an order you confirm you are authorised to use the payment method selected.</p>
            </section>

            <section id="shipping-terms"><h2>6. Shipping &amp; Delivery</h2>
              <p>Estimated delivery times are provided in good faith but are not guaranteed. International orders may be subject to import duties or taxes levied by the destination country, which are the buyer&apos;s sole responsibility. See our full <Link href="/returns#shipping">Shipping Policy</Link>.</p>
            </section>

            <section id="returns-terms"><h2>7. Returns &amp; Refunds</h2>
              <p>We offer a 14-day return window on non-customised physical products from the date of delivery. Numerology readings are non-refundable once delivered, as they are personalised digital services. See our full <Link href="/returns">Returns Policy</Link>.</p>
            </section>

            <section id="ip"><h2>8. Intellectual Property</h2>
              <p>All content on this website is the intellectual property of Arise Numero and is protected by applicable intellectual property laws.</p>
            </section>

            <section id="liability"><h2>9. Limitation of Liability</h2>
              <p>To the fullest extent permitted by applicable law, Arise Numero&apos;s total liability for any claim shall not exceed the amount you paid for the specific product or service giving rise to the claim.</p>
            </section>

            <section id="governing"><h2>10. Governing Law</h2>
              <p>These Terms are governed by the laws of India. Consumers in the EU or UK retain the benefit of mandatory protections under the laws of their country of residence.</p>
            </section>

            <section id="contact-terms"><h2>11. Contact</h2>
              <address>
                <strong>Arise Numero</strong><br />
                Email: <a href="mailto:hello@arisenumero.com">hello@arisenumero.com</a><br />
                Address: Mumbai, Maharashtra, India
              </address>
            </section>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
