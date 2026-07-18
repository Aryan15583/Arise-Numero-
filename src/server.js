// server.js — single entry point.
// Serves the storefront/admin static files AND the JSON API from one process,
// on one port, so there's nothing to deploy separately and no CORS to fight
// with. Point your host (Render, Railway, Fly, a VPS, etc.) at `npm start`.

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json());

// ── API routes ───────────────────────────────────────────────────────
app.use('/api', require('./routes/products'));
app.use('/api', require('./routes/coupons'));
app.use('/api', require('./routes/bookings'));
app.use('/api', require('./routes/orders'));
app.use('/api', require('./routes/paypal'));
app.use('/api', require('./routes/admin'));

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Public, non-secret config the frontend needs at runtime. The PayPal
// Client ID is meant to be public (it identifies your app to PayPal, it
// does not authenticate anything by itself) — never put PAYPAL_SECRET here.
app.get('/api/config', (req, res) => {
  res.json({ paypalClientId: process.env.PAYPAL_CLIENT_ID || null });
});

// ── Static frontend ──────────────────────────────────────────────────
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
app.use(express.static(PUBLIC_DIR));

// Fallback 404 for unmatched API routes (keep this after static + api routes)
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Arise Numero server running on http://localhost:${PORT}`);
  console.log(`  Storefront:  http://localhost:${PORT}/index.html`);
  console.log(`  Admin panel: http://localhost:${PORT}/ADMINDBMP.html`);
  console.log(`  API:         http://localhost:${PORT}/api/products`);
});
