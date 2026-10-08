import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactFormClient } from "@/components/ContactFormClient";
import { prisma } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact Us",
  description:
    "Contact Arise Numero. Get in touch for order support, product questions, or numerology reading enquiries. We respond within 24–48 hours.",
  path: "/contact",
});

const FAQS = [
  {
    q: "How long does shipping take?",
    a: "Delivery times vary by region: India (5–10 days), USA/Canada (7–14 days), Europe (10–18 days), Australia (12–20 days). See our full Shipping Policy.",
  },
  {
    q: "Are the crystals genuine?",
    a: "Yes. Every bracelet uses certified authentic gemstones. Natural colour and texture variations are expected and are signs of authenticity.",
  },
  {
    q: "Can I return my order?",
    a: "We offer a 14-day return window on all non-customised items. See our Returns Policy for full details.",
  },
  {
    q: "What is numerology? Is it scientific?",
    a: "Numerology is an ancient belief system that assigns meaning to numbers derived from names and dates. It is not a scientifically validated discipline. Our readings are provided for entertainment and self-insight purposes only.",
  },
  {
    q: "How is my personal data used?",
    a: "Your data is collected only as needed to process your order or reading and is never sold to third parties. We comply with GDPR and CCPA.",
  },
  {
    q: "Which payment methods do you accept?",
    a: "We accept Cash on Delivery, Bank Transfer, and PayPal where configured. We never collect card numbers directly on this site.",
  },
];

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  // "Enquire" buttons on price-on-request items link here with ?product=<id>.
  const { product: productId } = await searchParams;
  const enquiry = productId
    ? await prisma.product.findFirst({ where: { id: productId.slice(0, 100), active: true }, select: { name: true } })
    : null;
  return (
    <>
      <Header />
      <main id="main-content">
        <nav className="breadcrumb container" aria-label="Breadcrumb">
          <ol role="list">
            <li><Link href="/">Home</Link></li>
            <li aria-current="page">Contact</li>
          </ol>
        </nav>

        <div className="page-header container">
          <h1 className="page-title">Get in Touch</h1>
          <p className="page-subtitle">We&apos;d love to hear from you. We respond to all enquiries within 24–48 hours.</p>
        </div>

        <div className="container contact-layout">
          <section className="contact-form-wrap" aria-labelledby="contact-form-heading">
            <h2 id="contact-form-heading" className="section-title">Send Us a Message</h2>
            <ContactFormClient productName={enquiry?.name} />
          </section>

          <aside className="contact-sidebar" aria-label="Contact information and FAQ">
            <div className="contact-info-card">
              <h2 className="summary-title">Contact Information</h2>
              <ul className="contact-info-list" role="list">
                <li>
                  <span className="contact-info-icon" aria-hidden="true">📧</span>
                  <div><strong>Email</strong><a href="mailto:hello@arisenumero.com">hello@arisenumero.com</a></div>
                </li>
                <li>
                  <span className="contact-info-icon" aria-hidden="true">⏰</span>
                  <div><strong>Response Time</strong><span>24–48 hours (Mon–Sat)</span></div>
                </li>
                <li>
                  <span className="contact-info-icon" aria-hidden="true">🌍</span>
                  <div><strong>Based In</strong><span>Mumbai, India — serving customers worldwide</span></div>
                </li>
              </ul>
            </div>

            <div className="contact-info-card">
              <h2 className="summary-title">Follow Us</h2>
              <div className="contact-socials" aria-label="Social media links">
                <a href="#" className="social-link" rel="noopener noreferrer"><span aria-hidden="true">📸</span> Instagram</a>
                <a href="#" className="social-link" rel="noopener noreferrer"><span aria-hidden="true">👤</span> Facebook</a>
                <a href="#" className="social-link" rel="noopener noreferrer"><span aria-hidden="true">📌</span> Pinterest</a>
              </div>
            </div>

            <div className="faq-section" aria-labelledby="faq-heading">
              <h2 id="faq-heading" className="summary-title">Frequently Asked Questions</h2>
              <div className="faq-list" role="list">
                {FAQS.map((faq) => (
                  <details className="faq-item" role="listitem" key={faq.q}>
                    <summary className="faq-question">{faq.q}</summary>
                    <div className="faq-answer"><p>{faq.a}</p></div>
                  </details>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
