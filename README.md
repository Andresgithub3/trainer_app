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

## Build order

This app is built incrementally, pausing for review after each step:

1. **Scaffold** — repo, Vite + React, ESLint, Vitest, CI, `lib/`. ← _current_
2. **Calculation engine** — `lib/` wave-weight calculator + plate-rounding, fully tested.
3. **Supabase schema + seed** — reproduce the current program position (Week 2, next: Bench).
4. **TM auto-suggestion** — `lib/` logic tested against real calibration history.
5. **Mobile UI** — today's session card + plate loading → fast logging → progress charts; PWA wiring.

## Getting started

```bash
npm install
npm run dev
```
