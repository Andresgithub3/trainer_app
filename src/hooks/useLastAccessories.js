import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

// Pre-fill template: the accessories from the most recent completed session of
// the same day type (PRD §5.4 "repeat last same-day session").
export function useLastAccessories(dayType, beforeDate) {
  const [state, setState] = useState({ loading: true, accessories: [] })

  const load = useCallback(async () => {
    if (!dayType || !beforeDate) {
      setState({ loading: false, accessories: [] })
      return
    }
    const { data } = await supabase
      .from('sessions')
      .select('date, accessory_logs(name,set1_weight,set1_reps,set2_weight,set2_reps,notes,created_at)')
      .eq('day_type', dayType)
      .eq('status', 'completed')
      .lt('date', beforeDate)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()
    const accessories = (data?.accessory_logs ?? [])
      .slice()
      .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))
    setState({ loading: false, accessories })
  }, [dayType, beforeDate])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  return state
}
