"use client";

import { useEffect } from "react";

// A gentle 3D tilt with a soft light sheen on product cards, following the
// mouse. Desktop mice only, and off for people who prefer reduced motion.
export function CardTilt() {
  useEffect(() => {
    const canTilt = window.matchMedia("(hover: hover) and (pointer: fine)").matches
      && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canTilt) return;

    let active: HTMLElement | null = null;
    let frame = 0;

    function reset(card: HTMLElement) {
      card.classList.remove("is-tilting");
      card.style.removeProperty("--tilt-x");
      card.style.removeProperty("--tilt-y");
    }

    function onMove(e: PointerEvent) {
      const card = (e.target as Element | null)?.closest?.(".product-card") as HTMLElement | null;
      if (active && active !== card) reset(active);
      active = card;
      if (!card) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width; // 0..1
        const y = (e.clientY - r.top) / r.height;
        card.classList.add("is-tilting");
        card.style.setProperty("--tilt-x", `${((0.5 - y) * 6).toFixed(2)}deg`);
        card.style.setProperty("--tilt-y", `${((x - 0.5) * 6).toFixed(2)}deg`);
        card.style.setProperty("--glare-x", `${(x * 100).toFixed(1)}%`);
        card.style.setProperty("--glare-y", `${(y * 100).toFixed(1)}%`);
      });
    }

    function onLeave() {
      if (active) reset(active);
      active = null;
    }

    document.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return null;
}
