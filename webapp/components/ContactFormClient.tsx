"use client";

import { useState } from "react";
import Link from "next/link";

export function ContactFormClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [message, setMessage] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const showOrderField = subject === "order" || subject === "return";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim() || !privacyConsent) {
      setError("Please fill in all required fields and accept the privacy notice.");
      setStatus("error");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, orderNumber, message }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("success");
      setName("");
      setEmail("");
      setSubject("");
      setOrderNumber("");
      setMessage("");
      setPrivacyConsent(false);
    } catch {
      setStatus("error");
      setError("There was an error sending your message. Please try again or email us directly.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="contact-form" noValidate onSubmit={handleSubmit} aria-label="Contact form">
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="contact-name">Your Name <span className="required">*</span></label>
          <input type="text" id="contact-name" className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="contact-email-field">Email Address <span className="required">*</span></label>
          <input type="email" id="contact-email-field" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="contact-subject">Subject <span className="required">*</span></label>
        <select id="contact-subject" className="form-input" value={subject} onChange={(e) => setSubject(e.target.value)}>
          <option value="">Select a topic…</option>
          <option value="order">Order / Tracking Enquiry</option>
          <option value="product">Product Question</option>
          <option value="return">Return / Refund Request</option>
          <option value="numerology">Numerology Reading Enquiry</option>
          <option value="wholesale">Wholesale / Partnership</option>
          <option value="other">Other</option>
        </select>
      </div>

      {showOrderField && (
        <div className="form-group">
          <label className="form-label" htmlFor="contact-order-num">Order Number <span className="optional-label">(if applicable)</span></label>
          <input type="text" id="contact-order-num" className="form-input" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="e.g. cl8f92a1" />
        </div>
      )}

      <div className="form-group">
        <label className="form-label" htmlFor="contact-message">Message <span className="required">*</span></label>
        <textarea id="contact-message" className="form-input form-textarea" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="How can we help you?" />
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input type="checkbox" checked={privacyConsent} onChange={(e) => setPrivacyConsent(e.target.checked)} />
          I agree that my submitted data is collected and stored per the <Link href="/privacy" target="_blank">Privacy Policy</Link> <span className="required">*</span>
        </label>
      </div>

      <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
        {submitting ? "Sending…" : "Send Message"}
      </button>

      {status === "success" && (
        <div className="form-success" role="status" aria-live="polite">
          <span aria-hidden="true">✅</span> Thank you! Your message has been sent. We&apos;ll reply within 24–48 hours.
        </div>
      )}
      {status === "error" && (
        <div className="form-error" role="alert" aria-live="assertive">
          <span aria-hidden="true">⚠️</span> {error}
        </div>
      )}
    </form>
  );
}
