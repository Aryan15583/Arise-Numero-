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

const products = [
  { file: "amethyst-bracelet", from: "#3d2a52", to: "#7c4d99", accent: "#c49fd6", label: "Amethyst Serenity" },
  { file: "amethyst-bracelet-closeup", from: "#4a3462", to: "#8a5aa8", accent: "#d4b3e6", label: "Amethyst — Detail" },
  { file: "amethyst-bracelet-worn", from: "#3d2a52", to: "#6d4488", accent: "#c49fd6", label: "Amethyst — Worn" },
  { file: "amethyst-bracelet-box", from: "#2b1f3d", to: "#5a3d75", accent: "#b8975a", label: "Gift Box" },
  { file: "amethyst-6mm-bracelet", from: "#382550", to: "#6a4488", accent: "#c9b3e0", label: "Amethyst Clarity" },
  { file: "lapis-bracelet", from: "#1a2a52", to: "#2d4a8a", accent: "#b8975a", label: "Lapis Lazuli Wisdom" },
  { file: "rose-quartz-bracelet", from: "#5a2d3d", to: "#c48a9e", accent: "#f5d5df", label: "Rose Quartz Love" },
  { file: "rose-quartz-premium", from: "#5a2d3d", to: "#d19bb0", accent: "#b8975a", label: "Rose Quartz Premium" },
  { file: "tourmaline-bracelet", from: "#0e0b16", to: "#2d2340", accent: "#8a7a9a", label: "Black Tourmaline Shield" },
  { file: "citrine-bracelet", from: "#5a3d10", to: "#d4a02c", accent: "#fbe6a6", label: "Citrine Abundance" },
  { file: "obsidian-bracelet", from: "#050308", to: "#221932", accent: "#7c4d99", label: "Obsidian Grounding" },
];

for (const p of products) {
  const svg = gradientCard({ id: p.file, from: p.from, to: p.to, accent: p.accent, label: p.label });
  writeFileSync(join(OUT_DIR, `${p.file}.svg`), svg, "utf8");
}

// Generic fallback used by onerror handlers and any product missing a custom image.
writeFileSync(
  join(OUT_DIR, "placeholder.svg"),
  gradientCard({ id: "placeholder", from: "#1a1228", to: "#3a2d50", accent: "#b8975a", label: "Arise Numero" }),
  "utf8"
);

writeFileSync(
  join(OUT_DIR, "about-founder.svg"),
  portrait({ id: "founder-wide", from: "#2b1f3d", to: "#6d4488", initials: "AN" }),
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
