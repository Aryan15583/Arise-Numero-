import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BookingClient } from "@/components/BookingClient";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Book a Numerology Reading",
  description:
    "Book a personalised numerology reading with Arise Numero. Choose your package, select a time that works for you worldwide, and receive a comprehensive report.",
  path: "/booking",
});

export default function BookingPage() {
  return (
    <>
      <Header />
      <main id="main-content">
        <nav className="breadcrumb container" aria-label="Breadcrumb">
          <ol role="list">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/numerology">Numerology</Link></li>
            <li aria-current="page">Book a Reading</li>
          </ol>
        </nav>

        <div className="page-header container">
          <h1 className="page-title">Book a Personalised Reading</h1>
          <p className="page-subtitle">A comprehensive, handcrafted numerology report tailored to you.</p>
          <div className="entertainment-disclaimer" role="note">
            <span aria-hidden="true">ℹ️</span>
            <p><strong>For entertainment &amp; self-insight purposes only.</strong> Numerology readings do not constitute legal, financial, medical, or professional psychological advice.</p>
          </div>
        </div>

        <BookingClient />
      </main>
      <Footer />
    </>
  );
}
