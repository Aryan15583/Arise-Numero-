# Archived SQLite migrations

The app used SQLite (`prisma/dev.db`) until it moved to Postgres (Neon). These
are the old SQLite migrations, kept only for reference — Prisma no longer reads
this folder. The live migration history starts in `../migrations/`:

- `…_init_postgres` — the full schema, equivalent to all of these combined.
- `…_seed_catalogue` — the stones, products and coupons these migrations and
  `seed.ts` used to insert, loaded once into a new database.
