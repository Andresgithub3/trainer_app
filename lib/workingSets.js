// Compose the wave-weight calculator with plate-rounding to produce a session's
// ready-to-load working sets. Pure — the UI calls this to render the today card.

import { waveWeights } from './waveWeights.js'
import { closestLoadable, DEFAULT_BAR_WEIGHT, DEFAULT_INVENTORY } from './plateRounding.js'

// Returns one entry per set: the prescription (reps, pct, isAmrap, rawWeight)
// merged with the rounded loadable result (chosen, perSide, plates, needsChoice,
// alternatives). AMRAP sets round up on ties; back-off sets round down.
export function buildWorkingSets(
  trainingMax,
  week,
  { barWeight = DEFAULT_BAR_WEIGHT, inventory = DEFAULT_INVENTORY } = {},
) {
  return waveWeights(trainingMax, week).map((set) => {
    const setType = set.isAmrap ? 'amrap' : 'backoff'
    const rounded = closestLoadable(set.rawWeight, barWeight, inventory, setType)
    return { ...set, setType, ...rounded }
  })
}
