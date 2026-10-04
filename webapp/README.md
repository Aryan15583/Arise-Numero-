# Arise Numero — Next.js

A full Next.js rewrite of the Arise Numero crystal-bracelet-and-numerology
storefront: same design, plus a real database, a real API, and a working
admin panel (none of which the original static site had).

**Start here → [PROGRESS.md](./PROGRESS.md)** — what's built, what's genuinely
functional vs. needs your own API keys, known issues, and what to do next.

## Quick start

```bash
npm install
npx prisma migrate dev   # first time only — creates prisma/dev.db
npm run seed              # first time only — loads products, coupons, categories
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the storefront and
[http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel
(sign-in is a one-time code emailed to `ADMIN_LOGIN_EMAIL` — in dev without email configured,
the code is printed in the terminal running `npm run dev`; see TODO.md to enable real email).

## Stack

Next.js 16 (App Router) · TypeScript · Prisma 6 + SQLite · `jose` for admin
session JWTs · no CSS framework (styles ported from the original site).
