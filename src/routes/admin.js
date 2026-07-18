const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signAdminToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function getPinHash() {
  const row = db.prepare(`SELECT value FROM admin_settings WHERE key = 'admin_pin_hash'`).get();
  return row ? row.value : null;
}

function setPinHash(hash) {
  db.prepare(`
    INSERT INTO admin_settings (key, value) VALUES ('admin_pin_hash', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(hash);
}

// First run: if no PIN hash is stored yet, seed one from ADMIN_PIN in .env
// (or a fallback) so the panel isn't locked out of the box. Change it from
// the panel itself as soon as you log in.
if (!getPinHash()) {
  const initialPin = process.env.ADMIN_PIN || '1558';
  setPinHash(bcrypt.hashSync(initialPin, 10));
  console.log(`No admin PIN was set — seeded one from ADMIN_PIN (or default). Log in and change it under Settings.`);
}

// ── POST /api/admin/login ───────────────────────────────────────────
router.post('/admin/login', (req, res) => {
  const { pin } = req.body || {};
  if (!pin) return res.status(400).json({ error: 'PIN is required.' });

  const hash = getPinHash();
  if (!hash || !bcrypt.compareSync(String(pin), hash)) {
    return res.status(401).json({ error: 'Incorrect PIN.' });
  }
  res.json({ token: signAdminToken() });
});

// ── PUT /api/admin/pin — change the admin PIN (requires current session) ──
router.put('/admin/pin', requireAdmin, (req, res) => {
  const { current_pin, new_pin } = req.body || {};
  if (!current_pin || !new_pin) return res.status(400).json({ error: 'current_pin and new_pin are required.' });

  const hash = getPinHash();
  if (!hash || !bcrypt.compareSync(String(current_pin), hash)) {
    return res.status(401).json({ error: 'Current PIN is incorrect.' });
  }
  if (String(new_pin).length < 4) return res.status(400).json({ error: 'New PIN must be at least 4 digits.' });

  setPinHash(bcrypt.hashSync(String(new_pin), 10));
  res.json({ updated: true });
});

// ── GET /api/admin/verify — lets the admin SPA check its token is still good
router.get('/admin/verify', requireAdmin, (req, res) => {
  res.json({ valid: true });
});

module.exports = router;
