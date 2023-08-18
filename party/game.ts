import type { PartyKitConnection, PartyKitServer } from 'partykit/server'
import * as v from 'valibot'
import { createPartyRpc } from 'partyrpc/server'
import { createIdToken, verifyIdToken } from './lib/id-tokens'
import { Game } from './lib/game'

type GameConnection = PartyKitConnection & {
  userId?: string
}

type YouAreResponse = {
  type: 'youAre'
  userId: string
  token?: string
}

type FullGameResponse = { type: 'fullGame' }

type PartyResponses = YouAreResponse | FullGameResponse

const party = createPartyRpc<PartyResponses, Game>()

export const safeGame = party.events({
  whoami: {
    schema: v.object({ token: v.nullable(v.string()) }),
    async onMessage(message, ws: GameConnection, room, game) {
      if (game.isFull()) {
        return party.send(ws, { type: 'fullGame' })
      }

      if (message.token !== null) {
        const userId = await verifyIdToken(
          message.token,
          room.env.JWT_SECRET as string
        )

        if (userId) {
          ws.userId = userId
          game.addPlayer(userId)
          return party.send(ws, { type: 'youAre', userId })
        }
      }

      const { userId, token } = await createIdToken(
        room.env.JWT_SECRET as string
      )
      ws.userId = userId
      game.addPlayer(userId)
      party.send(ws, { type: 'youAre', userId, token })
    },
  },
  submitGuess: {
    schema: v.string(),
    onMessage(message, ws, room, ctx) {},
  },
})

export type SafeGameEvents = typeof safeGame.events
export type SafeGameResponses = typeof safeGame.responses

const game = new Game()

export default {
  async onConnect(ws, room) {
    ws.addEventListener('message', evt => {
      safeGame.onMessage(evt.data, ws, room, game)
    })
  },
} satisfies PartyKitServer
