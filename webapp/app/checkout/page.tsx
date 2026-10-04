import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CheckoutClient } from "@/components/CheckoutClient";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Secure Checkout",
  description:
    "Complete your Arise Numero order securely.",
  path: "/checkout",
  noindex: true,
});

export default function CheckoutPage() {
  return (
    <>
      <Header variant="checkout" />
      <main id="main-content">
        <div className="checkout-steps container" aria-label="Checkout progress">
          <div className="step step-done"><span className="step-num" aria-hidden="true">✓</span><span className="step-label">Cart</span></div>
          <div className="step-connector" aria-hidden="true"></div>
          <div className="step step-active" aria-current="step"><span className="step-num" aria-hidden="true">2</span><span className="step-label">Details</span></div>
          <div className="step-connector" aria-hidden="true"></div>
          <div className="step"><span className="step-num" aria-hidden="true">3</span><span className="step-label">Payment</span></div>
          <div className="step-connector" aria-hidden="true"></div>
          <div className="step"><span className="step-num" aria-hidden="true">4</span><span className="step-label">Confirm</span></div>
        </div>

        <CheckoutClient />
      </main>
      <Footer minimal />
    </>
  );
}
