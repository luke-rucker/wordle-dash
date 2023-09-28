import { PARTY_KIT_HOST } from '@/constants'
import { createPartyClient } from 'partyrpc/client'
import { createPartyHooks } from 'partyrpc/react'
import type { SafeGameEvents, SafeGameResponses } from '@party/dash-game'
import * as React from 'react'
import usePartySocket from 'partysocket/react'
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import ConfettiExplosion from 'react-confetti-explosion'
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
import { useSession } from '@supabase/auth-helpers-react'
import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { supabase } from '@/lib/supabase'
import { GameContext } from '@/contexts/game-context'
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
import { Cell } from '@/components/cell'
import { cn, getFlag, useCountdown } from '@/lib/utils'
import { Waiting } from '@/components/waiting'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { useReadLocalStorage } from 'usehooks-ts'

export function DashGame() {
  const { gameId } = useParams()
  const location = useLocation()

  if (!location.state?.realGame) {
    return <Navigate to="/" replace />
  }

  return <Game gameId={gameId!} key={gameId} />
}

function Game({ gameId }: { gameId: string }) {
  const session = useSession()
  const profile = useQuery(
    supabase
      .from('profiles')
      .select('username,country')
      .eq('id', session?.user.id as string)
      .limit(1)
      .single(),
    { enabled: !!session }
  )

  const socket = usePartySocket({
    host: PARTY_KIT_HOST,
    party: 'dashGame',
    room: gameId!,
    query: profile.data?.country
      ? { country: profile.data?.country }
      : undefined,
  })

  const client = React.useMemo(
    () =>
      createPartyClient<SafeGameEvents, SafeGameResponses>(socket, {
        debug: true,
      }),
    [socket]
  )

  const { usePartyMessage } = createPartyHooks(client)

  const navigate = useNavigate()

  const anonUsername = useReadLocalStorage<string>('username')

  usePartyMessage('ready', () => {
    if (!profile?.data?.username || !anonUsername) return navigate('/')
    client.send({
      type: 'knockKnock',
      token: session?.access_token ?? sessionStorage.getItem('token'),
      username: (profile?.data?.username ?? anonUsername) as string,
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

  const [badGuess, setBadGuess] = React.useState(false)
  usePartyMessage('badGuess', () => setBadGuess(true))

  React.useEffect(() => {
    if (!badGuess) return
    const clear = setTimeout(() => setBadGuess(false), 2500)
    return () => clearTimeout(clear)
  }, [badGuess])

  React.useEffect(() => {
    if (gameOver) {
      socket.close()
    }
  }, [gameOver, socket])

  if (!game || !game.you || !userId) {
    return <div className="container">Loading....</div>
  }

  const { you, others } = game
  const other = others[0]

  const emptyState: OtherPlayerState = {
    id: '',
    type: 'anon',
    username: 'Your opponent',
    country: null,
    guesses: [],
    currentGuess: 0,
  }

  return (
    <GameContext.Provider value={{ userId, badGuess, game, gameOver }}>
      {gameOver ? <GameOverDialog /> : null}

      <div className="h-full py-6 md:pt-20 flex flex-col items-center justify-between relative">
        {badGuess ? (
          <Alert className="absolute top-4 w-fit">
            <AlertTitle className="mb-0">Not in the word list</AlertTitle>
          </Alert>
        ) : null}

        {!other ? (
          <Alert className="absolute top-4 w-fit">
            <AlertTitle className="mb-0">
              Waiting for your opponent...
            </AlertTitle>
          </Alert>
        ) : null}

        <div className="container flex flex-col items-center space-y-2 md:hidden">
          <GamePreview {...(other ?? emptyState)} />

          <GameGrid {...you} />
        </div>

        <div className="container hidden md:flex gap-8 justify-center">
          <GameGrid {...you} />

          <GameGrid {...(other ?? emptyState)} />
        </div>

        <Keyboard
          onLetter={letter => client.send({ type: 'typeGuess', guess: letter })}
          onDelete={() => client.send({ type: 'typeGuess', guess: null })}
          onEnter={() => client.send({ type: 'submitGuess' })}
          guesses={you.guesses}
          disabled={!!gameOver || !other}
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
        <span className="text-red-500 dark:text-red-400">
          {player.username}
          {player.country ? ` ${getFlag(player.country)}` : null}
        </span>
        {' - Attempt '}
        {player.guesses.length}/{MAX_GUESSES}
        {player.guessBy ? (
          <Countdown to={player.guessBy} stopped={!!game.gameOver} />
        ) : null}
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
      <p>
        <span
          className={cn(
            isYou
              ? 'text-blue-500 dark:text-blue-400'
              : 'text-red-500 dark:text-red-400'
          )}
        >
          {isYou ? 'You' : player.username}
          {player.country ? ` ${getFlag(player.country)}` : null}
        </span>

        {player.guessBy ? (
          <Countdown to={player.guessBy} stopped={!!game.gameOver} />
        ) : null}
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

function Countdown({ to, stopped }: { to: number; stopped?: boolean }) {
  const countdown = useCountdown(to, stopped)

  return <span className="ml-2">{countdown}</span>
}

type RowProps = {
  children: React.ReactNode
  className?: string
}

function Row({ children, className }: RowProps) {
  return <div className={cn('flex gap-1', className)}>{children}</div>
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

  const { badGuess } = useGame()

  return (
    <Row className={cn(yourGuess && badGuess ? 'jiggle' : null)}>
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
  const [waiting, setWaiting] = React.useState(false)

  const navigate = useNavigate()

  const { gameOver, userId } = useGame()

  if (!gameOver) {
    return null
  }

  const { description, winnerIsMe } = (() => {
    if (gameOver?.state.type === 'noGuesses') {
      return {
        winnerIsMe: false,
        description:
          'You there? Neither you or your opponent submitted a guess in time.',
      }
    }

    const winningPlayer = gameOver.game[gameOver.state.playerId]

    if (gameOver?.state.type === 'win') {
      if (gameOver?.state.playerId === userId) {
        return {
          winnerIsMe: true,
          description: 'Looking speedy over there...',
        }
      } else {
        return {
          winnerIsMe: false,
          description: `${winningPlayer.username} was a bit speedier this time. Better luck next time.`,
        }
      }
    } else if (gameOver?.state.type === 'timeLimit') {
      if (gameOver?.state.playerId === userId) {
        return {
          winnerIsMe: false,
          description: "You didn't submit a guess in time.",
        }
      } else {
        return {
          winnerIsMe: true,
          description: `${winningPlayer.username} didn't submit a guess in time.`,
        }
      }
    } else {
      if (gameOver?.state.playerId === userId) {
        return {
          winnerIsMe: false,
          description: 'You ran out guesses. Better luck next time.',
        }
      } else {
        return {
          winnerIsMe: true,
          description: `${winningPlayer.username} ran out of guesses.`,
        }
      }
    }
  })()

  return (
    <Dialog open={open} onOpenChange={open => setOpen(open)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {winnerIsMe ? 'You won! 🏆' : 'You lost 😔'}{' '}
            {winnerIsMe ? <ConfettiExplosion zIndex={51} /> : null}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <p className="">The solution was</p>

        <div className=" pb-4 flex items-center space-x-1">
          {gameOver.state.solution.split('').map((letter, index) => (
            <Cell letter={letter} status="c" key={index} />
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
          {waiting ? (
            <Waiting
              lobby="dash"
              onJoin={gameUrl => {
                navigate(gameUrl, { state: { realGame: true } })
                setOpen(false)
              }}
              onCancel={() => setWaiting(false)}
            />
          ) : (
            <>
              <Button onClick={() => setWaiting(true)}>Play another</Button>

              <Button asChild variant="link">
                <Link to="/">Go home</Link>
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
