import { describe, it, expect } from 'vitest'
import {
  generateProgram,
  weekInBlock,
  blockForWeek,
  weekdayMon0,
} from './calendar.js'

const START = '2026-06-01'

describe('block / week helpers', () => {
  it('cycles week-in-block 1–4 and increments block every 4 weeks', () => {
    expect([1, 2, 3, 4, 5, 8, 9, 12].map(weekInBlock)).toEqual([1, 2, 3, 4, 1, 4, 1, 4])
    expect([1, 4, 5, 8, 9, 12].map(blockForWeek)).toEqual([1, 1, 2, 2, 3, 3])
  })
})

describe('generateProgram', () => {
  const program = generateProgram(START)
  const byDate = Object.fromEntries(program.map((s) => [s.date, s]))

  it('starts on a Monday with Squat, Week 1, Block 1', () => {
    expect(weekdayMon0(START)).toBe(0) // 2026-06-01 is a Monday
    expect(program[0]).toMatchObject({ date: START, dayType: 'squat', block: 1, week: 1 })
  })

  it('produces 6 non-rest sessions per week across 12 weeks (72)', () => {
    expect(program).toHaveLength(72)
    expect(program.some((s) => s.dayType === 'rest')).toBe(false)
  })

  it('aligns with the seeded history dates', () => {
    expect(byDate['2026-06-02']).toMatchObject({ dayType: 'bench', block: 1, week: 1 })
    expect(byDate['2026-06-04']).toMatchObject({ dayType: 'deadlift', block: 1, week: 1 })
    expect(byDate['2026-06-08']).toMatchObject({ dayType: 'squat', block: 1, week: 2 })
  })

  it('puts the current position (Tue Jun 9) at Bench, Block 1, Week 2', () => {
    expect(byDate['2026-06-09']).toMatchObject({ dayType: 'bench', block: 1, week: 2 })
  })

  it('maps the full weekly structure', () => {
    // Week 1: Mon Jun 1 … Sat Jun 6 (Sun rest excluded)
    expect(program.slice(0, 6).map((s) => s.dayType)).toEqual([
      'squat',
      'bench',
      'easy_run',
      'deadlift',
      'ohp',
      'long_run',
    ])
  })

  it('spans 3 blocks and ends at Block 3 Week 4', () => {
    const last = program[program.length - 1]
    expect(blockForWeek(last.weekGlobal)).toBe(3)
    expect(last.weekGlobal).toBe(12)
    expect(last.week).toBe(4)
    expect(Math.max(...program.map((s) => s.block))).toBe(3)
  })

  it('includeRest adds Sunday rest days (7/week)', () => {
    const withRest = generateProgram(START, { weeks: 1, includeRest: true })
    expect(withRest).toHaveLength(7)
    expect(withRest[6]).toMatchObject({ dayType: 'rest' })
  })
})
