import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartPageClient } from "@/components/CartPageClient";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Shopping Cart",
  description:
    "Your Arise Numero shopping cart. Review items, update quantities, apply coupon codes and proceed to secure checkout.",
  path: "/cart",
  noindex: true,
});

export default function CartPage() {
  return (
    <>
      <Header />
      <main id="main-content">
        <nav className="breadcrumb container" aria-label="Breadcrumb">
          <ol role="list">
            <li><Link href="/">Home</Link></li>
            <li aria-current="page">Cart</li>
          </ol>
        </nav>

        <div className="checkout-steps container" aria-label="Checkout progress">
          <div className="step step-active" aria-current="step"><span className="step-num" aria-hidden="true">1</span><span className="step-label">Cart</span></div>
          <div className="step-connector" aria-hidden="true"></div>
          <div className="step" aria-label="Step 2: Details"><span className="step-num" aria-hidden="true">2</span><span className="step-label">Details</span></div>
          <div className="step-connector" aria-hidden="true"></div>
          <div className="step" aria-label="Step 3: Payment"><span className="step-num" aria-hidden="true">3</span><span className="step-label">Payment</span></div>
          <div className="step-connector" aria-hidden="true"></div>
          <div className="step" aria-label="Step 4: Confirm"><span className="step-num" aria-hidden="true">4</span><span className="step-label">Confirm</span></div>
        </div>

        <CartPageClient />
      </main>
      <Footer />
    </>
  );
}
