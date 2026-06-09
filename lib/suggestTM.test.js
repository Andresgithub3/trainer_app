import { describe, it, expect } from 'vitest'
import { suggestTM } from './suggestTM.js'

// Fixtures from SEED_DATA.md "UNIT TEST FIXTURES: TM auto-suggestion".
// suggestTM(currentTM, amrapWeight, amrapReps, week, liftCategory)
//
// These are the owner's real calibration events — the suggested TMs match the
// raises actually adopted (Bench->150, DL->165, Squat->185, OHP held at 75).

describe('suggestTM — SEED_DATA calibration fixtures', () => {
  it('Bench, TM 135, 16 reps @ 110, Week 1 -> est ~168, raise toward 150', () => {
    const r = suggestTM(135, 110, 16, 1, 'upper')
    expect(r.est1RM).toBeCloseTo(168.6, 1)
    expect(r.recommendRaise).toBe(true)
    expect(r.suggestedTM).toBe(150)
  })

  it('Deadlift, TM 145, 14 reps @ 125, Week 1 -> est ~183, raise toward 165', () => {
    const r = suggestTM(145, 125, 14, 1, 'lower')
    expect(r.est1RM).toBeCloseTo(183.3, 1)
    expect(r.recommendRaise).toBe(true)
    expect(r.suggestedTM).toBe(165)
  })

  it('Squat, TM 170, 12 reps @ 145, Week 2 -> est ~203, raise toward 185', () => {
    const r = suggestTM(170, 145, 12, 2, 'lower')
    expect(r.est1RM).toBeCloseTo(202.9, 1)
    expect(r.recommendRaise).toBe(true)
    expect(r.suggestedTM).toBe(185)
  })

  it('OHP, TM 75, 12 reps @ 65, Week 1 -> est ~91, modest; hold ~75', () => {
    const r = suggestTM(75, 65, 12, 1, 'upper')
    expect(r.est1RM).toBeCloseTo(91, 1)
    expect(r.recommendRaise).toBe(false)
    expect(r.suggestedTM).toBe(75)
    // A small +5 is available but not auto-recommended (within standard bump).
    expect(r.impliedTM).toBe(80)
  })
})

describe('suggestTM — behaviour', () => {
  it('does not recommend a raise when reps merely hit the target', () => {
    // Bench Week 2 target is 3 reps; hitting exactly 3 @ 127.5 implies no raise.
    const r = suggestTM(150, 127.5, 3, 2, 'upper')
    expect(r.recommendRaise).toBe(false)
    expect(r.suggestedTM).toBe(150)
  })

  it('reports reps over the week target floor', () => {
    expect(suggestTM(135, 110, 16, 1, 'upper').repsOverTarget).toBe(11) // wk1 target 5
    expect(suggestTM(170, 145, 12, 2, 'lower').repsOverTarget).toBe(9) // wk2 target 3
  })

  it('uses +10 for lower and +5 for upper as the standard increment', () => {
    expect(suggestTM(185, 200, 5, 1, 'lower').standardIncrement).toBe(10)
    expect(suggestTM(150, 160, 5, 1, 'upper').standardIncrement).toBe(5)
  })

  it('never suggests below the current TM on a weak AMRAP', () => {
    const r = suggestTM(200, 100, 3, 1, 'lower')
    expect(r.recommendRaise).toBe(false)
    expect(r.suggestedTM).toBe(200)
  })
})

describe('suggestTM — input validation', () => {
  it('throws on an invalid week', () => {
    expect(() => suggestTM(150, 110, 5, 0, 'upper')).toThrow()
    expect(() => suggestTM(150, 110, 5, 9, 'upper')).toThrow()
  })

  it('throws on an invalid lift category', () => {
    expect(() => suggestTM(150, 110, 5, 1, 'olympic')).toThrow()
  })

  it('throws on non-positive inputs', () => {
    expect(() => suggestTM(0, 110, 5, 1, 'upper')).toThrow()
    expect(() => suggestTM(150, 0, 5, 1, 'upper')).toThrow()
    expect(() => suggestTM(150, 110, 0, 1, 'upper')).toThrow()
  })
})
