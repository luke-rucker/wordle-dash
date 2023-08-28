import { PARTY_KIT_HOST } from '@/constants'
import { createPartyClient } from 'partyrpc/client'
import { createPartyHooks } from 'partyrpc/react'
import type { SafeGameEvents, SafeGameResponses } from '@party/game'
import * as React from 'react'
import usePartySocket from 'partysocket/react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUsername } from '@/stores/settings-store'
import type {
  GameState,
  Guess,
  OtherPlayerState,
  PlayerState,
} from '@party/lib/game'
import { Keyboard } from '@/components/keyboard'
import type { LetterStatus } from '@party/lib/words/compare'
import { MAX_GUESSES, SOLUTION_SIZE } from '@party/lib/constants'
import { cn } from '@/lib/utils'

export function Game() {
  const navigate = useNavigate()
  const { gameId } = useParams()

  const socket = usePartySocket({
    host: PARTY_KIT_HOST,
    party: 'game',
    room: gameId!,
  })

  const client = React.useMemo(
    () =>
      createPartyClient<SafeGameEvents, SafeGameResponses>(socket, {
        debug: true,
      }),
    [socket]
  )

  const { usePartyMessage, useSocketEvent } = createPartyHooks(client)

  // React.useEffect(() => {
  //   const interval = setInterval(() => client.send({ type: 'ping' }), 1000)
  //   return () => clearInterval(interval)
  // }, [client])

  const username = useUsername()

  useSocketEvent('open', () => {
    client.send({
      type: 'whoami',
      token: sessionStorage.getItem('token'),
      username,
    })
  })

  React.useEffect(() => {
    client.send({ type: 'updateUsername', username })
  }, [username, client])

  const [userId, setUserId] = React.useState<string | null>(null)

  usePartyMessage('welcome', ({ token, userId }) => {
    setUserId(userId)
    if (token) sessionStorage.setItem('token', token)
  })

  usePartyMessage('fullGame', () => {
    navigate('/', { state: { fullGame: true } })
  })

  const [game, setGame] = React.useState<GameState>()

  usePartyMessage('tick', ({ game }) => setGame(game))

  if (!game || !game.others.length || !game.you) {
    return <div className="container">Loading....</div>
  }

  const { you, others } = game
  const other = others[0]

  return (
    <div className="container">
      <div className="flex flex-col items-center md:hidden">
        <GamePreview {...other} />

        <GameGrid {...you} />
      </div>

      <div className="hidden md:flex gap-8 justify-center">
        <GameGrid {...you} />

        <GameGrid {...other} />
      </div>

      <Keyboard
        guesses={you.guesses}
        onLetter={letter => client.send({ type: 'typeGuess', guess: letter })}
        onDelete={() => client.send({ type: 'typeGuess', guess: null })}
        onEnter={() => client.send({ type: 'submitGuess' })}
      />
    </div>
  )
}

type GameGridProps = PlayerState | OtherPlayerState

function GamePreview({
  username,
  online,
  guesses,
  currentGuess,
}: OtherPlayerState) {
  return (
    <div className="space-y-2">
      <p>
        {username}: {guesses.length} / {MAX_GUESSES}
      </p>

      <CurrentRow guess={currentGuess} />
    </div>
  )
}

function GameGrid({ username, online, guesses, currentGuess }: GameGridProps) {
  const isYou = typeof currentGuess === 'string'

  const empties =
    guesses.length < MAX_GUESSES - 1
      ? Array.from(Array(MAX_GUESSES - 1 - guesses.length))
      : []

  return (
    <div className="space-y-1">
      <p>
        {isYou ? 'You' : username} - {online ? 'Online' : 'Offline'}
      </p>

      {guesses.map((guess, index) => (
        <CompletedRow key={index} guess={guess} />
      ))}

      {guesses.length < MAX_GUESSES ? (
        <CurrentRow guess={currentGuess} />
      ) : null}

      {empties.map((_, i) => (
        <EmptyRow key={i} />
      ))}
    </div>
  )
}

type RowProps = {
  children: React.ReactNode
}

function Row({ children }: RowProps) {
  return <div className="flex gap-1">{children}</div>
}

type CellProps = {
  status?: LetterStatus | 'typed'
  hideLetter?: boolean
  letter?: string
}

function Cell({ status, hideLetter, letter }: CellProps) {
  return (
    <div
      className={cn(
        'h-14 w-14 flex items-center justify-center border-2 text-4xl font-bold uppercase',
        {
          'border-primary': status === 'typed',
          'border-muted bg-muted': status === 'absent',
          'border-yellow-400 bg-yellow-400 text-white': status === 'present',
          'border-green-800 bg-green-800 text-white': status === 'correct',
        }
      )}
    >
      {hideLetter ? null : letter}
    </div>
  )
}

type CompletedRowProps = {
  guess: Guess | Array<LetterStatus>
}

function CompletedRow({ guess }: CompletedRowProps) {
  return (
    <Row>
      {Array.isArray(guess)
        ? guess.map((status, index) => (
            <Cell key={index} status={status} hideLetter />
          ))
        : guess.computed.map((status, index) => (
            <Cell key={index} letter={guess.raw[index]} status={status} />
          ))}
    </Row>
  )
}

type CurrentRowProps = {
  guess: string | number
}

function CurrentRow({ guess }: CurrentRowProps) {
  const yourGuess = typeof guess === 'string'
  const letters = yourGuess ? guess.split('') : Array.from(Array(guess))
  const emptyCells = Array.from(Array(SOLUTION_SIZE - letters.length))

  return (
    <Row>
      {letters.map((letter, index) => (
        <Cell
          letter={letter ?? '*'}
          key={index}
          hideLetter={!yourGuess}
          status="typed"
        />
      ))}

      {emptyCells.map((_, i) => (
        <Cell key={i} />
      ))}
    </Row>
  )
}

function EmptyRow() {
  const emptyCells = Array.from(Array(SOLUTION_SIZE))

  return (
    <Row>
      {emptyCells.map((_, i) => (
        <Cell key={i} />
      ))}
    </Row>
  )
}
