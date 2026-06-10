// Seed the live Supabase DB with the current program state (SEED_DATA.md).
// Idempotent: clears all rows first, then inserts. Run: npm run seed
//
// Prescribed working weights are computed with the SAME pure engine the app
// uses (lib/), so the seed dogfoods waveWeights() + closestLoadable().

import { createClient } from '@supabase/supabase-js'
import { waveWeights } from '../lib/waveWeights.js'
import { closestLoadable } from '../lib/plateRounding.js'
import { generateProgram } from '../lib/calendar.js'

try {
  process.loadEnvFile('.env')
} catch {
  // env may already be in the environment; fall through to the check below.
}

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (.env).')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

const BAR = 45
const PLATES = [5, 10, 10, 25, 35, 45]
const PROGRAM_START = '2026-06-01' // Monday of Week 1 of the current wave.

function die(label, error) {
  if (error) {
    console.error(`✗ ${label}:`, error.message)
    process.exit(1)
  }
}

// Engine-derived prescribed sets at a given TM/week (rounded to loadable plates).
function prescribedSets(trainingMax, week) {
  return waveWeights(trainingMax, week).map((s) => {
    const setType = s.isAmrap ? 'amrap' : 'backoff'
    const { chosen } = closestLoadable(s.rawWeight, BAR, PLATES, setType)
    return {
      set_index: s.setIndex,
      is_amrap: s.isAmrap,
      prescribed_weight: chosen,
      prescribed_reps: s.reps,
    }
  })
}

// --- Source data (SEED_DATA.md) ---------------------------------------------

const LIFTS = [
  { name: 'Squat', category: 'lower', current_tm: 185 },
  { name: 'Bench', category: 'upper', current_tm: 150 },
  { name: 'Deadlift', category: 'lower', current_tm: 165 },
  { name: 'OHP', category: 'upper', current_tm: 75 },
]

const TM_HISTORY = [
  // Initial Training Maxes at program start.
  { lift: 'Squat', value: 170, effective_date: PROGRAM_START, reason: 'Initial Training Max (block start)' },
  { lift: 'Bench', value: 135, effective_date: PROGRAM_START, reason: 'Initial Training Max (block start)' },
  { lift: 'Deadlift', value: 145, effective_date: PROGRAM_START, reason: 'Initial Training Max (block start)' },
  { lift: 'OHP', value: 75, effective_date: PROGRAM_START, reason: 'Initial Training Max (block start)' },
  // AMRAP-driven calibration raises (dated to the session that produced them).
  { lift: 'Bench', value: 150, effective_date: '2026-06-02', reason: 'AMRAP calibration: 16 reps @ 110' },
  { lift: 'Deadlift', value: 165, effective_date: '2026-06-04', reason: 'AMRAP calibration: 14 reps @ 125' },
  { lift: 'OHP', value: 75, effective_date: '2026-06-05', reason: 'AMRAP calibration confirmed: 12 reps @ 65' },
  { lift: 'Squat', value: 185, effective_date: '2026-06-08', reason: 'AMRAP calibration: 12 reps @ 145' },
]

const PLATE_INVENTORY = [
  { plate_weight: 5, count_per_side: 1, bar_weight: BAR },
  { plate_weight: 10, count_per_side: 2, bar_weight: BAR },
  { plate_weight: 25, count_per_side: 1, bar_weight: BAR },
  { plate_weight: 35, count_per_side: 1, bar_weight: BAR },
  { plate_weight: 45, count_per_side: 1, bar_weight: BAR },
]

// Current program "today": the next session is the earliest upcoming one on or
// after this date. Past sessions that were never logged are marked 'skipped', so
// the catch-up model surfaces Bench (Jun 9) as next — not the unlogged Week-1
// Squat/runs that aren't part of the recorded history.
const CUTOFF = '2026-06-09'

