import { AuthModal } from '@/components/auth-modal'
import { Cell } from '@/components/cell'
import { GoogleButton } from '@/components/google-button'
import { Icons } from '@/components/icons'
import { LoadingDots } from '@/components/loading-dots'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { Waiting } from '@/components/waiting'
import { PARTY_KIT_HOST, PARTY_KIT_URL } from '@/constants'
import { AnonProfileData, anonProfileSchema } from '@/lib/profiles'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { MAX_GUESSES, SOLUTION_SIZE } from '@party/lib/constants'
import type { TimeToGuess } from '@party/lib/dash-game'
import { LetterStatus } from '@party/lib/words/compare'
import type { GameType } from '@party/lobby'
import { MAIN_ROOM, type MainMessage } from '@party/main'
import {
  ReadyResponse,
  SafeLobbyEvents,
  SafeLobbyResponses,
} from '@party/private-lobby'
import * as RadioGroup from '@radix-ui/react-radio-group'
import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { useSession } from '@supabase/auth-helpers-react'
import { useMutation } from '@tanstack/react-query'
import { createPartyClient } from 'partyrpc/client'
import { createPartyHooks } from 'partyrpc/react'
import usePartySocket from 'partysocket/react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { uid } from 'uid/secure'
import { useLocalStorage, useReadLocalStorage } from 'usehooks-ts'
import { Output, length, object, regex, string } from 'valibot'

