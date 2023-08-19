import { Icons } from '@/components/icons'
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
              className="rotate-180 text-xl leading-4"
            >
              💨
            </div>

            <h1 className="text-xl font-bold tracking-tight">Word Dash</h1>
          </div>

          <ThemeSwitcher />
        </div>
      </header>

      <div className="flex-grow flex flex-col items-center justify-center">
        <main className="max-w-md w-full container">
          <div className="flex items-center space-x-3 mb-5">
            <div
              role="img"
              aria-label="dashing away"
              className="rotate-180 text-5xl leading-4"
            >
              💨
            </div>

            <h2 className="text-5xl font-semibold tracking-tight">Word Dash</h2>
          </div>

          <p className="text-lg text-muted-foreground mb-7">
            Wordle, but you race against other people.
          </p>

          <div className="flex items-center space-x-4">
            <Button size="lg" onClick={() => setLobbyOpen(true)}>
              Play
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
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

          <LobbyModal open={lobbyOpen} onOpenChange={setLobbyOpen} />
        </main>
      </div>
    </div>
  )
}

function LobbyModal({
  open,
  onOpenChange,
}: {
  open: boolean
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          className="w-full h-auto object-cover"
          src="https://source.unsplash.com/random/500x300/?orientation=landscape&cat"
        />

        <p>
          While you're waiting, enjoy this cat picture :) If you're tired of
          waiting, share us with your friends!
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
                .catch()
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
