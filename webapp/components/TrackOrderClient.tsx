"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";
import { useCurrency } from "./CurrencyContext";

type TrackedOrder = {
  id: string;
  status: string;
  placedAt: string;
  paymentMethod: string | null;
  items: { name: string; qty: number; priceUsd: number; imageUrl: string | null }[];
  subtotalUsd: number;
  discountUsd: number;
  couponCode: string | null;
  shippingUsd: number;
  totalUsd: number;
  trackingNumber: string | null;
  carrier: string | null;
  shipTo: string | null;
  events: { status: string; note: string | null; at: string }[];
};

export const LAST_ORDER_KEY = "ariseNumero_lastOrder";

const STATUS_LABEL: Record<string, string> = {
  pending: "Order placed",
  paid: "Payment received",
  shipped: "Shipped",
  completed: "Completed",
  cancelled: "Cancelled",
  failed: "Payment failed",
};

const STATUS_HINT: Record<string, string> = {
  pending: "We've received your order and will confirm it shortly.",
  paid: "Payment confirmed — we're getting your order ready.",
  shipped: "Your order is on its way.",
  completed: "Your order is complete. We hope you love it!",
  cancelled: "This order was cancelled.",
  failed: "The payment didn't go through, so this order wasn't placed.",
};

const noSubscribe = () => () => {};
function readLastOrder(): string {
  try {
    return localStorage.getItem(LAST_ORDER_KEY) ?? "";
  } catch {
    return "";
  }
}

export function TrackOrderClient({ initialId }: { initialId?: string }) {
  const { format } = useCurrency();
  // Prefill from the order this browser placed last. Read through useSyncExternalStore (the
  // server renders ""), so there is no hydration mismatch and no effect needed.
  const lastRaw = useSyncExternalStore(noSubscribe, readLastOrder, () => "");
  let last: { id?: string; email?: string } = {};
  try {
    last = lastRaw ? JSON.parse(lastRaw) : {};
  } catch {
    last = {};
  }
  const [typedId, setTypedId] = useState<string | null>(null);
  const [typedEmail, setTypedEmail] = useState<string | null>(null);
  const orderId = typedId ?? initialId ?? (typeof last.id === "string" ? last.id : "");
  const email = typedEmail ?? (typeof last.email === "string" ? last.email : "");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function lookup(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderId.trim(), email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setOrder(data as TrackedOrder);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container track-layout">
      <form className="track-form" onSubmit={lookup}>
        <div className="form-group">
          <label className="form-label" htmlFor="track-id">Order number</label>
          <input id="track-id" className="form-input" value={orderId} onChange={(e) => setTypedId(e.target.value)} placeholder="From your confirmation email" required autoComplete="off" />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="track-email">Email used for the order</label>
          <input id="track-email" type="email" className="form-input" value={email} onChange={(e) => setTypedEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
        </div>
        <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
          {loading ? "Looking up…" : "Track order"}
        </button>
        {error && <p className="form-error" role="alert">{error}</p>}
      </form>

      {order && (
        <section className="track-result" aria-label={`Order ${order.id}`}>
          <div className="track-head">
            <div>
              <h2 className="track-title">Order <code>{order.id}</code></h2>
              <p className="text-muted">Placed {new Date(order.placedAt).toLocaleDateString(undefined, { dateStyle: "long" })}</p>
            </div>
            <span className={`track-status track-status--${order.status}`}>{STATUS_LABEL[order.status] || order.status}</span>
          </div>
          <p>{STATUS_HINT[order.status] || ""}</p>

          {order.trackingNumber && (
            <p className="track-tracking">
              <strong>Tracking:</strong> {order.carrier ? `${order.carrier} · ` : ""}
              <code>{order.trackingNumber}</code>
            </p>
          )}

          <h3 className="track-sub">Progress</h3>
          <ol className="track-timeline">
            {order.events.map((ev, i) => (
              <li key={i} className={i === order.events.length - 1 ? "is-current" : ""}>
                <strong>{STATUS_LABEL[ev.status] || ev.status}</strong>
                {ev.note && ev.note.trim().toLowerCase() !== (STATUS_LABEL[ev.status] || "").toLowerCase() && (
                  <span className="track-note">{ev.note}</span>
                )}
                <time dateTime={ev.at}>{new Date(ev.at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</time>
              </li>
            ))}
          </ol>

          <h3 className="track-sub">Items</h3>
          <table className="info-table" aria-label="Order items">
            <tbody>
              {order.items.map((it, i) => (
                <tr key={i}>
                  <td>{it.name} × {it.qty}</td>
                  <td style={{ textAlign: "right" }}>{format(it.priceUsd * it.qty)}</td>
                </tr>
              ))}
              {order.discountUsd > 0 && (
                <tr><td>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</td><td style={{ textAlign: "right" }}>−{format(order.discountUsd)}</td></tr>
              )}
              <tr><td>Shipping</td><td style={{ textAlign: "right" }}>{order.shippingUsd === 0 ? "Free" : format(order.shippingUsd)}</td></tr>
              <tr><td><strong>Total</strong></td><td style={{ textAlign: "right" }}><strong>{format(order.totalUsd)}</strong></td></tr>
            </tbody>
          </table>
          {order.shipTo && <p className="text-muted">Shipping to: {order.shipTo}</p>}
        </section>
      )}
    </div>
  );
}