export function Landing() {
  const navigate = useNavigate()

  const [waiting, setWaiting] = React.useState<GameType | null>(null)
  const [createGame, setCreateGame] = React.useState<GameType | null>(null)
  const [joinGame, setJoinGame] = React.useState<GameType | null>(null)

  const [coop, setCoop] = React.useState(0)
  const [dash, setDash] = React.useState(0)

  usePartySocket({
    host: PARTY_KIT_HOST,
    party: 'main',
    room: MAIN_ROOM,
    onMessage(event) {
      const update = JSON.parse(event.data) as MainMessage

      if (update.type === 'sync') {
        setCoop(update.coop)
        setDash(update.dash)
      } else if (update.type === 'update') {
        if (update.game === 'coop') setCoop(update.count)
        if (update.game === 'dash') setDash(update.count)
      }
    },
  })

  return (
    <main className="flex-grow flex flex-col items-center justify-center">
      <div className="w-full max-w-lg px-8 md:px-0 py-6 md:py-12">
        <h2 className="mb-0.5 md:mb-5 text-2xl md:text-5xl font-bold md:font-semibold tracking-tight">
          <span
            role="img"
            aria-label="dashing away"
            className=" inline-block rotate-180 text-2xl md:text-5xl leading-none"
          >
            💨
          </span>
          Wordle Dash
        </h2>

        <p className="text-base md:text-xl text-muted-foreground mb-7">
          Pick a game mode
        </p>

        <Tabs
          defaultValue="coop"
          onValueChange={tab => {
            if (tab !== waiting) {
              setWaiting(null)
              setCreateGame(null)
              setJoinGame(null)
            }
          }}
        >
          <TabsList className="grid w-full grid-cols-2 h-fit">
            <TabsTrigger value="coop" className="flex flex-col">
              Co-Op <p className="text-xs">{coop} Online</p>
            </TabsTrigger>
            <TabsTrigger value="dash" className="flex flex-col">
              Dash <p className="text-xs">{dash} Online</p>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="coop">
            <Card>
              <CardHeader>
                <CardTitle>Co-Op</CardTitle>

                <CurrentUser />
              </CardHeader>

              <CardContent>
                <EnsureUsername>
                  {waiting === 'coop' ? (
                    <Waiting
                      lobby="coop"
                      onJoin={gameUrl =>
                        navigate(gameUrl, { state: { realGame: true } })
                      }
                      onCancel={() => setWaiting(null)}
                    />
                  ) : null}

                  {createGame === 'coop' ? (
                    <CreateAGame
                      gameType="coop"
                      onCancel={() => setCreateGame(null)}
                    />
                  ) : null}

                  {joinGame === 'coop' ? (
                    <JoinGame onCancel={() => setJoinGame(null)} />
                  ) : null}

                  {!waiting && createGame !== 'coop' && joinGame !== 'coop' ? (
                    <PlayButtons
                      onPlay={() => setWaiting('coop')}
                      onInviteFriend={() => setCreateGame('coop')}
                      onJoinGame={() => setJoinGame('coop')}
                    />
                  ) : null}
                </EnsureUsername>
              </CardContent>

              <CardFooter className="block">
                <h4 className="text-lg font-semibold leading-none tracking-tight mb-2">
                  How to play
                </h4>

                <CardDescription>
                  Take turns trying to guess the hidden word with your opponent.
                  Whoever guesses it first, wins.
                </CardDescription>

                <CoopGame />
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="dash">
            <Card>
              <CardHeader>
                <CardTitle>Dash</CardTitle>

                <CurrentUser />
              </CardHeader>

              <CardContent>
                <EnsureUsername>
                  {waiting === 'dash' ? (
                    <Waiting
                      lobby="dash"
                      onJoin={gameUrl =>
                        navigate(gameUrl, { state: { realGame: true } })
                      }
                      onCancel={() => setWaiting(null)}
                    />
                  ) : null}

                  {createGame === 'dash' ? (
                    <CreateAGame
                      gameType="dash"
                      onCancel={() => setCreateGame(null)}
                    />
                  ) : null}

                  {joinGame === 'dash' ? (
                    <JoinGame onCancel={() => setJoinGame(null)} />
                  ) : null}

                  {!waiting && createGame !== 'dash' && joinGame !== 'dash' ? (
                    <PlayButtons
                      onPlay={() => setWaiting('dash')}
                      onInviteFriend={() => setCreateGame('dash')}
                      onJoinGame={() => setJoinGame('dash')}
                    />
                  ) : null}
                </EnsureUsername>
              </CardContent>

              <CardFooter className="block">
                <h4 className="text-lg font-semibold leading-none tracking-tight mb-2">
                  How to play
                </h4>

                <CardDescription>
                  Race against your opponent to guess the word first on separate
                  boards. Be careful not to run out of guesses.
                </CardDescription>

                <DashGame />
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

function CurrentUser() {
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

  const username = useReadLocalStorage<string>('username')

  if (session) {
    return (
      <CardDescription>
        Playing as {profile.data?.username}.{' '}
        <Button
          variant="link"
          onClick={() => supabase.auth.signOut()}
          className="px-0 text-sm"
        >
          Sign Out
        </Button>
      </CardDescription>
    )
  }

  if (username) {
    return (
      <CardDescription>
        Playing as {username}
        {'. '}
        <AuthModal
          variant="signUp"
          trigger={
            <Button variant="link" className="px-0 text-sm">
              Sign up to save your stats
            </Button>
          }
        />
      </CardDescription>
    )
  }

  return null
}

function PlayButtons({
  onPlay,
  onInviteFriend,
  onJoinGame,
}: {
  onPlay: () => void
  onInviteFriend: () => void
  onJoinGame: () => void
}) {
  return (
    <>
      <Button className="w-full" onClick={onPlay}>
        Play
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Button className="w-full" variant="secondary" onClick={onInviteFriend}>
          Invite a friend
        </Button>

        <Button className="w-full" variant="secondary" onClick={onJoinGame}>
          Join a game
        </Button>
      </div>
    </>
  )
}

function EnsureUsername({ children }: { children: React.ReactNode }) {
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

  const username = useReadLocalStorage<string>('username')

  if ((session && profile?.data?.username) || username) {
    return children
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold">Play with an Account</h3>
      <p className="text-xs text-muted-foreground mb-6">
        When you play with an account you can save the stats of your games and
        compete on the{' '}
        <Link to="/stats" className="underline">
          global leaderboard
        </Link>
        .
      </p>

      <GoogleButton />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or play as
          </span>
        </div>
      </div>

      <AnonProfileForm />
    </div>
  )
}

function AnonProfileForm() {
  const form = useForm<AnonProfileData>({
    resolver: valibotResolver(anonProfileSchema),
    values: {
      username: '',
    },
  })

  const [, setUsername] = useLocalStorage('username', '')

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(data => {
          setUsername(data.username)
        })}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="wordle-speedster" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className="w-full" variant="secondary">
          Continue
        </Button>
      </form>
    </Form>
  )
}

