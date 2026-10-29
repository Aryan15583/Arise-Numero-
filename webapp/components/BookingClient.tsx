"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useCurrency } from "./CurrencyContext";
import { Icon } from "./Icon";

const PACKAGES = [
  {
    key: "core",
    name: "Core Blueprint",
    price: 49.99,
    features: [
      "Life Path Number Analysis",
      "Expression Number Report",
      "Soul Urge Number Insight",
      "Written PDF Report (10–12 pages)",
      "Delivered in 3–5 business days",
    ],
    popular: false,
  },
  {
    key: "full",
    name: "Full Numeroscope",
    price: 89.99,
    features: [
      "Everything in Core Blueprint",
      "Personal Year & Monthly Forecast",
      "Birthday & Personality Numbers",
      "Compatibility Overview",
      "Comprehensive PDF (20–25 pages)",
      "Delivered in 5–7 business days",
    ],
    popular: true,
  },
  {
    key: "premium",
    name: "Premium + Live Session",
    price: 149.99,
    features: [
      "Everything in Full Numeroscope",
      "45-minute live video session",
      "Career & Life Purpose Deep Dive",
      "Q&A with your numerologist",
      "Session recording provided",
      "Scheduled at your convenience",
    ],
    popular: false,
  },
];

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "India Standard Time (IST, UTC+5:30)" },
  { value: "America/New_York", label: "Eastern Time (ET, UTC-5/-4)" },
  { value: "America/Chicago", label: "Central Time (CT, UTC-6/-5)" },
  { value: "America/Denver", label: "Mountain Time (MT, UTC-7/-6)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT, UTC-8/-7)" },
  { value: "Europe/London", label: "GMT / BST (UTC+0/+1)" },
  { value: "Europe/Paris", label: "Central European Time (CET, UTC+1/+2)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AEST, UTC+10/+11)" },
  { value: "Asia/Dubai", label: "Gulf Standard Time (GST, UTC+4)" },
  { value: "Asia/Singapore", label: "Singapore Time (SGT, UTC+8)" },
];

const FOCUS_OPTIONS = [
  { value: "career", label: "Career & Life Purpose" },
  { value: "relationships", label: "Relationships & Compatibility" },
  { value: "finance", label: "Finances & Abundance" },
  { value: "health", label: "Health & Wellbeing" },
  { value: "spirituality", label: "Spiritual Growth" },
];

function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

const noSubscribe = () => () => {};

