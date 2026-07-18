// paypal.js — server-side PayPal Orders v2 integration.
//
// Why server-side and not just the client-side button from before:
//   1. Prices are looked up from OUR database, not trusted from the browser,
//      so nobody can edit the page and pay $0.01 for a $50 bracelet.
//   2. We only mark an order "paid" after PayPal itself confirms the capture,
//      so the admin Orders tab reflects real, confirmed payments.
//
// NOTE ON THIS SANDBOX: this code cannot be exercised end-to-end here because
// this container's network egress does not allow api-m.paypal.com /
// api-m.sandbox.paypal.com. It's written against PayPal's documented Orders v2
// API and the logic has been reviewed carefully, but you should test it
// against your own PayPal Sandbox credentials once deployed — see SETUP.md.

const express = require('express');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router();

const PAYPAL_MODE = process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
const PAYPAL_BASE = PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;
  if (!clientId || !secret) throw new Error('PAYPAL_CLIENT_ID / PAYPAL_SECRET are not set in .env');

  const basicAuth = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const resp = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!resp.ok) throw new Error(`PayPal auth failed: ${resp.status} ${await resp.text()}`);
  const data = await resp.json();
  return data.access_token;
}

function computeTotals(items, couponRow) {
  const subtotal = items.reduce((sum, i) => sum + i.priceUSD * i.qty, 0);
  const discountPct = couponRow && couponRow.active ? couponRow.discount_percent : 0;
  const discount = +(subtotal * (discountPct / 100)).toFixed(2);
  const total = +(subtotal - discount).toFixed(2);
  return { subtotal: +subtotal.toFixed(2), discount, total };
}

// ── POST /api/paypal/create-order ──────────────────────────────────
// body: { items: [{id, qty}], coupon_code?, customer: {name,email,phone}, shipping: {...} }
router.post('/paypal/create-order', async (req, res) => {
  try {
    const { items = [], coupon_code, customer = {}, shipping = {} } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }

    // Resolve real prices/names from OUR database — never trust client-sent prices.
    const resolved = items.map((i) => {
      const p = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(i.id);
      if (!p) throw new Error(`Product "${i.id}" is not available.`);
      const qty = Math.max(1, parseInt(i.qty, 10) || 1);
      return { id: p.id, name: p.name, priceUSD: p.price_usd, qty };
    });

    let couponRow = null;
    if (coupon_code) {
      couponRow = db.prepare('SELECT * FROM coupons WHERE code = ?').get(String(coupon_code).toUpperCase());
    }

    const { subtotal, discount, total } = computeTotals(resolved, couponRow);
    if (total <= 0) return res.status(400).json({ error: 'Order total must be greater than zero.' });

    const accessToken = await getAccessToken();
    const ppResp = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          description: 'Arise Numero — Crystal Bracelet Order',
          amount: { currency_code: 'USD', value: total.toFixed(2) },
        }],
        application_context: {
          brand_name: 'Arise Numero',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
        },
      }),
    });
    if (!ppResp.ok) {
      const text = await ppResp.text();
      console.error('PayPal create order failed:', text);
      return res.status(502).json({ error: 'Could not start PayPal checkout.' });
    }
    const ppOrder = await ppResp.json();

    // Record a pending order now so it shows up (as "pending") in the admin
    // panel even if the buyer abandons payment on PayPal's page.
    const orderId = 'ord_' + crypto.randomBytes(6).toString('hex');
    db.prepare(`
      INSERT INTO orders
        (id, customer_name, customer_email, customer_phone, shipping_address, items,
         subtotal_usd, discount_usd, coupon_code, total_usd, status, payment_method, payment_reference)
      VALUES (@id, @customer_name, @customer_email, @customer_phone, @shipping_address, @items,
              @subtotal_usd, @discount_usd, @coupon_code, @total_usd, 'pending', 'paypal', @payment_reference)
    `).run({
      id: orderId,
      customer_name: customer.name || null,
      customer_email: customer.email || null,
      customer_phone: customer.phone || null,
      shipping_address: JSON.stringify(shipping || {}),
      items: JSON.stringify(resolved),
      subtotal_usd: subtotal,
      discount_usd: discount,
      coupon_code: couponRow ? couponRow.code : null,
      total_usd: total,
      payment_reference: ppOrder.id,
    });

    res.json({ paypal_order_id: ppOrder.id, total_usd: total });
  } catch (err) {
    console.error('create-order error:', err);
    res.status(400).json({ error: err.message || 'Could not create order.' });
  }
});

// ── POST /api/paypal/capture-order/:paypalOrderId ──────────────────
router.post('/paypal/capture-order/:paypalOrderId', async (req, res) => {
  const paypalOrderId = req.params.paypalOrderId;
  try {
    const orderRow = db.prepare('SELECT * FROM orders WHERE payment_reference = ?').get(paypalOrderId);
    if (!orderRow) return res.status(404).json({ error: 'No matching order found for this payment.' });

    const accessToken = await getAccessToken();
    const capResp = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    const capData = await capResp.json();

    if (!capResp.ok || capData.status !== 'COMPLETED') {
      db.prepare(`UPDATE orders SET status = 'failed' WHERE id = ?`).run(orderRow.id);
      console.error('PayPal capture failed:', capData);
      return res.status(402).json({ error: 'Payment was not completed.' });
    }

    // Mark paid + decrement stock (clamped at 0) for each item, atomically.
    const items = JSON.parse(orderRow.items);
    const tx = db.transaction(() => {
      db.prepare(`UPDATE orders SET status = 'paid' WHERE id = ?`).run(orderRow.id);
      for (const item of items) {
        db.prepare(`UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?`).run(item.qty, item.id);
      }
    });
    tx();

    const payer = capData.payer || {};
    res.json({
      order_id: orderRow.id,
      status: 'paid',
      payer_name: payer.name ? `${payer.name.given_name || ''} ${payer.name.surname || ''}`.trim() : null,
      payer_email: payer.email_address || null,
      capture_id: capData.purchase_units?.[0]?.payments?.captures?.[0]?.id || null,
    });
  } catch (err) {
    console.error('capture-order error:', err);
    res.status(400).json({ error: err.message || 'Could not capture payment.' });
  }
});

module.exports = router;