function CreateAGame({
  onCancel,
  gameType,
}: {
  onCancel: () => void
  gameType: GameType
}) {
  const [lobbyId] = React.useState(uid(6))

  const [timeToGuess, setTimeToGuess] = React.useState<'30' | '60' | '8'>('30')

  const socket = usePartySocket({
    host: PARTY_KIT_HOST,
    party: 'privateLobby',
    room: lobbyId,
    query: { gameType },
  })

  const client = React.useMemo(
    () =>
      createPartyClient<SafeLobbyEvents, SafeLobbyResponses>(socket, {
        debug: import.meta.env.DEV,
      }),
    [socket]
  )

  const { useSocketEvent, usePartyMessage } = createPartyHooks(client)

  const sendTimeToGuess = (newTimeToGuess: '30' | '60' | '8') => {
    client.send({
      type: 'setTimeToGuess',
      timeToGuess: newTimeToGuess,
    })
  }

  const [connecting, setConnecting] = React.useState(true)

  useSocketEvent('open', () => {
    sendTimeToGuess(timeToGuess)
    setConnecting(false)
  })

  const navigate = useNavigate()
  usePartyMessage('ready', message => {
    navigate(`/${message.gameType}/${message.gameId}`, {
      state: { realGame: true },
    })
  })

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-lg font-semibold leading-none tracking-tight mb-2">
          Invite a friend
          {connecting ? (
            <>
              {' '}
              - Connecting
              <LoadingDots />
            </>
          ) : null}
        </h4>

        <CardDescription>
          Waiting for your friend. Don't close the page! The game will start
          once they enter the code below.{' '}
          <Button
            variant="link"
            className="px-0 py-0 h-fit text-sm"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </CardDescription>
      </div>

      <div>
        <label className="text-sm font-medium leading-none" htmlFor="gameCode">
          Game Code
        </label>

        <div className="flex flex-col md:flex-row w-full items-start gap-2 mt-2">
          <div className="flex-grow">
            <Input
              id="gameCode"
              type="text"
              value={lobbyId.toUpperCase()}
              readOnly
              className="text-3xl font-bold h-14"
              onFocus={e => e.target.select()}
              aria-describedby="gameCodeDescription"
            />

            <p
              id="gameCodeDescription"
              className="text-sm text-muted-foreground mt-2"
            >
              Share this code with your friend
            </p>
          </div>

          <CopyButton
            value={`You've been invited to play Wordle Dash! Your game code is ${lobbyId.toUpperCase()}. Play at wordledash.com :)`}
          />
        </div>
      </div>

      <TimeToGuess
        value={timeToGuess}
        onChange={val => {
          setTimeToGuess(val)
          sendTimeToGuess(val)
        }}
      />
    </div>
  )
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    let clear: NodeJS.Timeout

    if (copied) {
      clear = setTimeout(() => setCopied(false), 3000)
    }

    return () => clearTimeout(clear)
  }, [copied])

  return (
    <Button
      type="button"
      className="w-full md:w-auto md:h-14"
      onClick={() => {
        setCopied(true)
        navigator.clipboard.writeText(value).catch(() => {})
      }}
    >
      <Icons.Copy className="mr-2 h-4 w-4" />
      {copied ? 'Copied!' : 'Copy'}
    </Button>
  )
}

