import { describe, it, expect } from 'vitest'
import {
  RUN_PLAN,
  weekGlobalOf,
  runWeekCompleted,
  effectiveRunWeek,
  currentRunTargets,
} from './runPlan.js'

describe('RUN_PLAN', () => {
  it('covers 12 weeks with deloads on 4/8/12', () => {
    expect(Object.keys(RUN_PLAN)).toHaveLength(12)
    expect(RUN_PLAN[1]).toEqual({ easy: 3.0, long: 5.0 })
    expect(RUN_PLAN[4]).toEqual({ easy: 3.0, long: 4.0 })
    expect(RUN_PLAN[11]).toEqual({ easy: 6.0, long: 11.0 })
  })
})

describe('weekGlobalOf', () => {
  it('maps block + week-in-block to a 1–12 global week', () => {
    expect(weekGlobalOf(1, 2)).toBe(2)
    expect(weekGlobalOf(2, 2)).toBe(6)
    expect(weekGlobalOf(3, 4)).toBe(12)
  })
})

describe('runWeekCompleted', () => {
  const sessions = [
    { day_type: 'easy_run', block: 1, week: 1, status: 'completed' },
    { day_type: 'long_run', block: 1, week: 1, status: 'completed' },
    { day_type: 'easy_run', block: 1, week: 2, status: 'completed' },
    { day_type: 'long_run', block: 1, week: 2, status: 'skipped' },
  ]
  it('is true only when all of a week’s runs are completed', () => {
    expect(runWeekCompleted(sessions, 1)).toBe(true)
    expect(runWeekCompleted(sessions, 2)).toBe(false)
    expect(runWeekCompleted(sessions, 3)).toBe(false) // no runs that week
  })
})

describe('effectiveRunWeek (2-consecutive-completed gate)', () => {
  it('climbs to the current week when everything is completed', () => {
    expect(effectiveRunWeek(5, () => true)).toBe(5)
  })
  it('holds at week 1 when nothing is completed', () => {
    expect(effectiveRunWeek(5, () => false)).toBe(1)
  })
  it('holds when 2 consecutive weeks are not completed', () => {
    const done = new Set([1]) // only week 1 done
    const eff = effectiveRunWeek(4, (w) => done.has(w))
    expect(eff).toBe(2) // cleared to wk2 off wk1, then stuck (wk2 not done)
  })
})

describe('currentRunTargets', () => {
  it('flags held targets when progression is gated', () => {
    const t = currentRunTargets(2, () => false) // week 1 runs not completed
    expect(t).toMatchObject({ effectiveWeek: 1, held: true, easy: 3.0, long: 5.0 })
  })
  it('uses the current week when fully caught up', () => {
    const t = currentRunTargets(3, () => true)
    expect(t).toMatchObject({ effectiveWeek: 3, held: false, easy: 4.0, long: 7.0 })
  })
})
