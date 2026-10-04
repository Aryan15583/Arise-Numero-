import Link from "next/link";
import { CookieSettingsLink } from "./CookieSettingsLink";
import { NewsletterForm } from "./NewsletterForm";
import { getSocialLinks } from "@/lib/social";

export function Footer({ minimal = false }: { minimal?: boolean }) {
  const year = new Date().getFullYear();

  if (minimal) {
    return (
      <footer className="site-footer site-footer--minimal" role="contentinfo">
        <div className="container">
          <p className="footer-legal-links">
            &copy; {year} Arise Numero. All rights reserved. &nbsp;|&nbsp;{" "}
            <Link href="/privacy">Privacy Policy</Link> &nbsp;|&nbsp; <Link href="/terms">Terms of Service</Link>{" "}
            &nbsp;|&nbsp; <Link href="/returns">Returns Policy</Link>
          </p>
        </div>
      </footer>
    );
  }

  const socials = getSocialLinks();

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Link href="/" className="logo" aria-label="Arise Numero Home">
            <span className="logo-symbol" aria-hidden="true">✦</span>
            <span className="logo-text">Arise Numero</span>
          </Link>
          <p>Authentic crystal bracelets &amp; numerology readings delivered worldwide.</p>
          {socials.length > 0 && (
            <div className="footer-socials" aria-label="Social media links">
              {socials.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={`Arise Numero on ${s.label}`}>
                  {s.label}
                </a>
              ))}
            </div>
          )}
          <NewsletterForm />
        </div>
        <nav className="footer-nav" aria-label="Shop navigation">
          <h4>Shop</h4>
          <ul role="list">
            <li><Link href="/shop">All Bracelets</Link></li>
            <li><Link href="/shop?cat=amethyst">Amethyst</Link></li>
            <li><Link href="/shop?cat=rose-quartz">Rose Quartz</Link></li>
            <li><Link href="/shop?cat=lapis-lazuli">Lapis Lazuli</Link></li>
            <li><Link href="/wishlist">Wishlist</Link></li>
            <li><Link href="/cart">Cart</Link></li>
          </ul>
        </nav>
        <nav className="footer-nav" aria-label="Numerology navigation">
          <h4>Numerology</h4>
          <ul role="list">
            <li><Link href="/numerology">Free Calculator</Link></li>
            <li><Link href="/booking">Book a Reading</Link></li>
            <li><Link href="/numerology#how-it-works">How It Works</Link></li>
          </ul>
        </nav>
        <nav className="footer-nav" aria-label="Legal and help navigation">
          <h4>Help &amp; Legal</h4>
          <ul role="list">
            <li><Link href="/track-order">Track Your Order</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/returns">Returns &amp; Shipping</Link></li>
            <li><Link href="/privacy">Privacy Policy</Link></li>
            <li><Link href="/terms">Terms of Service</Link></li>
            <li><CookieSettingsLink /></li>
          </ul>
        </nav>
      </div>

      <div className="footer-disclaimer">
        <div className="container">
          <p>
            <strong>Numerology Disclaimer:</strong> Numerology readings provided by Arise Numero are intended
            for self-insight and entertainment purposes only. They do not constitute legal, financial, medical,
            or professional psychological advice. Results are subjective and should not be used as the sole
            basis for any life decision.
          </p>
          <p className="footer-legal-links">
            &copy; {year} Arise Numero. All rights reserved. &nbsp;|&nbsp; <Link href="/privacy">Privacy Policy</Link>{" "}
            &nbsp;|&nbsp; <Link href="/terms">Terms of Service</Link> &nbsp;|&nbsp;{" "}
            <Link href="/returns">Returns Policy</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
