// Wave-weight calculator (PRD §5.1, SEED_DATA wave table).
//
// Pure, framework-free. Given a Training Max and a wave week (1–4), returns the
// three working sets as { setIndex, reps, pct, isAmrap, rawWeight } — BEFORE
// plate-rounding (rounding is a separate concern, see plateRounding.js).
//
// The top set's "+" in the program (e.g. "5+@80%") means an AMRAP set: `reps`
// is the prescribed floor and `isAmrap` is true. The Week-4 deload top set is a
// straight 5 (not AMRAP).

// pct is stored as a fraction of the Training Max.
export const WAVE_TABLE = {
  1: [
    { reps: 5, pct: 0.7, isAmrap: false },
    { reps: 5, pct: 0.75, isAmrap: false },
    { reps: 5, pct: 0.8, isAmrap: true },
  ],
  2: [
    { reps: 3, pct: 0.75, isAmrap: false },
    { reps: 3, pct: 0.8, isAmrap: false },
    { reps: 3, pct: 0.85, isAmrap: true },
  ],
  3: [
    { reps: 5, pct: 0.75, isAmrap: false },
    { reps: 3, pct: 0.85, isAmrap: false },
    { reps: 1, pct: 0.9, isAmrap: true },
  ],
  4: [
    { reps: 5, pct: 0.4, isAmrap: false },
    { reps: 5, pct: 0.5, isAmrap: false },
    { reps: 5, pct: 0.6, isAmrap: false },
  ],
}

// Round to 2 decimals to avoid binary floating-point noise (e.g. 150 * 0.85).
// Raw working weights land on quarter-pound values, so 2 decimals is exact.
function round2(n) {
  return Math.round(n * 100) / 100
}

export function waveWeights(trainingMax, week) {
  const rows = WAVE_TABLE[week]
  if (!rows) {
    throw new Error(`Invalid wave week: ${week} (expected 1, 2, 3, or 4)`)
  }
  if (!(typeof trainingMax === 'number') || !(trainingMax > 0)) {
    throw new Error(`Invalid Training Max: ${trainingMax} (expected a positive number)`)
  }
  return rows.map((row, setIndex) => ({
    setIndex,
    reps: row.reps,
    pct: row.pct,
    isAmrap: row.isAmrap,
    rawWeight: round2(trainingMax * row.pct),
  }))
}
