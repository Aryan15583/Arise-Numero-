# Security review: Arise Numero (webapp/)

Date: 8 Nov 2026. Scope: the live Next.js store in `webapp/` (www.arisenumero.co.in on Vercel).
The old static site and Express server in the repo root are not deployed (the GitHub Pages
copy only redirects to the live domain), so they were not changed.

## Summary

The store was already in good shape: admin login by emailed one-time code, signed
HttpOnly/SameSite=Strict cookies, rate limits, CSRF origin checks, security headers,
server-side prices and Zod validation on most routes. This pass found and fixed:

| # | Severity | Problem | Fix |
|---|---|---|---|
| 1 | **Critical** | Next.js 16.3.5 had several published remote-code-execution flaws, including one in `next/og ImageResponse`, which this site uses for link-preview images. | Upgraded `next` and `eslint-config-next` to 16.4.5. `npm audit fix` also updated zod, nodemailer, sharp and source-map-js. |
| 2 | **High** (money) | PayPal charged the order **without shipping**: the checkout showed e.g. $38.98, PayPal took $32.99. | All three checkout paths now use one server-side `computeOrderTotals()` (`lib/pricing.ts`). The checkout sends the shipping method to PayPal too. |
| 3 | **High** (privacy) | `GET /api/cashfree/order-status/<id>` returned the full order (name, email, phone, address) to anyone with an order ID. Order IDs appear in emails, URLs and the tracking page. | Now returns only `id`, `status`, `totalUsd`, only for Cashfree orders, with a rate limit. |
| 4 | Medium | PayPal create-order had no input validation and no rate limit. | Added a Zod schema (`paypalCreateOrderSchema`) and a 10/min rate limit, the same as the other checkout routes. |
| 5 | Medium | PayPal capture marked an order paid without checking the amount actually captured, and returned the full order and payer details. | Compares the captured amount and currency with the server total. On a mismatch it does not mark the order paid, logs it and emails the admin. Returns only id/total/status. |
| 6 | Medium | Rate limits and login lockout read the first `X-Forwarded-For` entry, which visitors can forge on hosts other than Vercel (e.g. Render, which `render.yaml` supports). | `getClientIp()` trusts Vercel's headers on Vercel, and otherwise uses the last entry (added by the hosting proxy). Tested: 12 requests with fake IPs are blocked after 10. |
| 7 | Low | Failed admin logins were logged but nobody was alerted. | After 5 wrong codes, the admin gets one email alert (max one per 30 min). |
| 8 | Low | Error messages from PayPal/Cashfree/internal code were sent to the browser. | Customers now see a plain message; details go to the server log only. |
| 9 | Low | Hidden products were still readable through `/api/products/<id>`. | Returns 404 for hidden products, like their pages already did. |

## The 27-point checklist

