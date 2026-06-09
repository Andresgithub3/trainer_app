import { describe, it, expect } from 'vitest'
import { buildWorkingSets } from './workingSets.js'

describe('buildWorkingSets', () => {
  it('builds Bench Week 2 sets at TM 150 with rounding + flags', () => {
    const sets = buildWorkingSets(150, 2)
    expect(sets).toHaveLength(3)

    // Set 1: 3 @ 75% = 112.5 -> back-off rounds down to 115? nearest is 115 (d2.5).
    expect(sets[0].reps).toBe(3)
    expect(sets[0].rawWeight).toBe(112.5)
    expect(sets[0].chosen).toBe(115)

    // Top set: 3+ @ 85% = 127.5 — no clean load, flagged (the bench Wk2 fixture).
    expect(sets[2].isAmrap).toBe(true)
    expect(sets[2].rawWeight).toBe(127.5)
    expect(sets[2].needsChoice).toBe(true)
    expect(sets[2].alternatives).toEqual({ below: 125, above: 135 })
  })

  it('every set carries loadable plate detail', () => {
    for (const set of buildWorkingSets(185, 1)) {
      expect(typeof set.chosen).toBe('number')
      expect(set.perSide).toBe((set.chosen - 45) / 2)
      expect(Array.isArray(set.plates)).toBe(true)
    }
  })

  it('respects a custom inventory and bar weight', () => {
    const sets = buildWorkingSets(100, 1, { barWeight: 45, inventory: [25, 25] })
    // Only loadable totals: 45, 95, 145. 70% of 100 = 70 -> nearest is 45 or 95.
    expect(sets[0].chosen === 45 || sets[0].chosen === 95).toBe(true)
  })
})
