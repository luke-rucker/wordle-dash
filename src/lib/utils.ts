import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import * as React from 'react'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function useTimer() {
  const [seconds, setSeconds] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => setSeconds(seconds => seconds + 1), 1000)
    return () => clearInterval(interval)
  }, [])

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
