import { Cell } from '@/components/cell'
import { cn } from '@/lib/utils'
import { MAX_GUESSES, SOLUTION_SIZE } from '@party/lib/constants'
import type { LetterStatus } from '@party/lib/words/compare'
import * as React from 'react'

type GameRows = Array<Array<LetterStatus | undefined>>

type DashFrame = { one: GameRows; two: GameRows }

const emptyRow: Array<LetterStatus | undefined> = Array.from(
  Array(SOLUTION_SIZE)
)

function board(rows?: GameRows) {
  if (!rows) return [emptyRow, emptyRow, emptyRow, emptyRow, emptyRow, emptyRow]
  const empties =
    rows.length <= MAX_GUESSES
      ? Array.from(Array(MAX_GUESSES - rows.length))
      : []
  return rows.concat(empties.fill(emptyRow))
}

const dashFrames: Array<DashFrame> = [
  {
    one: board(),
    two: board(),
  },
  {
    one: board([['a', 'a', 'c', 'p', 'a']]),
    two: board(),
  },
  {
    one: board([
      ['a', 'a', 'c', 'p', 'a'],
      ['p', 'a', 'c', 'a', 'a'],
    ]),
    two: board([['c', 'a', 'a', 'p', 'a']]),
  },
  {
    one: board([
      ['a', 'a', 'c', 'p', 'a'],
      ['p', 'a', 'c', 'a', 'a'],
    ]),
    two: board([
      ['c', 'a', 'a', 'p', 'a'],
      ['c', 'p', 'a', 'a', 'a'],
    ]),
  },
  {
    one: board([
      ['a', 'a', 'c', 'p', 'a'],
      ['p', 'a', 'c', 'a', 'a'],
      ['p', 'p', 'c', 'a', 'a'],
    ]),
    two: board([
      ['c', 'a', 'a', 'p', 'a'],
      ['c', 'p', 'a', 'a', 'a'],
      ['c', 'a', 'c', 'a', 'a'],
    ]),
  },
  {
    one: board([
      ['a', 'a', 'c', 'p', 'a'],
      ['p', 'a', 'c', 'a', 'a'],
      ['p', 'p', 'c', 'a', 'a'],
      ['c', 'c', 'c', 'a', 'a'],
    ]),
    two: board([
      ['c', 'a', 'a', 'p', 'a'],
      ['c', 'p', 'a', 'a', 'a'],
      ['c', 'a', 'c', 'a', 'a'],
    ]),
  },
  {
    one: board([
      ['a', 'a', 'c', 'p', 'a'],
      ['p', 'a', 'c', 'a', 'a'],
      ['p', 'p', 'c', 'a', 'a'],
      ['c', 'c', 'c', 'a', 'a'],
      ['c', 'c', 'c', 'a', 'c'],
    ]),
    two: board([
      ['c', 'a', 'a', 'p', 'a'],
      ['c', 'p', 'a', 'a', 'a'],
      ['c', 'a', 'c', 'a', 'a'],
      ['c', 'a', 'c', 'p', 'a'],
    ]),
  },
  {
    one: board([
      ['a', 'a', 'c', 'p', 'a'],
      ['p', 'a', 'c', 'a', 'a'],
      ['p', 'p', 'c', 'a', 'a'],
      ['c', 'c', 'c', 'a', 'a'],
      ['c', 'c', 'c', 'a', 'c'],
    ]),
    two: board([
      ['c', 'a', 'a', 'p', 'a'],
      ['c', 'p', 'a', 'a', 'a'],
      ['c', 'a', 'c', 'a', 'a'],
      ['c', 'a', 'c', 'p', 'a'],
      ['c', 'a', 'c', 'p', 'c'],
    ]),
  },
  {
    one: board([
      ['a', 'a', 'c', 'p', 'a'],
      ['p', 'a', 'c', 'a', 'a'],
      ['p', 'p', 'c', 'a', 'a'],
      ['c', 'c', 'c', 'a', 'a'],
      ['c', 'c', 'c', 'a', 'c'],
      ['c', 'c', 'c', 'c', 'c'],
    ]),
    two: board([
      ['c', 'a', 'a', 'p', 'a'],
      ['c', 'p', 'a', 'a', 'a'],
      ['c', 'a', 'c', 'a', 'a'],
      ['c', 'a', 'c', 'p', 'a'],
      ['c', 'a', 'c', 'p', 'c'],
    ]),
  },
]

export function DashGameAnimation({ className }: { className?: string }) {
  const current = useFrame(dashFrames, { min: 200, max: 900 })
  const frame = dashFrames[current]

  return (
    <div
      className={cn(
        'w-full flex justify-around md:justify-center md:space-x-2',
        className
      )}
    >
      <DashGameBoard
        player={1}
        gameOver={current === dashFrames.length - 1}
        rows={frame.one}
      />

      <DashGameBoard
        player={2}
        gameOver={current === dashFrames.length - 1}
        rows={frame.two}
      />
    </div>
  )
}

