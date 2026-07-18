// db.js — SQLite connection + schema.
// Uses better-sqlite3 (synchronous, embedded, no separate DB server needed).
// The .sqlite file lives in /data so it survives restarts on a persistent disk.
// If you outgrow SQLite later (multiple app servers, heavy concurrent writes),
// swap this file for a Postgres client — every route just calls the functions
// exported below, so the rest of the app doesn't need to change.

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'arisenumero.sqlite');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id                    TEXT PRIMARY KEY,
    name                  TEXT NOT NULL,
    material              TEXT,
    description           TEXT,
    price_usd             REAL NOT NULL DEFAULT 0,
    original_price_usd    REAL,
    category              TEXT,
    bead_size             TEXT,
    stock                 INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold   INTEGER NOT NULL DEFAULT 5,
    image_url             TEXT,
    images                TEXT,   -- JSON array, stored as text
    badge                 TEXT,
    rating                REAL DEFAULT 4.9,
    review_count          INTEGER DEFAULT 0,
    active                INTEGER NOT NULL DEFAULT 1,
    featured              INTEGER NOT NULL DEFAULT 0,
    created_at            TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS coupons (
    code              TEXT PRIMARY KEY,
    discount_percent  INTEGER NOT NULL,
    description       TEXT,
    active            INTEGER NOT NULL DEFAULT 1,
    created_at        TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id                  TEXT PRIMARY KEY,
    customer_name       TEXT,
    customer_email      TEXT,
    customer_phone      TEXT,
    shipping_address    TEXT,   -- JSON blob: address1, address2, city, state, postal_code, country
    items               TEXT NOT NULL, -- JSON array: [{id, name, priceUSD, qty}]
    subtotal_usd        REAL NOT NULL DEFAULT 0,
    discount_usd        REAL NOT NULL DEFAULT 0,
    coupon_code         TEXT,
    total_usd           REAL NOT NULL DEFAULT 0,
    status              TEXT NOT NULL DEFAULT 'pending', -- pending | paid | shipped | completed | cancelled | failed
    payment_method      TEXT,   -- paypal | stripe | razorpay
    payment_reference   TEXT,   -- gateway order/capture id
    date                TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id                  TEXT PRIMARY KEY,
    first_name          TEXT,
    last_name           TEXT,
    client_email        TEXT,
    birth_name          TEXT,
    date_of_birth       TEXT,
    package_selected    TEXT,
    timezone            TEXT,
    session_date        TEXT,
    reading_focus       TEXT,
    additional_notes    TEXT,
    status              TEXT NOT NULL DEFAULT 'new', -- new | confirmed | completed | cancelled
    submitted_at        TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admin_settings (
    key    TEXT PRIMARY KEY,
    value  TEXT
  );
`);

module.exports = db;
