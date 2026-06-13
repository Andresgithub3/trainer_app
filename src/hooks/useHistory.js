import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

const localIso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// Completed sessions (with their logged sets, accessories, and runs) from the
// last `days` days, most recent first. Refetches on realtime changes.
export function useHistory(days = 7) {
  const [state, setState] = useState({ loading: true, error: null, sessions: [] })

  const load = useCallback(async () => {
    const since = new Date()
    since.setDate(since.getDate() - days)
    const { data, error } = await supabase
      .from('sessions')
      .select(
        `id, date, day_type, block, week,
         set_logs(set_index, is_amrap, prescribed_weight, prescribed_reps, actual_weight, actual_reps, lifts(name)),
         accessory_logs(name, set1_weight, set1_reps, set2_weight, set2_reps, notes),
         runs(type, duration_min, distance, effort_note)`,
      )
      .eq('status', 'completed')
      .gte('date', localIso(since))
      .order('date', { ascending: false })
    setState({ loading: false, error: error || null, sessions: data ?? [] })
  }, [days])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
    const channel = supabase
      .channel('history-data')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [load])

  return state
}
