"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { setSmoothScroll } from "@/lib/smooth-scroll";

// Slow, gliding scroll for mouse wheels and trackpads (Lenis): each scroll eases
// out over ~1.1s instead of jumping. Phones keep their native touch scrolling,
// visitors who prefer reduced motion get normal scrolling, and the admin panel
// is left alone. In-page "#" links glide to their target below the header.
export function SmoothScroll() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdmin || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      autoRaf: true,
      anchors: { offset: -90, duration: 1.2 },
      // Let menus, dialogs and other scrollable panels scroll on their own.
      prevent: (node) => !!node.closest?.("[data-lenis-prevent], .mnav-panel, .modal, [role='dialog'], .cookie-modal"),
    });
    setSmoothScroll(lenis);
    return () => {
      setSmoothScroll(null);
      lenis.destroy();
    };
  }, [isAdmin]);

  return null;
}
