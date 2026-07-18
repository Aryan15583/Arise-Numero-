const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ── PUBLIC: submit a booking (booking.html) ────────────────────────
router.post('/bookings', (req, res) => {
  const b = req.body || {};
  if (!b.client_email || !b.birth_name || !b.date_of_birth) {
    return res.status(400).json({ error: 'client_email, birth_name, and date_of_birth are required.' });
  }

  const id = 'bk_' + crypto.randomBytes(6).toString('hex');
  db.prepare(`
    INSERT INTO bookings
      (id, first_name, last_name, client_email, birth_name, date_of_birth, package_selected,
       timezone, session_date, reading_focus, additional_notes, status)
    VALUES (@id, @first_name, @last_name, @client_email, @birth_name, @date_of_birth, @package_selected,
            @timezone, @session_date, @reading_focus, @additional_notes, 'new')
  `).run({
    id,
    first_name: b.first_name || null,
    last_name: b.last_name || null,
    client_email: b.client_email,
    birth_name: b.birth_name,
    date_of_birth: b.date_of_birth,
    package_selected: b.package_selected || null,
    timezone: b.timezone || null,
    session_date: b.session_date || null,
    reading_focus: b.reading_focus || null,
    additional_notes: b.additional_notes || null,
  });

  const row = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
  res.status(201).json(row);
});

// ── ADMIN: list bookings ────────────────────────────────────────────
router.get('/admin/bookings', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM bookings ORDER BY submitted_at DESC').all();
  res.json(rows);
});

// ── ADMIN: update booking status ───────────────────────────────────
router.put('/admin/bookings/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body || {};
  const allowed = ['new', 'confirmed', 'completed', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: `status must be one of ${allowed.join(', ')}` });

  const info = db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Booking not found.' });
  res.json(db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id));
});

// ── ADMIN: delete booking ───────────────────────────────────────────
router.delete('/admin/bookings/:id', requireAdmin, (req, res) => {
  const info = db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Booking not found.' });
  res.json({ deleted: true });
});

module.exports = router;
