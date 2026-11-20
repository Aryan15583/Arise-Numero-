"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCurrency } from "./CurrencyContext";
import { Icon } from "./Icon";
import { EXCHANGE_RATES, type CurrencyCode } from "@/lib/currency";
import { PRODUCT_TYPES } from "@/lib/product-types";
import { getSmoothScroll } from "@/lib/smooth-scroll";
import { thumbnailFor } from "@/lib/product-thumbs";
import { getSocialLinks } from "@/lib/social";

type NavLink = { href: string; label: string };
const CURRENCIES = Object.keys(EXCHANGE_RATES) as CurrencyCode[];
const social = getSocialLinks();

// One photo per category for the menu's category cards.
const CATEGORY_IMAGES: Record<string, string> = {
  "pyramid-bracelets": "/assets/products/howlite-pyramid-bracelet.jpg",
  pendants: "/assets/products/amethyst-pendant.jpg",
  rings: "/assets/products/amethyst-ring.jpg",
  pencils: "/assets/products/amethyst-pencil.jpg",
  anklets: "/assets/products/black-obsidian-anklet.jpg",
  rudraksha: "/assets/products/4-mukhi-rudraksha.jpg",
  "bowls-plates": "/assets/products/money-magnet-bowl.jpg",
  certificates: "/assets/products/authenticity-certificate.jpg",
};

// The phone menu: a panel that slides in from the right with search, the main
// pages, shop categories, currency, a reading call-to-action and help links.
// Locks page scrolling while open; closes on Esc, a tap outside, a swipe to the
// right, or navigating. (Cart and wishlist live in the bottom tab bar.)
export function MobileMenu({ open, onClose, links, isActive }: { open: boolean; onClose: () => void; links: NavLink[]; isActive: (href: string) => boolean }) {
  const pathname = usePathname();
  const router = useRouter();
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
    // Lock both <html> and <body>: iPhones keep scrolling the page if only body is locked.
    const html = document.documentElement;
    const previous = [html.style.overflow, document.body.style.overflow];
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    getSmoothScroll()?.stop();
    const opener = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab" || !panelRef.current) return;
      // Keep keyboard focus inside the menu while it's open.
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input")];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.querySelector<HTMLElement>(".mnav-close")?.focus();
    return () => {
      html.style.overflow = previous[0];
      document.body.style.overflow = previous[1];
      getSmoothScroll()?.start();
      window.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [open, onClose]);

  // Swipe right to close: the panel follows the finger, then closes past 80px.
  const drag = useRef<{ x: number; y: number; dx: number; axis: "x" | "y" | null } | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    drag.current = { x: t.clientX, y: t.clientY, dx: 0, axis: null };
  }
  function onTouchMove(e: React.TouchEvent) {
    const d = drag.current;
    const panel = panelRef.current;
    if (!d || !panel) return;
    const t = e.touches[0];
    const dx = t.clientX - d.x;
    const dy = t.clientY - d.y;
    if (!d.axis && Math.hypot(dx, dy) > 8) d.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    if (d.axis !== "x") return;
    d.dx = Math.max(0, dx);
    panel.style.transition = "none";
    panel.style.transform = `translateX(${d.dx}px)`;
  }
  function onTouchEnd() {
    const d = drag.current;
    const panel = panelRef.current;
    drag.current = null;
    if (!d || !panel || d.axis !== "x") return;
    panel.style.transition = "";
    panel.style.transform = "";
    if (d.dx > 80) onClose();
  }

  function search(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim().slice(0, 80);
    onClose();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }

  return (
    <div className={`mnav ${open ? "is-open" : ""}`} inert={!open} aria-hidden={!open}>
      <div className="mnav-backdrop" onClick={onClose} />
      <div ref={panelRef} id="mobile-nav" className="mnav-panel" role="dialog" aria-modal="true" aria-label="Menu" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
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
          <div className="mnav-section-head">
            <h2 id="mnav-shop-heading" className="mnav-label">Shop by category</h2>
            <Link href="/shop" className="mnav-see-all" onClick={onClose}>See all</Link>
          </div>
          <ul className="mnav-cats" role="list">
            {PRODUCT_TYPES.filter((t) => CATEGORY_IMAGES[t.slug]).map((t) => {
              const img = CATEGORY_IMAGES[t.slug];
              return (
                <li key={t.slug}>
                  <Link href={`/shop?type=${t.slug}`} onClick={onClose}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbnailFor(img) ?? img} alt="" width={64} height={64} loading="lazy" decoding="async" />
                    <span>{t.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

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

        <div className="mnav-foot">
          <ul className="mnav-help" role="list">
            <li><Link href="/track-order" onClick={onClose}><Icon name="truck" size={16} />Track order</Link></li>
            <li><Link href="/faq" onClick={onClose}>FAQ</Link></li>
            <li><Link href="/returns" onClick={onClose}>Returns</Link></li>
            <li><Link href="/contact" onClick={onClose}>Contact</Link></li>
          </ul>
          <p className="mnav-contact">
            <a href="mailto:arisenumero@gmail.com">arisenumero@gmail.com</a>
            {social.map((l) => (
              <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>
            ))}
          </p>
        </div>
      </div>
    </div>
  );
}
