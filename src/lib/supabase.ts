import { SUPABASE_ANON_KEY, SUPABASE_APP_URL } from '@/constants'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

export const supabase = createClient<Database>(
  SUPABASE_APP_URL,
  SUPABASE_ANON_KEY
)
