import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Returns & Shipping Policy",
  description:
    "Arise Numero Returns and Shipping Policy — 14-day returns, international shipping rates, customs information and delivery times worldwide.",
  path: "/returns",
});

export default function ReturnsPage() {
  return (
    <>
      <Header />
      <main id="main-content">
        <nav className="breadcrumb container" aria-label="Breadcrumb">
          <ol role="list"><li><Link href="/">Home</Link></li><li aria-current="page">Returns &amp; Shipping</li></ol>
        </nav>

        <div className="container legal-page">
          <aside className="legal-toc" aria-labelledby="toc-heading">
            <h2 id="toc-heading" className="toc-title">Contents</h2>
            <nav aria-label="Policy sections">
              <ol className="toc-list" role="list">
                <li><a href="#returns-policy">1. Returns Policy</a></li>
                <li><a href="#how-to-return">2. How to Return</a></li>
                <li><a href="#refunds">3. Refunds</a></li>
                <li><a href="#non-returnable">4. Non-Returnable Items</a></li>
                <li><a href="#shipping">5. Shipping Information</a></li>
                <li><a href="#shipping-rates">6. Shipping Rates &amp; Times</a></li>
                <li><a href="#customs">7. Customs &amp; Import Duties</a></li>
                <li><a href="#lost-damaged">8. Lost or Damaged Orders</a></li>
                <li><a href="#contact-returns">9. Contact</a></li>
              </ol>
            </nav>
          </aside>

          <article className="legal-content" aria-labelledby="returns-heading">
            <header className="legal-header">
              <h1 id="returns-heading" className="legal-title">Returns &amp; Shipping Policy</h1>
              <p className="legal-meta">Last updated: <time dateTime="2025-01-01">1 January 2025</time></p>
            </header>

            <section id="returns-policy"><h2>1. Returns Policy</h2>
              <p>We want you to be completely satisfied with your purchase. We offer a <strong>14-day return window</strong> from the date of delivery on all eligible non-customised physical products.</p>
              <div className="policy-highlight" role="note">
                <strong>To be eligible for a return, items must be:</strong>
                <ul>
                  <li>Returned within 14 days of your delivery date</li>
                  <li>Unworn and in original condition</li>
                  <li>In their original packaging (Arise Numero gift box)</li>
                  <li>Not customised or personalised</li>
                </ul>
              </div>
              <p><strong>Natural variations</strong> in crystal colour, texture, or pattern are characteristics of authentic gemstones and do not qualify as defects.</p>
            </section>

            <section id="how-to-return"><h2>2. How to Return</h2>
              <ol className="numbered-list">
                <li><strong>Contact us</strong> within 14 days of delivery at <a href="mailto:returns@arisenumero.com">returns@arisenumero.com</a> with your order number and reason for return</li>
                <li><strong>Receive your return authorisation</strong> — we&apos;ll confirm your return is eligible and provide a return address</li>
                <li><strong>Pack securely</strong> — use the original packaging if possible</li>
                <li><strong>Ship the item</strong> — use a tracked shipping method</li>
                <li><strong>Confirmation &amp; refund</strong> — processed within 5–7 business days of receipt</li>
              </ol>
            </section>

            <section id="refunds"><h2>3. Refunds</h2>
              <p>Approved refunds are processed within <strong>5–7 business days</strong> of receiving the returned item, to the original payment method used at checkout. Original shipping costs are non-refundable unless the return is due to our error.</p>
            </section>

            <section id="non-returnable"><h2>4. Non-Returnable Items</h2>
              <ul>
                <li>Customised or personalised bracelets</li>
                <li>Numerology readings once delivered (digital personalised service)</li>
                <li>Items returned after the 14-day window</li>
              </ul>
            </section>

            <section id="shipping"><h2>5. Shipping Information</h2>
              <p>We ship worldwide from Mumbai, India. Orders are processed and dispatched within 1–3 business days of confirmed payment.</p>
            </section>

            <section id="shipping-rates"><h2>6. Shipping Rates &amp; Estimated Delivery Times</h2>
              <table className="legal-table" aria-label="Shipping rates and delivery times by region">
                <thead><tr><th>Region</th><th>Estimated Delivery</th><th>Standard Shipping</th><th>Free Shipping Threshold</th></tr></thead>
                <tbody>
                  <tr><td>India</td><td>5–10 business days</td><td>₹150</td><td>Free on orders over ₹2,000</td></tr>
                  <tr><td>USA &amp; Canada</td><td>7–14 business days</td><td>$5.99</td><td>Free on orders over $50</td></tr>
                  <tr><td>United Kingdom</td><td>10–16 business days</td><td>£5.99</td><td>Free on orders over £40</td></tr>
                  <tr><td>European Union</td><td>10–18 business days</td><td>€6.99</td><td>Free on orders over €45</td></tr>
                  <tr><td>Australia &amp; New Zealand</td><td>12–20 business days</td><td>A$9.99</td><td>Free on orders over A$60</td></tr>
                  <tr><td>Rest of World</td><td>14–25 business days</td><td>$9.99</td><td>Free on orders over $70</td></tr>
                </tbody>
              </table>
              <p className="info-note">Express shipping is available at checkout for an additional cost.</p>
            </section>

            <section id="customs"><h2>7. Customs &amp; Import Duties</h2>
              <div className="policy-highlight" role="note">
                <p><strong>International buyers please note:</strong> Your order may be subject to import duties, customs taxes, or processing fees levied by your country&apos;s customs authority. These charges are <strong>the buyer&apos;s sole responsibility</strong>.</p>
              </div>
              <p>We mark all parcels with accurate customs values as required by law.</p>
            </section>

            <section id="lost-damaged"><h2>8. Lost or Damaged Orders</h2>
              <p>If your order arrives damaged, please photograph the damage immediately and contact us at <a href="mailto:hello@arisenumero.com">hello@arisenumero.com</a> within 48 hours of delivery. We will arrange a replacement or full refund.</p>
            </section>

            <section id="contact-returns"><h2>9. Contact</h2>
              <address>
                <strong>Arise Numero — Returns &amp; Shipping</strong><br />
                Email: <a href="mailto:returns@arisenumero.com">returns@arisenumero.com</a><br />
                General enquiries: <a href="mailto:hello@arisenumero.com">hello@arisenumero.com</a>
              </address>
            </section>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
