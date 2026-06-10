// Block-end Training Max increase (PRD §5.2). Pure, framework-free.
//
// At the start of each new 4-week block, the program prescribes a standard bump:
// +5 lb upper lifts, +10 lb lower lifts (with the option to take a bigger jump).

import { BLOCK_INCREMENT } from './suggestTM.js'

export function standardBlockIncrease(currentTM, category) {
  return currentTM + (BLOCK_INCREMENT[category] ?? 0)
}

// Prompt when entering block 2 or 3 and that block's increase hasn't been
// decided yet (recorded in tm_history, so applying OR holding suppresses it).
export function shouldPromptBlockIncrease(upcomingBlock, appliedBlocks) {
  return upcomingBlock >= 2 && !appliedBlocks.includes(upcomingBlock)
}

// Parse the block numbers already decided from tm_history reasons
// ("Block 2 increase (+5)", "Block 3: held", …).
export function appliedBlocksFromHistory(reasons) {
  const blocks = new Set()
  for (const reason of reasons) {
    const m = /^Block (\d+)/.exec(reason ?? '')
    if (m) blocks.add(Number(m[1]))
  }
  return [...blocks]
}
