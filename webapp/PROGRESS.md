# Arise Numero — Next.js rebuild — PROGRESS

Read this first if you're picking the project back up after a break. It explains
what exists, why it's built this way, what's genuinely working vs. what needs
your own API keys, and where to go next.

## Where this came from

The original project (`../` — the parent `Arise-Numero-` folder) was a static
HTML/CSS/JS site (12 pages) with no backend. Inside it was also
`arise-numero-fullstack (1).zip`, which contained an **unfinished Express +
libSQL/SQLite backend attempt** (`_extracted_zip/server/` after I unzipped it)
— a real schema, real routes (products/orders/coupons/bookings/PayPal/admin
auth with JWT + bcrypt), and a `ADMINDBMP.html` single-file admin panel driven
by localStorage. That zip is the reason this rebuild's data model looks the
way it does — I ported its schema and API design faithfully into Next.js
rather than inventing a new one, then rebuilt the frontend and admin panel as
real React/Next.js pages instead of static HTML + vanilla JS.

**This new project lives entirely in this `webapp/` folder.** The original
static site and the zip are untouched, one level up, for reference.

## Latest changes (newest work — read this first)

Some older sections below still describe earlier phases (e.g. the PIN login).
Where they disagree with this section, **this section is right**.

- **Database is now Postgres (Neon), not SQLite.** `schema.prisma` uses
  `provider = "postgresql"` with `DATABASE_URL` (pooled) + `DIRECT_URL` (direct,
  for migrations). The migration history was restarted for Postgres:
  `…_init_postgres` (schema) and `…_seed_catalogue` (stones, all products,
  coupons, inserted once with `ON CONFLICT DO NOTHING`). Old SQLite migrations
  are in `prisma/migrations-sqlite-archive/`. Admin searches use
  case-insensitive matching. Deploy: **DEPLOY.md** (Vercel + Neon; `render.yaml`
  for Render). `vercel-build` runs `prisma migrate deploy && next build`;
  `vercel.json` pins functions to Singapore (`sin1`) next to the Neon database.
  Upload limit is 4 MB (Vercel caps request bodies at 4.5 MB). Tested end to end
  against a local Postgres 16: fresh migrate, production build, admin login,
  uploads, pricing + ordering, reviews, back-in-stock, search.

- **Admin sign-in is now an emailed one-time code — the PIN is gone.** The login
  page emails an 8-character code to the single address in `ADMIN_LOGIN_EMAIL`
  (default `arisenumero@gmail.com`; the recipient can never come from the
  request). Each code works once, expires in 10 min, is replaced whenever a new
  one is requested, and is cancelled after 5 wrong guesses. Only an HMAC of the
  code is stored (`admin_login_codes` table, one row). 1 code/min and 6/hour
  limits live in the database; plus per-IP rate limits and the 15-minute IP
  lockout. Login endpoints also verify the request Origin. Code:
  `lib/admin-otp.ts`, `app/api/admin/login/{route,request/route}.ts`,
  `app/admin/login/page.tsx`. The old `/api/admin/pin` route, `bcryptjs`, the
  `ADMIN_PIN` env var and the stored PIN hash (deleted by migration) are all gone.
- **Email delivery: Gmail/SMTP or Resend** (`lib/email.ts`). Set `SMTP_*` (Gmail +
  App Password — steps in `TODO.md` §3) or `RESEND_API_KEY`. `npm run test-email`
  sends a test message. With neither: local dev prints the code in the terminal;
  production refuses to issue codes (503). A failed send in production leaves no
  live code behind. Verified against fake SMTP servers (accept / reject / unconfigured).
- **SEO** (`lib/seo.ts`, `app/robots.ts`, `app/sitemap.ts`, `app/opengraph-image.tsx`):
  per-page titles/descriptions/canonicals, Open Graph + Twitter cards (generated
  PNGs, also per product), JSON-LD (Organization, WebSite, Product+Offer,
  BreadcrumbList, product lists), live sitemap, robots rules, noindex on
  cart/checkout/admin, category landing pages, and clean product URLs
  `/product/<id>` (old `/product?id=` 308-redirects). While `NEXT_PUBLIC_SITE_URL`
  is a localhost URL the whole site is marked noindex on purpose. Structured data
  only ever uses real *approved* reviews, never the seeded rating numbers.
