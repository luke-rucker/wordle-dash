import { cn } from '@/lib/utils'
import type { LetterStatus } from '@party/lib/words/compare'

type CellProps = {
  status?: LetterStatus | 'typed'
  hideLetter?: boolean
  letter?: string
  className?: string
}

export function Cell({ status, hideLetter, letter, className }: CellProps) {
  return (
    <div
      className={cn(
        'h-14 w-14 flex items-center justify-center border-2 text-4xl font-bold uppercase',
        {
          'border-primary': status === 'typed',
          'border-gray-600 bg-gray-600 text-white': status === 'absent',
          'border-yellow-400 bg-yellow-400 text-white': status === 'present',
          'border-green-700 bg-green-700 text-white': status === 'correct',
        },
        className
      )}
    >
      {hideLetter ? null : letter}
    </div>
  )
}
