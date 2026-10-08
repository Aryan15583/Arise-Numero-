"use client";

import { useState } from "react";

// Shown on sold-out products: one email when the product is restocked.
export function BackInStockForm({ productId, productName }: { productId: string; productName: string }) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/stock-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, email, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save your alert. Please try again.");
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your alert. Please try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="back-in-stock back-in-stock--done" role="status">
        ✓ We&apos;ll email <strong>{email}</strong> as soon as {productName} is back.
      </div>
    );
  }

  return (
    <form className="back-in-stock" onSubmit={handleSubmit} aria-label={`Get notified when ${productName} is back in stock`}>
      <p className="back-in-stock-title">Sold out — get an email when it&apos;s back</p>
      <div className="back-in-stock-row">
        <label htmlFor="bis-email" className="sr-only">Email address</label>
        <input
          id="bis-email"
          type="email"
          required
          className="form-input"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <button type="submit" className="btn btn-primary" disabled={status === "sending"}>
          {status === "sending" ? "Saving…" : "Notify me"}
        </button>
      </div>
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="newsletter-hp"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        name="website"
      />
      {status === "error" && <p className="form-error" role="alert">{error}</p>}
      <p className="back-in-stock-note">One email only. We won&apos;t add you to any mailing list.</p>
    </form>
  );
}
