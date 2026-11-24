"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { setSmoothScroll } from "@/lib/smooth-scroll";

// Slow, gliding scroll (Lenis) for mouse wheels and trackpads: each wheel
// movement eases out over ~1.1s.
// Phones and tablets don't load Lenis at all and keep their own native
// scrolling on purpose. It runs on the graphics chip at the screen's full
// refresh rate (often 120Hz) with the phone's own momentum and bounce, which is
// as fluid as touch scrolling gets. Driving touch from JavaScript (Lenis
// "syncTouch") is capped at 60fps on iPhones and stutters whenever the page is
// busy, and even without it Lenis listens to touches in blocking mode, which
// makes the phone wait for JavaScript before every scroll step.
// Menus and dialogs scroll on their own; visitors who prefer reduced motion and
// the admin panel get normal scrolling. In-page "#" links glide to their target
// below the header.
export function SmoothScroll() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdmin || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Touch-first devices (no mouse): native scrolling, see above.
    if (window.matchMedia("(hover: none) and (pointer: coarse)").matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
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
