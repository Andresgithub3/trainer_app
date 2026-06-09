import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Which required env vars are missing (drives the config screen instead of a
// blank page — createClient throws if either is undefined).
export const missingEnv = [
  !url && 'VITE_SUPABASE_URL',
  !anonKey && 'VITE_SUPABASE_ANON_KEY',
].filter(Boolean)

export const supabase = missingEnv.length ? null : createClient(url, anonKey)
