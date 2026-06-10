// Run mileage plan + progression (PRD §5.5). Pure, framework-free.
//
// RUN_PLAN gives weekly Easy (Wed Z2) and Long (Sat Z2) target miles across the
// 12-week program (deload on weeks 4/8/12). Progression is gated: you only
// advance to a week's higher targets once you've completed 2 consecutive run
// weeks — otherwise the app holds you at the last cleared week's mileage.

export const RUN_UNIT = 'mi'

export const RUN_PLAN = {
  1: { easy: 3.0, long: 5.0 },
  2: { easy: 3.5, long: 6.0 },
  3: { easy: 4.0, long: 7.0 },
  4: { easy: 3.0, long: 4.0 }, // deload
  5: { easy: 4.0, long: 7.0 },
  6: { easy: 4.5, long: 8.0 },
  7: { easy: 5.0, long: 9.0 },
  8: { easy: 3.0, long: 5.0 }, // deload
  9: { easy: 5.0, long: 9.0 },
  10: { easy: 5.5, long: 10.0 },
  11: { easy: 6.0, long: 11.0 },
  12: { easy: 3.0, long: 5.0 }, // deload
}

// Global week (1–12) from block (1–3) + week-in-block (1–4).
export const weekGlobalOf = (block, week) => (block - 1) * 4 + week

// A run week counts as completed when its scheduled run sessions are all done.
export function runWeekCompleted(sessions, weekGlobal) {
  const runs = sessions.filter(
    (s) =>
      (s.day_type === 'easy_run' || s.day_type === 'long_run') &&
      weekGlobalOf(s.block, s.week) === weekGlobal,
  )
  return runs.length > 0 && runs.every((s) => s.status === 'completed')
}

// Highest week cleared to train at, given the 2-consecutive-completed-weeks gate.
export function effectiveRunWeek(currentWeek, isWeekCompleted) {
  let cleared = 1
  for (let w = 2; w <= currentWeek; w++) {
    const twoPriorDone = isWeekCompleted(w - 1) && (w - 2 < 1 || isWeekCompleted(w - 2))
    if (twoPriorDone) cleared = w
  }
  return Math.min(cleared, currentWeek)
}

// Targets to show for the current week, after applying the progression gate.
export function currentRunTargets(weekGlobal, isWeekCompleted) {
  const effectiveWeek = effectiveRunWeek(weekGlobal, isWeekCompleted)
  const plan = RUN_PLAN[effectiveWeek] ?? RUN_PLAN[1]
  return { effectiveWeek, held: effectiveWeek < weekGlobal, easy: plan.easy, long: plan.long }
}
