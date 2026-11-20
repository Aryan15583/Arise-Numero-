import type Lenis from "lenis";

// The page's smooth-scroll instance (set by components/SmoothScroll), so other
// parts of the site, like the mobile menu, can pause and resume it.
let instance: Lenis | null = null;

export function setSmoothScroll(lenis: Lenis | null) {
  instance = lenis;
}

export function getSmoothScroll(): Lenis | null {
  return instance;
}
