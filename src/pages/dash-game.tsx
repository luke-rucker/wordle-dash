import { PARTY_KIT_HOST } from '@/constants'
import { createPartyClient } from 'partyrpc/client'
import { createPartyHooks } from 'partyrpc/react'
import type { SafeGameEvents, SafeGameResponses } from '@party/dash-game'
import * as React from 'react'
import usePartySocket from 'partysocket/react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type {
  GameOverState,
  GameState,
  Guess,
  OtherPlayerState,
  PlayerState,
} from '@party/lib/dash-game'
import { Keyboard } from '@/components/keyboard'
import type { LetterStatus } from '@party/lib/words/compare'
import { MAX_GUESSES, SOLUTION_SIZE } from '@party/lib/constants'
import { cn } from '@/lib/utils'
import { useSession } from '@supabase/auth-helpers-react'
import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { supabase } from '@/lib/supabase'
import { GameContext } from '@/contexts/game-context'

import { useUsernameStore } from '@/stores/username-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useGame } from '@/lib/game'

export function DashGame() {
  const navigate = useNavigate()
  const { gameId } = useParams()

  const socket = usePartySocket({
    host: PARTY_KIT_HOST,
    party: 'dashGame',
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

  const session = useSession()
  const profile = useQuery(
    supabase
      .from('profiles')
      .select('username')
      .eq('id', session?.user.id as string),
    { enabled: !!session }
  )

  const anonUsername = useUsernameStore(state => state.username)
  const username = () => {
    if (profile.data && profile.data[0].username) {
      return profile.data[0].username
    } else {
      return anonUsername
    }
  }

  useSocketEvent('open', () => {
    client.send({
      type: 'knockKnock',
      token: session?.access_token ?? sessionStorage.getItem('token'),
      username: username(),
    })
  })

  const [userId, setUserId] = React.useState<string | null>(
    session?.user.id ?? null
  )
  usePartyMessage('welcome', ({ token, userId }) => {
    setUserId(userId)
    if (token) sessionStorage.setItem('token', token)
  })

  usePartyMessage('fullGame', () => {
    navigate('/', { state: { fullGame: true } })
  })

  const [game, setGame] = React.useState<GameState>()
  usePartyMessage('tick', ({ game }) => setGame(game))

  const [gameOver, setGameOver] = React.useState<{
    state: GameOverState
    game: Record<string, PlayerState>
  }>()
  usePartyMessage('gameOver', ({ state, game }) => setGameOver({ state, game }))

  if (!game || !game.others.length || !game.you || !userId) {
    return <div className="container">Loading....</div>
  }

  const { you, others } = game
  const other = others[0]

  return (
    <GameContext.Provider value={{ userId, game, gameOver }}>
      {gameOver ? <GameOverDialog /> : null}

      <div className="h-full py-4 flex flex-col items-center justify-between">
        <div className="container flex flex-col items-center space-y-2 md:hidden">
          <GamePreview {...other} />

          <GameGrid {...you} />
        </div>

        <div className="container hidden md:flex gap-8 justify-center">
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
    </GameContext.Provider>
  )
}

type GameGridProps = PlayerState | OtherPlayerState

function GamePreview(player: OtherPlayerState) {
  const game = useGame()

  const guess = (() => {
    if (game.gameOver) {
      const { game: finished } = game.gameOver
      if (finished[player.id].guesses.length > 0) {
        return finished[player.id].guesses[
          finished[player.id].guesses.length - 1
        ]
      }
      return finished[player.id].currentGuess
    }

    if (player.guesses.length > 0) {
      return player.guesses[player.guesses.length - 1]
    }

    return player.currentGuess
  })()

  return (
    <div className="space-y-2">
      <p>
        {player.username}: {player.guesses.length} / {MAX_GUESSES}
      </p>

      {typeof guess === 'string' || typeof guess === 'number' ? (
        <CurrentRow guess={guess} />
      ) : (
        <CompletedRow guess={guess} />
      )}
    </div>
  )
}

function GameGrid(player: GameGridProps) {
  const game = useGame()

  const isYou = game.userId === player.id

  const guesses = game.gameOver
    ? game.gameOver.game[player.id].guesses
    : player.guesses

  const currentGuess = game.gameOver
    ? game.gameOver.game[player.id].currentGuess
    : player.currentGuess

  const empties =
    guesses.length < MAX_GUESSES - 1
      ? Array.from(Array(MAX_GUESSES - 1 - guesses.length))
      : []

  return (
    <div className="space-y-1">
      <p>{isYou ? 'You' : player.username}</p>

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
          'border-gray-600 bg-gray-600 text-white': status === 'absent',
          'border-yellow-400 bg-yellow-400 text-white': status === 'present',
          'border-green-700 bg-green-700 text-white': status === 'correct',
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

function GameOverDialog() {
  const [open, setOpen] = React.useState(true)

  const game = useGame()

  if (!game.gameOver) {
    return null
  }

  const gameOver = game.gameOver

  const { title, description } = (() => {
    if (gameOver?.state.playerId === game.userId) {
      if (gameOver.state.type === 'win') {
        return {
          title: 'You won!',
          description: 'Looking speedy over there...',
        }
      }
      if (gameOver.state.type === 'outOfGuesses') {
        return {
          title: 'You lost :(',
          description: 'You ran out guesses. Better luck next time ;)',
        }
      }
    }

    const winningPlayer = gameOver.game[gameOver.state.playerId]
    return {
      title: 'You lost :(',
      description: `${winningPlayer.username} was a bit speedier this time. Better luck next time.`,
    }
  })()

  return (
    <Dialog open={open} onOpenChange={open => setOpen(open)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button asChild>
            <Link to="/">Play another</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
