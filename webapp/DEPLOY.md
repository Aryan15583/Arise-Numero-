# Deploying Arise Numero — Vercel + Neon

**How the pieces fit**

| Service | Job | Cost to start |
| --- | --- | --- |
| **Neon** | The database (Postgres): products, orders, customers, uploaded photos | Free tier |
| **Vercel** | Runs the website — storefront, admin panel and API are all one Next.js app | Free (Hobby) |
| **Render** | *Optional alternative to Vercel.* You don't need both — see the last section | — |

Everything below is done in your browser; nothing to install. Total time ≈ 30 minutes.

---

## 1. Create the database on Neon (5 min)

1. Sign up at **https://neon.tech** (Sign in with GitHub is easiest).
2. **Create project** → name `arise-numero` → Postgres 16 → region **AWS Asia Pacific (Singapore)**
   (closest to India; the app is pinned to Vercel's Singapore region to match).
3. On the project dashboard click **Connect**. You need **two** connection strings:
   - Turn **Connection pooling ON** → copy it → this is your **`DATABASE_URL`**.
     Add `&pgbouncer=true&connect_timeout=15` to the end of it.
   - Turn **Connection pooling OFF** → copy it → this is your **`DIRECT_URL`**.
   Both start with `postgresql://` and end with `?sslmode=require`. Keep them private.

> **Neon's names vs. ours.** Neon's `.env` view may list `DATABASE_URL_POOLED`
> (contains `-pooler`) and `DATABASE_URL` (no `-pooler`). In Vercel, the
> *pooled* one goes in **`DATABASE_URL`** and Neon's plain `DATABASE_URL` goes in
> **`DIRECT_URL`**. Paste only the part inside the quotes.

You don't create any tables yourself: the first deploy builds the database and
loads the whole catalogue (21 stones, all products, coupons) automatically.

## 2. Put the site on Vercel (10 min)

1. Sign up at **https://vercel.com** with your GitHub account.
2. **Add New → Project → Import** `Aryan15583/Arise-Numero-`.
3. **Root Directory: `webapp`** ← important (click *Edit* next to it). Framework: Next.js (auto-detected).
4. Open **Environment Variables** and add these (Name → Value):

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon pooled string (+ `&pgbouncer=true&connect_timeout=15`) |
   | `DIRECT_URL` | Neon direct string |
   | `JWT_SECRET` | a long random string (64+ characters) — e.g. "generate password" in a password manager |
   | `NEXT_PUBLIC_SITE_URL` | `https://<your-project>.vercel.app` for now (change to your domain in step 4) |
   | `ADMIN_LOGIN_EMAIL` | `arisenumero@gmail.com` |
   | `SMTP_HOST` | `smtp.gmail.com` |
   | `SMTP_PORT` | `465` |
   | `SMTP_USER` | `arisenumero@gmail.com` |
   | `SMTP_PASS` | the 16-character Gmail **App Password** (TODO.md §3) — needed for admin login |
   | `ADMIN_NOTIFY_EMAIL` | where new-order alerts go (can be the same Gmail) |

   Optional, add when ready: `CASHFREE_MODE` / `CASHFREE_APP_ID` / `CASHFREE_SECRET_KEY`,
   `PAYPAL_MODE` / `PAYPAL_CLIENT_ID` / `PAYPAL_SECRET`, `NEXT_PUBLIC_GA_ID`,
   `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_FACEBOOK_URL`, `NEXT_PUBLIC_PINTEREST_URL`,
   `NEXT_PUBLIC_WHATSAPP_NUMBER`, `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`
   (descriptions in `.env.example`).
   Vercel may suggest **Prisma Postgres** and **Resend** integrations — skip both
   (you already use Neon and Gmail; Prisma Postgres would replace `DATABASE_URL`).
   With a Gmail App Password in `SMTP_PASS`, the other `SMTP_*` / `ADMIN_*` email
   settings are optional — they default to Gmail and arisenumero@gmail.com.
5. Click **Deploy**. (If the project was created without deploying, use
   Deployments → **Create Deployment** → branch `main`, or push any commit to `main`.) The build runs `prisma migrate deploy` (creates the tables and loads the
   catalogue on the first run) and then builds the site. ~2–3 minutes.
6. Open the `.vercel.app` link: the shop should show all products. Check
   `https://<your-project>.vercel.app/api/health` → `{"ok":true,"db":"up",…}`.

**Which branch?** Vercel deploys your default branch (`main`) as production. Merge the
pull request first, or set Settings → Git → Production Branch to the PR branch.

## 3. Check the admin panel

Go to `/admin/login` → **Email me a login code** → enter the code from the Gmail inbox.
If it says email isn't set up, `SMTP_PASS` is missing or wrong — fix it in
Vercel → Settings → Environment Variables, then **Redeploy**.

Then set prices and stock for the catalogue (Admin → Products, filter by type) and
upload real photos (Product Images, up to 4 per product).

## 4. Point arisenumero.co.in at Vercel

Your domain currently shows the old static site from GitHub Pages.

1. Vercel → your project → **Settings → Domains → Add** `arisenumero.co.in` (and `www.arisenumero.co.in`).
2. Vercel shows the DNS records to create. At your domain registrar's DNS settings, replace the
   old GitHub Pages records with exactly what Vercel shows (typically an **A** record for the
   bare domain and a **CNAME** for `www`). Vercel turns on HTTPS by itself.
3. Change `NEXT_PUBLIC_SITE_URL` to `https://arisenumero.co.in` → **Redeploy** (this value is
   baked into the build — links in emails, payment return URLs, sitemap, SEO).
4. Turn off the old site: GitHub repo → **Settings → Pages** → set Source to *None* (or delete
   `.github/workflows/static.yml` and the root `CNAME` file).
5. If you use Cashfree: Cashfree dashboard → Developers → Webhooks →
   `https://arisenumero.co.in/api/cashfree/webhook`.

## 5. Day-to-day

- **Every push to `main` redeploys automatically**, and any new database migrations run as
  part of the build. Pull requests get their own preview URL.
- **Backups:** Neon keeps a restore history (free tier: 24 h; paid: longer). Uploaded product
  photos live in the database, so they're backed up with it.
- **Logs:** Vercel → project → *Logs*. Database usage: Neon dashboard.
- **Local development** now needs Postgres too: in Neon create a **branch** called `dev`
  (Branches → New branch), put its two connection strings in `webapp/.env`, then
  `npm install && npx prisma migrate deploy && npm run dev`.

---

## Alternative: Render instead of Vercel

Use this *instead of* section 2 if you prefer Render (one always-on server rather than
serverless functions). Neon stays the same.

1. **https://render.com** → sign in with GitHub → **New → Blueprint** → pick this repo.
   Render reads `render.yaml` (repo root): a Node web service in `webapp/`, Singapore region,
   health check `/api/health`, and it runs the migrations on every deploy.
2. Fill in the values it asks for (`DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SITE_URL`,
   `SMTP_PASS`, …) — same meanings as the Vercel table above. `JWT_SECRET` is generated for you.
3. Plan: **Starter** (~$7/month). The free plan sleeps after 15 minutes without visitors, so the
   next customer waits about a minute — not good for a shop.
4. Domain: Render → service → **Settings → Custom Domains**, then the DNS records it shows.
