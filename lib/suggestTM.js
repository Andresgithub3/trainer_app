// Training Max auto-suggestion (PRD §5.2).
//
// Pure, framework-free. After an AMRAP top set, estimate 1RM, compare the
// implied Training Max to the current one, and recommend a raise when the AMRAP
// justifies more than the routine end-of-block bump.

import { WAVE_TABLE } from './waveWeights.js'

// TM sits at 85–90% of true 1RM (PRD §4). We use the top of that range: it
// reproduces the owner's real calibration history cleanly (e.g. Deadlift 165).
export const TM_PERCENT_OF_1RM = 0.9

// Standard end-of-block increase (PRD §4): upper lifts +5, lower lifts +10.
export const BLOCK_INCREMENT = { upper: 5, lower: 10 }

// Epley-style estimate used throughout the program (SEED_DATA.md).
function estimate1RM(weight, reps) {
  return weight * reps * 0.0333 + weight
}

const round5 = (n) => Math.round(n / 5) * 5
const round1 = (n) => Math.round(n * 10) / 10

export function suggestTM(currentTM, amrapWeight, amrapReps, week, liftCategory) {
  const topSet = WAVE_TABLE[week]?.[2]
  if (!topSet) {
    throw new Error(`Invalid wave week: ${week} (expected 1, 2, 3, or 4)`)
  }
  if (liftCategory !== 'upper' && liftCategory !== 'lower') {
    throw new Error(`Invalid lift category: ${liftCategory} (expected 'upper' or 'lower')`)
  }
  if (!(currentTM > 0) || !(amrapWeight > 0) || !(amrapReps > 0)) {
    throw new Error('currentTM, amrapWeight, and amrapReps must all be positive')
  }

  const est1RM = estimate1RM(amrapWeight, amrapReps)
  const impliedTM = round5(est1RM * TM_PERCENT_OF_1RM)
  const increment = BLOCK_INCREMENT[liftCategory]
  const impliedDelta = impliedTM - currentTM
  const targetReps = topSet.reps

  // Recommend an AMRAP-driven raise only when the implied TM exceeds the current
  // one by MORE than the standard block increment. A smaller gap is left to the
  // routine end-of-block bump (so we don't double-raise).
  const recommendRaise = impliedDelta > increment
  const suggestedTM = recommendRaise ? impliedTM : currentTM

  return {
    est1RM: round1(est1RM),
    currentTM,
    impliedTM,
    suggestedTM,
    recommendRaise,
    standardIncrement: increment,
    targetReps,
    repsOverTarget: amrapReps - targetReps,
    reason: recommendRaise
      ? `AMRAP of ${amrapReps} reps @ ${amrapWeight} implies ~${impliedTM} TM ` +
        `(+${impliedDelta} over current ${currentTM}), beyond the standard +${increment}. Recommend raising to ${suggestedTM}.`
      : `AMRAP of ${amrapReps} reps @ ${amrapWeight} implies ~${impliedTM} TM ` +
        `(+${impliedDelta} over current ${currentTM}); within the standard +${increment}. Hold at ${currentTM}.`,
  }
}
