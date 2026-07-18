const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

function rowToOrder(row) {
  if (!row) return null;
  return {
    ...row,
    items: row.items ? JSON.parse(row.items) : [],
    shipping_address: row.shipping_address ? JSON.parse(row.shipping_address) : {},
  };
}

// ── ADMIN: list orders ──────────────────────────────────────────────
router.get('/admin/orders', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY date DESC').all();
  res.json(rows.map(rowToOrder));
});

// ── ADMIN: single order ──────────────────────────────────────────────
router.get('/admin/orders/:id', requireAdmin, (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Order not found.' });
  res.json(rowToOrder(row));
});

// ── ADMIN: manually record an order (phone / COD / in-person sale) ──
router.post('/admin/orders', requireAdmin, (req, res) => {
  const o = req.body || {};
  if (!o.customer_name || typeof o.total_usd !== 'number') {
    return res.status(400).json({ error: 'customer_name and total_usd are required.' });
  }
  const id = 'ord_' + Date.now().toString(36);
  db.prepare(`
    INSERT INTO orders
      (id, customer_name, customer_email, customer_phone, shipping_address, items,
       subtotal_usd, discount_usd, coupon_code, total_usd, status, payment_method, payment_reference)
    VALUES (@id, @customer_name, @customer_email, @customer_phone, @shipping_address, @items,
            @subtotal_usd, @discount_usd, @coupon_code, @total_usd, @status, @payment_method, @payment_reference)
  `).run({
    id,
    customer_name: o.customer_name,
    customer_email: o.customer_email || null,
    customer_phone: o.customer_phone || null,
    shipping_address: JSON.stringify(o.shipping_address || {}),
    items: JSON.stringify(o.items || []),
    subtotal_usd: o.subtotal_usd ?? o.total_usd,
    discount_usd: o.discount_usd ?? 0,
    coupon_code: o.coupon_code || null,
    total_usd: o.total_usd,
    status: o.status || 'pending',
    payment_method: o.payment_method || 'manual',
    payment_reference: o.payment_reference || null,
  });
  res.status(201).json(rowToOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(id)));
});

// ── ADMIN: update order status ──────────────────────────────────────
router.put('/admin/orders/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body || {};
  const allowed = ['pending', 'paid', 'shipped', 'completed', 'cancelled', 'failed'];
  if (!allowed.includes(status)) return res.status(400).json({ error: `status must be one of ${allowed.join(', ')}` });

  const info = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Order not found.' });
  res.json(rowToOrder(db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)));
});

module.exports = router;
