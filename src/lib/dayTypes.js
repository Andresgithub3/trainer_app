// UI helpers for session day types (kept in src/, not the framework-free lib/).

export const DAY_LIFT = {
  squat: 'Squat',
  bench: 'Bench',
  deadlift: 'Deadlift',
  ohp: 'OHP',
}

export const DAY_LABEL = {
  squat: 'Squat',
  bench: 'Bench',
  deadlift: 'Deadlift',
  ohp: 'OHP',
  easy_run: 'Easy Run',
  long_run: 'Long Run',
  rest: 'Rest',
}

export const isStrengthDay = (dayType) => dayType in DAY_LIFT

// Parse a 'YYYY-MM-DD' date as local (avoids UTC off-by-one) and format short.
export function formatSessionDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
