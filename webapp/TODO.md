# Your To-Do List

Everything below is something only you can do (accounts, business decisions,
API keys) — the code is already written and working for all of it in
"inert until configured" mode. Nothing here blocks the site from running
today; it's what unlocks each feature for real customers.

## 1. Get paid — Cashfree (UPI, GPay, Mastercard, Visa)

This is the main new piece. One integration, already coded and tested against
mocked responses, covers UPI/GPay/cards/netbanking/wallets.

1. Sign up at **https://merchant.cashfree.com/merchants/signup** (free).
2. Go to **Developers → API Keys**, switch to **Test Mode**, and copy your
   **App ID** and **Secret Key** — issued instantly, no KYC needed yet.
3. In `webapp/.env`, set:
   ```
   CASHFREE_MODE=sandbox
   CASHFREE_APP_ID=<your test App ID>
   CASHFREE_SECRET_KEY=<your test Secret Key>
   ```
4. Restart the dev server. The "UPI / GPay / Card" tab will now appear at
   checkout automatically (it's hidden whenever these aren't set).
5. Test a full payment using Cashfree's sandbox test credentials — their
   dashboard has test UPI IDs and test card numbers that simulate success/
   failure without moving real money. **Do this before going live.**
6. In the Cashfree dashboard, under **Developers → Webhooks**, add a webhook
   pointing to `https://yourdomain.com/api/cashfree/webhook` (must be your
   real public domain once deployed — sandbox testing works without this
   since the checkout page also verifies payment status directly, but the
   webhook is what catches payments where the buyer closes the tab early).
7. When ready for real money: complete Cashfree's KYC (business documents,
   bank account), switch `CASHFREE_MODE=production`, and swap in your live
   App ID/Secret Key.

## 2. Get paid — PayPal (optional, already built)

Same pattern as Cashfree. Sign up at developer.paypal.com, create an app,
put the Client ID / Secret in `.env` as `PAYPAL_CLIENT_ID` / `PAYPAL_SECRET`.
Useful for international customers outside India who'd rather use PayPal
than a card directly.

## 3. Real email — **required** for admin login in production

The admin panel has no PIN or password. You sign in with a one-time code that
is emailed to **arisenumero@gmail.com** (change it with `ADMIN_LOGIN_EMAIL`).
Order/booking/contact emails use the same sender. Until email is configured,
locally the code is printed in the terminal running `npm run dev`, and in
production **admin login is disabled** (by design — no backdoor).

**Easiest: send through the Gmail account itself (about 2 minutes).**

1. Sign in to arisenumero@gmail.com and turn on **2-Step Verification**:
   https://myaccount.google.com/security
2. Create an **App Password**: https://myaccount.google.com/apppasswords
   (Google shows a 16-character code — this is *not* your normal password.)
3. In `webapp/.env` set `SMTP_PASS=` to that code (spaces are fine). The other
   `SMTP_*` lines are already filled in for Gmail.
4. Run `npm run test-email` — it sends one test message to the admin address
   and tells you if anything is wrong. Check the inbox (and spam).
5. Restart the dev server. Open `/admin/login` → "Email me a login code".

