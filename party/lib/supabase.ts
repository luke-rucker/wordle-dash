import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export const createSupabaseClient = (env: Record<string, unknown>) =>
  createClient<Database>(
    env.SUPABASE_APP_URL as string,
    env.SUPABASE_SERVICE_KEY as string,
    { auth: { persistSession: false } }
  )
