import { Icons } from '@/components/icons'
import { SettingsModal } from '@/components/settings-modal'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { PARTY_KIT_HOST } from '@/constants'
import { LobbyMessage, MAIN_LOBBY } from '@party/lobby'
import usePartySocket from 'partysocket/react'
import * as React from 'react'
import { useNavigate } from 'react-router-dom'

export function Landing() {
  const [lobbyOpen, setLobbyOpen] = React.useState(false)

  return (
    <div className="h-full flex flex-col">
      <header className="border-b h-16">
        <div className="flex items-center justify-between h-16 container">
          <div className="flex items-center space-x-1">
            <div
              role="img"
              aria-label="dashing away"
              className="rotate-180 text-xl leading-none"
            >
              💨
            </div>

            <h1 className="text-xl font-bold tracking-tight">Word Dash</h1>
          </div>

          <div className="flex items-center space-x-2">
            <SettingsModal />

            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <div className="flex-grow flex flex-col items-center justify-center">
        <main className="max-w-xl w-full container">
          <h2 className="mb-5 text-5xl font-semibold tracking-tight">
            Wordle, but you{' '}
            <span
              role="img"
              aria-label="dashing away"
              className=" inline-block rotate-180 text-5xl leading-none"
            >
              💨
            </span>{' '}
            race against other people.
          </h2>

          <p className="text-lg text-muted-foreground mb-7">
            Your favorite word game, with a twist. Take the competition out of
            the groupchat and onto the race course.
          </p>

          <div className="flex items-center space-x-4">
            <Button size="lg" onClick={() => setLobbyOpen(true)}>
              Play
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button disabled size="lg" variant="secondary">
                    Play a Friend
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Coming soon :)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {lobbyOpen ? <LobbyModal onOpenChange={setLobbyOpen} /> : null}
        </main>
      </div>
    </div>
  )
}

function LobbyModal({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void
}) {
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

  const pet = localStorage.getItem('pet') ?? 'cat'

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>You're in line</DialogTitle>
          <DialogDescription>
            We're waiting for another player to match you with. Once somebody
            joins, you'll be placed into a game.
          </DialogDescription>
        </DialogHeader>

        <img
          width={500}
          height={300}
          className="w-full h-auto object-cover rounded-md"
          src={`https://source.unsplash.com/random/500x300/?orientation=landscape&${pet}&nonce=${Date.now()}`}
        />

        <p>
          While you're waiting, enjoy this {pet} picture{' '}
          {pet === 'dog' ? (
            <span role="img" aria-label="dog face" className="leading-none">
              🐶
            </span>
          ) : (
            <span role="img" aria-label="grinning cat" className="leading-none">
              😺
            </span>
          )}
          {'. '}
          If you're tired of waiting, share us with your friends!
        </p>

        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>

          <Button
            onClick={() => {
              navigator
                .share({
                  title: 'Word Dash',
                  text: "You've been invited to play Word Dash. Think Wordle, but you race against other people.",
                  url: window.location.href,
                })
                .catch(() => {})
            }}
          >
            <Icons.Share className="mr-2 w-4 h-4" />
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
