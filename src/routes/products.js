const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

function rowToProduct(row) {
  if (!row) return null;
  return {
    ...row,
    images: row.images ? JSON.parse(row.images) : [],
    active: !!row.active,
    featured: !!row.featured,
  };
}

// ── PUBLIC: list active products (used by shop.html) ──────────────
router.get('/products', (req, res) => {
  const rows = db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY rowid ASC').all();
  res.json(rows.map(rowToProduct));
});

// ── PUBLIC: single product by id (used by product.html) ───────────
router.get('/products/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Product not found.' });
  res.json(rowToProduct(row));
});

// ── ADMIN: list every product, including hidden/inactive ──────────
router.get('/admin/products', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY rowid ASC').all();
  res.json(rows.map(rowToProduct));
});

// ── ADMIN: create product ──────────────────────────────────────────
router.post('/admin/products', requireAdmin, (req, res) => {
  const p = req.body || {};
  if (!p.id || !p.name) return res.status(400).json({ error: 'id and name are required.' });

  const exists = db.prepare('SELECT 1 FROM products WHERE id = ?').get(p.id);
  if (exists) return res.status(409).json({ error: 'A product with this id already exists.' });

  db.prepare(`
    INSERT INTO products
      (id, name, material, description, price_usd, original_price_usd, category, bead_size,
       stock, low_stock_threshold, image_url, images, badge, rating, review_count, active, featured)
    VALUES (@id, @name, @material, @description, @price_usd, @original_price_usd, @category, @bead_size,
            @stock, @low_stock_threshold, @image_url, @images, @badge, @rating, @review_count, @active, @featured)
  `).run({
    id: p.id,
    name: p.name,
    material: p.material || null,
    description: p.description || null,
    price_usd: p.price_usd || 0,
    original_price_usd: p.original_price_usd || null,
    category: p.category || null,
    bead_size: p.bead_size || null,
    stock: p.stock ?? 0,
    low_stock_threshold: p.low_stock_threshold ?? 5,
    image_url: p.image_url || null,
    images: JSON.stringify(p.images || []),
    badge: p.badge || null,
    rating: p.rating ?? 4.9,
    review_count: p.review_count ?? 0,
    active: p.active === false ? 0 : 1,
    featured: p.featured ? 1 : 0,
  });

  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(p.id);
  res.status(201).json(rowToProduct(row));
});

// ── ADMIN: update product ──────────────────────────────────────────
router.put('/admin/products/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found.' });

  const p = { ...existing, ...req.body };

  db.prepare(`
    UPDATE products SET
      name = @name, material = @material, description = @description, price_usd = @price_usd,
      original_price_usd = @original_price_usd, category = @category, bead_size = @bead_size,
      stock = @stock, low_stock_threshold = @low_stock_threshold, image_url = @image_url,
      images = @images, badge = @badge, rating = @rating, review_count = @review_count,
      active = @active, featured = @featured, updated_at = datetime('now')
    WHERE id = @id
  `).run({
    id: req.params.id,
    name: p.name,
    material: p.material || null,
    description: p.description || null,
    price_usd: p.price_usd || 0,
    original_price_usd: p.original_price_usd || null,
    category: p.category || null,
    bead_size: p.bead_size || null,
    stock: p.stock ?? 0,
    low_stock_threshold: p.low_stock_threshold ?? 5,
    image_url: p.image_url || null,
    images: JSON.stringify(Array.isArray(p.images) ? p.images : (p.images ? JSON.parse(p.images) : [])),
    badge: p.badge || null,
    rating: p.rating ?? 4.9,
    review_count: p.review_count ?? 0,
    active: p.active === false || p.active === 0 ? 0 : 1,
    featured: p.featured ? 1 : 0,
  });

  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(rowToProduct(row));
});

// ── ADMIN: delete product ──────────────────────────────────────────
router.delete('/admin/products/:id', requireAdmin, (req, res) => {
  const info = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Product not found.' });
  res.json({ deleted: true });
});

// ── ADMIN: quick stock update ───────────────────────────────────────
router.put('/admin/products/:id/stock', requireAdmin, (req, res) => {
  const { stock } = req.body || {};
  if (typeof stock !== 'number' || stock < 0) return res.status(400).json({ error: 'stock must be a non-negative number.' });
  const info = db.prepare(`UPDATE products SET stock = ?, updated_at = datetime('now') WHERE id = ?`).run(stock, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Product not found.' });
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(rowToProduct(row));
});

module.exports = router;
