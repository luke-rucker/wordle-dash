import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { PARTY_KIT_HOST } from '@/constants'
import { usePet } from '@/stores/settings-store'
import { MAIN_LOBBY, LobbyMessage } from '@party/lobby'
import usePartySocket from 'partysocket/react'
import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'

export function Lobby() {
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

  const pet = usePet()

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
