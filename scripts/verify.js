// Verify the seeded DB reproduces the current program position (PRD §9):
//   Week 2, next session Bench, TMs 185/150/165/75, inventory [5,10,10,25,35,45].
// Run: npm run verify   (exit code 1 if any check fails)

import { createClient } from '@supabase/supabase-js'

try {
  process.loadEnvFile('.env')
} catch {
  /* env may already be present */
}

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (.env).')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } })

let failures = 0
function check(label, actual, expected) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  const ok = a === e
  if (!ok) failures += 1
  console.log(`${ok ? '✓' : '✗'} ${label}: ${a}${ok ? '' : ` (expected ${e})`}`)
}

async function main() {
  const { data: settings } = await supabase.from('settings').select('*').single()
  check('current_week', settings?.current_week, 2)
  check('current_block', settings?.current_block, 1)
  check('program_start_date', settings?.program_start_date, '2026-06-01')

  const { data: lifts } = await supabase.from('lifts').select('name, current_tm')
  const tms = Object.fromEntries((lifts ?? []).map((l) => [l.name, Number(l.current_tm)]))
  check('Training Maxes', tms, { Squat: 185, Bench: 150, Deadlift: 165, OHP: 75 })

  // Next session = earliest pending (upcoming/in_progress) session — the
  // catch-up model: completed and skipped sessions are excluded.
  const { data: next } = await supabase
    .from('sessions')
    .select('day_type, date, week')
    .in('status', ['upcoming', 'in_progress'])
    .order('date', { ascending: true })
    .limit(1)
    .single()
  check('next session day_type', next?.day_type, 'bench')
  check('next session date', next?.date, '2026-06-09')
  check('next session week', next?.week, 2)

  // Full 12-week calendar materialized (6 non-rest sessions × 12 weeks).
  const { count: total } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
  check('total sessions (12-week calendar)', total, 72)

  const { count: block3 } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('block', 3)
  check('block-3 sessions exist (self-sustains)', block3, 24)

  const { data: inv } = await supabase
    .from('plate_inventory')
    .select('plate_weight, count_per_side')
    .order('plate_weight', { ascending: true })
  const expanded = (inv ?? [])
    .flatMap((p) => Array(p.count_per_side).fill(Number(p.plate_weight)))
    .sort((a, b) => a - b)
  check('plate inventory (per side)', expanded, [5, 10, 10, 25, 35, 45])

  const { count: completed } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
  check('completed sessions', completed, 4)

  console.log(failures === 0 ? '\n✓ All checks passed.' : `\n✗ ${failures} check(s) failed.`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => {
  console.error('Verify failed:', e)
  process.exit(1)
})
