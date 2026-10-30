import Link from "next/link";
import { Icon } from "../Icon";

// "What this page can't tell you": the parts of a reading that depend on the
// visitor's own name and date of birth, shown as locked items with a CTA.
export function LockedInsights({ heading, intro, items }: { heading: string; intro: string; items: string[] }) {
  return (
    <section className="section guide-locked" aria-labelledby="guide-locked-heading">
      <div className="container guide-locked-inner">
        <div className="guide-locked-text">
          <p className="eyebrow eyebrow--light">Go deeper</p>
          <h2 id="guide-locked-heading" className="section-title">{heading}</h2>
          <p className="guide-locked-intro">{intro}</p>
          <div className="guide-locked-actions">
            <Link href="/booking?package=full#booking-form-section" className="btn btn-primary btn-lg">Get My Full Reading</Link>
            <Link href="/numerology" className="btn btn-outline btn-outline--light btn-lg">Free Calculator</Link>
          </div>
        </div>
        <ul className="guide-locked-list" role="list">
          {items.map((item) => (
            <li key={item}>
              <span className="guide-locked-icon" aria-hidden="true"><Icon name="lock" size={18} /></span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
