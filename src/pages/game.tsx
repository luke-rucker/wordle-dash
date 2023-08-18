import { PARTY_KIT_HOST } from '@/constants'
import { createPartyClient } from 'partyrpc/client'
import { createPartyHooks } from 'partyrpc/react'
import type { SafeGameEvents, SafeGameResponses } from '@party/game'
import * as React from 'react'
import usePartySocket from 'partysocket/react'
import { useNavigate, useParams } from 'react-router-dom'

export function Game() {
  const { gameId } = useParams()

  const [userId, setUserId] = React.useState<string | null>(null)

  const socket = usePartySocket({
    host: PARTY_KIT_HOST,
    party: 'game',
    room: gameId!,
  })

  const client = createPartyClient<SafeGameEvents, SafeGameResponses>(socket, {
    debug: true,
  })
  const { usePartyMessage, useSocketEvent } = createPartyHooks(client)

  useSocketEvent('open', () => {
    client.send({ type: 'whoami', token: sessionStorage.getItem('token') })
  })

  usePartyMessage('youAre', ({ token, userId }) => {
    setUserId(userId)
    if (token) sessionStorage.setItem('token', token)
  })

  const navigate = useNavigate()

  usePartyMessage('fullGame', () => {
    navigate('/', { state: { fullGame: true } })
  })

  return (
    <>
      <h1>game {gameId}</h1>
      <p>userId: {userId}</p>
    </>
  )
}
