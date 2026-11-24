"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartContext";
import { useWishlist } from "./WishlistContext";
import { Icon, type IconName } from "./Icon";

const TABS: { href: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
  { href: "/", label: "Home", icon: "home", match: (p) => p === "/" },
  { href: "/shop", label: "Shop", icon: "grid", match: (p) => p.startsWith("/shop") || p.startsWith("/product") },
  { href: "/numerology", label: "Numbers", icon: "sparkle", match: (p) => p.startsWith("/numerology") || p.startsWith("/booking") || p.startsWith("/guides") },
  { href: "/wishlist", label: "Wishlist", icon: "heart", match: (p) => p.startsWith("/wishlist") },
  { href: "/cart", label: "Cart", icon: "bag", match: (p) => p.startsWith("/cart") },
];

// App-style bottom bar on phones: the main destinations are always one tap away.
// Slides out of the way while scrolling down and returns when scrolling up.
// Not shown in checkout (no distractions while paying) or the admin panel.
export function MobileTabBar() {
  const pathname = usePathname();
  const { totalCount } = useCart();
  const { ids: wishlistIds } = useWishlist();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  // Bring the bar back whenever the bag count changes, so "added" is visible.
  const [lastCount, setLastCount] = useState(totalCount);
  if (totalCount !== lastCount) {
    setLastCount(totalCount);
    setHidden(false);
  }

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (Math.abs(delta) < 6) return;
      // Near the bottom of the page the bar stays visible (the footer is there).
      const nearEnd = window.innerHeight + y >= document.documentElement.scrollHeight - 120;
      setHidden(delta > 0 && y > 200 && !nearEnd);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/admin") || pathname.startsWith("/checkout")) return null;

  const counts: Record<string, number> = { "/wishlist": wishlistIds.length, "/cart": totalCount };
  return (
    <>
      <div className="tabbar-spacer" aria-hidden="true" />
      <nav className={`tabbar ${hidden ? "is-hidden" : ""}`} aria-label="Quick navigation">
        {TABS.map((t) => {
          const active = t.match(pathname);
          const count = counts[t.href] ?? 0;
          return (
            <Link key={t.href} href={t.href} className={`tabbar-item ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined}>
              <span className="tabbar-icon">
                <Icon name={t.icon} size={22} />
                {count > 0 && <span className="tabbar-count">{count > 99 ? "99+" : count}</span>}
              </span>
              <span className="tabbar-label">{t.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
