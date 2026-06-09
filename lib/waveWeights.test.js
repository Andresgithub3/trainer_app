import { describe, it, expect } from 'vitest'
import { waveWeights, WAVE_TABLE } from './waveWeights.js'

// Fixtures from SEED_DATA.md "UNIT TEST FIXTURES: wave-weight calculator".
// waveWeights(TM, week) -> 3 sets {reps, pct, rawWeight}, before plate-rounding.

describe('waveWeights — SEED_DATA fixtures', () => {
  it('Bench TM 150, Week 2', () => {
    const sets = waveWeights(150, 2)
    expect(sets.map((s) => ({ reps: s.reps, pct: s.pct, rawWeight: s.rawWeight }))).toEqual([
      { reps: 3, pct: 0.75, rawWeight: 112.5 },
      { reps: 3, pct: 0.8, rawWeight: 120 },
      { reps: 3, pct: 0.85, rawWeight: 127.5 },
    ])
  })

  it('Squat TM 185, Week 2', () => {
    const sets = waveWeights(185, 2)
    expect(sets.map((s) => s.rawWeight)).toEqual([138.75, 148, 157.25])
  })

  it('Deadlift TM 165, Week 1', () => {
    const sets = waveWeights(165, 1)
    expect(sets.map((s) => ({ reps: s.reps, pct: s.pct, rawWeight: s.rawWeight }))).toEqual([
      { reps: 5, pct: 0.7, rawWeight: 115.5 },
      { reps: 5, pct: 0.75, rawWeight: 123.75 },
      { reps: 5, pct: 0.8, rawWeight: 132 },
    ])
  })

  it('OHP TM 75, Week 1', () => {
    const sets = waveWeights(75, 1)
    expect(sets.map((s) => s.rawWeight)).toEqual([52.5, 56.25, 60])
  })
})

describe('waveWeights — structure and flags', () => {
  it('marks the top set as AMRAP for waves 1–3, not for the week-4 deload', () => {
    expect(waveWeights(150, 1)[2].isAmrap).toBe(true)
    expect(waveWeights(150, 2)[2].isAmrap).toBe(true)
    expect(waveWeights(150, 3)[2].isAmrap).toBe(true)
    expect(waveWeights(150, 4)[2].isAmrap).toBe(false)
  })

  it('returns exactly three sets with ascending percentages for every week', () => {
    for (const week of [1, 2, 3, 4]) {
      const sets = waveWeights(200, week)
      expect(sets).toHaveLength(3)
      expect(sets[0].pct).toBeLessThan(sets[1].pct)
      expect(sets[1].pct).toBeLessThan(sets[2].pct)
      expect(sets.map((s) => s.setIndex)).toEqual([0, 1, 2])
    }
  })

  it('matches the published wave table percentages and reps', () => {
    expect(WAVE_TABLE[3].map((r) => [r.reps, r.pct])).toEqual([
      [5, 0.75],
      [3, 0.85],
      [1, 0.9],
    ])
  })
})

describe('waveWeights — input validation', () => {
  it('throws on an invalid week', () => {
    expect(() => waveWeights(150, 0)).toThrow()
    expect(() => waveWeights(150, 5)).toThrow()
  })

  it('throws on a non-positive Training Max', () => {
    expect(() => waveWeights(0, 1)).toThrow()
    expect(() => waveWeights(-100, 1)).toThrow()
  })
})
