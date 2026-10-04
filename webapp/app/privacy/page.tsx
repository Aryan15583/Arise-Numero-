import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "Arise Numero Privacy Policy — how we collect, store, and protect your personal data. GDPR and CCPA compliant.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main id="main-content">
        <nav className="breadcrumb container" aria-label="Breadcrumb">
          <ol role="list"><li><Link href="/">Home</Link></li><li aria-current="page">Privacy Policy</li></ol>
        </nav>

        <div className="container legal-page">
          <aside className="legal-toc" aria-labelledby="toc-heading">
            <h2 id="toc-heading" className="toc-title">Contents</h2>
            <nav aria-label="Privacy policy sections">
              <ol className="toc-list" role="list">
                <li><a href="#who-we-are">1. Who We Are</a></li>
                <li><a href="#data-collected">2. Data We Collect</a></li>
                <li><a href="#how-used">3. How We Use Your Data</a></li>
                <li><a href="#legal-basis">4. Legal Basis (GDPR)</a></li>
                <li><a href="#data-sharing">5. Data Sharing</a></li>
                <li><a href="#cookies">6. Cookies</a></li>
                <li><a href="#data-retention">7. Data Retention</a></li>
                <li><a href="#your-rights">8. Your Rights</a></li>
                <li><a href="#ccpa">9. California Rights (CCPA)</a></li>
                <li><a href="#security">10. Security</a></li>
                <li><a href="#children">11. Children&apos;s Privacy</a></li>
                <li><a href="#changes">12. Changes to This Policy</a></li>
                <li><a href="#contact-privacy">13. Contact</a></li>
              </ol>
            </nav>
          </aside>

          <article className="legal-content" aria-labelledby="privacy-heading">
            <header className="legal-header">
              <h1 id="privacy-heading" className="legal-title">Privacy Policy</h1>
              <p className="legal-meta">Last updated: <time dateTime="2025-01-01">1 January 2025</time></p>
            </header>

            <p>This Privacy Policy explains how Arise Numero (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) collects, uses, stores, and protects your personal data when you visit our website or purchase our products and services. We comply with the EU General Data Protection Regulation (GDPR), the UK GDPR, and the California Consumer Privacy Act (CCPA).</p>

            <section id="who-we-are"><h2>1. Who We Are</h2>
              <p><strong>Data Controller:</strong> Arise Numero<br /><strong>Contact:</strong> <a href="mailto:privacy@arisenumero.com">privacy@arisenumero.com</a><br /><strong>Address:</strong> Mumbai, Maharashtra, India</p>
            </section>

            <section id="data-collected"><h2>2. Data We Collect</h2>
              <h3>2.1 Data You Provide Directly</h3>
              <ul>
                <li><strong>Purchase data:</strong> Name, email, shipping address, phone number, order details</li>
                <li><strong>Numerology data:</strong> Full birth name and date of birth, collected strictly to calculate your numeric blueprint</li>
                <li><strong>Communication data:</strong> Messages sent via our contact form</li>
                <li><strong>Marketing preferences:</strong> Whether you opt in to receive promotional emails</li>
              </ul>
              <h3>2.2 Data Collected Automatically</h3>
              <ul>
                <li><strong>Usage data:</strong> Pages visited, time on site, referring URLs</li>
                <li><strong>Technical data:</strong> IP address, browser type, device type, operating system</li>
              </ul>
            </section>

            <section id="how-used"><h2>3. How We Use Your Data</h2>
              <table className="legal-table" aria-label="How we use your data">
                <thead><tr><th>Purpose</th><th>Data Used</th></tr></thead>
                <tbody>
                  <tr><td>Processing and fulfilling your order</td><td>Name, address, email, phone, order details</td></tr>
                  <tr><td>Calculating your numerology reading</td><td>Full birth name, date of birth — used solely for this purpose</td></tr>
                  <tr><td>Customer support</td><td>Email, name, order details</td></tr>
                  <tr><td>Sending order confirmations and updates</td><td>Email address</td></tr>
                  <tr><td>Improving our website (analytics)</td><td>Usage data (only with cookie consent)</td></tr>
                  <tr><td>Legal and compliance obligations</td><td>As required by applicable law</td></tr>
                </tbody>
              </table>
            </section>

            <section id="legal-basis"><h2>4. Legal Basis for Processing (GDPR)</h2>
              <ul>
                <li><strong>Contract performance:</strong> Processing necessary to fulfil your order or service</li>
                <li><strong>Consent:</strong> Marketing emails and non-essential analytics cookies — you may withdraw consent at any time</li>
                <li><strong>Legitimate interests:</strong> Fraud prevention, site security, and improving our services</li>
                <li><strong>Legal obligation:</strong> Where required by applicable law</li>
              </ul>
            </section>

            <section id="data-sharing"><h2>5. Data Sharing</h2>
              <p>We do not sell your personal data. We share data only with shipping carriers to fulfil delivery, an email service provider to send confirmations, and legal authorities where required by law.</p>
            </section>

            <section id="cookies"><h2>6. Cookies</h2>
              <table className="legal-table" aria-label="Cookie types">
                <thead><tr><th>Type</th><th>Purpose</th><th>Consent Required</th></tr></thead>
                <tbody>
                  <tr><td>Essential</td><td>Cart functionality, session management, security</td><td>No</td></tr>
                  <tr><td>Functional</td><td>Remembering preferences (currency)</td><td>No</td></tr>
                  <tr><td>Analytics</td><td>Understanding how visitors use the site</td><td>Yes — opt-in</td></tr>
                  <tr><td>Marketing</td><td>Personalised advertising (if enabled)</td><td>Yes — opt-in</td></tr>
                </tbody>
              </table>
              <p>You can manage cookie preferences via the banner shown on your first visit.</p>
            </section>

            <section id="data-retention"><h2>7. Data Retention</h2>
              <ul>
                <li><strong>Order data:</strong> Retained for 7 years for legal and tax compliance</li>
                <li><strong>Numerology data:</strong> Retained only as long as needed to deliver your reading</li>
                <li><strong>Contact form data:</strong> 12 months after resolution of your enquiry</li>
              </ul>
            </section>

            <section id="your-rights"><h2>8. Your Rights (GDPR &amp; UK GDPR)</h2>
              <ul>
                <li><strong>Right of access:</strong> Request a copy of the data we hold about you</li>
                <li><strong>Right to rectification:</strong> Request correction of inaccurate data</li>
                <li><strong>Right to erasure:</strong> Request deletion of your data</li>
                <li><strong>Right to data portability:</strong> Receive your data in a structured format</li>
                <li><strong>Right to withdraw consent:</strong> At any time, where processing is based on consent</li>
              </ul>
              <p>To exercise any of these rights, contact us at <a href="mailto:privacy@arisenumero.com">privacy@arisenumero.com</a>.</p>
            </section>

            <section id="ccpa"><h2>9. California Residents — CCPA Rights</h2>
              <ul>
                <li>Know what personal information we collect and how it is used</li>
                <li>Request deletion of your personal information</li>
                <li>Opt out of the sale of personal information — <strong>we do not sell personal information</strong></li>
              </ul>
            </section>

            <section id="security"><h2>10. Security</h2>
              <ul>
                <li>HTTPS / SSL/TLS encryption for all data in transit</li>
                <li>Hashed passwords and admin PINs — never stored in plain text</li>
                <li>Access controls — data is accessible only to personnel who need it</li>
              </ul>
              <p>No system is 100% secure. In the event of a data breach that poses a risk to your rights, we will notify affected individuals as required by law.</p>
            </section>

            <section id="children"><h2>11. Children&apos;s Privacy</h2>
              <p>Our website is not directed at children under 16. We do not knowingly collect data from children.</p>
            </section>

            <section id="changes"><h2>12. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. Material changes will be reflected in the &quot;Last updated&quot; date above.</p>
            </section>

            <section id="contact-privacy"><h2>13. Contact Us</h2>
              <address>
                <strong>Arise Numero — Privacy Team</strong><br />
                Email: <a href="mailto:privacy@arisenumero.com">privacy@arisenumero.com</a><br />
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
