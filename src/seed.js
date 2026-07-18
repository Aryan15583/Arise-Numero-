// seed.js — one-time (idempotent) seed of the real catalog that used to be
// hardcoded in shop.html, plus the coupon codes that used to be hardcoded in
// main.js. Safe to re-run: it skips rows that already exist.
//
// Run with:  npm run seed

const db = require('./db');

const products = [
  {
    id: 'amethyst-8mm', name: 'Amethyst Serenity',
    material: 'Authentic 8mm Amethyst, elastic cord',
    description: 'Handcrafted using genuine, ethically sourced amethyst beads. Natural colour variations mean no two bracelets are exactly alike.',
    price_usd: 24.99, original_price_usd: null, category: 'amethyst', bead_size: '8mm',
    stock: 3, low_stock_threshold: 5, image_url: 'assets/amethyst-bracelet.jpg',
    images: ['assets/amethyst-bracelet.jpg', 'assets/amethyst-bracelet-closeup.jpg', 'assets/amethyst-bracelet-worn.jpg', 'assets/amethyst-bracelet-box.jpg'],
    badge: 'Bestseller', rating: 4.9, review_count: 128, active: true, featured: true,
  },
  {
    id: 'lapis-lazuli', name: 'Lapis Lazuli Wisdom',
    material: 'Authentic Lapis Lazuli, gold accents',
    description: 'Deep blue Lapis Lazuli beads finished with gold-tone accents, prized historically as a stone of insight and truth.',
    price_usd: 32.99, original_price_usd: null, category: 'lapis-lazuli', bead_size: '8mm',
    stock: 20, low_stock_threshold: 5, image_url: 'assets/lapis-bracelet.jpg',
    images: ['assets/lapis-bracelet.jpg'],
    badge: 'New', rating: 4.8, review_count: 94, active: true, featured: false,
  },
  {
    id: 'rose-quartz', name: 'Rose Quartz Love',
    material: 'Authentic 10mm Rose Quartz, elastic cord',
    description: 'Soft pink 10mm Rose Quartz beads on durable elastic cord — the classic stone of love and gentle energy.',
    price_usd: 22.99, original_price_usd: null, category: 'rose-quartz', bead_size: '10mm',
    stock: 20, low_stock_threshold: 5, image_url: 'assets/rose-quartz-bracelet.jpg',
    images: ['assets/rose-quartz-bracelet.jpg'],
    badge: null, rating: 5.0, review_count: 211, active: true, featured: true,
  },
  {
    id: 'black-tourmaline', name: 'Black Tourmaline Shield',
    material: 'Authentic Black Tourmaline, elastic cord',
    description: 'Matte black Tourmaline beads, worn traditionally as a grounding, protective stone.',
    price_usd: 27.99, original_price_usd: null, category: 'tourmaline', bead_size: '8mm',
    stock: 5, low_stock_threshold: 5, image_url: 'assets/tourmaline-bracelet.jpg',
    images: ['assets/tourmaline-bracelet.jpg'],
    badge: null, rating: 4.7, review_count: 76, active: true, featured: false,
  },
  {
    id: 'citrine', name: 'Citrine Abundance',
    material: 'Authentic 8mm Citrine, elastic cord',
    description: 'Warm golden-yellow Citrine beads, associated with abundance and positive energy.',
    price_usd: 29.99, original_price_usd: 39.99, category: 'citrine', bead_size: '8mm',
    stock: 20, low_stock_threshold: 5, image_url: 'assets/citrine-bracelet.jpg',
    images: ['assets/citrine-bracelet.jpg'],
    badge: 'Sale', rating: 4.8, review_count: 53, active: true, featured: true,
  },
  {
    id: 'obsidian', name: 'Obsidian Grounding',
    material: 'Authentic 10mm Obsidian, elastic cord',
    description: 'Glossy black Obsidian beads, a volcanic glass valued for its grounding, clarifying qualities.',
    price_usd: 25.99, original_price_usd: null, category: 'obsidian', bead_size: '10mm',
    stock: 20, low_stock_threshold: 5, image_url: 'assets/obsidian-bracelet.jpg',
    images: ['assets/obsidian-bracelet.jpg'],
    badge: null, rating: 4.6, review_count: 41, active: true, featured: false,
  },
  {
    id: 'amethyst-6mm', name: 'Amethyst Clarity',
    material: 'Authentic 6mm Amethyst, silver accents',
    description: 'A delicate 6mm take on our signature Amethyst, finished with silver-tone accents.',
    price_usd: 34.99, original_price_usd: null, category: 'amethyst', bead_size: '6mm',
    stock: 20, low_stock_threshold: 5, image_url: 'assets/amethyst-6mm-bracelet.jpg',
    images: ['assets/amethyst-6mm-bracelet.jpg'],
    badge: null, rating: 5.0, review_count: 38, active: true, featured: false,
  },
  {
    id: 'rose-quartz-premium', name: 'Rose Quartz Premium Set',
    material: '8mm Rose Quartz, gold spacers, gift box',
    description: 'Our premium Rose Quartz bracelet with gold-tone spacer beads, presented in a keepsake gift box.',
    price_usd: 49.99, original_price_usd: null, category: 'rose-quartz', bead_size: '8mm',
    stock: 20, low_stock_threshold: 5, image_url: 'assets/rose-quartz-premium.jpg',
    images: ['assets/rose-quartz-premium.jpg'],
    badge: 'Premium', rating: 5.0, review_count: 19, active: true, featured: false,
  },
];

const coupons = [
  { code: 'ARISENUMERO', discount_percent: 15, description: 'General site-wide discount.' },
  { code: 'WELCOME10', discount_percent: 10, description: 'First-order welcome discount.' },
  { code: 'CRYSTALS20', discount_percent: 20, description: 'Promotional 20% off.' },
  { code: 'NEWUSER', discount_percent: 12, description: 'New customer discount.' },
];

const insertProduct = db.prepare(`
  INSERT INTO products
    (id, name, material, description, price_usd, original_price_usd, category, bead_size,
     stock, low_stock_threshold, image_url, images, badge, rating, review_count, active, featured)
  VALUES (@id, @name, @material, @description, @price_usd, @original_price_usd, @category, @bead_size,
          @stock, @low_stock_threshold, @image_url, @images, @badge, @rating, @review_count, @active, @featured)
`);

let productsAdded = 0;
for (const p of products) {
  const exists = db.prepare('SELECT 1 FROM products WHERE id = ?').get(p.id);
  if (exists) continue;
  insertProduct.run({ ...p, images: JSON.stringify(p.images), active: p.active ? 1 : 0, featured: p.featured ? 1 : 0 });
  productsAdded++;
}

const insertCoupon = db.prepare('INSERT INTO coupons (code, discount_percent, description, active) VALUES (?, ?, ?, 1)');
let couponsAdded = 0;
for (const c of coupons) {
  const exists = db.prepare('SELECT 1 FROM coupons WHERE code = ?').get(c.code);
  if (exists) continue;
  insertCoupon.run(c.code, c.discount_percent, c.description);
  couponsAdded++;
}

console.log(`Seed complete — ${productsAdded} product(s) and ${couponsAdded} coupon(s) added.`);
