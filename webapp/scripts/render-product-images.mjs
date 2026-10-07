// Renders the product images in public/assets/products/ (run manually):
//   CHROMIUM_PATH=/path/to/chromium node scripts/render-product-images.mjs [name…]
// Needs playwright-core (devDependency) and any Chromium/Chrome binary.
// Not part of the app runtime — the JPEGs it writes are committed.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright-core";

const OUT = join(process.cwd(), "public", "assets", "products");

// name → scene spec (see scripts/product-images/renderer.js)
export const IMAGES = {
  "amethyst-8mm": { scene: "bracelet", stone: "amethyst", beadMm: 8, seed: 11 },
  "amethyst-8mm-closeup": { scene: "closeup", stone: "amethyst", beadMm: 8, seed: 12 },
  "amethyst-8mm-slate": { scene: "bracelet", stone: "amethyst", beadMm: 8, seed: 13, surface: "slate" },
  "amethyst-8mm-box": { scene: "box", stone: "amethyst", beadMm: 8, seed: 14 },
  "lapis-lazuli": { scene: "bracelet", stone: "lapis", beadMm: 8, seed: 21, pattern: "goldEvery6" },
  "lapis-lazuli-closeup": { scene: "closeup", stone: "lapis", beadMm: 8, seed: 22, pattern: "goldEvery6" },
  "rose-quartz": { scene: "bracelet", stone: "roseQuartz", beadMm: 10, seed: 31 },
  "rose-quartz-closeup": { scene: "closeup", stone: "roseQuartz", beadMm: 10, seed: 32 },
  "black-tourmaline": { scene: "bracelet", stone: "tourmaline", beadMm: 8, seed: 41, surface: "marble" },
  "black-tourmaline-closeup": { scene: "closeup", stone: "tourmaline", beadMm: 8, seed: 42, surface: "marble" },
  "citrine": { scene: "bracelet", stone: "citrine", beadMm: 8, seed: 51 },
  "citrine-closeup": { scene: "closeup", stone: "citrine", beadMm: 8, seed: 52 },
  "obsidian": { scene: "bracelet", stone: "obsidian", beadMm: 10, seed: 61, surface: "marble" },
  "obsidian-closeup": { scene: "closeup", stone: "obsidian", beadMm: 10, seed: 62, surface: "marble" },
  "amethyst-6mm": { scene: "bracelet", stone: "amethyst", beadMm: 6, seed: 71 },
  "amethyst-6mm-closeup": { scene: "closeup", stone: "amethyst", beadMm: 6, seed: 72 },
  "rose-quartz-premium": { scene: "box", stone: "roseQuartz", beadMm: 8, seed: 81, pair: true, pattern: "goldPairs" },
  "rose-quartz-premium-pair": { scene: "pair", stone: "roseQuartz", beadMm: 8, seed: 82, pattern: "goldPairs" },
  "about-workbench": { scene: "workbench", seed: 91 },
};

const only = process.argv.slice(2);
const names = only.length ? only : Object.keys(IMAGES);
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage();
await page.setContent("<!doctype html><html><body></body></html>");
await page.addScriptTag({ content: readFileSync(new URL("./product-images/renderer.js", import.meta.url), "utf8") });
if (!(await page.evaluate(() => typeof window.renderScene === "function"))) {
  throw new Error("renderer.js did not load — check it for syntax errors (node --check).");
}
for (const name of names) {
  const spec = IMAGES[name];
  if (!spec) throw new Error(`Unknown image "${name}"`);
  const t = Date.now();
  const dataUrl = await page.evaluate((s) => window.renderScene(s), { size: 1200, ...spec });
  const buf = Buffer.from(dataUrl.split(",")[1], "base64");
  writeFileSync(join(OUT, `${name}.jpg`), buf);
  console.log(`${name}.jpg  ${(buf.length / 1024).toFixed(0)} KB  ${Date.now() - t} ms`);
}
await browser.close();
