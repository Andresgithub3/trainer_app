import { describe, it, expect } from 'vitest'
import {
  closestLoadable,
  subsetSums,
  DEFAULT_BAR_WEIGHT,
  DEFAULT_INVENTORY,
} from './plateRounding.js'

const sum = (arr) => arr.reduce((a, b) => a + b, 0)

// Fixtures from SEED_DATA.md "UNIT TEST FIXTURES: plate-rounding engine".
// closestLoadable(target, bar=45, plates=[5,10,10,25,35,45], setType)

describe('closestLoadable — SEED_DATA fixtures', () => {
  it('target 145, any -> chosen 145, perSide 50 (45+5), exact', () => {
    const r = closestLoadable(145)
    expect(r.chosen).toBe(145)
    expect(r.perSide).toBe(50)
    expect(r.needsChoice).toBe(false)
  })

  it('target 60, amrap -> chosen 65, perSide 10 (no 60 loadable)', () => {
    const r = closestLoadable(60, DEFAULT_BAR_WEIGHT, DEFAULT_INVENTORY, 'amrap')
    expect(r.chosen).toBe(65)
    expect(r.perSide).toBe(10)
    // 55 and 65 are both 5 lb away; nearest-above is within 5, so not flagged.
    expect(r.needsChoice).toBe(false)
  })

  it('target 128, backoff -> needsChoice true, {below:125, above:135} (bench Wk2 top)', () => {
    const r = closestLoadable(128, DEFAULT_BAR_WEIGHT, DEFAULT_INVENTORY, 'backoff')
    expect(r.needsChoice).toBe(true)
    expect(r.alternatives).toEqual({ below: 125, above: 135 })
  })

  it('target 135, any -> chosen 135, perSide 45, exact', () => {
    const r = closestLoadable(135)
    expect(r.chosen).toBe(135)
    expect(r.perSide).toBe(45)
    expect(r.needsChoice).toBe(false)
  })

  it('target 115, any -> chosen 115, perSide 35, exact', () => {
    const r = closestLoadable(115)
    expect(r.chosen).toBe(115)
    expect(r.perSide).toBe(35)
    expect(r.needsChoice).toBe(false)
  })

  it('target 175, any -> chosen 175, perSide 65 (uses 2nd pair of 10s), exact', () => {
    const r = closestLoadable(175)
    expect(r.chosen).toBe(175)
    expect(r.perSide).toBe(65)
    expect(sum(r.plates)).toBe(65) // a valid combo summing to the per-side weight
    expect(r.needsChoice).toBe(false)
  })

  it('target 85, any -> chosen 85, perSide 20 (10+10), exact', () => {
    const r = closestLoadable(85)
    expect(r.chosen).toBe(85)
    expect(r.perSide).toBe(20)
    expect(r.needsChoice).toBe(false)
  })

  it('target 45, any -> chosen 45, perSide 0, empty bar', () => {
    const r = closestLoadable(45)
    expect(r.chosen).toBe(45)
    expect(r.perSide).toBe(0)
    expect(r.plates).toEqual([])
    expect(r.needsChoice).toBe(false)
  })
})

describe('closestLoadable — invariants', () => {
  it('every returned plate set sums to the chosen per-side weight', () => {
    for (const target of [45, 60, 85, 115, 128, 135, 145, 175, 305]) {
      const r = closestLoadable(target)
      expect(sum(r.plates)).toBe(r.perSide)
      expect(r.chosen).toBe(DEFAULT_BAR_WEIGHT + 2 * r.perSide)
    }
  })

  it('prefers the fewest-plate combination on ties (145 = 45+5, not 25+10+10+5)', () => {
    const r = closestLoadable(145)
    expect(r.plates).toHaveLength(2)
    expect(sum(r.plates)).toBe(50)
  })

  it('biases ties up for amrap and down for backoff', () => {
    // target 60 sits exactly between loadable 55 and 65.
    expect(closestLoadable(60, 45, DEFAULT_INVENTORY, 'amrap').chosen).toBe(65)
    expect(closestLoadable(60, 45, DEFAULT_INVENTORY, 'backoff').chosen).toBe(55)
  })

  it('caps out at the full inventory (per-side 130 -> total 305)', () => {
    const r = closestLoadable(9999)
    expect(r.chosen).toBe(305)
    expect(r.perSide).toBe(130)
  })
})

describe('subsetSums', () => {
  it('includes the empty subset and produces 2^n entries', () => {
    const out = subsetSums([5, 10, 25])
    expect(out).toHaveLength(8)
    expect(out[0]).toEqual({ sum: 0, plates: [] })
    expect(out.map((r) => r.sum).sort((a, b) => a - b)).toEqual([0, 5, 10, 15, 25, 30, 35, 40])
  })
})