export function BookingClient() {
  const { format } = useCurrency();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [birthName, setBirthName] = useState("");
  const [dob, setDob] = useState("");
  // Default to the visitor's own timezone (when it's one we offer) until they pick another. Read via
  // useSyncExternalStore so the server renders "" and the client fills it in without a hydration mismatch.
  const detectedTz = useSyncExternalStore(noSubscribe, browserTimezone, () => "");
  const [pickedTz, setPickedTz] = useState<string | null>(null);
  const timezone = pickedTz ?? (TIMEZONES.some((t) => t.value === detectedTz) ? detectedTz : "");
  const [sessionDate, setSessionDate] = useState("");
  const [minSessionDate] = useState(() => new Date(Date.now() + 86400000).toISOString().split("T")[0]);
  const [focus, setFocus] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [disclaimerConsent, setDisclaimerConsent] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function toggleFocus(value: string) {
    setFocus((prev) => (prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value]));
  }

  const pkg = PACKAGES.find((p) => p.key === selectedPackage);
  const isPremium = selectedPackage === "premium";

  function selectPackage(key: string) {
    setSelectedPackage(key);
    document.getElementById("booking-form-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPackage) return setError("Please select a reading package above.");
    if (!firstName || !lastName || !email || !birthName || !dob) return setError("Please fill in all required fields.");
    if (isPremium && !sessionDate) return setError("Please select a preferred session date for your live session.");
    if (!privacyConsent || !disclaimerConsent || !termsConsent) return setError("Please accept all required consents.");

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          clientEmail: email,
          birthName,
          dateOfBirth: dob,
          packageSelected: selectedPackage,
          timezone,
          sessionDate: isPremium ? sessionDate : null,
          readingFocus: focus,
          additionalNotes: notes,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Could not submit your booking. Please try again.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="section" aria-labelledby="packages-heading">
        <div className="container">
          <h2 id="packages-heading" className="section-title text-center">Choose Your Package</h2>
          <div className="packages-grid" role="list" aria-label="Reading package options">
            {PACKAGES.map((p) => (
              <article
                key={p.key}
                className={`package-card ${p.popular ? "package-card--popular" : ""} ${selectedPackage === p.key ? "package-card--selected" : ""}`}
                role="listitem"
              >
                {p.popular && <div className="popular-badge">Most Popular</div>}
                <div className="package-header">
                  <h3 className="package-name">{p.name}</h3>
                  <div className="package-price">{format(p.price)}</div>
                </div>
                <ul className="package-features">
                  {p.features.map((f) => <li key={f}>✓ {f}</li>)}
                </ul>
                <button
                  className={`btn ${p.popular ? "btn-primary" : "btn-outline"} btn-lg`}
                  onClick={() => selectPackage(p.key)}
                  style={{ width: "100%" }}
                >
                  Select Package
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section booking-form-section" id="booking-form-section" aria-labelledby="booking-form-heading">
        <div className="container booking-layout">
          <div className="booking-form-wrap">
            <h2 id="booking-form-heading" className="section-title">Your Information</h2>

            <div className="data-notice" role="note">
              <strong>Why we collect this information:</strong>
              <p>
                We require your full birth name and date of birth <strong>strictly</strong> to calculate your numeric
                blueprint. This information is used solely for your reading and is never shared with third parties.
                Please review our <Link href="/privacy">Privacy Policy</Link>.
              </p>
            </div>

            {success ? (
              <div className="form-success" role="status">
                <strong>✓ Booking Confirmed!</strong><br />
                We have received your booking. A confirmation has been sent to <strong>{email}</strong>. We will be in
                touch within 24 hours.
              </div>
            ) : (
              <form className="booking-form" noValidate onSubmit={handleSubmit} aria-label="Numerology reading intake form">
                <div className="selected-package-display" aria-live="polite">
                  <p>
                    Selected: <strong>{pkg ? pkg.name : "Please select a package above"}</strong>
                    {pkg && <> &mdash; <span>{format(pkg.price)}</span></>}
                  </p>
                </div>

                <fieldset className="checkout-fieldset">
                  <legend className="checkout-section-title">Personal Details</legend>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label" htmlFor="book-first">First Name <span className="required">*</span></label>
                      <input type="text" id="book-first" className="form-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="book-last">Last Name <span className="required">*</span></label>
                      <input type="text" id="book-last" className="form-input" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Smith" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="book-email">Email Address <span className="required">*</span></label>
                    <input type="email" id="book-email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
                    <p className="form-hint">Your completed reading will be delivered to this email address.</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="book-birth-name">Full Birth Name <span className="required">*</span></label>
                    <input type="text" id="book-birth-name" className="form-input" value={birthName} onChange={(e) => setBirthName(e.target.value)} placeholder="Jane Elizabeth Smith" />
                    <p className="form-hint">Enter your full legal name as recorded on your birth certificate.</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="book-dob">Date of Birth <span className="required">*</span></label>
                    <input type="date" id="book-dob" className="form-input" value={dob} onChange={(e) => setDob(e.target.value)} />
                  </div>
                </fieldset>

                <fieldset className="checkout-fieldset">
                  <legend className="checkout-section-title">Scheduling &amp; Timezone</legend>
                  <p className="form-hint">All times are automatically converted to your local timezone.</p>
                  <div className="form-group">
                    <label className="form-label" htmlFor="book-timezone">Your Timezone <span className="required">*</span></label>
                    <select id="book-timezone" className="form-input" value={timezone} onChange={(e) => setPickedTz(e.target.value)}>
                      <option value="">Select your timezone…</option>
                      {TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                    </select>
                  </div>
                  {isPremium && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="book-session-date">Preferred Session Date <span className="required">*</span></label>
                      <input
                        type="date"
                        id="book-session-date"
                        className="form-input"
                        value={sessionDate}
                        min={minSessionDate}
                        onChange={(e) => setSessionDate(e.target.value)}
                      />
                      <p className="form-hint">Available Monday–Saturday. Times confirmed by email within 24 hours.</p>
                    </div>
                  )}
                </fieldset>

                <fieldset className="checkout-fieldset">
                  <legend className="checkout-section-title">Reading Focus <span className="optional-label">(optional)</span></legend>
                  <div className="form-group">
                    <label className="form-label">What areas would you like the reading to focus on?</label>
                    <div className="focus-checkboxes" role="group" aria-label="Reading focus areas">
                      {FOCUS_OPTIONS.map((f) => (
                        <label className="checkbox-label" key={f.value}>
                          <input type="checkbox" checked={focus.includes(f.value)} onChange={() => toggleFocus(f.value)} /> {f.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="book-notes">Additional Notes</label>
                    <textarea id="book-notes" className="form-input form-textarea" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any specific questions or areas you'd like addressed…" />
                  </div>
                </fieldset>

                <div className="checkout-consent">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={privacyConsent} onChange={(e) => setPrivacyConsent(e.target.checked)} />
                    I consent to my name and date of birth being used <strong>strictly</strong> to calculate my numerology reading per the <Link href="/privacy" target="_blank">Privacy Policy</Link>. <span className="required">*</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={disclaimerConsent} onChange={(e) => setDisclaimerConsent(e.target.checked)} />
                    I understand this reading is for <strong>entertainment and self-insight purposes only</strong>. <span className="required">*</span>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={termsConsent} onChange={(e) => setTermsConsent(e.target.checked)} />
                    I agree to the <Link href="/terms" target="_blank">Terms of Service</Link> <span className="required">*</span>
                  </label>
                </div>

                {error && <p className="form-error" role="alert">{error}</p>}

                <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
                  {submitting ? "Submitting…" : "Confirm Booking"}
                </button>

                <p className="checkout-final-note">Payment instructions (Bank Transfer / Cash on Delivery) will be sent to your email after booking.</p>
              </form>
            )}
          </div>

          <aside className="booking-sidebar" aria-labelledby="booking-sidebar-heading">
            <h2 id="booking-sidebar-heading" className="summary-title">What to Expect</h2>
            <ol className="booking-steps-list" role="list">
              <li><strong>Submit</strong> — Complete the intake form above.</li>
              <li><strong>Confirmation</strong> — You&apos;ll receive an email confirmation within minutes.</li>
              <li><strong>Reading Prepared</strong> — Your numerologist calculates and writes your report.</li>
              <li><strong>Delivery</strong> — Your PDF report (and session link if applicable) is emailed to you.</li>
              <li><strong>Follow-up</strong> — Reply to your report email with any follow-up questions.</li>
            </ol>
            <div className="booking-disclaimer-box" role="note">
              <strong>Reminder:</strong> All readings are for entertainment and self-insight purposes only.
            </div>
            <div className="booking-security">
              <p><Icon name="lock" size={16} /> Secure &amp; private</p>
              <p><Icon name="globe" size={16} /> Available worldwide</p>
              <p><Icon name="clock" size={16} /> Timezone auto-detected</p>
              <p><Icon name="mail" size={16} /> Delivered by email</p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
