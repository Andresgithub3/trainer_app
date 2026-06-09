// Plate-rounding engine (PRD §5.6).
//
// Pure, framework-free. Enumerates every loadable per-side plate combination by
// brute-force subset-sum (the inventory is tiny, so 2^n is trivial) and finds
// the closest physically-loadable total to a target weight.

export const DEFAULT_BAR_WEIGHT = 45
// Per side; each value is one plate available on each side (duplicates = pairs).
export const DEFAULT_INVENTORY = [5, 10, 10, 25, 35, 45]

// Every subset of `plates` with its sum and the plates that produced it.
// Implemented exactly as the PRD §5.6 pseudocode (includes the empty subset).
export function subsetSums(plates) {
  const results = [{ sum: 0, plates: [] }]
  for (const p of plates) {
    const snapshot = [...results]
    for (const r of snapshot) {
      results.push({ sum: r.sum + p, plates: [...r.plates, p] })
    }
  }
  return results
}

export function closestLoadable(
  targetWeight,
  barWeight = DEFAULT_BAR_WEIGHT,
  plateInventory = DEFAULT_INVENTORY,
  setType = 'backoff',
) {
  const perSideSums = subsetSums(plateInventory)

  // Map each achievable total -> the plate subset that makes it, preferring the
  // subset that uses the fewest plates when totals tie (PRD §5.6 step 3).
  const totalsMap = new Map()
  for (const { sum, plates } of perSideSums) {
    const total = barWeight + 2 * sum
    if (!totalsMap.has(total) || plates.length < totalsMap.get(total).length) {
      totalsMap.set(total, plates)
    }
  }

  const totals = [...totalsMap.keys()].sort((a, b) => a - b)
  const below = [...totals].reverse().find((t) => t <= targetWeight)
  const above = totals.find((t) => t >= targetWeight)
  const dBelow = below != null ? targetWeight - below : Infinity
  const dAbove = above != null ? above - targetWeight : Infinity

  // Pick the nearest total; on a tie, bias by set type (PRD §5.6 step 5):
  // AMRAP/top set rounds up so the top set "bites"; back-off rounds down.
  let chosen
  if (dBelow === dAbove) {
    chosen = setType === 'amrap' ? above : below
  } else {
    chosen = dBelow < dAbove ? below : above
  }

  // needsChoice — see NOTE below. This flags when there is no clean loadable
  // total at or above the target within 5 lb, so the UI offers both neighbours.
  //
  // NOTE: This DEVIATES from the literal §5.6 pseudocode, which uses
  //   Math.min(dBelow, dAbove) > 5.
  // That literal rule conflicts with the SEED_DATA fixture
  //   target 128, backoff -> needsChoice true, {below:125, above:135}
  // because 125 is only 3 lb below 128 (min distance 3, not > 5), so the literal
  // rule yields false. Using `dAbove > 5` reproduces every provided fixture and
  // matches PRD §5.1's stated preference ("keep the set at or slightly above
  // target rather than under"): if the nearest at-or-above loadable weight is
  // more than 5 lb over target, surface the choice. Flagged to the owner for
  // confirmation — easy to switch back to the literal rule if preferred.
  const needsChoice = dAbove > 5

  return {
    chosen,
    perSide: (chosen - barWeight) / 2,
    plates: totalsMap.get(chosen),
    alternatives: needsChoice ? { below, above } : null,
    needsChoice,
  }
}
