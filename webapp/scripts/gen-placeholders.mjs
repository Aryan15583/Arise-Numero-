// One-off generator for product/portrait placeholder art, run manually with:
//   node scripts/gen-placeholders.mjs
// Not part of the app runtime — output is committed to public/assets.
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT_DIR = join(process.cwd(), "public", "assets");
mkdirSync(OUT_DIR, { recursive: true });

function gradientCard({ id, from, to, accent, label, symbol = "✦" }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="g-${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${from}" />
      <stop offset="100%" stop-color="${to}" />
    </linearGradient>
    <radialGradient id="glow-${id}" cx="50%" cy="35%" r="60%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.55" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="400" height="400" fill="url(#g-${id})" />
  <rect width="400" height="400" fill="url(#glow-${id})" />
  <circle cx="200" cy="150" r="70" fill="${accent}" opacity="0.18" />
  <text x="200" y="168" font-family="Georgia, serif" font-size="64" fill="${accent}" text-anchor="middle" opacity="0.9">${symbol}</text>
  <text x="200" y="330" font-family="Georgia, serif" font-size="26" fill="#f0eafa" text-anchor="middle" opacity="0.92">${label}</text>
  <text x="200" y="358" font-family="Arial, sans-serif" font-size="12" letter-spacing="3" fill="#f0eafa" text-anchor="middle" opacity="0.55">ARISE NUMERO</text>
</svg>`;
}

function portrait({ id, from, to, initials }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="p-${id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${from}" />
      <stop offset="100%" stop-color="${to}" />
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#p-${id})" />
  <circle cx="200" cy="160" r="72" fill="#f0eafa" opacity="0.14" />
  <text x="200" y="182" font-family="Georgia, serif" font-size="56" fill="#f0eafa" text-anchor="middle" opacity="0.9">${initials}</text>
</svg>`;
}

// Product images are rendered by scripts/render-product-images.mjs (JPEGs in
// public/assets/products/). This script only makes the fallback and team art.

// Generic fallback used by onerror handlers and any product missing a custom image.
writeFileSync(
  join(OUT_DIR, "placeholder.svg"),
  gradientCard({ id: "placeholder", from: "#1a1228", to: "#3a2d50", accent: "#b8975a", label: "Arise Numero" }),
  "utf8"
);

const team = [
  { file: "team-founder", from: "#3d2a52", to: "#7c4d99", initials: "AR" },
  { file: "team-numerologist", from: "#1a2a52", to: "#2d4a8a", initials: "RS" },
  { file: "team-ops", from: "#5a3d10", to: "#b8975a", initials: "KM" },
];
for (const t of team) {
  writeFileSync(join(OUT_DIR, `${t.file}.svg`), portrait(t), "utf8");
}

console.log(`Generated ${products.length + team.length + 2} placeholder SVGs in ${OUT_DIR}`);
