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
                <li><a href="#india-dpdp">8. Your Rights in India (DPDP Act)</a></li>
                <li><a href="#your-rights">9. Your Rights (GDPR)</a></li>
                <li><a href="#ccpa">10. California Rights (CCPA)</a></li>
                <li><a href="#security">11. Security</a></li>
                <li><a href="#children">12. Children&apos;s Privacy</a></li>
                <li><a href="#changes">13. Changes to This Policy</a></li>
                <li><a href="#contact-privacy">14. Contact &amp; Grievance Officer</a></li>
              </ol>
            </nav>
          </aside>

          <article className="legal-content" aria-labelledby="privacy-heading">
            <header className="legal-header">
              <h1 id="privacy-heading" className="legal-title">Privacy Policy</h1>
              <p className="legal-meta">Last updated: <time dateTime="2026-11-08">8 November 2026</time></p>
            </header>

            <p>This Privacy Policy explains how Arise Numero (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) collects, uses, stores, and protects your personal data when you visit our website or purchase our products and services. We comply with the EU General Data Protection Regulation (GDPR), the UK GDPR, and the California Consumer Privacy Act (CCPA).</p>

            <section id="who-we-are"><h2>1. Who We Are</h2>
              <p><strong>Data Controller:</strong> Arise Numero<br /><strong>Contact:</strong> <a href="mailto:arisenumero@gmail.com">arisenumero@gmail.com</a><br /><strong>Address:</strong> Mumbai, Maharashtra, India</p>
            </section>

            <section id="data-collected"><h2>2. Data We Collect</h2>
              <h3>2.1 Data You Provide Directly</h3>
              <ul>
                <li><strong>Purchase data:</strong> Name, email, shipping address, phone number, order details</li>
                <li><strong>Numerology booking data:</strong> Full birth name and date of birth, collected strictly to prepare the reading you book</li>
                <li><strong>Reviews:</strong> The name you choose to display, your rating and review, and your email (never published)</li>
                <li><strong>Communication data:</strong> Messages sent via our contact form</li>
                <li><strong>Marketing preferences:</strong> Whether you opt in to receive promotional emails</li>
              </ul>
              <p>The free numerology calculator works entirely in your browser: the name and date of birth you enter are not sent to us or stored.</p>
              <p>We never see or store your card or UPI details: payments are handled directly by our payment providers.</p>
              <h3>2.2 Data Collected Automatically</h3>
              <ul>
                <li><strong>Usage data:</strong> Pages visited, time on site, referring URLs (only if you accept analytics cookies). We do not use session-recording or keystroke-tracking tools.</li>
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
              <p>We do not sell your personal data. We share it only with the service providers who help us run the shop, and only what each one needs:</p>
              <ul>
                <li><strong>Payments:</strong> Cashfree Payments and PayPal, to process your payment</li>
                <li><strong>Hosting and database:</strong> Vercel and Neon, which host this website and its data</li>
                <li><strong>Email:</strong> Google (Gmail), to send order confirmations and replies</li>
                <li><strong>Delivery:</strong> shipping carriers, to deliver your order</li>
                <li><strong>Analytics:</strong> Google Analytics, only if you accept analytics cookies</li>
                <li><strong>Authorities:</strong> where the law requires it</li>
              </ul>
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
                <li><strong>Newsletter:</strong> until you unsubscribe (every email has an unsubscribe link)</li>
              </ul>
              <p>When data is no longer needed for its purpose, we delete it. You can ask us to delete it sooner at any time (see your rights below).</p>
            </section>

            <section id="india-dpdp"><h2>8. Your Rights in India (Digital Personal Data Protection Act, 2023)</h2>
              <p>We process your personal data only for the purposes listed above, based on the consent you give when you place an order, book a reading, contact us or subscribe, or where the law allows. You have the right to:</p>
              <ul>
                <li><strong>Access:</strong> a summary of the personal data we hold about you and how we use it, and who we have shared it with</li>
                <li><strong>Correction and erasure:</strong> have inaccurate or incomplete data corrected or updated, and have data erased once it is no longer needed</li>
                <li><strong>Withdraw consent:</strong> as easily as you gave it. Withdrawing doesn&apos;t affect what was done before, and we may then be unable to complete an order or reading</li>
                <li><strong>Grievance redressal:</strong> raise any concern with our Grievance Officer (section 14), who will respond as quickly as possible and within the time the law requires</li>
                <li><strong>Nominate:</strong> someone to exercise these rights on your behalf in the event of your death or incapacity</li>
              </ul>
              <p>If you are not satisfied with our response, you may complain to the Data Protection Board of India.</p>
            </section>

            <section id="your-rights"><h2>9. Your Rights (GDPR &amp; UK GDPR)</h2>
              <ul>
                <li><strong>Right of access:</strong> Request a copy of the data we hold about you</li>
                <li><strong>Right to rectification:</strong> Request correction of inaccurate data</li>
                <li><strong>Right to erasure:</strong> Request deletion of your data</li>
                <li><strong>Right to data portability:</strong> Receive your data in a structured format</li>
                <li><strong>Right to withdraw consent:</strong> At any time, where processing is based on consent</li>
              </ul>
              <p>To exercise any of these rights, contact us at <a href="mailto:arisenumero@gmail.com">arisenumero@gmail.com</a>.</p>
            </section>

            <section id="ccpa"><h2>10. California Residents — CCPA Rights</h2>
              <ul>
                <li>Know what personal information we collect and how it is used</li>
                <li>Request deletion of your personal information</li>
                <li>Opt out of the sale of personal information — <strong>we do not sell personal information</strong></li>
              </ul>
            </section>

            <section id="security"><h2>11. Security</h2>
              <ul>
                <li>HTTPS / SSL/TLS encryption for all data in transit</li>
                <li>Admin access protected by one-time sign-in codes sent by email, and a log of admin actions</li>
                <li>Database and payment keys kept on the server only, never in the website code your browser downloads</li>
                <li>Access controls: data is accessible only to people who need it</li>
              </ul>
              <p>No system is 100% secure. In the event of a data breach that poses a risk to your rights, we will notify affected individuals as required by law.</p>
            </section>

            <section id="children"><h2>12. Children&apos;s Privacy</h2>
              <p>Ordering, reviews, the newsletter and the contact form are for adults aged 18 or over. We do not knowingly collect personal data from anyone under 18 without verifiable consent from a parent or lawful guardian.</p>
              <p>A numerology reading for someone under 18 must be booked by their parent or guardian, who confirms their consent at booking; we use the child&apos;s details only to prepare that reading. We never track children&apos;s behaviour or show them targeted advertising.</p>
              <p>If you believe a child has given us personal data without a parent&apos;s consent, contact us and we will delete it.</p>
            </section>

            <section id="changes"><h2>13. Changes to This Policy</h2>
              <p>We may update this Privacy Policy from time to time. Material changes will be reflected in the &quot;Last updated&quot; date above.</p>
            </section>

            <section id="contact-privacy"><h2>14. Contact &amp; Grievance Officer</h2>
              <p>For any privacy question, to exercise your rights, or to raise a grievance, contact our Grievance Officer:</p>
              <address>
                <strong>Grievance Officer, Arise Numero</strong><br />
                Email: <a href="mailto:arisenumero@gmail.com">arisenumero@gmail.com</a><br />
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
