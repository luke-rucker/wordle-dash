import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useInterval } from 'usehooks-ts'
import * as React from 'react'
import i18nCountries, { type Alpha2Code } from 'i18n-iso-countries'
import english from 'i18n-iso-countries/langs/en.json'

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
    seconds <= 0 || stopped ? 0 : 1000
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
