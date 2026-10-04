"use client";

import { FormEvent, useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — humans never see this field
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    setMessage("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState("error");
        setMessage(data.error || "Couldn't subscribe — please try again.");
        return;
      }
      setState("done");
      setEmail("");
    } catch {
      setState("error");
      setMessage("Network error — please try again.");
    }
  }

  if (state === "done") {
    return (
      <p className="newsletter-done" role="status">
        ✓ Thanks for subscribing! Check your inbox for a welcome note.
      </p>
    );
  }

  return (
    <form className="newsletter-form" onSubmit={submit} noValidate>
      <label htmlFor="newsletter-email" className="newsletter-label">Join our newsletter</label>
      <div className="newsletter-row">
        <input
          id="newsletter-email"
          type="email"
          className="newsletter-input"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <button type="submit" className="btn btn-primary btn-sm" disabled={state === "sending"}>
          {state === "sending" ? "…" : "Subscribe"}
        </button>
      </div>
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="newsletter-hp"
      />
      {state === "error" && <p className="newsletter-error" role="alert">{message}</p>}
      <p className="newsletter-fineprint">New collections &amp; numerology tips. Unsubscribe any time.</p>
    </form>
  );
}
