"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useCart } from "./CartContext";
import { useCurrency } from "./CurrencyContext";
import { useWishlist } from "./WishlistContext";
import type { CurrencyCode } from "@/lib/currency";
import { AnnouncementBar } from "./AnnouncementBar";
import { Icon } from "./Icon";
import { MobileMenu } from "./MobileMenu";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/numerology", label: "Numerology" },
  { href: "/booking", label: "Book a Reading" },
  { href: "/guides", label: "Guides" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header({ variant = "default" }: { variant?: "default" | "checkout" }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  const { totalCount } = useCart();
  const { currency, setCurrency } = useCurrency();
  const { ids: wishlistIds } = useWishlist();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/brand/logo-badge-160.png" alt="" className="logo-badge" width={52} height={52} />
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
                    className={`nav-link ${isActive(link.href) ? "active" : ""}`}
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

              <Link href="/wishlist" className="cart-btn header-wishlist" aria-label={`Wishlist, ${wishlistIds.length} saved`}>
                <Icon name="heart" />
                {wishlistIds.length > 0 && <span className="cart-count">{wishlistIds.length}</span>}
              </Link>

              <Link href="/cart" className="cart-btn" aria-label={`Shopping cart, ${totalCount} items`}>
                <Icon name="bag" />
                <span className="cart-count" aria-live="polite">{totalCount}</span>
              </Link>

              <button
                className={`mobile-menu-btn ${mobileOpen ? "is-open" : ""}`}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
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

    </header>
    {/* Outside <header>: its backdrop blur would otherwise trap the fixed panel. */}
    {variant !== "checkout" && (
      <MobileMenu open={mobileOpen} onClose={closeMobile} links={NAV_LINKS} isActive={isActive} />
    )}
    </>
  );
}
