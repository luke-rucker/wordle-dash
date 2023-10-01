import { Icons } from '@/components/icons'
import { cn } from '@/lib/utils'
import type { Guess } from '@party/lib/shared'
import type { LetterStatus } from '@party/lib/words/compare'
import * as React from 'react'

type KeyboardProps = {
  onEnter: () => void
  onDelete: () => void
  onLetter: (letter: string) => void
  guesses: Array<Guess>
  disabled?: boolean
}

export function Keyboard({
  onEnter,
  onDelete,
  onLetter,
  guesses,
  disabled,
}: KeyboardProps) {
  React.useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).nodeName === 'INPUT') return
      if (disabled) return

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
  }, [onEnter, onDelete, onLetter, disabled])

  const weight = (status: LetterStatus) => {
    if (status === 'a') return 0
    if (status === 'p') return 1
    return 2
  }

  const letterStatuses = guesses.reduce<Record<string, LetterStatus>>(
    (letters, guess) => {
      guess.raw.split('').forEach((letter, index) => {
        const newStatus = guess.computed[index]
        if (!letters[letter] || weight(letters[letter]) < weight(newStatus)) {
          letters[letter] = newStatus
        }
      })
      return letters
    },
    {}
  )

  const handleLetter = (letter: string) => {
    if (disabled) return
    onLetter(letter)
  }

  return (
    <div className="pb-2 pt-8 px-1 md:px-0 space-y-2 w-full">
      <div className="flex justify-center gap-1 md:gap-2">
        {['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'].map(letter => (
          <Key
            key={letter}
            value={letter}
            onClick={() => handleLetter(letter)}
            status={letterStatuses[letter]}
          />
        ))}
      </div>

      <div className="flex justify-center gap-1 md:gap-2">
        {['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'].map(letter => (
          <Key
            key={letter}
            value={letter}
            onClick={() => handleLetter(letter)}
            status={letterStatuses[letter]}
          />
        ))}
      </div>

      <div className="flex justify-center gap-1 md:gap-2">
        <Key
          value="ENTER"
          onClick={() => {
            if (disabled) return
            onEnter()
          }}
          className="text-xs md:text-md w-16 md:w-20"
        />

        {['z', 'x', 'c', 'v', 'b', 'n', 'm'].map(letter => (
          <Key
            key={letter}
            value={letter}
            onClick={() => handleLetter(letter)}
            status={letterStatuses[letter]}
          />
        ))}

        <Key
          value="DELETE"
          onClick={() => {
            if (disabled) return
            onDelete()
          }}
          className="w-16 md:w-20"
        >
          <Icons.Backspace className="h-6 w-6" />
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
        'h-14 w-10 md:h-16 md:w-12 flex items-center justify-center uppercase text-sm md:text-xl rounded font-bold focus:outline-none select-none',
        {
          'bg-secondary text-secondary-foreground dark:bg-gray-600 dark:text-white':
            !status,
          'bg-gray-600 text-white dark:bg-secondary dark:text-secondary-foreground':
            status === 'a',
          'bg-yellow-400 text-white': status === 'p',
          'bg-green-700 text-white': status === 'c',
        },
        className
      )}
    >
      {children || value}
    </button>
  )
}
