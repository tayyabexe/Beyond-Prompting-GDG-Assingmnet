// Supabase is used in the browser ONLY for admin login (Supabase Auth).
// The anon/publishable key is public by design; RLS blocks all table access with it.
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseReady = Boolean(url && anonKey && !anonKey.startsWith('your-'))
export const supabase = supabaseReady ? createClient(url, anonKey) : null
