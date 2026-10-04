"use client";

import { useState } from "react";
import Link from "next/link";
import { calcBirthday, calcExpression, calcLifePath, calcSoulUrge, getMeaning } from "@/lib/numerology";

type Results = { lifePath: number; expression: number; soulUrge: number; birthday: number };

export function NumerologyCalculator() {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Results | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !dob) {
      setError("Please enter your full birth name and date of birth.");
      return;
    }
    if (!consent) {
      setError("Please accept the privacy notice to continue.");
      return;
    }
    setError(null);
    setResults({
      lifePath: calcLifePath(dob),
      expression: calcExpression(name),
      soulUrge: calcSoulUrge(name),
      birthday: calcBirthday(dob),
    });
  }

  return (
    <div className="numerology-layout">
      <div className="numerology-form-wrap">
        <form className="numerology-form" noValidate onSubmit={handleSubmit} aria-label="Numerology calculator form">
          <div className="form-group">
            <label className="form-label" htmlFor="num-name">
              Full Birth Name <span className="required">*</span>
              <button type="button" className="info-tooltip-btn" title="The full name given at birth is used to calculate your Expression number">ℹ</button>
            </label>
            <input
              type="text"
              id="num-name"
              className="form-input"
              placeholder="e.g. Jane Elizabeth Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <p className="form-hint">Enter your full name exactly as recorded on your birth certificate. Used solely to calculate your numeric blueprint.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="num-dob">Date of Birth <span className="required">*</span></label>
            <input type="date" id="num-dob" className="form-input" value={dob} onChange={(e) => setDob(e.target.value)} />
            <p className="form-hint">Your date of birth is used to calculate your Life Path number.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="num-email">Email Address <span className="optional-label">(optional)</span></label>
            <input type="email" id="num-email" className="form-input" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <p className="form-hint">Optional. We do not share your email with third parties. See our <Link href="/privacy">Privacy Policy</Link>.</p>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              I understand my name and date of birth are used <strong>strictly</strong> to calculate my numeric blueprint and for no other purpose. <Link href="/privacy" target="_blank">Privacy Policy</Link> <span className="required">*</span>
            </label>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button type="submit" className="btn btn-primary btn-lg">✦ Calculate My Numbers</button>
        </form>
      </div>

      {results && (
        <div className="numerology-results" aria-live="polite" aria-label="Numerology reading results">
          <div className="results-header">
            <h2 className="results-title">Your Numerology Report</h2>
            <p className="results-name">Reading for: {name}</p>
            <div className="entertainment-disclaimer-sm" role="note">For entertainment &amp; self-insight only. Not professional advice.</div>
          </div>

          <div className="number-card number-card--primary">
            <div className="number-big" aria-label="Life Path Number">{results.lifePath}</div>
            <div className="number-info">
              <h3 className="number-title">Life Path Number</h3>
              <p className="number-description">{getMeaning(results.lifePath).title} — {getMeaning(results.lifePath).desc}</p>
            </div>
          </div>

          <div className="number-card">
            <div className="number-big number-big--sm" aria-label="Expression Number">{results.expression}</div>
            <div className="number-info">
              <h3 className="number-title">Expression Number</h3>
              <p className="number-description">{getMeaning(results.expression).title} — {getMeaning(results.expression).desc}</p>
            </div>
          </div>

          <div className="number-card">
            <div className="number-big number-big--sm" aria-label="Soul Urge Number">{results.soulUrge}</div>
            <div className="number-info">
              <h3 className="number-title">Soul Urge Number</h3>
              <p className="number-description">{getMeaning(results.soulUrge).title} — {getMeaning(results.soulUrge).desc}</p>
            </div>
          </div>

          <div className="number-card">
            <div className="number-big number-big--sm" aria-label="Birthday Number">{results.birthday}</div>
            <div className="number-info">
              <h3 className="number-title">Birthday Number</h3>
              <p className="number-description">{getMeaning(results.birthday).title} — {getMeaning(results.birthday).desc}</p>
            </div>
          </div>

          <div className="results-cta">
            <p>Want a <strong>deeper, personalised reading</strong> with a one-to-one session?</p>
            <Link href="/booking" className="btn btn-primary btn-lg">Book a Full Reading</Link>
          </div>

          <div className="results-disclaimer" role="note">
            <p><strong>Disclaimer:</strong> This numerology reading is provided for self-insight and entertainment purposes only. Results are based on traditional numerological systems and should not be used as the sole basis for any personal, financial, medical, or life decision.</p>
          </div>
        </div>
      )}
    </div>
  );
}
