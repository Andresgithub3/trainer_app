# lib/ — framework-free logic

Pure JavaScript modules with **no React or Supabase dependency**, so the program
math can be unit-tested in isolation (PRD §7).

Planned modules (built in later steps):

- `waveWeights.js` — wave-weight calculator: `(lift, TM, week) → 3 working sets` (PRD §5.1).
- `plateRounding.js` — `closestLoadable(target, bar, inventory, setType)` via subset-sum enumeration (PRD §5.6).
- `suggestTM.js` — Training Max auto-suggestion from AMRAP performance (PRD §5.2).

Each module ships with a co-located `*.test.js` covering the fixtures in `SEED_DATA.md`.
