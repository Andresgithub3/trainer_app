import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient.js'

// Fetches the editable settings data (lifts + raw plate inventory rows).
// `version` bumps on every load so the form can re-initialise after a save.
export function useSettingsData() {
  const [state, setState] = useState({ loading: true, error: null, lifts: [], inventory: [], version: 0 })

  const load = useCallback(async () => {
    const [lifts, inventory] = await Promise.all([
      supabase.from('lifts').select('id, name, category, current_tm'),
      supabase.from('plate_inventory').select('*').order('plate_weight', { ascending: true }),
    ])
    setState((prev) => ({
      loading: false,
      error: lifts.error || inventory.error || null,
      lifts: lifts.data ?? [],
      inventory: inventory.data ?? [],
      version: prev.version + 1,
    }))
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  return { ...state, reload: load }
}