function TimeToGuess({
  value,
  onChange,
}: {
  value: '30' | '60' | '8'
  onChange: (timeToGuess: '30' | '60' | '8') => void
}) {
  return (
    <div>
      <label className="text-sm font-medium leading-none" htmlFor="timeToGuess">
        Time per guess
      </label>

      <RadioGroup.Root
        id="timeToGuess"
        value={value}
        onValueChange={val => {
          onChange(val as '30' | '60' | '8')
        }}
        className="mt-2 flex items-center space-x-3 w-full"
      >
        {['30', '60', '8'].map(timeToGuess => (
          <Button
            asChild
            variant={value === timeToGuess ? 'secondary' : 'default'}
            key={timeToGuess}
            className="flex-1"
          >
            <RadioGroup.Item id={timeToGuess} value={timeToGuess}>
              <RadioGroup.Indicator />

              <label htmlFor={timeToGuess} className="cursor-pointer">
                {timeToGuess === '8' ? (
                  <>
                    <Icons.Infinity className="h-6 w-6" />
                    <span className="sr-only">Infinity</span>
                  </>
                ) : (
                  `${timeToGuess}s`
                )}
              </label>
            </RadioGroup.Item>
          </Button>
        ))}
      </RadioGroup.Root>
    </div>
  )
}

const joinGameSchema = object({
  code: string('A game code is required', [
    length(6, 'Needs to be 6 characters'),
    regex(/^[A-Z0-9]+$/, 'Invalid code'),
  ]),
})

type JoinGameData = Output<typeof joinGameSchema>

function JoinGame({ onCancel }: { onCancel: () => void }) {
  const form = useForm<JoinGameData>({
    resolver: valibotResolver(joinGameSchema),
    values: {
      code: '',
    },
  })

  const toast = useToast()
  const navigate = useNavigate()

  const join = useMutation({
    mutationFn: async (lobbyId: string) => {
      const res = await fetch(
        `${PARTY_KIT_URL}/parties/privateLobby/${lobbyId}`,
        { method: 'POST' }
      )

      if (!res.ok) {
        if (res.status === 400) {
          throw new Error('Invalid code.')
        } else {
          throw new Error('Something went wrong!')
        }
      }

      const answer = (await res.json()) as ReadyResponse
      return { id: answer.gameId, type: answer.gameType }
    },
    onError: (err: Error) => {
      toast.toast({ title: err.message, variant: 'destructive' })
    },
    onSuccess: game => {
      navigate(`/${game.type}/${game.id}`, { state: { realGame: true } })
    },
  })

  return (
    <>
      <div className="mb-5">
        <h4 className="text-lg font-semibold leading-none tracking-tight mb-2">
          Join a game
        </h4>

        <CardDescription>
          Enter the code your friend sent you below. The game will start once
          you press join.{' '}
          <Button
            variant="link"
            className="px-0 py-0 h-fit text-sm"
            onClick={onCancel}
          >
            Go back
          </Button>
        </CardDescription>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(data => {
            join.mutate(data.code.toLowerCase())
          })}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Game Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="AX7B02"
                    className="text-3xl font-bold h-14"
                    {...field}
                    onChange={e =>
                      field.onChange({
                        ...e,
                        target: {
                          ...e.target,
                          value: e.target.value.toUpperCase(),
                        },
                      })
                    }
                  />
                </FormControl>
                <FormDescription>
                  This is the code your friend sent you.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button className="w-full" disabled={join.isLoading}>
            {join.isLoading ? <Icons.Spinner className="mr-2 h-4 w-4" /> : null}
            Join
          </Button>
        </form>
      </Form>
    </>
  )
}

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

function DashGame() {
  const current = useFrame(dashFrames, { min: 200, max: 900 })
  const frame = dashFrames[current]

  return (
    <div className="w-full flex justify-around md:justify-center md:space-x-2">
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

function CoopGame() {
  const current = useFrame(coopFrames, { min: 500, max: 1200 })
  const frame = coopFrames[current]

  const gameOver = current === coopFrames.length - 1

  return (
    <div className="w-full flex flex-col items-center p-3">
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
