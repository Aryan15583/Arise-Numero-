import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Frequently Asked Questions",
  description:
    "Answers about Arise Numero orders, shipping and delivery times, payment methods, returns, crystal care and numerology readings.",
  path: "/faq",
});

type Faq = { q: string; a: string; link?: { href: string; label: string } };

const GROUPS: { title: string; items: Faq[] }[] = [
  {
    title: "Orders & shipping",
    items: [
      {
        q: "Do you ship worldwide?",
        a: "Yes. We ship handcrafted bracelets to customers worldwide. Delivery times and shipping costs depend on your region.",
        link: { href: "/returns#shipping", label: "See shipping rates and delivery times" },
      },
      {
        q: "How long will my order take to arrive?",
        a: "As a guide: roughly 5–10 business days within India and 7–25 business days to the rest of the world, depending on the destination. Every parcel is tracked where the carrier supports it.",
      },
      {
        q: "How do I track my order?",
        a: "Use the Track Order page with your order number (it's in your confirmation email) and the email address you ordered with. We also email you when your order ships, including the tracking number when we have one.",
        link: { href: "/track-order", label: "Track an order" },
      },
      {
        q: "Will I have to pay customs or import duties?",
        a: "International orders may be subject to import duties or taxes charged by the destination country. These charges are the buyer's responsibility and are not included in our prices.",
      },
    ],
  },
  {
    title: "Payments",
    items: [
      {
        q: "Which payment methods do you accept?",
        a: "Depending on your location you can pay by UPI (including Google Pay), Visa or Mastercard, PayPal, bank transfer, or Cash on Delivery. The options available to you are shown at checkout.",
      },
      {
        q: "Is it safe to pay on your site?",
        a: "Yes. We never see or store your card details — card and UPI payments are handled on the payment provider's own secure checkout. Our pages are served over HTTPS and prices are always calculated on our server.",
      },
      {
        q: "How does bank transfer work?",
        a: "Choose bank transfer at checkout. We email you our bank details and your order number to use as the payment reference. Your order ships once the payment arrives.",
      },
      {
        q: "How do coupon codes work?",
        a: "Enter your code in the cart before checking out. Some codes have an expiry date, a limited number of uses, or a minimum order amount — the cart tells you if a code can't be applied and why.",
      },
    ],
  },
  {
    title: "Our crystals",
    items: [
      {
        q: "Are your crystals genuine?",
        a: "Yes. Every bracelet is made with genuine, ethically sourced gemstones. Because they are natural stones, colour, texture and pattern vary slightly from bead to bead and from the photos — that's a mark of authenticity, not a defect.",
      },
      {
        q: "What size will fit me?",
        a: "Our bracelets are made on a strong elastic cord and fit wrists of roughly 15–20 cm. On the product page you can choose S (15–16 cm), M (17–18 cm) or L (19–20 cm).",
      },
      {
        q: "How should I care for my bracelet?",
        a: "Keep it out of prolonged direct sunlight, remove it before swimming, bathing or using chemical cleaners, clean it gently with a soft dry cloth, and store it in its gift box or a soft pouch. Avoid over-stretching the cord.",
      },
    ],
  },
  {
    title: "Numerology readings",
    items: [
      {
        q: "What does the free numerology calculator do?",
        a: "It instantly works out your Life Path, Expression and Soul Urge numbers from your date of birth and name using the Pythagorean system, with a short description of each.",
        link: { href: "/numerology", label: "Try the free calculator" },
      },
      {
        q: "What is a personalised reading?",
        a: "A booked reading is a fuller, written interpretation of your numbers prepared for you. Choose a package, tell us your details and preferred time, and we'll be in touch within 24 hours to confirm.",
        link: { href: "/booking", label: "Book a reading" },
      },
      {
        q: "Is numerology professional advice?",
        a: "No. Numerology readings are offered for self-insight and entertainment only. They are not legal, financial, medical or psychological advice and shouldn't be the sole basis for any life decision.",
      },
    ],
  },
  {
    title: "Returns & privacy",
    items: [
      {
        q: "What is your return policy?",
        a: "You can return non-customised items within 14 days of delivery if they are unworn and in their original packaging. Contact us within the 14 days to start a return; refunds are processed within 5–7 business days of us receiving the item. Return shipping is the buyer's responsibility unless the item arrived defective.",
        link: { href: "/returns", label: "Read the full returns policy" },
      },
      {
        q: "Do I need an account to order?",
        a: "No. You can check out as a guest, and your cart and wishlist are saved on your own device.",
      },
      {
        q: "How do you use my personal information?",
        a: "Only to fulfil your order or booking and to reply to your messages. If you join our newsletter you can unsubscribe at any time from the link in any email.",
        link: { href: "/privacy", label: "Read the privacy policy" },
      },
    ],
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: GROUPS.flatMap((g) => g.items).map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqJsonLd} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "FAQ", path: "/faq" },
        ])}
      />
      <Header />
      <main id="main-content">
        <div className="page-header container">
          <h1 className="page-title">Frequently Asked Questions</h1>
          <p className="page-subtitle">
            Can&apos;t find your answer? <Link href="/contact">Get in touch</Link> — we reply within 24–48 hours.
          </p>
        </div>

        <div className="container faq-layout">
          {GROUPS.map((group) => (
            <section key={group.title} className="faq-group" aria-labelledby={`faq-${group.title}`}>
              <h2 id={`faq-${group.title}`} className="faq-group-title">{group.title}</h2>
              {group.items.map((item) => (
                <details key={item.q} className="faq-item">
                  <summary>{item.q}</summary>
                  <div className="faq-answer">
                    <p>{item.a}</p>
                    {item.link && (
                      <p>
                        <Link href={item.link.href}>{item.link.label} →</Link>
                      </p>
                    )}
                  </div>
                </details>
              ))}
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
