# Arise Numero — Next.js

A full Next.js rewrite of the Arise Numero crystal-bracelet-and-numerology
storefront: same design, plus a real database, a real API, and a working
admin panel (none of which the original static site had).

**Start here → [PROGRESS.md](./PROGRESS.md)** — what's built, what's genuinely
functional vs. needs your own API keys, known issues, and what to do next.

## Quick start

The database is Postgres (Neon in production). Put a Postgres connection string
in `.env` as both `DATABASE_URL` and `DIRECT_URL` — a free Neon `dev` branch is
easiest (see `.env.example`). Then:

```bash
npm install
npx prisma migrate deploy   # creates the tables and loads the catalogue
npm run dev
```

**Deploying:** see [DEPLOY.md](./DEPLOY.md) (Vercel + Neon, or Render).

Open [http://localhost:3000](http://localhost:3000) for the storefront and
[http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel
(sign-in is a one-time code emailed to `ADMIN_LOGIN_EMAIL` — in dev without email configured,
the code is printed in the terminal running `npm run dev`; see TODO.md to enable real email).

## Stack

Next.js 16 (App Router) · TypeScript · Prisma 6 + Postgres (Neon) · `jose` for admin
session JWTs · no CSS framework (styles ported from the original site).
