import usePartySocket from 'partysocket/react'
import { LobbyMessage, MAIN_LOBBY } from '@party/lobby'
import { PARTY_KIT_HOST } from '@/constants'
import { useNavigate } from 'react-router-dom'

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

  return <h1>Lobby</h1>
}