- **Bugs found and fixed:**
  - Overselling: no order path checked stock. COD/bank orders now reject
    over-stock quantities (409) and re-check inside the transaction; PayPal and
    Cashfree reject before taking payment; a post-payment race is flagged in the
    audit log and admin email instead of silently clamped.
  - PayPal capture bypassed the shared fulfilment code: no confirmation email,
    no admin notification, and a retried capture could flip a *paid* order to
    "failed" and double-decrement stock. Now idempotent and shared.
  - Admin **Stock Levels page crashed** (`products.filter is not a function`):
    the products API became paginated but this page still expected an array.
  - Home page was prerendered at build time, freezing featured products/prices/
    stock until the next deploy; it now revalidates every 60 s.
  - Hidden (inactive) products were reachable by URL; they now 404.
  - Currency detection called a third-party geo-IP service from the browser for
    every first-time visitor; it now prefers the host/CDN country header
    (`/api/geo`) and only falls back to the old lookup.
- **New customer features:**
  - *Order tracking* — `/track-order` (order number + the order's email; any mismatch
    gives an identical "not found", so it can't be used to probe). Shows a timeline
    (`order_events` table), items, totals, tracking number/carrier. The checkout
    confirmation links to it and remembers the last order on that device.
  - *Shipping emails* — customers are emailed when an order is paid / shipped (with
    tracking number) / completed / cancelled. The confirmation email now lists the
    items and has a "Track your order" button.
  - *Bank transfer actually works* — instructions are set in Admin → Settings and
    shown only to the customer who chose bank transfer (email + confirmation screen;
    never via `/api/config`). Previously the page promised instructions that didn't exist.
  - *Wishlist* (heart on cards + product page, `/wishlist`, header count — saved on
    the device), *shop search* (name/material/description/size/crystal), *FAQ* page
    (with FAQPage markup), *branded 404 + error pages*, *share buttons* (WhatsApp,
    Facebook, X, Pinterest, copy link), *newsletter signup* in the footer (honeypot +
    rate limit, welcome email with an optional coupon, token unsubscribe page that
    needs a button press so email scanners can't unsubscribe people).
  - *Cart* now enforces the same limits as the server (max 10 per product, never more
    than in stock) and keeps an applied coupon across refreshes.
  - *Footer social links* come from env vars and only show if set (the old ones were
    dead `#` links). *Google Analytics 4* is supported but loads **only** after the
    visitor accepts analytics cookies and `NEXT_PUBLIC_GA_ID` is set; a "Cookie
    settings" footer link lets visitors change or withdraw consent.
- **New admin features:** Update-order dialog (status, carrier, tracking number, note to
  customer, email toggle); cancelling an order **returns its stock** (and re-opening takes
  it again — it used to drift); CSV export for orders / bookings / messages / subscribers
  (formula-injection safe, audit-logged); printable invoice per order; Subscribers page;
  14-day revenue chart + pending-order and subscriber counts on the dashboard; coupons
  can have an expiry date, a usage limit and a minimum order; low-stock email alerts.
- **Order-flow hardening:** an invalid/expired coupon at checkout is now refused with a
  message instead of silently dropping the discount; payment fulfilment claims the order
  atomically so a webhook and a status check arriving together can't take stock twice
  (verified with three simultaneous calls).
- **Cleanup:** `middleware.ts` → `proxy.ts` (Next 16 rename); the cart/currency/wishlist
  state now uses `useSyncExternalStore`, which removed all lint warnings (the rule that
  used to be downgraded is enforced again — `npm run lint` is clean) and the
  Strict-Mode "wiped cart" class of bug; the cookie banner no longer appears in the
  admin panel.

## Stack

- **Next.js 16 (App Router)**, TypeScript, no CSS framework — `app/globals.css`
  is the original `styles.css` ported nearly verbatim (same CSS variables,
  same class names, same dark-mode-via-`prefers-color-scheme` behavior, same
  responsive breakpoints) so the site looks the same as the static original.
- **Prisma 6.19.3 + SQLite** (`prisma/schema.prisma`, `prisma/dev.db`). Pinned
  to 6.x deliberately — `prisma@latest` currently resolves to an `8.0.0-rc`
  that changed how `datasource url` works and broke `migrate dev` outright.
  Don't upgrade prisma without checking that first.
- **Auth**: `jose` (not `jsonwebtoken`) for JWT, because it works in both
  Node API routes and the Edge `middleware.ts` that gates `/admin/*` pages.
  Sign-in is an emailed one-time code (see "Latest changes"); there is no stored
  password/PIN. Session is an httpOnly cookie (`arisenumero_admin`), 8-hour
  expiry — a real improvement over the original's `localStorage` PIN + token design.
- **No third-party payment processor configured out of the box.** See
  "Checkout & payments" below — this is the one area where "identical to the
  original" wasn't possible without your own API keys.

## What's done (all tested working end-to-end in a real browser, not just compiled)

**Public site** — all 12 original pages rebuilt as real Next.js
routes/components, content and copy carried over:
`/`, `/shop` (working filters: crystal type, price range, bead size,
in-stock-only, sort — all client-side over live DB data), `/product/<id>`
(gallery, tabs, wishlist toggle, qty picker), `/cart`, `/checkout`,
`/numerology` (calculator is 100% client-side math, ported verbatim from the
original `main.js` — Pythagorean system, same number meanings), `/booking`,
`/about`, `/contact`, `/privacy`, `/terms`, `/returns`.

**Real backend, not mocked:**
- Products, Coupons, Orders, Bookings, ContactMessages, AdminSettings all in
  SQLite via Prisma. Seed data (`prisma/seed.ts`) is the original 8 products +
  4 coupon codes from the zip's `seed.js`, ported 1:1.
- `POST /api/orders` — a **real, working checkout** (Cash on Delivery / Bank
  Transfer). Prices are always re-resolved server-side from the DB (client
  can't fake a lower price), coupon discount + free-shipping-over-$50 logic
  is computed server-side, stock is decremented in a transaction. This is not
  a stub — I placed a real order through the actual UI during testing and
  watched stock decrement and the order appear in the admin panel.
- `POST /api/bookings`, `POST /api/contact` — real inserts, verified showing
  up in the admin panel's Bookings/Messages pages.
- Admin panel (`/admin/*`) — emailed-code login (JWT + httpOnly cookie, middleware
  gated), Dashboard (live stats), Products (full CRUD + image URLs + featured/
  active toggles), Stock Levels (bulk quick-edit), Orders (status changes,
  detail modal), Coupons (CRUD), Bookings (status + delete), Messages (contact
  inbox), Settings (store settings, sign out other sessions). Every one of these was clicked through and
  verified against the database during this session, not just code-reviewed.

**Product images**: the original repo never actually had product photos —
every `assets/*.jpg` in the static HTML pointed at a file that didn't exist.
Rather than port broken image links, I generated gradient/monogram SVG
placeholders per product (`scripts/gen-placeholders.mjs` → `public/assets/`)
so the working demo actually looks finished. Swap these for real photos
whenever you have them — just update `imageUrl`/`images` via the admin panel
or directly in the DB.

## Checkout & payments — what's real vs. what needs your keys

The original static site's checkout had Stripe/Card, PayPal, and Razorpay
tabs, but **only PayPal had real server-side logic** in the zip's backend
(and even that shipped with placeholder credentials — it was never actually
exercised end-to-end, per the zip's own `paypal.js` comments). I did not
build a fake card-number input that pretends to charge a card with no real
processor behind it — that would be a worse, more misleading version of
"working" than what's here.

What you get:
- **Cash on Delivery** and **Bank Transfer** — fully functional today, no
  setup. This is the default and what I tested against.
- **PayPal** — the integration is fully coded (`/api/paypal/create-order`,
  `/api/paypal/capture-order/[id]`, real PayPal Orders v2 API calls, stock
  decremented only after a confirmed capture) but is **inert until you set
  `PAYPAL_CLIENT_ID` / `PAYPAL_SECRET` in `.env`**. The checkout page checks
  `/api/config` and only shows the PayPal tab if a client ID is configured.
- **Cashfree** (added in the backend scale-up pass, see below) — covers UPI,
  GPay, Mastercard, Visa, netbanking, and wallets through one hosted checkout.
  Chosen explicitly instead of Razorpay per your request. Also inert until
  configured — see `TODO.md` section 1 for the exact signup steps.

If you want Stripe in addition, that's a new integration — worth knowing
Stripe stopped onboarding new India-domiciled merchants for standard
accounts as of 2022, which is why Cashfree (not Stripe) was the pick for
UPI/Indian cards here.

---

## Backend scale-up pass (this session)

You asked to "scale it up," rework the backend to be more production-ready,
and add UPI/GPay/Mastercard/Visa via a non-Razorpay gateway. Here's exactly
what changed, all tested against the running dev server, not just written:

**Cashfree integration** (`lib/cashfree.ts`, `app/api/cashfree/*`) — order
creation, webhook handling with HMAC signature verification, and a
client-side status-check fallback for the rare case where a payment method
redirects the full page instead of staying in Cashfree's modal. Verified the
route correctly returns 503 with a clear message when unconfigured, and that
the checkout page hides the UPI/Card tab entirely until it is.

**Request validation** (`lib/validation.ts`) — every API route (public and
admin) now validates its body with Zod instead of ad-hoc `if` checks. Bad
input gets a real 400 with a specific field-level message instead of either
silently doing the wrong thing or crashing.

**Rate limiting** (`lib/rate-limit.ts`) — in-memory sliding window per
(IP, endpoint), applied to every public write endpoint (orders, bookings,
contact, coupon validation, reviews, Cashfree order creation) and to admin
login specifically (8 attempts/minute — a PIN is a small keyspace, this
matters). Verified: 20 rapid coupon-validate calls return 200 for the first
20, then 429 for the rest. This is process-local — see `TODO.md` section 7
for what changes if you scale to multiple server instances.

**Categories are now a real, admin-manageable table** instead of a
hardcoded array baked into the shop page and product form. Admin →
Categories has full CRUD; the shop filter and the product-add dropdown both
read from it live. Verified: added a "Moonstone" category via the API,
confirmed it appeared in the shop filter, deleted it, confirmed it
disappeared.

**Product reviews are real** (`Review` model, `/api/reviews`,
`/api/products/[id]/reviews`, Admin → Reviews). Customers submit a review
from the product page; it starts "pending" and is invisible publicly until
an admin approves it from Admin → Reviews. Verified the full loop: submitted
a review via the UI form's underlying API, confirmed it did NOT appear on
the product page yet, approved it from the admin API, confirmed it then
replaced the two static example reviews on the product page. Products with
zero real reviews still show the original two illustrative example reviews
so the page doesn't look empty — this is presentational only, not fabricated
data (nothing is written to the database for the fallback).

**Site config is now database-backed, not hardcoded** (`lib/site-config.ts`,
Admin → Settings → Store Settings). Shipping rates, the free-shipping
threshold, and currency exchange rates were previously constants in the
frontend code; they now live in `admin_settings` and are editable from the
admin panel without a redeploy. Verified: changed the INR rate from 83.5 to
90 via the API, reloaded the homepage, watched the displayed price change
from ₹2086.66 to ₹2249.10 (24.99 × 90 = 2249.1, checks out) — then reset it
back to 83.5.

**Transactional email** (`lib/email.ts`, using Resend) — order confirmations,
booking confirmations, and admin new-order/new-booking/new-message/
new-review notifications now go through a real send function. Inert until
`RESEND_API_KEY` is set — until then it logs
`[email:not-configured] would send to X: subject` to the server console
instead, which I confirmed happens correctly by placing a test order and
grepping the dev server log for that line.

**Pagination everywhere that lists grow unboundedly** — Admin Products,
Orders, Bookings, Messages, and Reviews all now paginate server-side
(`?page=&pageSize=`) instead of loading the entire table into the browser.
The admin dashboard's stats also switched from `findMany()` + JS filtering
to real `count()`/`aggregate()` queries, so it stays fast as data grows into
the thousands instead of loading full tables on every dashboard view.

**Database indexes** added on every column list/detail pages filter or sort
by: `Product.active/category/featured`, `Order.status/date/paymentReference`,
`Booking.status`, `ContactMessage.status`, plus indexes on the new `Review`
table's `productId`/`status`.

**Health check** at `/api/health` for uptime monitors / load balancer probes
— confirms DB connectivity, not just that the process is alive.

---

## Security hardening pass (this session)

You asked for "industry-level security protocols for the safety of users."
Everything below is implemented and verified against the running app — not
just written. I'm listing what each thing actually defends against, since
"add security" is meaningless without that.

**A real vulnerability I found and fixed while doing this**: `lib/email.ts`
and several route files interpolated user-supplied text (order names,
contact-form messages, review comments) directly into HTML email bodies
sent via Resend. A customer entering `<img src=x onerror=alert(1)>` as their
name would have had that execute in whoever opened the notification email.
Added `escapeHtml()` and applied it everywhere user text reaches an `html:`
string (`lib/email.ts`, and the `notifyAdmin()` calls in
`orders/route.ts`, `bookings/route.ts`, `contact/route.ts`,
`reviews/route.ts`, `lib/order-fulfillment.ts`).

**HTTP security headers** (`next.config.ts`) — sent on every response,
verified via a live `fetch()` against the running server:
- **Content-Security-Policy** — allow-lists exactly the third parties this
  app loads (Google Fonts, PayPal, Cashfree) and blocks everything else;
  `frame-ancestors 'none'` stops the site being framed by another site
  (clickjacking). Known tradeoff documented in the file: `script-src`
  includes `'unsafe-inline'` because a full nonce-based CSP needs a bigger
  middleware change than this pass covers — see TODO.md.
- **X-Frame-Options: DENY**, **X-Content-Type-Options: nosniff**,
  **Referrer-Policy: strict-origin-when-cross-origin**, **Permissions-Policy**
  (blocks camera/mic/geolocation access entirely — this site never needs
  them), **Strict-Transport-Security** (forces HTTPS once you're actually
  deployed on it — harmless over local `http://localhost`).
- `poweredByHeader: false` — stops advertising "X-Powered-By: Next.js" (and
  its version) to every visitor, which is free reconnaissance for an
  attacker looking for known framework CVEs.

**CSRF defense-in-depth** (`lib/csrf.ts`, wired into `lib/require-admin.ts`)
— the admin cookie is `SameSite=Strict` (tightened from `Lax` — see below),
which already stops browsers from attaching it to cross-site requests. On
top of that, every state-changing admin API call now also checks that the
`Origin` (or `Referer`) header matches this server's own host, rejecting
anything that doesn't with 403. Verified the matching logic against 6 cases
(same-origin via Origin, same-origin via Referer-only, forged cross-site
Origin, missing headers entirely, production-host match, subdomain
mismatch) — all passed — and confirmed a real same-origin admin request
still succeeds end-to-end through the running server.

**Session invalidation on demand** (`lib/admin-session.ts`,
`lib/auth.ts`'s versioned JWTs) — every admin token now carries the current
value of a database-stored "session version." Changing the PIN, or a new
Admin → Settings → **Sign Out All Other Sessions** button, bumps that
version, which instantly invalidates every previously issued token —
including one an attacker might have — without needing a server-side
session store. The session taking the action gets a freshly reissued
cookie so you're not logged out by your own security action. Verified: PIN
change kept the current session working while invalidating the old PIN
immediately; logout-everywhere likewise kept the current session alive.

**Brute-force lockout on admin login** (`lib/login-lockout.ts`) — on top of
the existing rate limiter (which caps volume), 5 consecutive wrong PINs
from an IP now locks that IP out for 15 minutes, *including further correct
attempts* (a lockout that let the right PIN through would leak "you got it
right" information to an attacker mid-brute-force). Verified live: 5 wrong
PINs → 429 on the 6th regardless of correctness, including a subsequent
correct-PIN attempt.

**Admin audit log** (`AuditLog` table, `/admin/audit-log`) — every login
(success and failure), PIN change, session invalidation, and
product/coupon/category/order-status/review-status/settings mutation is now
recorded with a timestamp, action, short human-readable detail, and IP.
Verified the page renders a real captured sequence of events from this
session's own testing (logins, failures, a PIN change, a settings update).
Never logs secrets — PINs and tokens never appear in a log row.

**Cookie hardening** — `SameSite` tightened from `Lax` to `Strict` for the
admin cookie (it's never legitimately needed for a cross-site top-level
navigation, unlike a public-facing login where `Lax` is the usual
recommendation to not break "click a link from email" flows).

**Webhook replay protection** (`api/cashfree/webhook`) — in addition to
verifying Cashfree's HMAC signature (already in place), webhooks older than
5 minutes are now rejected outright. `finalizeOrderAsPaid()` was already
idempotent so a replay couldn't double-fulfil an order, but this means a
captured/logged webhook body stops being usable to a replayer shortly
after.

**Fail-fast on placeholder secrets** — `lib/auth.ts` now throws at startup
if `NODE_ENV=production` and `JWT_SECRET` is still one of the placeholder
values shipped in `.env`/`.env.example`, instead of silently signing
production admin sessions with a secret that's sitting in this repo.

**Dependency hygiene** — moved `prisma` (the CLI/migration tool, only used
at build/dev time) from `dependencies` to `devDependencies`, where it
belongs; it was inflating the production dependency tree. `npm audit`
currently reports 3 high-severity advisories, all from `deepmerge-ts` via
`@prisma/config` via the `prisma` CLI package itself — not
`@prisma/client`, which is what actually runs in the deployed app. This is
a build-tool-only exposure (nothing an end user's request can reach), but
it's tracked, not ignored — see TODO.md.

## Environment / setup

```bash
cd webapp
npm install
cp .env.example .env        # already done for you locally; regenerate JWT_SECRET before deploying anywhere real
npx prisma migrate dev      # creates prisma/dev.db (already done)
npm run seed                # loads the 8 products + 4 coupons (already done)
npm run dev                 # http://localhost:3000
```

Admin panel: `http://localhost:3000/admin/login` — click "Email me a login code".
With no email configured yet, the code is printed in the terminal running
`npm run dev`. To get it into the real inbox, add a Gmail App Password as
`SMTP_PASS` in `.env` and run `npm run test-email` (see `TODO.md` §3).

## Known non-blocking issues

- (Resolved) The `middleware` deprecation warning — the file is now `proxy.ts`, which is
  what gates `/admin/*` pages. `npm run lint` is clean with the default rules.
- SQLite (`prisma/dev.db`) is fine for local dev but has no persistent disk on
  most serverless hosts (Vercel, etc.). If you deploy, either use a host with
  a persistent volume, or swap the Prisma datasource to Postgres/Turso — the
  original zip's `db.js` comments explain exactly this tradeoff, which is why
  it used libSQL/Turso instead of plain SQLite. Schema is portable; this is a
  `datasource` provider change plus a fresh `prisma migrate` when you're ready.
- The dev database currently has real records from testing across two
  sessions: a CoD test order ("Jane Smith"), a bank-transfer test order
  ("Backend Test"), a test booking, a test contact message, and Amethyst
  Serenity's stock is 2 instead of the seeded 3 because a real order
  decremented it. (The test review was removed so it can't leak into SEO markup.)
  Delete them from the admin panel, or wipe and reseed:
  `rm prisma/dev.db && npx prisma migrate dev && npm run seed`.

## A bug I hit and fixed while testing — worth knowing if you touch CartContext

`CartContext.tsx` originally gated its localStorage-persist effect behind a
`useRef` flag set to `true` inside the load effect. Under React's Strict Mode
dev-only double-invoke behavior, this let the persist effect fire once with
the still-empty initial cart *between* the two invocations of the load
effect, silently wiping the saved cart on every full page load. Fixed by
making the "have we hydrated yet" flag real `useState` instead of a ref, so
it stays tied to the render it belongs to instead of being a mutable value
effects can observe out of order. If you ever add a similar
"load-once-then-persist" pattern elsewhere, use the same approach (state, not
a ref) or you'll hit the same bug.

## What I'd do next, roughly in priority order

**See `TODO.md` for the full list of things only you can do** (sign up for
Cashfree, set env vars, etc.) — this is just the short version:

1. Sign up for Cashfree sandbox keys and test a real payment end-to-end (TODO.md §1).
2. Set a real `JWT_SECRET` and configure email (Gmail App Password, TODO.md §3) before deploying anywhere reachable — admin login needs it.
3. Delete this session's test records (a few orders, a booking, a message, an audit log full of test login attempts) or reseed.
4. Real product photos, replacing the rendered product images (TODO.md §5).
5. Set `NEXT_PUBLIC_SITE_URL` to the real domain and submit the sitemap to Google (TODO.md §11).
6. If deploying to Vercel/serverless: swap SQLite for Postgres (TODO.md §6).
7. Consider nonce-based CSP and a pen test before a high-stakes launch (TODO.md's Security section).
