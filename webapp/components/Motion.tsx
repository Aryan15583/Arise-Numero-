"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Site-wide motion, in the spirit of a slow, premium landing page:
//  - Headings, text and cards below the fold rise and fade in as they scroll
//    into view; cards in a grid follow one another in a gentle stagger, and
//    section eyebrow lines draw outwards.
//  - Each new page drifts in, and the header settles into place on first load
//    (both pure CSS, see "MOTION" in globals.css).
// Only `opacity` and `translate` move, which the browser hands to the graphics
// chip, so it stays smooth on phones. The animations use the Web Animations
// API rather than classes or attributes, so the page's HTML is never touched
// (React hydrates parts of the page later and would object to changed markup).
// Nothing already on screen is hidden (no flicker), and it's all off for
// people who prefer reduced motion and in the admin panel.

// Grids whose children rise one after another.
const STAGGER_GRIDS = [
  ".product-grid", ".category-tiles", ".values-grid", ".testimonial-grid", ".how-grid",
  ".features-grid", ".cert-grid", ".packages-grid", ".mukhi-grid", ".guide-number-grid",
  ".guide-crystal-grid", ".guide-assoc-grid", ".guide-plans-grid", ".about-stats",
  ".faq-list", ".contact-info-list", ".reviews-list",
].map((g) => `${g} > *`);

// Single elements that rise on their own.
const SINGLES = [
  ".section-header > *",
  "main section > .container > :is(h2, .section-title, .section-subtitle, .hero-cta-group)",
  ".about-story-img", ".about-story-text > :is(h2, p)",
  ".numerology-text > *", ".numerology-widget-preview",
  ".guide-band :is(h2, .guide-lead)",
];

const SELECTOR = [...STAGGER_GRIDS, ...SINGLES].join(", ");
const EXCLUDE = ".hero, .mnav, .tabbar, .site-header, footer";
const STEP_MS = 80; // gap between items revealed together
const MAX_DELAY_MS = 480;
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

// What we've done with each element (kept out of the DOM on purpose).
type State = { hold?: Animation; done?: boolean };

export function Motion() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  // Once per load: let the CSS header intro finish; after that, moving between
  // pages doesn't replay it.
  useEffect(() => {
    if (isAdmin || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const settle = window.setTimeout(() => document.documentElement.classList.add("m-settled"), 1600);
    return () => window.clearTimeout(settle);
  }, [isAdmin]);

  // Per page: scroll reveals for whatever this page contains.
  useEffect(() => {
    if (isAdmin || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window) || typeof Element.prototype.animate !== "function") return;

    const states = new WeakMap<Element, State>();

    const reveal = (el: HTMLElement, delay: number) => {
      const state = states.get(el);
      if (!state || state.done) return;
      state.done = true;
      // "backwards" covers the delay, then lets go entirely once finished, so
      // nothing is left holding a transform.
      el.animate(
        [{ opacity: 0, translate: "0 26px" }, { opacity: 1, translate: "0 0" }],
        { duration: 950, delay, easing: EASE, fill: "backwards" }
      );
      state.hold?.cancel();
      state.hold = undefined;
      if (el.classList.contains("eyebrow")) {
        try {
          const line = { duration: 1100, delay: delay + 150, easing: EASE, fill: "backwards" as const };
          el.animate([{ scale: "0 1", transformOrigin: "right center" }, { scale: "1 1", transformOrigin: "right center" }], { ...line, pseudoElement: "::before" });
          if (el.closest(".section-header")) {
            el.animate([{ scale: "0 1", transformOrigin: "left center" }, { scale: "1 1", transformOrigin: "left center" }], { ...line, pseudoElement: "::after" });
          }
        } catch {
          // Older browsers can't animate pseudo-elements: the lines just show.
        }
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entering = entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
        // Reveal together whatever came into view together, top to bottom.
        entering.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
        entering.forEach((el, i) => {
          observer.unobserve(el);
          reveal(el, Math.min(i * STEP_MS, MAX_DELAY_MS));
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.01 }
    );

    // `initial`: the page has already been painted, so anything on screen stays
    // as it is (hiding it now would flicker). Later scans run before the next
    // paint, so cards that appear on screen (e.g. after a filter) can rise in.
    const scan = (initial: boolean) => {
      const fold = window.innerHeight;
      let i = 0;
      document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
        if (states.has(el) || el.closest(EXCLUDE)) return;
        const r = el.getBoundingClientRect();
        const onScreen = r.top < fold && r.bottom > 0;
        if ((onScreen || r.bottom <= 0) && initial) { states.set(el, { done: true }); return; }
        const state: State = { hold: el.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: "forwards" }) };
        states.set(el, state);
        if (onScreen) reveal(el, Math.min(i++ * STEP_MS, MAX_DELAY_MS));
        else observer.observe(el);
      });
    };
    scan(true);

    // Content added later (shop filters, reviews, a page replacing its loading
    // placeholder) joins in too.
    let frame = 0;
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => scan(false));
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Printing: show everything straight away.
    const showAll = () => document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
      const state = states.get(el);
      state?.hold?.cancel();
      if (state) state.done = true;
    });
    window.addEventListener("beforeprint", showAll);

    return () => {
      cancelAnimationFrame(frame);
      mo.disconnect();
      observer.disconnect();
      window.removeEventListener("beforeprint", showAll);
      // Leave nothing hidden if this page's setup is torn down early.
      showAll();
    };
  }, [pathname, isAdmin]);

  return null;
}
