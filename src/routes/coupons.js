const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

function rowToCoupon(row) {
  if (!row) return null;
  return { ...row, active: !!row.active };
}

// ── PUBLIC: validate a coupon code at checkout ─────────────────────
router.post('/coupons/validate', (req, res) => {
  const code = String((req.body && req.body.code) || '').trim().toUpperCase();
  if (!code) return res.status(400).json({ valid: false, message: 'Enter a coupon code.' });

  const row = db.prepare('SELECT * FROM coupons WHERE code = ?').get(code);
  if (!row || !row.active) {
    return res.json({ valid: false, message: 'Invalid or expired coupon code.' });
  }
  res.json({ valid: true, discount_percent: row.discount_percent, message: `${row.discount_percent}% off applied.` });
});

// ── ADMIN: list all coupons ─────────────────────────────────────────
router.get('/admin/coupons', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM coupons ORDER BY rowid ASC').all();
  res.json(rows.map(rowToCoupon));
});

// ── ADMIN: create coupon ────────────────────────────────────────────
router.post('/admin/coupons', requireAdmin, (req, res) => {
  const c = req.body || {};
  const code = String(c.code || '').trim().toUpperCase();
  const discount = parseInt(c.discount_percent, 10);
  if (!code || Number.isNaN(discount)) return res.status(400).json({ error: 'code and discount_percent are required.' });

  const exists = db.prepare('SELECT 1 FROM coupons WHERE code = ?').get(code);
  if (exists) return res.status(409).json({ error: 'This coupon code already exists.' });

  db.prepare('INSERT INTO coupons (code, discount_percent, description, active) VALUES (?, ?, ?, ?)')
    .run(code, discount, c.description || null, c.active === false ? 0 : 1);

  res.status(201).json(rowToCoupon(db.prepare('SELECT * FROM coupons WHERE code = ?').get(code)));
});

// ── ADMIN: update coupon ────────────────────────────────────────────
router.put('/admin/coupons/:code', requireAdmin, (req, res) => {
  const code = req.params.code.toUpperCase();
  const existing = db.prepare('SELECT * FROM coupons WHERE code = ?').get(code);
  if (!existing) return res.status(404).json({ error: 'Coupon not found.' });

  const c = { ...existing, ...req.body };
  db.prepare('UPDATE coupons SET discount_percent = ?, description = ?, active = ? WHERE code = ?')
    .run(parseInt(c.discount_percent, 10) || existing.discount_percent, c.description || null, c.active === false || c.active === 0 ? 0 : 1, code);

  res.json(rowToCoupon(db.prepare('SELECT * FROM coupons WHERE code = ?').get(code)));
});

// ── ADMIN: delete coupon ────────────────────────────────────────────
router.delete('/admin/coupons/:code', requireAdmin, (req, res) => {
  const info = db.prepare('DELETE FROM coupons WHERE code = ?').run(req.params.code.toUpperCase());
  if (info.changes === 0) return res.status(404).json({ error: 'Coupon not found.' });
  res.json({ deleted: true });
});

module.exports = router;