// The four completed sessions (SEED_DATA.md), keyed by date. tmAtTime is the TM
// in effect then (drives prescribed weights). Only the AMRAP top set has actuals.
const COMPLETED = {
  '2026-06-02': {
    lift: 'Bench', tmAtTime: 135, amrap: { weight: 110, reps: 16 },
    accessories: [
      { name: 'Pull-ups', set1_weight: 'bodyweight (~200)', set1_reps: 7, set2_weight: 'banded (assisted)', set2_reps: 8 },
      { name: 'DB Shoulder Press', set1_weight: '35', set1_reps: 16, set2_weight: '25', set2_reps: 14, notes: 'DBs capped at 35 lb → slow tempo when reps exceed zone' },
      { name: 'Seated Cable Row', set1_weight: '6 plates', set1_reps: 12, set2_weight: '6 plates', set2_reps: 12, notes: 'No drop set taken' },
      { name: 'Barbell Curl', set1_weight: '65', set1_reps: 8, set2_weight: '55', set2_reps: 7 },
    ],
  },
  '2026-06-04': {
    lift: 'Deadlift', tmAtTime: 145, amrap: { weight: 125, reps: 14 },
    accessories: [
      { name: 'Front Squat', set1_weight: '95', set1_reps: 12, set2_weight: '75', set2_reps: 13 },
      { name: 'RDL', set1_weight: '115', set1_reps: null, set2_weight: '115', set2_reps: null, notes: 'No drop set taken' },
      { name: 'Lat Pulldown', set1_weight: '8 plates', set1_reps: null, set2_weight: '6 plates', set2_reps: null },
      { name: 'Face Pulls', set1_weight: '4 plates', set1_reps: null, set2_weight: '3 plates', set2_reps: null },
    ],
  },
  '2026-06-05': {
    lift: 'OHP', tmAtTime: 75, amrap: { weight: 65, reps: 12 },
    accessories: [
      { name: 'Dips', set1_weight: 'bodyweight', set1_reps: 8, set2_weight: 'bodyweight', set2_reps: 8, notes: 'Add weight belt when 8 reps becomes easy' },
      { name: 'Lateral Raises', set1_weight: '15', set1_reps: 12, set2_weight: '10', set2_reps: 12 },
      { name: 'Single-Arm Landmine Row', set1_weight: '35', set1_reps: 12, set2_weight: '30', set2_reps: 12 },
      { name: 'Hammer Curls', set1_weight: '25', set1_reps: 12, set2_weight: '20', set2_reps: 12 },
      { name: 'Tricep Rope Pushdown', set1_weight: '3 plates', set1_reps: 12, set2_weight: '2 plates', set2_reps: 12 },
    ],
  },
  '2026-06-08': {
    lift: 'Squat', tmAtTime: 170, amrap: { weight: 145, reps: 12 },
    accessories: [
      { name: 'Bulgarian Split Squat', set1_weight: '60', set1_reps: 8, set2_weight: '40', set2_reps: 8 },
      { name: 'Hamstring Curl', set1_weight: '25', set1_reps: 10, set2_weight: '25', set2_reps: 10, notes: 'Single-leg going forward; start weaker LEFT leg (ACL), match right to left' },
      { name: 'Incline DB Press', set1_weight: '30', set1_reps: 12, set2_weight: '30', set2_reps: 12, notes: 'DBs capped at 30 lb → 3-sec eccentric to stay in 8–10 zone' },
      { name: 'DB Row', set1_weight: '45 plate', set1_reps: 10, set2_weight: '35 plate', set2_reps: 10 },
    ],
  },
}

// --- Seed -------------------------------------------------------------------

async function clearAll() {
  // FK-safe order (children first). `.not('id','is',null)` matches all rows.
  for (const table of [
    'set_logs', 'accessory_logs', 'runs', 'tm_history',
    'sessions', 'settings', 'plate_inventory', 'lifts',
  ]) {
    const { error } = await supabase.from(table).delete().not('id', 'is', null)
    die(`clear ${table}`, error)
  }
}

async function main() {
  console.log('Clearing existing rows…')
  await clearAll()

  console.log('Inserting lifts…')
  const { data: liftRows, error: liftErr } = await supabase.from('lifts').insert(LIFTS).select()
  die('insert lifts', liftErr)
  const liftId = Object.fromEntries(liftRows.map((l) => [l.name, l.id]))

  console.log('Inserting tm_history…')
  const { error: tmErr } = await supabase.from('tm_history').insert(
    TM_HISTORY.map((r) => ({
      lift_id: liftId[r.lift],
      value: r.value,
      effective_date: r.effective_date,
      reason: r.reason,
    })),
  )
  die('insert tm_history', tmErr)

  console.log('Inserting plate_inventory…')
  die('insert plate_inventory', (await supabase.from('plate_inventory').insert(PLATE_INVENTORY)).error)

  console.log('Inserting settings…')
  die('insert settings', (await supabase.from('settings').insert({
    id: 1, current_block: 1, current_week: 2, program_start_date: PROGRAM_START,
  })).error)

  console.log('Generating 12-week calendar + logs…')
  const program = generateProgram(PROGRAM_START)
  const weekByDate = Object.fromEntries(program.map((s) => [s.date, s.week]))

  const sessionRows = program.map((s) => ({
    date: s.date,
    day_type: s.dayType,
    block: s.block,
    week: s.week,
    status: COMPLETED[s.date] ? 'completed' : s.date < CUTOFF ? 'skipped' : 'upcoming',
  }))
  const { data: inserted, error: sErr } = await supabase.from('sessions').insert(sessionRows).select()
  die('insert sessions', sErr)
  const idByDate = Object.fromEntries(inserted.map((r) => [r.date, r.id]))

  for (const [date, info] of Object.entries(COMPLETED)) {
    const sessionId = idByDate[date]
    const sets = prescribedSets(info.tmAtTime, weekByDate[date]).map((set) => ({
      session_id: sessionId,
      lift_id: liftId[info.lift],
      ...set,
      // Only the AMRAP top set's actuals were recorded.
      actual_weight: set.is_amrap ? info.amrap.weight : null,
      actual_reps: set.is_amrap ? info.amrap.reps : null,
    }))
    die(`insert set_logs ${info.lift}`, (await supabase.from('set_logs').insert(sets)).error)
    die(`insert accessory_logs ${info.lift}`, (await supabase.from('accessory_logs').insert(
      info.accessories.map((a) => ({ session_id: sessionId, ...a })),
    )).error)
  }

  console.log(`\n✓ Seed complete (${sessionRows.length} sessions).`)
}

main().catch((e) => {
  console.error('Seed failed:', e)
  process.exit(1)
})
