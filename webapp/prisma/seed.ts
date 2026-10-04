// Idempotent seed — ports the catalogue that used to be hardcoded in
// shop.html/index.html, plus the coupon codes that used to be hardcoded in
// main.js, into the real database. Safe to re-run: it skips rows that
// already exist and won't overwrite admin edits. (Admin sign-in is an emailed
// one-time code — there's no admin credential to seed.)
//
// Run with: npm run seed

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    id: "amethyst-8mm",
    name: "Amethyst Serenity",
    material: "Authentic 8mm Amethyst, elastic cord",
    description:
      "Handcrafted using genuine, ethically sourced amethyst gemstones. Each bead displays the natural colour variations unique to authentic amethyst — no two bracelets are exactly the same. Note on natural variations: as a natural gemstone, colour, texture, and pattern may vary slightly from the photos shown. This is a mark of authenticity, not a defect.",
    priceUsd: 24.99,
    originalPriceUsd: null,
    category: "amethyst",
    beadSize: "8mm",
    stock: 3,
    lowStockThreshold: 5,
    imageUrl: "/assets/amethyst-bracelet.svg",
    images: [
      "/assets/amethyst-bracelet.svg",
      "/assets/amethyst-bracelet-closeup.svg",
      "/assets/amethyst-bracelet-worn.svg",
      "/assets/amethyst-bracelet-box.svg",
    ],
    badge: "Bestseller",
    rating: 4.9,
    reviewCount: 128,
    active: true,
    featured: true,
  },
  {
    id: "lapis-lazuli",
    name: "Lapis Lazuli Wisdom",
    material: "Authentic Lapis Lazuli, gold accents",
    description:
      "Deep blue Lapis Lazuli beads finished with gold-tone accents, prized historically as a stone of insight and truth.",
    priceUsd: 32.99,
    originalPriceUsd: null,
    category: "lapis-lazuli",
    beadSize: "8mm",
    stock: 20,
    lowStockThreshold: 5,
    imageUrl: "/assets/lapis-bracelet.svg",
    images: ["/assets/lapis-bracelet.svg"],
    badge: "New",
    rating: 4.8,
    reviewCount: 94,
    active: true,
    featured: false,
  },
  {
    id: "rose-quartz",
    name: "Rose Quartz Love",
    material: "Authentic 10mm Rose Quartz, elastic cord",
    description:
      "Soft pink 10mm Rose Quartz beads on durable elastic cord — the classic stone of love and gentle energy.",
    priceUsd: 22.99,
    originalPriceUsd: null,
    category: "rose-quartz",
    beadSize: "10mm",
    stock: 20,
    lowStockThreshold: 5,
    imageUrl: "/assets/rose-quartz-bracelet.svg",
    images: ["/assets/rose-quartz-bracelet.svg"],
    badge: null,
    rating: 5.0,
    reviewCount: 211,
    active: true,
    featured: true,
  },
  {
    id: "black-tourmaline",
    name: "Black Tourmaline Shield",
    material: "Authentic Black Tourmaline, elastic cord",
    description: "Matte black Tourmaline beads, worn traditionally as a grounding, protective stone.",
    priceUsd: 27.99,
    originalPriceUsd: null,
    category: "tourmaline",
    beadSize: "8mm",
    stock: 5,
    lowStockThreshold: 5,
    imageUrl: "/assets/tourmaline-bracelet.svg",
    images: ["/assets/tourmaline-bracelet.svg"],
    badge: null,
    rating: 4.7,
    reviewCount: 76,
    active: true,
    featured: false,
  },
  {
    id: "citrine",
    name: "Citrine Abundance",
    material: "Authentic 8mm Citrine, elastic cord",
    description: "Warm golden-yellow Citrine beads, associated with abundance and positive energy.",
    priceUsd: 29.99,
    originalPriceUsd: 39.99,
    category: "citrine",
    beadSize: "8mm",
    stock: 20,
    lowStockThreshold: 5,
    imageUrl: "/assets/citrine-bracelet.svg",
    images: ["/assets/citrine-bracelet.svg"],
    badge: "Sale",
    rating: 4.8,
    reviewCount: 53,
    active: true,
    featured: true,
  },
  {
    id: "obsidian",
    name: "Obsidian Grounding",
    material: "Authentic 10mm Obsidian, elastic cord",
    description: "Glossy black Obsidian beads, a volcanic glass valued for its grounding, clarifying qualities.",
    priceUsd: 25.99,
    originalPriceUsd: null,
    category: "obsidian",
    beadSize: "10mm",
    stock: 20,
    lowStockThreshold: 5,
    imageUrl: "/assets/obsidian-bracelet.svg",
    images: ["/assets/obsidian-bracelet.svg"],
    badge: null,
    rating: 4.6,
    reviewCount: 41,
    active: true,
    featured: false,
  },
  {
    id: "amethyst-6mm",
    name: "Amethyst Clarity",
    material: "Authentic 6mm Amethyst, silver accents",
    description: "A delicate 6mm take on our signature Amethyst, finished with silver-tone accents.",
    priceUsd: 34.99,
    originalPriceUsd: null,
    category: "amethyst",
    beadSize: "6mm",
    stock: 20,
    lowStockThreshold: 5,
    imageUrl: "/assets/amethyst-6mm-bracelet.svg",
    images: ["/assets/amethyst-6mm-bracelet.svg"],
    badge: null,
    rating: 5.0,
    reviewCount: 38,
    active: true,
    featured: false,
  },
  {
    id: "rose-quartz-premium",
    name: "Rose Quartz Premium Set",
    material: "8mm Rose Quartz, gold spacers, gift box",
    description:
      "Our premium Rose Quartz bracelet with gold-tone spacer beads, presented in a keepsake gift box.",
    priceUsd: 49.99,
    originalPriceUsd: null,
    category: "rose-quartz",
    beadSize: "8mm",
    stock: 20,
    lowStockThreshold: 5,
    imageUrl: "/assets/rose-quartz-premium.svg",
    images: ["/assets/rose-quartz-premium.svg"],
    badge: "Premium",
    rating: 5.0,
    reviewCount: 19,
    active: true,
    featured: false,
  },
];

