"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { setSmoothScroll } from "@/lib/smooth-scroll";

// Slow, gliding scroll (Lenis). Mouse wheels and trackpads ease out over ~1.1s;
// on phones the page follows the finger 1:1 and then glides to a soft stop.
// Sideways strips, menus and dialogs keep native scrolling; visitors who prefer
// reduced motion and the admin panel get normal scrolling. In-page "#" links
// glide to their target below the header.
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
      syncTouch: true,
      syncTouchLerp: 0.085,
      touchMultiplier: 1,
      allowNestedScroll: true,
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
