# Benchmark Tracker

A mobile-first, single-user web app to run the **Benchmark Project 4-Day Strength +
Hybrid Running Program** over its 12-week duration. It removes all manual training
math: wave-loaded working weights from Training Maxes, plate-rounding to a real plate
inventory, Training Max suggestions from AMRAP performance, and progress tracking.

See [PRD.md](PRD.md) for the full spec and [SEED_DATA.md](SEED_DATA.md) for seed
values and test fixtures.

## Stack

- **Frontend:** React + JavaScript (no TypeScript), Vite, mobile-first, PWA-installable.
- **Backend:** Supabase (Postgres + auth via email magic link + realtime).
- **CI/CD:** GitHub Actions (lint + test on PRs) → Vercel auto-deploy on `main`.
- **Pure logic:** `lib/` holds framework-free, unit-tested calculation modules.

## Scripts

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start the Vite dev server            |
| `npm run build`    | Production build                     |
| `npm run preview`  | Preview the production build         |
| `npm run lint`     | ESLint over the project              |
| `npm run test`     | Run the Vitest suite once            |
| `npm run test:watch` | Vitest in watch mode               |
| `npm run seed`     | Load the current program state into Supabase (idempotent) |
| `npm run verify`   | Assert the seeded DB reproduces the current position |
| `npm run icons`    | Regenerate the PWA icons             |

## Features

- **Wave-weight engine** (`lib/`) — working sets from Training Max + wave week, rounded
  to loadable plates via subset-sum enumeration (PRD §5.1/§5.6).
- **TM auto-suggestion** — estimate 1RM from an AMRAP top set and recommend a raise
  beyond the standard block bump (§5.2).
- **Program calendar** — 12-week / 3-block schedule with a catch-up model (§5.5).
- **Run plan + progression** — weekly mileage with a 2-consecutive-completed-weeks gate.
- **Fast logging** — sets, prescribed accessories, runs, and a rest timer (§5.4).
- **Progress charts** — TM over time, AMRAP trend, run volume vs. plan (§5.3).
- **Settings** — editable plate inventory + Training Max overrides.
- **PWA** — installable, dark, mobile-first, with realtime phone/laptop sync.

The framework-free logic in `lib/` is fully unit-tested (`npm run test`).

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Supabase URL + keys
# apply supabase/migrations/0001_init.sql in the Supabase SQL editor
npm run seed && npm run verify
npm run dev
```
