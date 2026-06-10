import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

const EMPTY = {
  loading: true,
  error: null,
  settings: null,
  lifts: [],
  inventory: [],
  barWeight: 45,
  nextSession: null,
  allSessions: [],
}

// Loads the data the Today card needs (settings, lifts, plate inventory, the
// next non-completed session) and refetches on any realtime change so the
// phone and laptop stay in sync (PRD §7).
export function useProgramData() {
  const [state, setState] = useState(EMPTY)

  const load = useCallback(async () => {
    const [settings, lifts, inventory, session, all] = await Promise.all([
      supabase.from('settings').select('*').maybeSingle(),
      supabase.from('lifts').select('*'),
      supabase.from('plate_inventory').select('*').order('plate_weight', { ascending: true }),
      supabase
        .from('sessions')
        .select('*')
        .in('status', ['upcoming', 'in_progress'])
        .order('date', { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase.from('sessions').select('status, block, week, day_type'),
    ])

    const error =
      settings.error || lifts.error || inventory.error || session.error || all.error || null

    const invRows = inventory.data ?? []
    setState({
      loading: false,
      error,
      settings: settings.data ?? null,
      lifts: lifts.data ?? [],
      inventory: invRows.flatMap((p) => Array(p.count_per_side).fill(Number(p.plate_weight))),
      barWeight: Number(invRows[0]?.bar_weight ?? 45),
      nextSession: session.data ?? null,
      allSessions: all.data ?? [],
    })
  }, [])

  useEffect(() => {
    // Fetch-on-mount: load() only setStates after an await, so this is async,
    // not a synchronous cascading render. (The realtime callback below is the
    // rule's endorsed "subscribe + setState in a callback" pattern.)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
    const channel = supabase
      .channel('program-data')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  return { ...state, reload: load }
}
