"use client";

import Link from "next/link";
import { useCurrency } from "../CurrencyContext";
import { Icon } from "../Icon";
import { READING_PACKAGES } from "@/lib/reading-packages";

// The three reading plans as compact cards for guide pages. Each card links
// straight to the booking form with that plan already selected.
export function ReadingPlans({ heading, intro, eyebrow = "Personal readings" }: { heading: string; intro: string; eyebrow?: string }) {
  const { format } = useCurrency();
  return (
    <section className="section guide-plans" aria-labelledby="guide-plans-heading">
      <div className="container">
        <div className="section-header">
          <p className="eyebrow">{eyebrow}</p>
          <h2 id="guide-plans-heading" className="section-title">{heading}</h2>
          <p className="section-subtitle">{intro}</p>
        </div>
        <div className="guide-plans-grid" role="list">
          {READING_PACKAGES.map((p) => (
            <article key={p.key} className={`guide-plan ${p.popular ? "guide-plan--popular" : ""}`} role="listitem">
              {p.popular && <span className="guide-plan-badge">Most popular</span>}
              <h3 className="guide-plan-name">{p.name}</h3>
              <p className="guide-plan-price">{format(p.price)}</p>
              <p className="guide-plan-pitch">{p.pitch}</p>
              <ul className="guide-plan-features">
                {p.features.slice(0, 4).map((f) => (
                  <li key={f}><Icon name="check" size={16} /> {f}</li>
                ))}
              </ul>
              <Link
                href={`/booking?package=${p.key}#booking-form-section`}
                className={`btn ${p.popular ? "btn-primary" : "btn-outline"} btn-lg guide-plan-cta`}
              >
                Choose {p.name}
              </Link>
            </article>
          ))}
        </div>
        <p className="guide-plans-note">
          <Icon name="lock" size={14} /> Secure booking · Delivered by email · For entertainment &amp; self-insight only
        </p>
      </div>
    </section>
  );
}