const coupons = [
  { code: "ARISENUMERO", discountPercent: 15, description: "General site-wide discount." },
  { code: "WELCOME10", discountPercent: 10, description: "First-order welcome discount." },
  { code: "CRYSTALS20", discountPercent: 20, description: "Promotional 20% off." },
  { code: "NEWUSER", discountPercent: 12, description: "New customer discount." },
];

const categories = [
  { slug: "amethyst", name: "Amethyst", description: "Deep purple stone of calm and clarity." },
  { slug: "rose-quartz", name: "Rose Quartz", description: "Soft pink stone of love and gentle energy." },
  { slug: "lapis-lazuli", name: "Lapis Lazuli", description: "Deep blue stone of insight and truth." },
  { slug: "tourmaline", name: "Black Tourmaline", description: "Grounding, protective black stone." },
  { slug: "citrine", name: "Citrine", description: "Warm golden stone of abundance." },
  { slug: "obsidian", name: "Obsidian", description: "Glossy black volcanic glass, grounding and clarifying." },
];

async function main() {
  let productsAdded = 0;
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const exists = await prisma.product.findUnique({ where: { id: p.id } });
    if (exists) continue;
    await prisma.product.create({
      data: { ...p, images: JSON.stringify(p.images), sortOrder: i },
    });
    productsAdded++;
  }

  let couponsAdded = 0;
  for (const c of coupons) {
    const exists = await prisma.coupon.findUnique({ where: { code: c.code } });
    if (exists) continue;
    await prisma.coupon.create({ data: c });
    couponsAdded++;
  }

  let categoriesAdded = 0;
  for (let i = 0; i < categories.length; i++) {
    const c = categories[i];
    const exists = await prisma.category.findUnique({ where: { slug: c.slug } });
    if (exists) continue;
    await prisma.category.create({ data: { ...c, sortOrder: i } });
    categoriesAdded++;
  }

  console.log(
    `Seed complete — ${productsAdded} product(s), ${couponsAdded} coupon(s), ${categoriesAdded} categor${categoriesAdded === 1 ? "y" : "ies"} added.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
