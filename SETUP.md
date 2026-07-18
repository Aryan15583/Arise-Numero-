# Arise Numero — Setup & Deployment Guide

This turns the site from a browser-only prototype into a real client → server →
database app. One Node process serves both the storefront/admin HTML **and**
the JSON API, so there's a single thing to run and a single thing to deploy.

```
server/
  package.json
  .env.example        ← copy to .env and fill in
  data/                ← SQLite database file lives here (auto-created)
  public/               ← your storefront + admin HTML/CSS/JS (served as-is)
  src/
    server.js           ← entry point
    db.js               ← SQLite schema
    seed.js              ← one-time seed of your 8 products + 4 coupons
    middleware/auth.js  ← admin JWT check
    routes/
      products.js  coupons.js  bookings.js  orders.js  paypal.js  admin.js
```

## 1. Run it locally

```bash
cd server
npm install
cp .env.example .env
```

Open `.env` and set:
- `JWT_SECRET` — any long random string. Generate one with:
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `ADMIN_PIN` — only used the very first time the server starts (to seed the
  hashed PIN in the database). Change it from the admin panel afterwards.
- `PAYPAL_CLIENT_ID` / `PAYPAL_SECRET` — from
  [developer.paypal.com](https://developer.paypal.com) → Apps & Credentials.
  Use your **Sandbox** app while testing.

Then:

```bash
npm run seed     # loads your real 8 products + 4 coupons into the database
npm start
```

Visit:
- Storefront: http://localhost:3000/index.html
- Shop (now live from the database): http://localhost:3000/shop.html
- Admin panel: http://localhost:3000/ADMINDBMP.html (PIN = whatever you set as `ADMIN_PIN`)

## 2. What actually changed (mapped to your 5 issues)

1. **Admin ↔ storefront sync** — `shop.html` and `product.html` now fetch
   `/api/products` / `/api/products/:id` instead of hardcoded HTML. Every
   add/edit/delete you make in the admin panel is live on the site
   immediately — same database, no separate "sync" step.
2. **Orders reach the admin panel** — a successful PayPal payment calls
   `/api/paypal/capture-order/...` server-side, which writes a real row into
   the `orders` table. The Orders tab reads that same table.
3. **`product.html` reads `?id=`** — `main.js:initProductDetailPage()` now
   parses `URLSearchParams`, fetches that product, and populates the page.
   (The long prose specs like Cord/Wrist Size/Colour/Origin/Packaging are
   still generic across products — only Material and Bead Size are
   per-product from the database. Let me know if you want a `specs` JSON
   field added per product for full control over every row.)
4. **Checkout / PayPal** — per your call, PayPal is the one gateway that's
   fully wired end-to-end, server-side (see `routes/paypal.js`). Card and
   Razorpay tabs are now disabled with a "Coming soon" label instead of
   silently doing nothing.
5. **Real backend** — Express + SQLite (`better-sqlite3`), admin PIN is
   bcrypt-hashed server-side (never in page source), sessions are signed
   JWTs, all writes go through the API.

**Bonus fix:** `main.js` had a genuine syntax error (`await` used inside a
non-`async` function, in both the booking and contact form submit handlers)
that would have silently broken *all* JavaScript on every page in a real
browser. Fixed — confirmed via `node --check` before and after.

## 3. Testing PayPal

I could not test the PayPal calls from my sandbox — its network egress
doesn't allow `api-m.paypal.com` / `api-m.sandbox.paypal.com`. The
integration is written against PayPal's documented Orders v2 API
(server-side create-order → client approves → server-side capture-order),
and everything else in this project (routing, auth, database writes,
static serving) has been tested end-to-end with real HTTP requests. Please
run through one full Sandbox checkout after deploying:

1. Create a Sandbox app at developer.paypal.com, get a **Sandbox** Client ID
   + Secret, put them in `.env`, `PAYPAL_MODE=sandbox`.
2. `npm start`, go to `checkout.html`, add an item to cart first.
3. Click the PayPal button, pay with a Sandbox buyer account.
4. Check the admin panel's Orders tab — you should see the order flip from
   nothing → `paid`.

If something doesn't match PayPal's current API shape, the fix will be
isolated to `server/src/routes/paypal.js`.

## 4. Deploying

Any host that runs a persistent Node process works (Render, Railway, Fly.io,
a plain VPS). Render's free/starter web service is the simplest:

1. Push this `server/` folder to a GitHub repo.
2. Render → New → Web Service → point at the repo, root directory `server`.
3. Build command: `npm install`. Start command: `npm start`.
4. Add the same env vars from `.env` in Render's dashboard (use your **Live**
   PayPal credentials once you're ready to accept real payments,
   `PAYPAL_MODE=live`).
5. Add a persistent disk mounted at `server/data` so your SQLite file (and
   therefore your products/orders/bookings) survives redeploys — on Render:
   Settings → Disks → mount path `/opt/render/project/src/data` (adjust to
   wherever your repo lands).

## 5. Rename the admin panel URL

`ADMINDBMP.html` is served as a plain static file at a guessable name. Once
you're ready to go live, rename the file (e.g. `mypage-8x2k.html`) and don't
link to it from anywhere on the site — exactly like the comment at the top
of that file already says.

## 6. Known limitations / good next steps

- **No email receipts yet from the backend** — EmailJS still fires from the
  browser for booking confirmations; order confirmation is just the on-page
  "Order Confirmed!" screen. Wiring a transactional email (e.g. via Resend
  or SendGrid) into `routes/paypal.js` after a successful capture would be
  a clean next step.
- **Stock isn't reserved during checkout** — it's decremented only after a
  successful PayPal capture, so two people could in theory buy the last item
  at the same moment. Fine at this scale; worth a reservation/lock if you
  scale up.
- **product.html specs are partly generic** — see point 3 above.
- **SQLite** is great for a single-server store like this. If you ever run
  multiple app servers behind a load balancer, move `db.js` to a hosted
  Postgres — every route calls the same handful of functions in that file,
  so it's a contained change.
