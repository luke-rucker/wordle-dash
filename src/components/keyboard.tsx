import { Icons } from '@/components/icons'
import { cn } from '@/lib/utils'
import type { Guess } from '@party/lib/game'
import type { LetterStatus } from '@party/lib/words/compare'
import * as React from 'react'

type KeyboardProps = {
  onEnter: () => void
  onDelete: () => void
  onLetter: (letter: string) => void
  guesses: Array<Guess>
}

export function Keyboard({
  onEnter,
  onDelete,
  onLetter,
  guesses,
}: KeyboardProps) {
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

  const letterStatuses = guesses.reduce<Record<string, LetterStatus>>(
    (letters, guess) => {
      guess.raw.split('').forEach((letter, index) => {
        letters[letter] = guess.computed[index]
      })
      return letters
    },
    {}
  )

  return (
    <div className="pb-2 pt-8 space-y-1 w-full">
      <div className="flex justify-center gap-1">
        {['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'].map(letter => (
          <Key
            key={letter}
            value={letter}
            onClick={() => onLetter(letter)}
            status={letterStatuses[letter]}
          />
        ))}
      </div>

      <div className="flex justify-center gap-1">
        {['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'].map(letter => (
          <Key
            key={letter}
            value={letter}
            onClick={() => onLetter(letter)}
            status={letterStatuses[letter]}
          />
        ))}
      </div>

      <div className="flex justify-center gap-1">
        <Key value="ENTER" onClick={onEnter} className="w-16" />

        {['z', 'x', 'c', 'v', 'b', 'n', 'm'].map(letter => (
          <Key
            key={letter}
            value={letter}
            onClick={() => onLetter(letter)}
            status={letterStatuses[letter]}
          />
        ))}

        <Key value="DELETE" onClick={onDelete} className="w-16">
          <Icons.Backspace className="h-8 w-8" />
        </Key>
      </div>
    </div>
  )
}

type KeyProps = {
  children?: React.ReactNode
  value: string
  onClick: () => void
  status?: LetterStatus
  className?: string
}

function Key({ children, value, onClick, status, className }: KeyProps) {
  return (
    <button
      aria-label={value}
      onClick={onClick}
      className={cn(
        'h-14 w-10 flex items-center justify-center uppercase text-xs md:text-sm rounded font-bold focus:outline-none select-none',
        {
          'bg-primary text-primary-foreground': !status,
          'border-muted bg-muted opacity-50': status === 'absent',
          'bg-yellow-400 text-white': status === 'present',
          'bg-green-800 text-white': status === 'correct',
        },
        className
      )}
    >
      {children || value}
    </button>
  )
}