**Alternative: Resend** (https://resend.com) — set `RESEND_API_KEY` instead.
Its free `onboarding@resend.dev` sender can only deliver to the address the
Resend account was created with, so sign up with arisenumero@gmail.com, or
verify your own domain and set `EMAIL_FROM`. If both `SMTP_*` and
`RESEND_API_KEY` are set, SMTP is used.

Also set `ADMIN_NOTIFY_EMAIL` to get pinged on every new order, booking,
contact message, and review.

## 4. Security basics before going live

- [ ] Set a real, random `JWT_SECRET` in production (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) — the one in `.env` right now is a placeholder. **The app now refuses to start in production with a placeholder secret**, so this isn't optional — it'll fail fast and tell you.
- [ ] Turn on 2-Step Verification for arisenumero@gmail.com — whoever can read that inbox can sign in to the admin panel, so its security *is* the admin security.
- [ ] Delete the test data from this session's testing: one order for
      "Backend Test", the Cashfree/COD test orders from earlier sessions, a
      test booking, a test review, and now also an audit log full of test
      login attempts/lockouts from security testing — or just reset with
      `rm prisma/dev.db && npx prisma migrate dev && npm run seed`.

## 5. Product content

- [ ] Replace the generated SVG placeholder images (`public/assets/*.svg`)
      with real product photography. Update each product's Image URL from
      Admin → Products, or directly in the database.
- [ ] Review the auto-generated category descriptions (Admin → Categories)
      and adjust to your own voice.
- [ ] Moderate incoming reviews regularly — Admin → Reviews, they start as
      "Pending" and won't show publicly until you approve them. Approving,
      rejecting or deleting a review updates that product's rating instantly.

## 6. If/when you outgrow SQLite

SQLite (the current database) is genuinely fine for a small-to-medium store —
single file, zero setup, handles concurrent reads well. It becomes a real
constraint once you have many simultaneous writers (e.g. a traffic spike
during a sale) or you deploy to a serverless host with no persistent disk
(Vercel, etc. — the file would reset on every deploy there).

When you hit that point:
1. Stand up a Postgres database (free tiers: Neon, Supabase, Railway).
2. In `prisma/schema.prisma`, change `provider = "sqlite"` to
   `provider = "postgresql"` under `datasource db`.
3. Point `DATABASE_URL` at your new Postgres connection string.
4. Run `npx prisma migrate dev` once against the new database — it replays
   all the existing migrations, so you get the identical schema.
5. Re-run `npm run seed` if it's a fresh database.

Nothing else in the app needs to change — all the query code goes through
Prisma, which is database-agnostic.

## 7. If you deploy behind multiple server instances (load balancer)

The rate limiter (`lib/rate-limit.ts`) and the site config cache are
process-local. That's correct and sufficient for one server instance. If you
ever scale to multiple instances behind a load balancer, swap the in-memory
rate limiter for a shared store (Redis via `@upstash/ratelimit` is the
easiest drop-in) so limits are enforced consistently across instances.

## 8. Set your real domain

Once deployed, set `NEXT_PUBLIC_SITE_URL` in your production environment to
your real domain (e.g. `https://arisenumero.com`) — Cashfree's payment
return/notify URLs and PayPal both need absolute URLs, and this is the one
place that assembles them.

## 9. Security — what's already built in (no action needed)

This session added a full hardening pass. You don't need to do anything for
these — they're live now — but you should know they're there:

- **HTTP security headers** on every response: Content-Security-Policy,
  X-Frame-Options (blocks clickjacking), X-Content-Type-Options, a strict
  Referrer-Policy, a locked-down Permissions-Policy, and HSTS.
- **CSRF protection**: every state-changing admin request (POST/PUT/DELETE)
  checks that the request's Origin/Referer actually matches your site before
  it's allowed through.
- **Email one-time-code login** (no PIN/password to steal or guess): codes go
  only to the one configured address, are 8 characters, work once, expire in
  10 minutes, and are replaced whenever a new one is requested. Only a keyed
  hash is stored. A code is cancelled after 5 wrong guesses; at most 1 code
  per minute and 6 per hour can be requested.
- **Brute-force lockout**: 5 wrong codes in a row locks out that IP for 15
  minutes — including further correct attempts, on purpose, so an attacker
  can't use response timing to confirm they've found the right code.
- **Session revocation**: clicking "Sign Out All Other Sessions" in Settings
  instantly invalidates every other logged-in session/device — no waiting for
  cookies to expire.
- **Admin audit log** (Admin → Audit Log): every login, PIN change, product/
  order/coupon/category/review/settings change is recorded with a
  timestamp and IP. Worth a periodic glance to spot anything you didn't do.
- **Hardened cookies**: the admin session cookie is httpOnly (invisible to
  page JavaScript, so it can't be stolen via an XSS bug), SameSite=Strict,
  and Secure (HTTPS-only) in production.
- **HTML-injection fix**: customer-supplied text (names, order/booking
  details, contact messages) is now escaped before going into notification
  emails — previously someone could have put HTML/script tags in a form
  field and had it render in the admin's inbox.
- **Webhook replay protection**: Cashfree webhook requests older than 5
  minutes are rejected, on top of the existing signature check.
- **Fail-fast on weak config**: the app refuses to boot in production if
  `JWT_SECRET` is still the placeholder value.

## 10. Security — worth doing as you grow

Not urgent, but keep these in mind:

- [ ] **If you ever suspect a real compromise** (leaked `.env`, a server you
      think was accessed by someone else), rotate `JWT_SECRET` to a brand
      new random value and restart the app. This is the "nuclear option" —
      unlike "Sign Out All Other Sessions," it invalidates *every* session
      immediately, including your own, and you'll need to log in again with
      your PIN.
- [ ] If arisenumero@gmail.com is ever compromised, change `ADMIN_LOGIN_EMAIL`
      to a safe address and restart, then use "Sign Out All Other Sessions".
- [ ] Check Admin → Audit Log occasionally, especially after enabling public
      internet access to `/admin/login` — failed-login clusters from
      unfamiliar IPs are worth noticing.
- [ ] The current CSP allows `'unsafe-inline'` for scripts (needed for some
      inline bits Next.js/React use). A stricter nonce-based CSP is possible
      but is a bigger change — reasonable to defer until closer to a
      high-stakes public launch, ideally alongside a professional pen test.
- [ ] Consider putting the site behind Cloudflare (free tier) once you have
      a real domain — gives you a WAF, DDoS protection, and bot filtering
      for free on top of everything above.
- [ ] `npm audit` currently flags 3 high-severity advisories, but they're in
      `prisma`'s own CLI tooling (via `deepmerge-ts`), which only runs
      during `npx prisma migrate` on your machine — not reachable by a
      website visitor. Keep an eye out for a `prisma` patch release that
      clears it, or turn on GitHub's Dependabot once this is in a repo.
- [ ] Longer-term/optional: a passkey for the admin login on top of the
      emailed code, and field-level encryption for the more
      sensitive personal fields in bookings (birth name/date of birth) if
      you're ever storing them at meaningful scale.

## 11. SEO — what's built, and what only you can do

**Already built (nothing to do):** unique title + description + canonical URL
on every page; Open Graph / Twitter link-preview cards (a generated 1200×630
image for the site and for each product); `/sitemap.xml` (built live from the
catalogue) and `/robots.txt`; structured data (Organization, WebSite, Product +
Offer, BreadcrumbList, product-list); clean product URLs (`/product/amethyst-8mm`,
old `?id=` links redirect permanently); category landing pages
(`/shop?cat=amethyst`); `noindex` on cart/checkout/admin; hidden products 404.

**You need to:**

- [ ] **Set `NEXT_PUBLIC_SITE_URL` to your real domain (e.g. `https://arisenumero.co.in`) in the
      production environment *before building*.** Every canonical URL, sitemap
      entry and social card is built from it. While it points at `localhost`
      the site deliberately tells search engines **not** to index it.
- [ ] Add the site to **Google Search Console** (https://search.google.com/search-console),
      verify ownership (paste the code into `GOOGLE_SITE_VERIFICATION` in `.env`),
      and submit `https://yourdomain/sitemap.xml`. Do the same in **Bing
      Webmaster Tools** (`BING_SITE_VERIFICATION`).
- [ ] Replace the generated SVG placeholder product images with real photos
      (JPG/PNG/WebP, ideally 1200×1200). Google shows photo results, not SVGs.
- [x] **Ratings are real now.** Product star ratings and review counts are
      calculated automatically from *approved* customer reviews (they can't be
      typed in by hand any more). Products with no approved reviews show "No
      reviews yet". The homepage rating badge, the About page "Average Rating"
      stat and the homepage testimonials also come from approved reviews, and
      are hidden until you have some.
- [ ] The About page still claims "50+ Countries Served" and "12k+ Happy
      Customers" — edit `app/about/page.tsx` if those aren't accurate yet.
- [ ] Write a unique description for each product (Admin → Products) — the first
      ~155 characters become the Google snippet.
- [ ] Fill in the footer social links (they are placeholders) and consider a
      Google Business Profile; links from other sites help rankings most.

## 12. GitHub & deployment

- The GitHub repo's `main` branch **publishes the whole repository to your live
  site (`arisenumero.co.in`) via GitHub Pages** (`.github/workflows/static.yml`).
  GitHub Pages can only serve static files — it **cannot run this Next.js app**
  (it needs a server for the database, payments, and admin).
- The Pages workflow now publishes **only** the old static storefront files
  (`*.html`, `styles.css`, `main.js`, `CNAME`, `assets/` if present). `webapp/`,
  `src/` and the docs are no longer copied onto the public site, so `webapp/` can
  safely live on `main`.
- To put the new app live, deploy `webapp/` to a Node host (Vercel is easiest:
  import the repo, pick branch `main`, set **Root Directory = `webapp`**) and
  point your domain there. SQLite needs a persistent disk — on Vercel/serverless,
  switch to Postgres first (section 6).
- **Old admin panel removed:** the static `ADMINDBMP.html` (which had its default
  PIN in the page source and was published on the live site) has been deleted.
  Never reuse that PIN anywhere. The new Next.js app has no PIN at all.

## 13. New store features — what to set up

All of these work out of the box; the items below are the bits only you can fill in.

- [ ] **Bank-transfer details:** Admin → Settings → "Bank transfer instructions". Until
      you fill it in, customers who choose bank transfer are told you'll email them
      the details. (They're only shown to that customer — never on the public site.)
- [ ] **Order emails need email set up (section 3).** Confirmations, "shipped" emails
      with tracking numbers, newsletter welcome emails and low-stock alerts all go
      through the same sender. Set `ADMIN_NOTIFY_EMAIL` to get new-order and
      low-stock alerts. Without email configured they're only logged in the terminal.
- [ ] **When you ship an order:** Admin → Orders → Update → set status "Shipped", pick a
      carrier and paste the tracking number. The customer is emailed and their
      tracking page updates. Cancelling an order puts its stock back automatically.
- [ ] **Footer social links:** set any of `NEXT_PUBLIC_INSTAGRAM_URL`,
      `NEXT_PUBLIC_FACEBOOK_URL`, `NEXT_PUBLIC_PINTEREST_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`
      (see `.env.example`). Only the ones you set appear. Rebuild/restart afterwards.
- [ ] **Google Analytics (optional):** create a GA4 property and set `NEXT_PUBLIC_GA_ID`
      (`G-XXXXXXXXXX`). It only loads for visitors who accept analytics cookies.
- [ ] **Newsletter:** the site *collects* subscribers (Admin → Subscribers, with CSV
      export) but cannot *send* campaigns. Export the list into a tool such as
      Brevo, Mailchimp or MailerLite to send newsletters. Signup is single opt-in; if
      you sell in the EU/UK, consider double opt-in. The welcome email offers the coupon
      in `NEWSLETTER_WELCOME_COUPON` (default `WELCOME10`) if it exists and is valid.
- [ ] **Coupons:** you can now set an expiry date, a total-uses limit and a minimum
      order on each coupon (Admin → Coupons). Online-payment orders count toward a
      coupon's limit when payment succeeds; COD/bank-transfer orders when placed.
- [ ] Review the **FAQ** page text (`app/faq/page.tsx`) — it summarises your current
      policies (14-day returns, delivery times, payment methods). Edit it if any of
      that changes.
- [ ] **Clean out the test data** before launch (a few test orders, a booking, a
      message, an audit log) — or reset with `rm prisma/dev.db && npx prisma migrate dev && npm run seed`.
