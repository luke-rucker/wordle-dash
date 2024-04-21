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
import ReactGA from 'react-ga4'
import { GameOverState, GameState, PlayerState } from '@party/lib/coop-game'
import { Splash } from '@/components/splash'
import { Alert, AlertTitle } from '@/components/ui/alert'
import { Keyboard } from '@/components/keyboard'
import { CoopGameContext } from '@/contexts/coop-game-context'
import { useCoopGame } from '@/lib/game'
import { capitalize, cn, getFlag } from '@/lib/utils'
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
import { useToast } from '@/components/ui/use-toast'
import type { PlayAgainState } from '@party/lib/play-again'
import { LoadingDots } from '@/components/loading-dots'
import { Streak } from '@/components/streak'
import { Icons } from '@/components/icons'

export function CoopGame() {
  const { gameId } = useParams()
  const location = useLocation()

  if (!location.state?.realGame) {
    return <Navigate to="/" replace />
  }

  return (
    <Game
      key={gameId}
      gameId={gameId!.toLowerCase()}
      privateGame={location.state?.privateGame}
    />
  )
}

function Game({
  gameId,
  privateGame,
}: {
  gameId: string
  privateGame?: boolean
}) {
  const navigate = useNavigate()
  const toaster = useToast()

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
  const trackedStart = React.useRef(false)
  usePartyMessage('welcome', ({ token, userId }) => {
    setUserId(userId)
    if (token) sessionStorage.setItem('token', token)
    if (!trackedStart.current) {
      ReactGA.event('started_game', { game_type: 'coop' })
      trackedStart.current = true
    }
  })

  usePartyMessage('fullGame', () => {
    toaster.toast({ title: 'Game is full.', variant: 'destructive' })
    navigate('/')
  })

  const [game, setGame] = React.useState<GameState>()
  usePartyMessage('tick', ({ game }) => setGame(game))

  const handleLetter = (letter: string | null) => {
    client.send({ type: 'typeGuess', guess: letter })

    setGame(game => {
      if (!game) return
      if (game.you.currentGuess.length >= SOLUTION_SIZE) return game

      const newGuess = letter
        ? game.you.currentGuess + letter
        : game.you.currentGuess.slice(0, -1)

      return {
        ...game,
        you: {
          ...game.you,
          currentGuess: newGuess,
        },
      }
    })
  }

  const [badGuess, setBadGuess] = React.useState(false)
  usePartyMessage('badGuess', () => setBadGuess(true))

  React.useEffect(() => {
    if (!badGuess) return
    const clear = setTimeout(() => setBadGuess(false), 2500)
    return () => clearTimeout(clear)
  }, [badGuess])

  const [gameOver, setGameOver] = React.useState<{
    state: GameOverState
    game: Record<string, PlayerState>
  }>()
  const trackedFinish = React.useRef(false)
  usePartyMessage('gameOver', ({ state, game }) => {
    setGameOver({ state, game })
    if (!trackedFinish.current) {
      ReactGA.event('played_game', { game_type: 'coop' })
      trackedFinish.current = true
    }
  })

  const [playAgain, setPlayAgain] = React.useState<PlayAgainState>()
  usePartyMessage('playAgain', ({ playAgain }) => setPlayAgain(playAgain))

  usePartyMessage('newGame', ({ gameId }) =>
    navigate(`/coop/${gameId}`, {
      state: { realGame: true, privateGame: true },
    })
  )

  usePartyMessage('goHome', () => {
    toaster.toast({
      title: 'Your opponent disconnected.',
      variant: 'destructive',
    })
    navigate('/')
  })

  React.useEffect(() => {
    if (gameOver && !privateGame) {
      socket.close()
    }
  }, [gameOver, socket, privateGame])

  if (!game || !game.you || !userId) {
    return <Splash type="loading" />
  }

  return (
    <CoopGameContext.Provider
      value={{ userId, badGuess, game, gameOver, playAgain }}
    >
      {gameOver ? (
        <GameOverDialog
          privateGame={privateGame}
          onPlayAgain={() => client.send({ type: 'playAgain' })}
        />
      ) : null}

      <div className="flex-grow pt-2 md:pt-6 flex flex-col items-center justify-between relative">
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

        {gameOver ? (
          <Alert className="absolute top-4 w-fit">
            <AlertTitle className="mb-0">
              Game over!{'  '}
              <Link to="/" className="underline">
                Go home
              </Link>
            </AlertTitle>
          </Alert>
        ) : null}

        <div className="container flex flex-col items-center">
          <GameHeader />

          <GameGrid />
        </div>

        <Keyboard
          onLetter={handleLetter}
          onDelete={() => handleLetter(null)}
          onEnter={() => client.send({ type: 'submitGuess' })}
          guesses={game.guesses}
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
    <div className="w-full max-w-lg flex justify-between mb-3">
      <Player
        username={game.you.username}
        country={game.you.country}
        isCurrentTurn={game.you.isCurrentTurn}
        type={game.you.type}
        isYou
      />

      <Player
        username={game.others[0]?.username ?? 'Player 2'}
        country={game.others[0]?.country}
        isCurrentTurn={game.others[0]?.isCurrentTurn}
        type={game.others[0]?.type}
      />
    </div>
  )
}

