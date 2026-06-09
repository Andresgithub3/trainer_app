# Supabase

## Schema

[`migrations/0001_init.sql`](migrations/0001_init.sql) builds the full schema (PRD §8),
enables RLS (single user: the authenticated magic-link user has full access), and
turns on realtime for phone/laptop sync.

**Apply it once** (the data API keys can't run DDL):

- **SQL Editor (easiest):** Supabase dashboard → SQL Editor → paste the file → Run.
- **Or `psql`/CLI** with the DB connection string, if you have it.

## Seed + verify

With `.env` populated (see [`.env.example`](../.env.example)):

```bash
npm run seed     # clears + loads current program state (idempotent)
npm run verify   # asserts Week 2, next session Bench, TMs, inventory
```

`seed.js` computes prescribed weights with the same `lib/` engine the app uses.
The seed is idempotent — it clears all rows before inserting, so it's safe to re-run.
