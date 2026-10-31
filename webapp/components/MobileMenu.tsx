"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartContext";
import { useCurrency } from "./CurrencyContext";
import { useWishlist } from "./WishlistContext";
import { Icon } from "./Icon";
import { EXCHANGE_RATES, type CurrencyCode } from "@/lib/currency";
import { PRODUCT_TYPES } from "@/lib/product-types";

type NavLink = { href: string; label: string };
const CURRENCIES = Object.keys(EXCHANGE_RATES) as CurrencyCode[];

// The phone menu: a panel that slides in from the right with search, the main
// pages, shop categories, quick links, currency and a reading call-to-action.
// Locks page scrolling while open; closes on Esc, a tap outside, or navigating.
export function MobileMenu({ open, onClose, links, isActive }: { open: boolean; onClose: () => void; links: NavLink[]; isActive: (href: string) => boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { totalCount } = useCart();
  const { ids: wishlistIds } = useWishlist();
  const { currency, setCurrency } = useCurrency();
  const [query, setQuery] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  // Close whenever the page changes (e.g. after tapping a link).
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) onClose();
  }

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>(".mnav-close")?.focus();
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  function search(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim().slice(0, 80);
    onClose();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }

  return (
    <div className={`mnav ${open ? "is-open" : ""}`} inert={!open} aria-hidden={!open}>
      <div className="mnav-backdrop" onClick={onClose} />
      <div ref={panelRef} id="mobile-nav" className="mnav-panel" role="dialog" aria-modal="true" aria-label="Menu">
        <div className="mnav-head">
          <Link href="/" className="mnav-brand" onClick={onClose}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/brand/logo-badge-160.png" alt="" width={44} height={44} />
            <span>Arise Numero</span>
          </Link>
          <button type="button" className="mnav-close" onClick={onClose} aria-label="Close menu">
            <Icon name="close" size={22} />
          </button>
        </div>

        <form className="mnav-search" role="search" onSubmit={search}>
          <Icon name="search" size={18} />
          <label htmlFor="mnav-search-input" className="sr-only">Search the shop</label>
          <input
            id="mnav-search-input"
            type="search"
            placeholder="Search crystals, rings, rudraksha…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={80}
          />
        </form>

        <nav aria-label="Main navigation (mobile)">
          <ul className="mnav-links" role="list">
            {links.map((link, i) => (
              <li key={link.href} style={{ "--i": i } as React.CSSProperties}>
                <Link href={link.href} className={isActive(link.href) ? "is-active" : ""} aria-current={pathname === link.href ? "page" : undefined} onClick={onClose}>
                  <span>{link.label}</span>
                  <Icon name="arrowRight" size={18} />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section className="mnav-section" aria-labelledby="mnav-shop-heading">
          <h2 id="mnav-shop-heading" className="mnav-label">Shop by category</h2>
          <ul className="mnav-chips" role="list">
            {PRODUCT_TYPES.filter((t) => t.slug !== "bracelets").map((t) => (
              <li key={t.slug}>
                <Link href={`/shop?type=${t.slug}`} onClick={onClose}>{t.name}</Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="mnav-quick">
          <Link href="/wishlist" onClick={onClose}>
            <Icon name="heart" size={20} />
            <span>Wishlist</span>
            {wishlistIds.length > 0 && <em>{wishlistIds.length}</em>}
          </Link>
          <Link href="/cart" onClick={onClose}>
            <Icon name="bag" size={20} />
            <span>Cart</span>
            {totalCount > 0 && <em>{totalCount}</em>}
          </Link>
          <Link href="/track-order" onClick={onClose}>
            <Icon name="truck" size={20} />
            <span>Track order</span>
          </Link>
        </div>

        <section className="mnav-section" aria-labelledby="mnav-currency-heading">
          <h2 id="mnav-currency-heading" className="mnav-label">Currency</h2>
          <div className="mnav-currency" role="radiogroup" aria-labelledby="mnav-currency-heading">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={currency === c}
                className={currency === c ? "is-active" : ""}
                onClick={() => setCurrency(c)}
              >
                <strong>{EXCHANGE_RATES[c].symbol}</strong>
                <span>{c}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="mnav-cta">
          <p className="mnav-cta-kicker">Free tool</p>
          <p className="mnav-cta-title">Discover your Life Path number</p>
          <div className="mnav-cta-actions">
            <Link href="/numerology" className="btn btn-primary" onClick={onClose}>Free Calculator</Link>
            <Link href="/booking" className="btn btn-outline btn-outline--light" onClick={onClose}>Book a Reading</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
