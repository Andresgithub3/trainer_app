import { describe, it, expect } from 'vitest'
import {
  standardBlockIncrease,
  shouldPromptBlockIncrease,
  appliedBlocksFromHistory,
} from './blockIncrease.js'

describe('standardBlockIncrease', () => {
  it('adds +5 to upper lifts and +10 to lower lifts', () => {
    expect(standardBlockIncrease(150, 'upper')).toBe(155)
    expect(standardBlockIncrease(185, 'lower')).toBe(195)
  })
})

describe('shouldPromptBlockIncrease', () => {
  it('never prompts for block 1', () => {
    expect(shouldPromptBlockIncrease(1, [])).toBe(false)
  })
  it('prompts entering block 2/3 when not yet decided', () => {
    expect(shouldPromptBlockIncrease(2, [])).toBe(true)
    expect(shouldPromptBlockIncrease(3, [2])).toBe(true)
  })
  it('does not re-prompt once decided', () => {
    expect(shouldPromptBlockIncrease(2, [2])).toBe(false)
  })
})

describe('appliedBlocksFromHistory', () => {
  it('extracts decided block numbers from reasons', () => {
    const reasons = [
      'Initial Training Max (block start)',
      'AMRAP-driven: 16 reps @ 110',
      'Block 2 increase (+5)',
      'Block 2: held',
      'Block 3 increase (+10)',
    ]
    expect(appliedBlocksFromHistory(reasons).sort()).toEqual([2, 3])
  })
})
