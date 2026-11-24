"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { setSmoothScroll } from "@/lib/smooth-scroll";

// Slow, gliding scroll (Lenis). Mouse wheels and trackpads ease out over ~1.1s.
// On phones the page follows the finger 1:1, and a flick then glides on and
// eases to a soft stop, like the desktop wheel (our own momentum, modelled on
// iOS deceleration: faster flicks travel further and glide longer). Touching
// the screen mid-glide catches the page where it is.
// Sideways strips, menus and dialogs keep native scrolling; visitors who prefer
// reduced motion and the admin panel get normal scrolling. In-page "#" links
// glide to their target below the header.

const PREVENT = "[data-lenis-prevent], .mnav-panel, .modal, [role='dialog'], .cookie-modal";
const EASE = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

// Momentum tuning for touch flicks.
const VELOCITY_WINDOW_MS = 100; // finger movement considered when it lifts
const MIN_FLICK = 0.12; // px/ms; slower than this just stops where it is
const DISTANCE_PER_VELOCITY = 470; // px travelled per px/ms of flick speed
const MAX_DISTANCE_SCREENS = 3;

// True when the touch began inside something that scrolls on its own
// (a sideways strip, a scrollable panel), so the page shouldn't glide.
function inNestedScroller(target: EventTarget | null): boolean {
  let el = target instanceof Element ? target : null;
  while (el && el !== document.body && el !== document.documentElement) {
    if (el.closest(PREVENT)) return true;
    const style = getComputedStyle(el);
    const scrollsX = /(auto|scroll)/.test(style.overflowX) && el.scrollWidth > el.clientWidth + 1;
    const scrollsY = /(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1;
    if (scrollsX || scrollsY) return true;
    el = el.parentElement;
  }
  return false;
}

export function SmoothScroll() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdmin || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let samples: { t: number; y: number }[] = [];
    let nested = false;
    let caughtGlide = false; // this touch stopped a moving page
    let ignoreClickUntil = 0;

    // As with native phone scrolling, a tap that stops a gliding page only
    // stops it: it doesn't also open the link or button under the finger.
    const onClick = (e: MouseEvent) => {
      if (performance.now() > ignoreClickUntil) return;
      ignoreClickUntil = 0;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("click", onClick, true);

    const lenis: Lenis = new Lenis({
      duration: 1.1,
      easing: EASE,
      smoothWheel: true,
      wheelMultiplier: 1,
      syncTouch: true,
      touchMultiplier: 1,
      allowNestedScroll: true,
      autoRaf: true,
      anchors: { offset: -90, duration: 1.2 },
      // Let menus, dialogs and other scrollable panels scroll on their own.
      prevent: (node) => !!node.closest?.(PREVENT),
      virtualScroll: ({ event }) => {
        if (!("touches" in event)) return true; // wheel: handled as usual
        const now = event.timeStamp || performance.now();
        if (event.type === "touchstart") {
          nested = inNestedScroller(event.target);
          samples = [{ t: now, y: event.touches[0]?.clientY ?? 0 }];
          // Catch the page where it is, instead of letting the next finger
          // movement jump on to where the previous glide was heading.
          caughtGlide = !nested && lenis.isScrolling === "smooth" && Math.abs(lenis.velocity) > 0.5;
          if (caughtGlide) lenis.scrollTo(lenis.animatedScroll, { immediate: true });
          return true;
        }
        // A touch that began on a sideways strip, gallery or panel belongs to
        // the phone from start to finish: claiming even its first move would
        // stop that strip scrolling (fingers never move perfectly straight).
        if (nested) return false;
        if (event.type === "touchmove") {
          const y = event.touches[0]?.clientY;
          if (y !== undefined) {
            samples.push({ t: now, y });
            while (samples.length > 2 && now - samples[0].t > VELOCITY_WINDOW_MS) samples.shift();
          }
          return true;
        }
        if (event.type !== "touchend") return true;
        if (caughtGlide) {
          caughtGlide = false;
          ignoreClickUntil = performance.now() + 400;
        }

        // Finger lifted: work out how fast it was moving just before.
        const last = samples[samples.length - 1];
        const first = samples[0];
        samples = [];
        if (!last || !first || last === first || now - last.t > 80) return false; // held still: stay put
        const velocity = (first.y - last.y) / Math.max(16, last.t - first.t); // px/ms, + = down the page
        if (Math.abs(velocity) < MIN_FLICK) return false;
        const maxDistance = window.innerHeight * MAX_DISTANCE_SCREENS;
        const distance = Math.max(-maxDistance, Math.min(maxDistance, velocity * DISTANCE_PER_VELOCITY));
        const duration = Math.min(1.6, 0.75 + Math.abs(velocity) * 0.3);
        lenis.scrollTo(lenis.targetScroll + distance, { duration, easing: EASE });
        return false; // replaces Lenis's own (much shorter) flick
      },
    });
    setSmoothScroll(lenis);
    return () => {
      window.removeEventListener("click", onClick, true);
      setSmoothScroll(null);
      lenis.destroy();
    };
  }, [isAdmin]);

  return null;
}
