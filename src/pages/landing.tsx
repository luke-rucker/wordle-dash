import { AuthModal } from '@/components/auth-modal'
import { Cell } from '@/components/cell'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PARTY_KIT_HOST } from '@/constants'
import { AnonProfileData, anonProfileSchema } from '@/lib/profiles'
import { supabase } from '@/lib/supabase'
import { cn, useTimer } from '@/lib/utils'
import { useUsernameStore } from '@/stores/username-store'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { MAX_GUESSES, SOLUTION_SIZE } from '@party/lib/constants'
import type { LobbyMessage } from '@party/lobby'
import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { useSession } from '@supabase/auth-helpers-react'
import usePartySocket from 'partysocket/react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

type GameType = 'coop' | 'dash'

export function Landing() {
  const [waiting, setWaiting] = React.useState<GameType | null>(null)

  return (
    <main className="flex-grow flex flex-col items-center justify-center">
      <div className="w-full max-w-lg px-8 md:px-0">
        <h2 className="mb-5 text-5xl font-semibold tracking-tight">
          <span
            role="img"
            aria-label="dashing away"
            className=" inline-block rotate-180 text-5xl leading-none"
          >
            💨
          </span>
          Wordle Dash
        </h2>

        <p className="text-xl text-muted-foreground mb-7">Pick a game mode</p>

        <Tabs
          defaultValue="coop"
          onValueChange={tab => {
            if (tab !== waiting) setWaiting(null)
          }}
        >
          <TabsList className="grid w-full grid-cols-2 h-fit">
            <TabsTrigger value="coop" className="flex flex-col">
              Co-Op <p className="text-xs">1034 Online</p>
            </TabsTrigger>
            <TabsTrigger value="dash" className="flex flex-col">
              Dash <p className="text-xs">754 Online</p>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="coop">
            <Card>
              <CardHeader>
                <CardTitle>Co-Op</CardTitle>
                <CardDescription>
                  Take turns trying to guess the hidden word with your opponent.
                  Whoever guesses it first, wins.
                </CardDescription>
              </CardHeader>

              <CardFooter>
                <EnsureUsername>
                  {waiting === 'coop' ? (
                    <Waiting lobby="coop" onCancel={() => setWaiting(null)} />
                  ) : (
                    <div className="flex flex-col md:flex-row gap-4">
                      <Button
                        className="w-full"
                        onClick={() => setWaiting('coop')}
                      >
                        Play
                      </Button>

                      <Button className="w-full">Invite a friend</Button>
                    </div>
                  )}
                </EnsureUsername>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="dash">
            <Card>
              <CardHeader>
                <CardTitle>Dash</CardTitle>
                <CardDescription>
                  Race against your opponent to guess the word first on separate
                  boards. Be careful not to run out of guesses.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <DashGame />
              </CardContent>

              <CardFooter>
                <EnsureUsername>
                  {waiting === 'dash' ? (
                    <Waiting lobby="dash" onCancel={() => setWaiting(null)} />
                  ) : (
                    <div className="flex flex-col md:flex-row gap-4">
                      <Button
                        className="w-full"
                        onClick={() => setWaiting('dash')}
                      >
                        Play
                      </Button>

                      <Button className="w-full">Invite a friend</Button>
                    </div>
                  )}
                </EnsureUsername>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

function Waiting({
  onCancel,
  lobby,
}: {
  onCancel: () => void
  lobby: GameType
}) {
  const navigate = useNavigate()

  usePartySocket({
    host: PARTY_KIT_HOST,
    party: 'lobby',
    room: lobby,
    onMessage(event) {
      const message = JSON.parse(event.data) as LobbyMessage

      if (message.type === 'join') {
        navigate(`/${lobby}/${message.game}`)
      }
    },
  })

  const timer = useTimer()

  return (
    <div>
      <p>Waiting for a game - {timer}</p>

      <Button className="mt-3 w-full" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  )
}

function EnsureUsername({ children }: { children: React.ReactNode }) {
  const session = useSession()
  const profile = useQuery(
    supabase
      .from('profiles')
      .select('username')
      .eq('id', session?.user.id as string),
    { enabled: !!session }
  )

  const username = useUsernameStore(state => state.username)

  if (session) {
    return (
      <div className="w-full">
        <p className="mb-3">
          Playing as {profile.data![0].username}.{' '}
          <Button
            variant="link"
            onClick={() => supabase.auth.signOut()}
            className="px-0 text-base"
          >
            Sign Out
          </Button>
        </p>

        {children}
      </div>
    )
  }

  if (username) {
    return (
      <div className="w-full">
        <p className="mb-3">
          Playing as {username}
          {'. '}
          <AuthModal
            variant="signUp"
            trigger={
              <Button variant="link" className="px-0 text-base">
                Sign up to save your stats
              </Button>
            }
          />
        </p>

        {children}
      </div>
    )
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold">Play with an Account</h3>
      <p className="text-xs text-muted-foreground mb-6">
        When you play with an account you can save the stats of your games.
      </p>

      <div className="flex items-center space-x-2">
        <AuthModal
          variant="signIn"
          trigger={<Button className="w-full">Sign In</Button>}
        />
        <AuthModal
          variant="signUp"
          trigger={<Button className="w-full">Sign Up</Button>}
        />
      </div>

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

  const setUsername = useUsernameStore(state => state.setUsername)

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
          Play
        </Button>
      </form>
    </Form>
  )
}

type CharStatus = 'a' | 'c' | 'p' | undefined

type GameRows = Array<Array<CharStatus>>

type DashFrame = { one: GameRows; two: GameRows }

const emptyRow: Array<CharStatus> = Array.from(Array(SOLUTION_SIZE))

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
  const current = useFrame(dashFrames)
  const frame = dashFrames[current]

  return (
    <div className="w-full flex justify-center space-x-2">
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

function useFrame<Frames extends Array<DashFrame>>(frames: Frames) {
  const [current, setCurrent] = React.useState(0)

  React.useEffect(() => {
    let timeout: NodeJS.Timeout

    const tick = () => {
      setCurrent(current => (current === frames.length - 1 ? 0 : current + 1))
      timeout = setTimeout(
        tick,
        current === frames.length - 1 ? 2500 : randomInRange(200, 900)
      )
    }

    timeout = setTimeout(
      tick,
      current === frames.length - 1 ? 2500 : randomInRange(200, 900)
    )

    return () => clearTimeout(timeout)
  }, [frames.length, current])

  return current
}

const randomInRange = (min: number, max: number) =>
  Math.random() * (max - min) + min

function DashGameBoard({
  rows,
  player,
  gameOver,
}: {
  rows: GameRows
  player: 1 | 2
  gameOver?: boolean
}) {
  const statusForChar = {
    a: 'absent',
    p: 'present',
    c: 'correct',
  } as const

  const emoji = player === 1 ? '🏆' : '😔'

  return (
    <div className="p-3">
      <p
        className={cn(
          'mb-2 text-center',
          player === 1
            ? 'text-blue-500 dark:text-blue-400'
            : 'text-red-500 dark:text-red-400'
        )}
      >
        {gameOver ? (
          <>
            {emoji} Player {player} {emoji}
          </>
        ) : (
          <>Player {player}</>
        )}
      </p>

      <div className="grid grid-cols-5 gap-1">
        {rows.flatMap((statuses, row) =>
          statuses.map((status, index) => (
            <Cell
              key={`${row}-${index}`}
              status={status ? statusForChar[status] : undefined}
              className="h-6 w-6 border-2"
            />
          ))
        )}
      </div>
    </div>
  )
}
