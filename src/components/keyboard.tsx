import { cn } from '@/lib/utils'
import type { LetterStatus } from '@party/lib/words/compare'
import * as React from 'react'

type KeyboardProps = {
  onEnter: () => void
  onDelete: () => void
  onLetter: (letter: string) => void
}

export function Keyboard({ onEnter, onDelete, onLetter }: KeyboardProps) {
  React.useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).nodeName === 'INPUT') return

      if (e.code === 'Enter') {
        onEnter()
      } else if (e.code === 'Backspace') {
        onDelete()
      } else {
        const key = e.key.toLowerCase()

        if (key.length === 1 && key >= 'a' && key <= 'z') {
          onLetter(key)
        }
      }
    }

    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [onEnter, onDelete, onLetter])

  return null
}

type KeyProps = {
  children?: React.ReactNode
  value: string
  onClick: () => void
  status?: LetterStatus
  className?: string
}

export function Key({ children, value, onClick, status, className }: KeyProps) {
  return (
    <button
      aria-label={value}
      onClick={onClick}
      className={cn(
        'h-14 w-10 flex items-center justify-center uppercase text-xs md:text-sm font-bold focus:outline-none select-none',
        {
          'bg-primary': !status,
          'bg-base-300 text-base-content opacity-50': status === 'absent',
          'bg-warning text-warning-content': status === 'present',
          'bg-success text-success-content': status === 'correct',
        },
        className
      )}
    >
      {children || value}
    </button>
  )
}
