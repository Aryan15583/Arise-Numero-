"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "./CartContext";
import { useCurrency } from "./CurrencyContext";
import { useWishlist } from "./WishlistContext";
import type { CurrencyCode } from "@/lib/currency";
import { AnnouncementBar } from "./AnnouncementBar";
import { Icon } from "./Icon";

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
  const { ids: wishlistIds } = useWishlist();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchTerm.trim().slice(0, 80);
    setSearchOpen(false);
    setMobileOpen(false);
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }

  return (
    <>
    {variant !== "checkout" && <AnnouncementBar />}
    <header className={`site-header ${variant === "checkout" ? "site-header--checkout" : ""}`} role="banner">
      <div className="header-inner container">
        <Link href="/" className="logo" aria-label="Arise Numero Home">
          <span className="logo-symbol" aria-hidden="true">✦</span>
          <span className="logo-text">Arise Numero</span>
        </Link>

        {variant === "checkout" ? (
          <div className="checkout-header-secure" aria-label="Secure checkout indicator">
            <Icon name="lock" size={16} /> Secure Checkout
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

              <button
                type="button"
                className="cart-btn header-search-btn"
                aria-label={searchOpen ? "Close search" : "Search products"}
                aria-expanded={searchOpen}
                aria-controls="header-search"
                onClick={() => setSearchOpen((v) => !v)}
              >
                <Icon name={searchOpen ? "close" : "search"} />
              </button>

              <Link href="/wishlist" className="cart-btn" aria-label={`Wishlist, ${wishlistIds.length} saved`}>
                <Icon name="heart" />
                {wishlistIds.length > 0 && <span className="cart-count">{wishlistIds.length}</span>}
              </Link>

              <Link href="/cart" className="cart-btn" aria-label={`Shopping cart, ${totalCount} items`}>
                <Icon name="bag" />
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

      {variant !== "checkout" && searchOpen && (
        <form id="header-search" className="header-search container" role="search" onSubmit={submitSearch}>
          <label htmlFor="header-search-input" className="sr-only">Search bracelets</label>
          <input
            id="header-search-input"
            type="search"
            className="form-input"
            placeholder="Search bracelets — amethyst, protection, 8mm…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
            autoFocus
            maxLength={80}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      )}

      {variant !== "checkout" && (
        <nav id="mobile-nav" className="mobile-nav" role="navigation" aria-label="Mobile navigation" hidden={!mobileOpen}>
          <form className="mobile-nav-search" role="search" onSubmit={submitSearch}>
            <label htmlFor="mobile-search-input" className="sr-only">Search bracelets</label>
            <input
              id="mobile-search-input"
              type="search"
              className="form-input"
              placeholder="Search bracelets…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              maxLength={80}
            />
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
          </form>
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
    </>
  );
}
