import { Icons } from '@/components/icons'
import {
  AlertDialogHeader,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Form,
} from '@/components/ui/form'
import { PARTY_KIT_HOST } from '@/constants'
import { useUsernameStore } from '@/stores/username-store'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { MAIN_LOBBY, LobbyMessage } from '@party/lobby'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { useSession } from '@supabase/auth-helpers-react'
import usePartySocket from 'partysocket/react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Output, maxLength, minLength, object, string } from 'valibot'
import { Input } from '@/components/ui/input'

export function Lobby() {
  const [completedUsername, setCompletedUsername] = React.useState(false)
  const session = useSession()

  return session || completedUsername ? (
    <WaitingRoom />
  ) : (
    <AnonUserDialog onComplete={() => setCompletedUsername(true)} />
  )
}

const anonUserSchema = object({
  username: string('A username is required', [
    minLength(3, 'Needs to be at least 3 characters'),
    maxLength(24, 'Cannot be more than 24 characters'),
  ]),
})

type CompleteProfileData = Output<typeof anonUserSchema>

function AnonUserDialog({ onComplete }: { onComplete: () => void }) {
  const username = useUsernameStore(state => state.username)
  const setUsername = useUsernameStore(state => state.setUsername)

  const form = useForm<CompleteProfileData>({
    resolver: valibotResolver(anonUserSchema),
    values: {
      username: username ?? '',
    },
  })

  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Pick a username</AlertDialogTitle>
          <AlertDialogDescription>
            You need to pick a username. This is what you will be known by to
            other users.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form
            id="anonUser"
            onSubmit={form.handleSubmit(data => {
              setUsername(data.username)
              onComplete()
            })}
            className="space-y-8"
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
                  <FormDescription>
                    This is your public display name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <AlertDialogFooter>
          <AlertDialogAction type="submit" form="anonUser">
            Save
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function WaitingRoom() {
  const navigate = useNavigate()

  usePartySocket({
    host: PARTY_KIT_HOST,
    party: 'lobby',
    room: MAIN_LOBBY,
    onMessage(event) {
      const message = JSON.parse(event.data) as LobbyMessage

      if (message.type === 'join') {
        navigate(`/game/${message.game}`)
      }
    },
  })

  const pet = 'dog'

  return (
    <div className="flex-grow flex flex-col items-center justify-center">
      <Card className="max-w-xl w-full">
        <CardHeader>
          <CardTitle>
            Waiting for a game - <Timer />
          </CardTitle>
          <CardDescription>
            We're waiting for another player to match you with. Once somebody
            joins, you'll be placed into a game.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <img
            width={800}
            height={600}
            className="w-full h-auto object-center rounded-md mb-4"
            src={`https://source.unsplash.com/random/800x600/?orientation=landscape&${pet}&nonce=${Date.now()}`}
          />

          <p>
            While you're waiting, enjoy this {pet} picture{' '}
            {pet === 'dog' ? (
              <span role="img" aria-label="dog face" className="leading-none">
                🐶
              </span>
            ) : (
              <span
                role="img"
                aria-label="grinning cat"
                className="leading-none"
              >
                😺
              </span>
            )}
            {'. '}
            If you're tired of waiting, share us with your friends!
          </p>
        </CardContent>

        <CardFooter className="justify-between">
          <Button variant="secondary" asChild>
            <Link to="/">Cancel</Link>
          </Button>

          <Button
            onClick={async () => {
              try {
                await navigator.share({
                  title: 'Wordle Dash',
                  text: "You've been invited to play Wordle Dash. Think Wordle, but you race against other people.",
                  url: window.location.href,
                })
              } catch (err) {
                await navigator.clipboard
                  .writeText(`Play Wordle dash ${window.location.href}`)
                  .catch(() => {})
              }
            }}
          >
            <Icons.Share className="mr-2 w-4 h-4" />
            Share
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

function Timer() {
  const [seconds, setSeconds] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => setSeconds(seconds => seconds + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const date = new Date(0)
  date.setSeconds(seconds)

  return <span>{date.toISOString().substring(14, 19)}</span>
}
