import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { useInterval } from 'usehooks-ts'
import * as React from 'react'

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
  date.setSeconds(seconds)

  return date.toISOString().substring(14, 19)
}

export function getFlag(countryCode: string | null) {
  if (!countryCode) return ''
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}