function DashGameBoard({
  rows,
  player,
  gameOver,
}: {
  rows: GameRows
  player: 1 | 2
  gameOver?: boolean
}) {
  return (
    <div className="py-3 md:px-3">
      <Player
        player={player}
        gameOver={gameOver}
        className="mb-2 text-center"
      />

      <div className="grid grid-cols-5 gap-0.5 md:gap-1">
        {rows.flatMap((statuses, row) =>
          statuses.map((status, index) => (
            <Cell
              key={`${row}-${index}`}
              status={status}
              className="h-4 md:h-6 w-4 md:w-6 border-2"
            />
          ))
        )}
      </div>
    </div>
  )
}

type CoopFrame = GameRows

const coopFrames: Array<CoopFrame> = [
  board([['a', 'a', 'c', 'p', 'a']]),
  board([
    ['a', 'a', 'c', 'p', 'a'],
    ['p', 'a', 'c', 'a', 'a'],
  ]),
  board([
    ['a', 'a', 'c', 'p', 'a'],
    ['p', 'a', 'c', 'a', 'a'],
    ['p', 'p', 'c', 'a', 'a'],
  ]),
  board([
    ['a', 'a', 'c', 'p', 'a'],
    ['p', 'a', 'c', 'a', 'a'],
    ['p', 'p', 'c', 'a', 'a'],
    ['c', 'c', 'c', 'a', 'a'],
  ]),
  board([
    ['a', 'a', 'c', 'p', 'a'],
    ['p', 'a', 'c', 'a', 'a'],
    ['p', 'p', 'c', 'a', 'a'],
    ['c', 'c', 'c', 'a', 'a'],
    ['c', 'c', 'c', 'a', 'c'],
  ]),
  board([
    ['a', 'a', 'c', 'p', 'a'],
    ['p', 'a', 'c', 'a', 'a'],
    ['p', 'p', 'c', 'a', 'a'],
    ['c', 'c', 'c', 'a', 'a'],
    ['c', 'c', 'c', 'a', 'c'],
    ['c', 'c', 'c', 'c', 'c'],
  ]),
]

export function CoopGameAnimation({ className }: { className?: string }) {
  const current = useFrame(coopFrames, { min: 500, max: 1200 })
  const frame = coopFrames[current]

  const gameOver = current === coopFrames.length - 1

  return (
    <div className={cn('w-full flex flex-col items-center p-3', className)}>
      <div className="flex justify-center space-x-32 mb-2">
        <Player
          player={1}
          gameOver={gameOver}
          className={cn(current % 2 == 1 ? 'underline' : null)}
        />

        <Player
          player={2}
          gameOver={gameOver}
          className={cn(current % 2 == 0 ? 'underline' : null)}
        />
      </div>

      <div className="grid grid-cols-5 gap-1">
        {frame.flatMap((statuses, row) =>
          statuses.map((status, index) => (
            <Cell
              key={`${row}-${index}`}
              status={status}
              className="h-6 w-6 border-2"
            />
          ))
        )}
      </div>
    </div>
  )
}

function Player({
  player,
  gameOver,
  className,
}: {
  player: 1 | 2
  gameOver?: boolean
  className?: string
}) {
  const emoji = player === 1 ? '🏆' : '😔'

  return (
    <p
      className={cn(
        player === 1
          ? 'text-blue-500 dark:text-blue-400'
          : 'text-red-500 dark:text-red-400',
        'text-sm md:text-base',
        className
      )}
    >
      {gameOver ? (
        <span className="relative">
          <span className="absolute -left-5 md:-left-6">{emoji}</span> Player{' '}
          {player}{' '}
          <span className="absolute -right-5 md:-right-6">{emoji}</span>
        </span>
      ) : (
        <>Player {player}</>
      )}
    </p>
  )
}

function useFrame<Frames extends Array<DashFrame | CoopFrame>>(
  frames: Frames,
  { min, max }: { min: number; max: number }
) {
  const [current, setCurrent] = React.useState(0)

  React.useEffect(() => {
    let timeout: NodeJS.Timeout

    const tick = () => {
      setCurrent(current => (current === frames.length - 1 ? 0 : current + 1))
      timeout = setTimeout(
        tick,
        current === frames.length - 1 ? 2500 : randomInRange(min, max)
      )
    }

    timeout = setTimeout(
      tick,
      current === frames.length - 1 ? 2500 : randomInRange(min, max)
    )

    return () => clearTimeout(timeout)
  }, [frames.length, current, min, max])

  return current
}

const randomInRange = (min: number, max: number) =>
  Math.random() * (max - min) + min
