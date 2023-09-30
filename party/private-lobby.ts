import type * as Party from 'partykit/server'
import type { TimeToGuess } from '@party/lib/dash-game'
import { createPartyRpc } from 'partyrpc/server'
import { enumType, object } from 'valibot'
import { uid } from 'uid/secure'
import { GameType } from '@party/lobby'

export type ReadyResponse = {
  type: 'ready'
  gameId: string
  gameType: GameType
}

type PartyResponses = ReadyResponse

type Lobby = {
  gameType: GameType
  timeToGuess: TimeToGuess
}

const rpc = createPartyRpc<PartyResponses, Lobby>()

export const safeLobby = rpc.events({
  setTimeToGuess: {
    schema: object({
      timeToGuess: enumType(['30', '60', '8']),
    }),
    onMessage(message, ws, party, lobby) {
      lobby.timeToGuess = parseInt(message.timeToGuess, 10) as TimeToGuess
    },
  },
})

export type SafeLobbyEvents = typeof safeLobby.events
export type SafeLobbyResponses = typeof safeLobby.responses

export default class Server implements Party.PartyServer {
  private lobby: Lobby

  constructor(readonly party: Party.Party) {
    this.party = party
    this.lobby = { timeToGuess: 30, gameType: 'coop' }
  }

  onMessage(message: string | ArrayBuffer, ws: Party.Connection) {
    safeLobby.onMessage(message, ws, this.party, this.lobby)
  }

  async onRequest(req: Party.Request) {
    if (req.method === 'POST') {
      const connected = [...this.party.getConnections()].length

      if (connected !== 1) {
        return new Response(undefined, {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        })
      }

      const gameId = uid(6)
      const gameParty = this.party.context.parties[`${this.lobby.gameType}Game`]
      const gameRoom = gameParty.get(gameId)

      await gameRoom.fetch({
        method: 'POST',
        body: JSON.stringify({
          timeToGuess: this.lobby.timeToGuess,
        }),
      })

      const ready: ReadyResponse = {
        type: 'ready',
        gameId,
        gameType: this.lobby.gameType,
      }

      rpc.broadcast(this.party, ready)

      return new Response(JSON.stringify(ready), {
        headers: {
          'content-type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    return new Response(undefined, { status: 204 })
  }

  onConnect(ws: Party.Connection, ctx: Party.ConnectionContext) {
    const gameType =
      new URL(ctx.request.url).searchParams.get('gameType') ?? 'coop'
    this.lobby.gameType = gameType as GameType
  }
}
