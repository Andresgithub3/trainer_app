// Program calendar (PRD §5.5). Pure, framework-free.
//
// Maps the weekly structure across 12 weeks / 3 blocks:
//   Mon Squat · Tue Bench · Wed easy run · Thu Deadlift · Fri OHP · Sat long run · Sun rest
//
// week-in-block cycles 1–4; block = 1..3. Program start is assumed to be the
// Monday of Week 1 (the day type is derived from the real weekday, so a
// non-Monday start still labels days correctly, just with a partial first week).

// Indexed Mon=0 … Sun=6.
export const DAY_SEQUENCE = [
  'squat',
  'bench',
  'easy_run',
  'deadlift',
  'ohp',
  'long_run',
  'rest',
]

export const weekInBlock = (weekGlobal) => ((weekGlobal - 1) % 4) + 1
export const blockForWeek = (weekGlobal) => Math.floor((weekGlobal - 1) / 4) + 1

function addDaysISO(iso, n) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

// Monday-based weekday (0=Mon … 6=Sun) for a 'YYYY-MM-DD' date.
export function weekdayMon0(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7
}

// Generates one entry per day: { date, dayType, weekGlobal, block, week }.
// Rest days are excluded by default (they aren't stored as sessions).
export function generateProgram(startDate, { weeks = 12, includeRest = false } = {}) {
  const out = []
  for (let i = 0; i < weeks * 7; i++) {
    const date = addDaysISO(startDate, i)
    const dayType = DAY_SEQUENCE[weekdayMon0(date)]
    if (!includeRest && dayType === 'rest') continue
    const weekGlobal = Math.floor(i / 7) + 1
    out.push({
      date,
      dayType,
      weekGlobal,
      block: blockForWeek(weekGlobal),
      week: weekInBlock(weekGlobal),
    })
  }
  return out
}
