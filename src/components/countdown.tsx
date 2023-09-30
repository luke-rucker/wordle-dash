import { cn, useCountdown } from '@/lib/utils'

export function Countdown({
  to,
  stopped,
  className,
}: {
  to: number
  stopped?: boolean
  className?: string
}) {
  const countdown = useCountdown(to, stopped)

  return <span className={cn('ml-2', className)}>{countdown}</span>
}
