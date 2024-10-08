export const PARTY_KIT_HOST =
  import.meta.env.VITE_PARTYKIT_HOST ?? 'localhost:1999'

export const PARTY_KIT_URL = PARTY_KIT_HOST.includes('localhost')
  ? `http://${PARTY_KIT_HOST}`
  : `https://${PARTY_KIT_HOST}`

export const SUPABASE_APP_URL = import.meta.env.VITE_SUPABASE_APP_URL as string

export const SUPABASE_ANON_KEY = import.meta.env
  .VITE_SUPABASE_ANON_KEY as string
