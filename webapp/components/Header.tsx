"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "./CartContext";
import { useCurrency } from "./CurrencyContext";
import type { CurrencyCode } from "@/lib/currency";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/numerology", label: "Numerology" },
  { href: "/booking", label: "Book a Reading" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header({ variant = "default" }: { variant?: "default" | "checkout" }) {
  const pathname = usePathname();
  const { totalCount } = useCart();
  const { currency, setCurrency } = useCurrency();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className={`site-header ${variant === "checkout" ? "site-header--checkout" : ""}`} role="banner">
      <div className="header-inner container">
        <Link href="/" className="logo" aria-label="Arise Numero Home">
          <span className="logo-symbol" aria-hidden="true">✦</span>
          <span className="logo-text">Arise Numero</span>
        </Link>

        {variant === "checkout" ? (
          <div className="checkout-header-secure" aria-label="Secure checkout indicator">
            <span aria-hidden="true">🔒</span> Secure Checkout
          </div>
        ) : (
          <nav className="main-nav" role="navigation" aria-label="Main navigation">
            <ul className="nav-list" role="list">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`nav-link ${pathname === link.href ? "active" : ""}`}
                    aria-current={pathname === link.href ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="header-actions">
          {variant === "checkout" ? (
            <Link href="/cart" className="btn btn-ghost btn-sm" aria-label="Return to cart">
              ← Back to Cart
            </Link>
          ) : (
            <>
              <div className="currency-selector">
                <select
                  aria-label="Currency selection"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                >
                  <option value="USD">$ USD</option>
                  <option value="INR">₹ INR</option>
                  <option value="EUR">€ EUR</option>
                  <option value="GBP">£ GBP</option>
                  <option value="AUD">A$ AUD</option>
                </select>
              </div>

              <Link href="/cart" className="cart-btn" aria-label={`Shopping cart, ${totalCount} items`}>
                <span className="cart-icon" aria-hidden="true">🛒</span>
                <span className="cart-count" aria-live="polite">{totalCount}</span>
              </Link>

              <button
                className="mobile-menu-btn"
                aria-label={mobileOpen ? "Close mobile menu" : "Open mobile menu"}
                aria-expanded={mobileOpen}
                aria-controls="mobile-nav"
                onClick={() => setMobileOpen((v) => !v)}
              >
                <span className="hamburger" aria-hidden="true"></span>
              </button>
            </>
          )}
        </div>
      </div>

      {variant !== "checkout" && (
        <nav id="mobile-nav" className="mobile-nav" role="navigation" aria-label="Mobile navigation" hidden={!mobileOpen}>
          <ul className="mobile-nav-list" role="list">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="nav-link" onClick={() => setMobileOpen(false)}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