| # | Item | Result |
|---|---|---|
| 1 | Login on every private page | ✅ Already: proxy guards all `/admin` pages; every admin API route calls `requireAdmin` (checked all 26). |
| 2 | Hash passwords | ✅ No passwords exist. Login codes are stored only as an HMAC-SHA256 hash. |
| 3 | Cookies HttpOnly, Secure, SameSite | ✅ Already: HttpOnly, Secure in production, SameSite=Strict, 8-hour expiry. |
| 4 | Reset links expire, single use | ✅ No reset links. Login codes expire in 10 min, work once, max 5 guesses. |
| 5 | Rate-limit logins and sign-ups | ✅ Already + **fixed** IP spoofing (item 6 above) and added limits to the PayPal and Cashfree status routes. |
| 6 | Admin routes admin-only | ✅ Already (see 1); session version check lets you sign out all sessions. |
| 7 | Users see only their own data | 🔧 **Fixed** the Cashfree status leak (3) and trimmed the PayPal capture response (5). Order tracking already needed ID + matching email. |
| 8 | Parameterized queries | ✅ Prisma everywhere; the only raw query is a fixed `SELECT 1` health check. |
| 9 | Validate every form on the server | 🔧 **Fixed** PayPal create-order (4); all other public routes already used Zod. |
| 10 | Escape input to block XSS | ✅ React escapes output; emails use `escapeHtml`; the only `dangerouslySetInnerHTML` is JSON-LD, which escapes `<`. |
| 11 | CSRF protection | ✅ Already: SameSite=Strict + Origin check on every state-changing admin request and on login. |
| 12 | Force HTTPS | ✅ Vercel redirects to HTTPS; HSTS (2 years, preload) and `upgrade-insecure-requests` are set. |
| 13 | Security headers | ✅ Already: CSP, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy, HSTS. Verified on the live site. |
| 14 | Restrict CORS | ✅ No CORS headers are sent, so browsers only allow same-site calls. |
| 15 | API keys off the frontend | ✅ Only the PayPal *client ID* (public by design) reaches the browser. |
| 16 | No secrets in public env vars | ✅ `NEXT_PUBLIC_*` vars are only the site URL, social links, WhatsApp number and Analytics ID. |
| 17 | Scan Git history for secrets | ✅ Scanned all 44 commits: only placeholders. Note: the old root `.env.example` has `ADMIN_PIN=1558`, used only by the old, undeployed Express server. |
| 18 | Revoke leaked keys | ✅ Nothing leaked, nothing to revoke. |
| 19 | Limit upload types and sizes | ✅ Already: admin-only, 4 MB max, file type checked from the bytes (JPEG/PNG/WebP only). |
| 20 | Check prices and payments on the server | 🔧 Prices were already from the database; **fixed** the PayPal shipping gap (2) and added the captured-amount check (5). |
| 21 | Debug mode off in production | ✅ Production build; dev-only login hints are hidden in production. 🔧 **Fixed** error-detail leaks (8). |
| 22 | `.env` not public | ✅ `/.env` returns 404 on the live site; `.env*` is git-ignored. |
| 23 | Update packages with known holes | 🔧 **Fixed** (1). One left: `deepmerge-ts` inside the Prisma CLI (build-time only, never handles visitor requests). Its fix needs Prisma 7, a breaking upgrade, so it was left for a separate change. |
| 24 | Remove unused packages | ✅ Every dependency is used. |
| 25 | Log failed logins and alert | 🔧 Logging existed; **added** the email alert (7). |
| 26 | Full security review | ✅ This document. |
| 27 | Test every fix | ✅ See below. |

## How it was tested

Production build (`next build` on Next 16.4.5) against a local Postgres 16 with the real
migrations, then:

- COD order: total includes shipping (32.99 + 5.99 = 38.98) ✅
- PayPal create-order: bad input → 400 with a validation message; valid input → plain error, no internals ✅
- Cashfree status: non-Cashfree order → 404; paid order → only `{id, status, totalUsd}`; junk id → 404 ✅
- PayPal capture with an unknown id → 404 ✅
- Hidden product → 404 ✅
- 12 order lookups with forged `X-Forwarded-For` → blocked after 10 ✅
- 5 wrong admin codes → lockout (429) and exactly one alert recorded ✅
- Home, shop, product, cart, checkout, tracking and admin login pages → 200; `/admin` without login → redirect ✅
- `tsc --noEmit` and `eslint` pass ✅

Not tested end to end: real PayPal and Cashfree payments (no sandbox keys here). Do one sandbox
PayPal payment after deploying to confirm the amount now includes shipping.

## What you need to do

1. **Set `ADMIN_NOTIFY_EMAIL` in Vercel** (Settings → Environment Variables) if it isn't set.
   Failed-login and payment-mismatch alerts go there; without it they're only logged.
2. After merging, test one PayPal sandbox order with shipping.
3. Optional clean-up: delete the old root static site, `src/` Express server, root
   `.env.example` and the GitHub Pages workflow (`.github/workflows/static.yml`). They're not
   live, but they're old code that could be redeployed by mistake.
4. Later: plan a Prisma 7 upgrade to clear the last audit warning, and consider a shared
   rate-limit store (e.g. Upstash Redis): the current limits are per server instance, which
   on Vercel means they reset when a new instance starts. The login code's own database
   limits (5 guesses, 6 codes per hour) don't have this weakness.
