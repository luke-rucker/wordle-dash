import { Button } from '@/components/ui/button'
import { PARTY_KIT_HOST } from '@/constants'
import { useTimer } from '@/lib/utils'
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
  usePartySocket({
    host: PARTY_KIT_HOST,
    party: 'lobby',
    room: lobby,
    onMessage(event) {
      const message = JSON.parse(event.data) as LobbyMessage

      if (message.type === 'join') {
        onJoin(`/${lobby}/${message.game}`)
      }
    },
  })

  const timer = useTimer()

  return (
    <div className="w-full">
      <p> Waiting for a game - {timer}</p>

      <Button className="mt-3 w-full" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  )
}
