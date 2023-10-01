import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useInterval } from 'usehooks-ts'
import * as React from 'react'
import ReactGA from 'react-ga4'
import i18nCountries, { type Alpha2Code } from 'i18n-iso-countries'
import english from 'i18n-iso-countries/langs/en.json'
import { useQuery } from '@tanstack/react-query'
import { PARTY_KIT_URL } from '@/constants'
import { useQuery as useSupabaseQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { useSession } from '@supabase/auth-helpers-react'
import { supabase } from '@/lib/supabase'
import { useLocation, useMatch } from 'react-router-dom'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function useTimer() {
  const [seconds, setSeconds] = React.useState(0)

  useInterval(() => setSeconds(seconds => seconds + 1), 1000)

  return formatSeconds(seconds)
}

export function useCountdown(to: number, stopped?: boolean) {
  const [seconds, setSeconds] = React.useState(
    Math.ceil((to - Date.now()) / 1000)
  )

  React.useEffect(() => setSeconds(Math.ceil((to - Date.now()) / 1000)), [to])

  useInterval(
    () => {
      if (seconds <= 0) return
      setSeconds(Math.ceil((to - Date.now()) / 1000))
    },
    stopped || seconds <= 0 ? null : 1000
  )

  return formatSeconds(seconds)
}

function formatSeconds(seconds: number) {
  const date = new Date(0)
  date.setSeconds(seconds <= 0 ? 0 : seconds)

  return date.toISOString().substring(14, 19)
}

i18nCountries.registerLocale(english)
export const countries = i18nCountries.getNames('en', { select: 'alias' })
export const countryCodes = Object.keys(countries) as Array<Alpha2Code>

export function getFlag(countryCode: string | null) {
  if (!countryCode) return ''
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

export function useDetectCountry(options?: { enabled?: boolean }) {
  const query = useQuery<Alpha2Code>({
    queryKey: ['detectCountry'],
    queryFn: async () => {
      try {
        const res = await fetch(`${PARTY_KIT_URL}/parties/main/countries`)
        if (!res.ok) return 'US'
        const json = (await res.json()) as { country: Alpha2Code }
        return json?.country ?? 'US'
      } catch (err) {
        return 'US'
      }
    },
    enabled: options?.enabled,
    staleTime: Infinity,
  })

  return query.data ?? 'US'
}

export function useCurrentLocale() {
  const session = useSession()

  const profile = useSupabaseQuery(
    supabase
      .from('profiles')
      .select('country')
      .eq('id', session?.user.id as string)
      .limit(1)
      .single(),
    { enabled: !!session }
  )

  const detectedCountry = useDetectCountry({ enabled: !session })

  const locale = (country: string) => `${country.toLowerCase()}-${country}`

  if (session && profile.data?.country) {
    return locale(profile.data.country)
  }

  return locale(detectedCountry)
}

export function usePageViewTracking() {
  const landing = useMatch('/')
  const stats = useMatch('/stats')
  const settings = useMatch('/settings')
  const help = useMatch('/help')
  const privacy = useMatch('/privacy')
  const coop = useMatch('/coop/:gameId')
  const dash = useMatch('/dash/:gameId')

  const location = useLocation()

  React.useEffect(() => {
    let page = location.pathname
    let title = '404'

    if (landing) {
      page = '/'
      title = 'Landing'
    } else if (stats) {
      page = '/stats'
      title = 'Stats'
    } else if (settings) {
      page = '/settings'
      title = 'Settings'
    } else if (help) {
      page = '/help'
      title = 'Help'
    } else if (privacy) {
      page = '/privacy'
      title = 'Privacy'
    } else if (coop) {
      page = '/coop/:gameId'
      title = 'Coop Game'
    } else if (dash) {
      page = '/dash/:gameId'
      title = 'Dash Game'
    }

    ReactGA.send({
      hitType: 'pageview',
      page,
      title,
    })
  }, [location.pathname, landing, stats, settings, help, privacy, coop, dash])
}
