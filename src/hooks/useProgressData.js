import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

const INITIAL = { loading: true, error: null, tmHistory: [], amrap: [], sessions: [], runs: [] }

// Fetches everything the Progress charts need, refetching on realtime changes.
export function useProgressData() {
  const [state, setState] = useState(INITIAL)

  const load = useCallback(async () => {
    const [tm, amrap, sessions, runs] = await Promise.all([
      supabase
        .from('tm_history')
        .select('value, effective_date, reason, lifts(name)')
        .order('effective_date', { ascending: true }),
      supabase
        .from('set_logs')
        .select('actual_reps, actual_weight, sessions(date), lifts(name)')
        .eq('is_amrap', true),
      supabase.from('sessions').select('status, week, block, day_type, date'),
      supabase.from('runs').select('type, duration_min, distance, sessions(date, week)'),
    ])

    const error = tm.error || amrap.error || sessions.error || runs.error || null
    setState({
      loading: false,
      error,
      tmHistory: tm.data ?? [],
      amrap: amrap.data ?? [],
      sessions: sessions.data ?? [],
      runs: runs.data ?? [],
    })
  }, [])

  useEffect(() => {
    // Fetch-on-mount: load() only setStates after an await (async, not a
    // synchronous cascading render). The realtime callback below is the rule's
    // endorsed "subscribe + setState in a callback" pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
    const channel = supabase
      .channel('progress-data')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  return state
}
