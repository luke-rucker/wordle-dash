import { PARTY_KIT_HOST } from '@/constants'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { useSession } from '@supabase/auth-helpers-react'
import usePartySocket from 'partysocket/react'
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import * as React from 'react'
import { createPartyClient } from 'partyrpc/client'
import type { SafeCoopEvents, SafeCoopResponses } from '@party/coop-game'
import { createPartyHooks } from 'partyrpc/react'
import { useReadLocalStorage } from 'usehooks-ts'
import { GameOverState, GameState, PlayerState } from '@party/lib/coop-game'
import { Splash } from '@/components/splash'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Keyboard } from '@/components/keyboard'
import { CoopGameContext } from '@/contexts/coop-game-context'
import { useCoopGame } from '@/lib/game'
import { cn, getFlag } from '@/lib/utils'
import { SOLUTION_SIZE } from '@party/lib/constants'
import { Cell } from '@/components/cell'
import { Countdown } from '@/components/countdown'
import { Guess } from '@party/lib/shared'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Waiting } from '@/components/waiting'
import ConfettiExplosion from 'react-confetti-explosion'

export function CoopGame() {
  const { gameId } = useParams()
  const location = useLocation()

  if (!location.state?.realGame) {
    return <Navigate to="/" replace />
  }

  return <Game gameId={gameId!.toLowerCase()} key={gameId} />
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
    party: 'coopGame',
    room: gameId!,
    query: profile.data?.country
      ? { country: profile.data?.country }
      : undefined,
  })

  const client = React.useMemo(
    () =>
      createPartyClient<SafeCoopEvents, SafeCoopResponses>(socket, {
        debug: import.meta.env.DEV,
      }),
    [socket]
  )

  const { usePartyMessage } = createPartyHooks(client)

  const navigate = useNavigate()
  const anonUsername = useReadLocalStorage<string>('username')

  usePartyMessage('ready', () => {
    if (!profile?.data?.username && !anonUsername) return navigate('/')
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
    // TODO: error?
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
    return <Splash type="loading" />
  }

  return (
    <CoopGameContext.Provider value={{ userId, badGuess, game, gameOver }}>
      {gameOver ? <GameOverDialog /> : null}

      <div className="h-full py-6 md:pt-20 flex flex-col items-center justify-between relative">
        {badGuess ? (
          <Alert className="absolute top-4 w-fit">
            <AlertTitle className="mb-0">Not in the word list</AlertTitle>
          </Alert>
        ) : null}

        {game.others.length === 0 ? (
          <Alert className="absolute top-4 w-fit">
            <AlertTitle className="mb-0">
              Waiting for your opponent...
            </AlertTitle>
          </Alert>
        ) : null}

        <div className="container flex flex-col items-center">
          <GameHeader />

          <GameGrid />
        </div>

        <Keyboard
          onLetter={letter => client.send({ type: 'typeGuess', guess: letter })}
          onDelete={() => client.send({ type: 'typeGuess', guess: null })}
          onEnter={() => client.send({ type: 'submitGuess' })}
          guesses={game.guesses.filter(guess => guess.playerId === userId)}
          disabled={
            !game.you.isCurrentTurn || !!gameOver || game.others.length === 0
          }
        />
      </div>
    </CoopGameContext.Provider>
  )
}

function GameHeader() {
  const { game } = useCoopGame()

  return (
    <div className="w-full max-w-md flex justify-between mb-3">
      <Player
        username={game.you.username}
        country={game.you.country}
        isCurrentTurn={game.you.isCurrentTurn}
        isYou
      />

      <Player
        username={game.others[0]?.username ?? 'Player 2'}
        country={game.others[0]?.country}
        isCurrentTurn={game.others[0]?.isCurrentTurn}
      />
    </div>
  )
}

function Player({
  username,
  country,
  isCurrentTurn,
  isYou,
}: Pick<PlayerState, 'username' | 'country'> & {
  isCurrentTurn: boolean
  isYou?: boolean
}) {
  return (
    <p
      className={cn(
        isYou
          ? 'text-blue-500 dark:text-blue-400'
          : 'text-red-500 dark:text-red-400',
        isCurrentTurn && 'underline'
      )}
    >
      {isYou
        ? `${username}${country ? ` ${getFlag(country)} ` : ''}(You)`
        : username}
    </p>
  )
}

function GameGrid() {
  const { game, gameOver } = useCoopGame()

  const empties =
    game.guesses.length < game.maxGuesses - 1
      ? Array.from(Array(game.maxGuesses - 1 - game.guesses.length))
      : []

  return (
    <div className="space-y-1">
      {game.guesses.map((guess, index) => (
        <CompletedRow key={index} guess={guess} />
      ))}

      <CurrentRow />

      {empties.map((_, index) => (
        <EmptyRow key={index} />
      ))}

      <p className="text-center py-2">
        {game.you.isCurrentTurn ? 'Enter a guess - ' : "Opponent's turn - "}
        {game.guessBy ? (
          <Countdown to={game.guessBy} stopped={!!gameOver} className="ml-0" />
        ) : null}
      </p>
    </div>
  )
}

function Row({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('flex gap-1', className)}>{children}</div>
}

function CompletedRow({ guess }: { guess: Guess }) {
  return (
    <Row>
      {guess.computed.map((status, index) => (
        <Cell key={index} letter={guess.raw[index]} status={status} />
      ))}
    </Row>
  )
}

function CurrentRow() {
  const { game, badGuess } = useCoopGame()

  const yourGuess = game.you.isCurrentTurn

  const letters = yourGuess
    ? game.you.currentGuess.split('')
    : Array.from(Array(game.others[0]?.currentGuess ?? 0))

  const emptyCells = Array.from(Array(SOLUTION_SIZE - letters.length))

  return (
    <Row className={cn(yourGuess && badGuess ? 'jiggle' : null)}>
      {letters.map((letter, index) => (
        <Cell
          letter={letter ?? '*'}
          key={index}
          hideLetter={!yourGuess}
          className={cn(
            yourGuess
              ? 'border-blue-500 dark:border-blue-400'
              : 'border-red-500 dark:border-red-400 ring ring-red-400 dark:ring-red-300'
          )}
        />
      ))}

      {emptyCells.map((_, i) => (
        <Cell
          key={i}
          className={cn(
            yourGuess
              ? 'border-blue-500 dark:border-blue-400'
              : 'border-red-500 dark:border-red-400'
          )}
        />
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

  const { gameOver, userId } = useCoopGame()

  if (!gameOver) {
    return null
  }

  const { description, winnerIsMe } = (() => {
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
    } else {
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
