"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { useCart } from "./CartContext";
import { useCurrency } from "./CurrencyContext";

const COUNTRIES = [
  { value: "", label: "Select country…" },
  { value: "IN", label: "India" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
  { value: "CA", label: "Canada" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "NL", label: "Netherlands" },
  { value: "SG", label: "Singapore" },
  { value: "AE", label: "UAE" },
  { value: "OTHER", label: "Other" },
];

type OrderConfirmation = {
  id: string;
  totalUsd: number;
  paymentMethod: string;
};

type PaymentMethod = "cod" | "bank_transfer" | "paypal" | "cashfree";

export function CheckoutClient() {
  const { items, subtotalUsd, clearCart } = useCart();
  const { format } = useCurrency();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [termsAgree, setTermsAgree] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);
  const [paypalClientId, setPaypalClientId] = useState<string | null>(null);
  const [cashfreeEnabled, setCashfreeEnabled] = useState(false);
  const [cashfreeMode, setCashfreeMode] = useState<"sandbox" | "production">("sandbox");
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [shippingRates, setShippingRates] = useState({ standard: 5.99, express: 14.99, freeThreshold: 50 });

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => {
        setPaypalClientId(d.paypalClientId);
        setCashfreeEnabled(!!d.cashfreeEnabled);
        setCashfreeMode(d.cashfreeMode === "production" ? "production" : "sandbox");
        setShippingRates({
          standard: d.standardShippingUsd ?? 5.99,
          express: d.expressShippingUsd ?? 14.99,
          freeThreshold: d.freeShippingThresholdUsd ?? 50,
        });
      })
      .catch(() => {});

    const savedCoupon = sessionStorage.getItem("ariseNumero_coupon");
    if (savedCoupon) {
      setCouponCode(savedCoupon);
      fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: savedCoupon }),
      })
        .then((r) => r.json())
        .then((d) => setDiscountPercent(d.valid ? d.discountPercent : 0));
    }

    // Some payment methods inside Cashfree's checkout (notably netbanking on
    // certain banks) redirect the whole page despite redirectTarget:
    // "_modal". If we land back here with ?cf_order_id=..., pick up where
    // the CashfreePanel would have: check status server-side and finalize.
    const cfOrderId = new URLSearchParams(window.location.search).get("cf_order_id");
    if (cfOrderId) {
      fetch(`/api/cashfree/order-status/${cfOrderId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.status === "paid") {
            clearCart();
            setConfirmation({ id: d.id, totalUsd: d.totalUsd, paymentMethod: "cashfree" });
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isInternational = country !== "" && country !== "IN";
  const discount = subtotalUsd * (discountPercent / 100);
  const afterDiscount = subtotalUsd - discount;
  const shippingCost =
    afterDiscount === 0
      ? 0
      : shippingMethod === "express"
      ? shippingRates.express
      : afterDiscount >= shippingRates.freeThreshold
      ? 0
      : shippingRates.standard;
  const total = afterDiscount + shippingCost;

  function validate(opts?: { requirePhone?: boolean }): string[] {
    const errs: string[] = [];
    if (!email.trim()) errs.push("Email address is required.");
    if (opts?.requirePhone && !phone.trim()) errs.push("Phone number is required for this payment method.");
    if (!firstName.trim() || !lastName.trim()) errs.push("First and last name are required.");
    if (!address1.trim()) errs.push("Address line 1 is required.");
    if (!city.trim() || !state.trim() || !postalCode.trim() || !country) errs.push("Complete shipping address is required.");
    if (!termsAgree) errs.push("You must agree to the Terms of Service and Privacy Policy.");
    if (items.length === 0) errs.push("Your cart is empty.");
    return errs;
  }

  async function placeOrder() {
    const errs = validate();
    setErrors(errs);
    if (errs.length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        items: items.map((i) => ({ id: i.id, qty: i.qty })),
        couponCode,
        shippingMethod,
        paymentMethod,
        customer: { name: `${firstName} ${lastName}`.trim(), email, phone },
        shipping: { firstName, lastName, address1, address2, city, state, postalCode, country },
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors([data.error || "Could not place your order. Please try again."]);
        return;
      }

      sessionStorage.removeItem("ariseNumero_coupon");
      clearCart();
      setConfirmation({ id: data.id, totalUsd: data.totalUsd, paymentMethod: data.paymentMethod });
    } catch {
      setErrors(["Network error. Please check your connection and try again."]);
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <div className="container" style={{ paddingBlock: "var(--space-20)", textAlign: "center" }}>
        <div style={{ fontSize: "4rem", marginBottom: 16 }} aria-hidden="true">✦</div>
        <h1 className="page-title">Order Confirmed!</h1>
        <p className="page-subtitle" style={{ marginInline: "auto" }}>
          Thank you! Your order <code>{confirmation.id}</code> for {format(confirmation.totalUsd)} has been
          placed and a confirmation has been sent to your email.
        </p>
        <p className="text-muted">
          {confirmation.paymentMethod === "cod" && "Please have the exact amount ready for Cash on Delivery."}
          {confirmation.paymentMethod === "bank_transfer" &&
            "Bank transfer instructions have been emailed to you. Your order ships once payment is confirmed."}
          {confirmation.paymentMethod === "paypal" && "Your PayPal payment has been captured successfully."}
          {confirmation.paymentMethod === "cashfree" && "Your payment has been confirmed successfully."}
        </p>
        <div style={{ marginTop: 24 }}>
          <Link href="/shop" className="btn btn-primary btn-lg">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container checkout-layout">
      <div className="checkout-form-wrap">
        {errors.length > 0 && (
          <div className="form-error" role="alert">
            <ul style={{ paddingLeft: 20, listStyle: "disc" }}>
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        <fieldset className="checkout-fieldset">
          <legend className="checkout-section-title">Contact Information</legend>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="contact-email">Email Address <span className="required">*</span></label>
              <input type="email" id="contact-email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
              <p className="form-hint">Order confirmation will be sent to this address</p>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="contact-phone">
                Phone Number {paymentMethod === "cashfree" && <span className="required">*</span>}
              </label>
              <input type="tel" id="contact-phone" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
              <p className="form-hint">
                {paymentMethod === "cashfree" ? "Required by the payment provider for UPI/card payments." : "For shipping notifications only"}
              </p>
            </div>
          </div>
        </fieldset>

        <fieldset className="checkout-fieldset">
          <legend className="checkout-section-title">Shipping Address</legend>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="ship-first">First Name <span className="required">*</span></label>
              <input type="text" id="ship-first" className="form-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ship-last">Last Name <span className="required">*</span></label>
              <input type="text" id="ship-last" className="form-input" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Smith" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ship-address1">Address Line 1 <span className="required">*</span></label>
            <input type="text" id="ship-address1" className="form-input" value={address1} onChange={(e) => setAddress1(e.target.value)} placeholder="123 Main Street" />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="ship-address2">Address Line 2 <span className="optional-label">(optional)</span></label>
            <input type="text" id="ship-address2" className="form-input" value={address2} onChange={(e) => setAddress2(e.target.value)} placeholder="Apartment, suite, etc." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="ship-city">City <span className="required">*</span></label>
              <input type="text" id="ship-city" className="form-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mumbai" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ship-state">State / Province <span className="required">*</span></label>
              <input type="text" id="ship-state" className="form-input" value={state} onChange={(e) => setState(e.target.value)} placeholder="Maharashtra" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="ship-zip">Postal / ZIP Code <span className="required">*</span></label>
              <input type="text" id="ship-zip" className="form-input" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="400001" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ship-country">Country <span className="required">*</span></label>
              <select id="ship-country" className="form-input" value={country} onChange={(e) => setCountry(e.target.value)}>
                {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          {isInternational && (
            <div className="customs-notice" role="note">
              <span aria-hidden="true">ℹ️</span>
              <p><strong>International Shipping:</strong> Your order may be subject to import duties and taxes levied by the destination country. These charges are the buyer&apos;s responsibility.</p>
            </div>
          )}
        </fieldset>

        <fieldset className="checkout-fieldset">
          <legend className="checkout-section-title">Shipping Method</legend>
          <div className="shipping-options" role="radiogroup" aria-label="Select shipping method">
            <label className="shipping-option">
              <input type="radio" name="shipping_method" checked={shippingMethod === "standard"} onChange={() => setShippingMethod("standard")} />
              <div className="shipping-option-info">
                <span className="shipping-name">Standard Shipping</span>
                <span className="shipping-time">7–14 business days · free over {format(shippingRates.freeThreshold)}</span>
              </div>
              <span className="shipping-cost">{format(shippingRates.standard)}</span>
            </label>
            <label className="shipping-option">
              <input type="radio" name="shipping_method" checked={shippingMethod === "express"} onChange={() => setShippingMethod("express")} />
              <div className="shipping-option-info">
                <span className="shipping-name">Express Shipping</span>
                <span className="shipping-time">3–5 business days</span>
              </div>
              <span className="shipping-cost">{format(shippingRates.express)}</span>
            </label>
          </div>
        </fieldset>

        <fieldset className="checkout-fieldset" id="payment-section">
          <legend className="checkout-section-title">
            <span aria-hidden="true">🔒</span> Payment Method
          </legend>
          <p className="payment-note">Choose how you&apos;d like to pay. We never ask for card numbers directly on this site.</p>

          <div className="payment-tabs" role="tablist" aria-label="Select payment method">
            <button type="button" className={`payment-tab ${paymentMethod === "cod" ? "active" : ""}`} onClick={() => setPaymentMethod("cod")}>
              <span aria-hidden="true">💵</span> Cash on Delivery
            </button>
            <button type="button" className={`payment-tab ${paymentMethod === "bank_transfer" ? "active" : ""}`} onClick={() => setPaymentMethod("bank_transfer")}>
              <span aria-hidden="true">🏦</span> Bank Transfer
            </button>
            {cashfreeEnabled && (
              <button type="button" className={`payment-tab ${paymentMethod === "cashfree" ? "active" : ""}`} onClick={() => setPaymentMethod("cashfree")}>
                <span aria-hidden="true">📱</span> UPI / GPay / Card
              </button>
            )}
            {paypalClientId && (
              <button type="button" className={`payment-tab ${paymentMethod === "paypal" ? "active" : ""}`} onClick={() => setPaymentMethod("paypal")}>
                <span aria-hidden="true">🅿</span> PayPal
              </button>
            )}
          </div>

          {paymentMethod === "cod" && (
            <div className="payment-panel">
              <p className="payment-redirect-note">Pay in cash when your order is delivered. Please keep the exact amount ready.</p>
            </div>
          )}
          {paymentMethod === "bank_transfer" && (
            <div className="payment-panel">
              <p className="payment-redirect-note">
                We&apos;ll email you our bank details after you place the order. Your order ships once payment is confirmed.
              </p>
            </div>
          )}
          {paymentMethod === "cashfree" && cashfreeEnabled && (
            <div className="payment-panel">
              <Script src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="afterInteractive" />
              <p className="payment-redirect-note">
                Pay instantly via UPI (GPay, PhonePe, Paytm), Mastercard, Visa, netbanking, or wallets.
              </p>
              <CashfreePanel
                mode={cashfreeMode}
                onValidate={() => {
                  const errs = validate({ requirePhone: true });
                  setErrors(errs);
                  return errs.length === 0;
                }}
                buildPayload={() => ({
                  items: items.map((i) => ({ id: i.id, qty: i.qty })),
                  couponCode,
                  shippingMethod,
                  customer: { name: `${firstName} ${lastName}`.trim(), email, phone },
                  shipping: { firstName, lastName, address1, address2, city, state, postalCode, country },
                })}
                onSuccess={(orderId, totalUsd) => {
                  sessionStorage.removeItem("ariseNumero_coupon");
                  clearCart();
                  setConfirmation({ id: orderId, totalUsd, paymentMethod: "cashfree" });
                }}
                onError={(msg) => setErrors([msg])}
              />
            </div>
          )}
          {paymentMethod === "paypal" && paypalClientId && (
            <div className="payment-panel">
              <Script src={`https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD&intent=capture`} strategy="afterInteractive" />
              <PayPalPanel
                disabled={validate().length > 0}
                onValidate={() => {
                  const errs = validate();
                  setErrors(errs);
                  return errs.length === 0;
                }}
                buildPayload={() => ({
                  items: items.map((i) => ({ id: i.id, qty: i.qty })),
                  couponCode,
                  customer: { name: `${firstName} ${lastName}`.trim(), email, phone },
                  shipping: { firstName, lastName, address1, address2, city, state, postalCode, country },
                })}
                onSuccess={(orderId, totalUsd) => {
                  sessionStorage.removeItem("ariseNumero_coupon");
                  clearCart();
                  setConfirmation({ id: orderId, totalUsd, paymentMethod: "paypal" });
                }}
                onError={(msg) => setErrors([msg])}
              />
            </div>
          )}
        </fieldset>

        <div className="checkout-consent">
          <label className="checkbox-label">
            <input type="checkbox" checked={termsAgree} onChange={(e) => setTermsAgree(e.target.checked)} />
            I agree to the <Link href="/terms" target="_blank">Terms of Service</Link> and{" "}
            <Link href="/privacy" target="_blank">Privacy Policy</Link> <span className="required">*</span>
          </label>
        </div>

        {paymentMethod !== "paypal" && paymentMethod !== "cashfree" && (
          <button
            type="button"
            className="btn btn-primary btn-lg btn-full place-order-btn"
            onClick={placeOrder}
            disabled={submitting}
          >
            {submitting ? "Placing Order…" : "🔒 Place Order Securely"}
          </button>
        )}

        <p className="checkout-final-note">
          By placing your order you confirm you have read and agreed to our <Link href="/terms">Terms of Service</Link> and{" "}
          <Link href="/returns">Returns Policy</Link>.
        </p>
      </div>

      <aside className="cart-summary checkout-summary-sticky" aria-labelledby="checkout-summary-heading">
        <h2 id="checkout-summary-heading" className="summary-title">Your Order</h2>
        <div>
          {items.length === 0 ? (
            <p className="checkout-empty-note">Your cart appears to be empty. <Link href="/shop">Return to shop</Link>.</p>
          ) : (
            items.map((item) => (
              <div className="checkout-order-item" key={item.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl || "/assets/placeholder.svg"} alt="" />
                <div className="checkout-order-item-info">
                  <div className="checkout-order-item-name">{item.name}</div>
                  <div className="checkout-order-item-meta">Qty: {item.qty}</div>
                </div>
                <div className="checkout-order-item-price">{format(item.priceUsd * item.qty)}</div>
              </div>
            ))
          )}
        </div>
        <dl className="summary-breakdown">
          <div className="summary-row"><dt>Subtotal</dt><dd>{format(subtotalUsd)}</dd></div>
          {discountPercent > 0 && (
            <div className="summary-row"><dt>Discount ({discountPercent}%)</dt><dd className="summary-discount">−{format(discount)}</dd></div>
          )}
          <div className="summary-row"><dt>Shipping</dt><dd>{shippingCost === 0 ? "Free" : format(shippingCost)}</dd></div>
          <div className="summary-row summary-total"><dt>Total</dt><dd><strong>{format(total)}</strong></dd></div>
        </dl>
        <p className="security-note"><span aria-hidden="true">🔐</span> No card numbers are ever collected on this site.</p>
      </aside>
    </div>
  );
}

function PayPalPanel({
  disabled,
  onValidate,
  buildPayload,
  onSuccess,
  onError,
}: {
  disabled: boolean;
  onValidate: () => boolean;
  buildPayload: () => Record<string, unknown>;
  onSuccess: (orderId: string, totalUsd: number) => void;
  onError: (message: string) => void;
}) {
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    function render() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paypal = (window as any).paypal;
      const container = document.getElementById("paypal-button-container");
      if (!paypal || !container) {
        if (attempts++ < 20 && !cancelled) setTimeout(render, 300);
        return;
      }
      container.innerHTML = "";
      paypal
        .Buttons({
          style: { layout: "vertical", color: "gold", shape: "rect", label: "paypal", height: 45 },
          createOrder: async () => {
            if (!onValidate()) throw new Error("Please complete the required fields above.");
            const res = await fetch("/api/paypal/create-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(buildPayload()),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Could not start PayPal checkout.");
            return data.paypalOrderId;
          },
          onApprove: async (data: { orderID: string }) => {
            const res = await fetch(`/api/paypal/capture-order/${data.orderID}`, { method: "POST" });
            const result = await res.json();
            if (!res.ok) {
              onError(result.error || "Payment could not be completed.");
              return;
            }
            onSuccess(result.order.id, result.order.totalUsd);
          },
          onError: () => onError("PayPal payment error. Please try again or choose another payment method."),
        })
        .render("#paypal-button-container");
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [onValidate, buildPayload, onSuccess, onError]);

  return (
    <div>
      <div id="paypal-button-container" aria-disabled={disabled}></div>
    </div>
  );
}

function CashfreePanel({
  mode,
  onValidate,
  buildPayload,
  onSuccess,
  onError,
}: {
  mode: "sandbox" | "production";
  onValidate: () => boolean;
  buildPayload: () => Record<string, unknown>;
  onSuccess: (orderId: string, totalUsd: number) => void;
  onError: (message: string) => void;
}) {
  const [starting, setStarting] = useState(false);

  async function pay() {
    if (!onValidate()) return;
    setStarting(true);
    try {
      const res = await fetch("/api/cashfree/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error || "Could not start payment.");
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const CashfreeCtor = (window as any).Cashfree;
      if (!CashfreeCtor) {
        onError("Payment SDK failed to load. Please refresh and try again.");
        return;
      }
      const cashfree = CashfreeCtor({ mode });

      const result = await cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: "_modal",
      });

      if (result?.error) {
        onError("Payment was not completed. Please try again.");
        return;
      }

      // Never trust the modal's own result — always re-check with our
      // server, which re-checks with Cashfree directly, before treating the
      // order as paid.
      for (let attempt = 0; attempt < 5; attempt++) {
        const statusRes = await fetch(`/api/cashfree/order-status/${data.orderId}`);
        const statusData = await statusRes.json();
        if (statusData.status === "paid") {
          onSuccess(statusData.id, statusData.totalUsd);
          return;
        }
        if (statusData.status === "failed") {
          onError("Payment failed or was cancelled. Please try again.");
          return;
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
      onError("We're still confirming your payment — check Order Status by contacting support with your order reference, or try again.");
    } catch {
      onError("Network error while starting payment. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  return (
    <button type="button" className="btn btn-primary btn-lg btn-full" onClick={pay} disabled={starting}>
      {starting ? "Opening secure payment…" : "🔒 Pay with UPI / GPay / Card"}
    </button>
  );
}
