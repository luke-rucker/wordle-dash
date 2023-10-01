import { Button } from '@/components/ui/button'
import { PARTY_KIT_HOST } from '@/constants'
import { useTimer } from '@/lib/utils'
import * as React from 'react'
import type { GameType, LobbyMessage } from '@party/lobby'
import usePartySocket from 'partysocket/react'

export function Waiting({
  onCancel,
  onJoin,
  lobby,
}: {
  onCancel: () => void
  onJoin: (gameUrl: string) => void
  lobby: GameType
}) {
  const [waiting, setWaiting] = React.useState(false)

  usePartySocket({
    host: PARTY_KIT_HOST,
    party: 'lobby',
    room: lobby,
    onOpen() {
      setWaiting(true)
    },
    onMessage(event) {
      const message = JSON.parse(event.data) as LobbyMessage

      if (message.type === 'join') {
        onJoin(`/${lobby}/${message.game}`)
      }
    },
  })

  return (
    <div className="w-full">
      <p className="text-center sm:text-left">
        Waiting for a game - {waiting ? <Timer /> : 'Connecting...'}
      </p>

      <Button className="mt-3 w-full" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  )
}

function Timer() {
  const timer = useTimer()

  return timer
}