function Player({
  username,
  country,
  isCurrentTurn,
  type,
  isYou,
}: Pick<PlayerState, 'username' | 'country' | 'type'> & {
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
        : `${username}${country ? ` ${getFlag(country)}` : ''}${
            type === 'anon' ? ' (Guest)' : ''
          }`}
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

        {game.others.length === 0 ? '00:00' : null}

        {game.guessBy && gameOver?.state.type !== 'timeLimit' ? (
          <Countdown to={game.guessBy} stopped={!!gameOver} className="ml-0" />
        ) : null}

        {gameOver?.state.type === 'timeLimit' ? <span>00:00</span> : null}
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
            'typed',
            yourGuess
              ? 'border-blue-500 dark:border-blue-400'
              : 'border-red-500 dark:border-red-400 ring-1 ring-red-500 dark:ring-red-400'
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

function GameOverDialog({
  onPlayAgain,
  privateGame,
}: {
  onPlayAgain: () => void
  privateGame?: boolean
}) {
  const [open, setOpen] = React.useState(true)

  const { gameOver, userId, playAgain } = useCoopGame()

  React.useEffect(() => {
    if (playAgain) {
      setOpen(true)
    }
  }, [playAgain])

  if (!gameOver) {
    return null
  }

  const { description, winnerIsMe } = (() => {
    const winningPlayer = gameOver.game[gameOver.state.playerId]

    if (gameOver?.state.type === 'win') {
      if (gameOver?.state.playerId === userId) {
        return {
          winnerIsMe: true,
          description: 'Looking speedy over there :)',
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

        <p className="text-center sm:text-left">The solution was</p>

        <div
          className={cn(
            'flex items-center justify-center sm:justify-start space-x-1',
            gameOver.state.solution.wordle_solution ? 'pb-0' : 'pb-4'
          )}
        >
          {gameOver.state.solution.word.split('').map((letter, index) => (
            <Cell letter={letter} status="c" key={index} />
          ))}
        </div>

        {gameOver.state.solution.wordle_solution ? (
          <p className="text-center sm:text-left text-sm">
            {capitalize(gameOver.state.solution.word)} was the Wordle on{' '}
            {new Date(
              gameOver.state.solution.wordle_solution
            ).toLocaleDateString()}
            .
          </p>
        ) : null}

        <Streak />

        <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-3">
          {privateGame ? (
            <PrivateGameOverOptions onPlayAgain={onPlayAgain} />
          ) : (
            <GameOverOptions />
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function GameOverOptions() {
  const navigate = useNavigate()

  const [waiting, setWaiting] = React.useState(false)

  if (waiting) {
    return (
      <Waiting
        lobby="coop"
        onJoin={gameUrl => {
          navigate(gameUrl, { state: { realGame: true } })
        }}
        onCancel={() => setWaiting(false)}
      />
    )
  }

  return (
    <>
      <Button onClick={() => setWaiting(true)} autoFocus>
        Play another
      </Button>

      <Button asChild variant="outline">
        <Link to="/">Go home</Link>
      </Button>
    </>
  )
}

function PrivateGameOverOptions({ onPlayAgain }: { onPlayAgain: () => void }) {
  const { userId, playAgain } = useCoopGame()

  if (!playAgain) {
    return (
      <>
        <Button onClick={onPlayAgain} autoFocus>
          Ask for a rematch
        </Button>

        <Button asChild variant="outline">
          <Link to="/">Go home</Link>
        </Button>
      </>
    )
  }

  if (Object.keys(playAgain).length === 2) {
    return (
      <p className="text-center sm:text-left">
        Starting new game
        <LoadingDots />
      </p>
    )
  }

  if (playAgain[userId]) {
    return (
      <>
        <p className="text-center sm:text-left">
          Waiting for a response
          <LoadingDots />
        </p>

        <Button asChild variant="outline">
          <Link to="/">Go home</Link>
        </Button>
      </>
    )
  }

  return (
    <>
      <p className="text-center sm:text-left">Your opponent wants a rematch</p>

      <Button onClick={onPlayAgain} autoFocus>
        <Icons.Check className="mr-2 h-4 w-4" />
        Accept
      </Button>

      <Button asChild variant="outline">
        <Link to="/">Go home</Link>
      </Button>
    </>
  )
}
