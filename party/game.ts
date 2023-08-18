import type { PartyKitConnection, PartyKitServer } from 'partykit/server'
import * as v from 'valibot'
import { createPartyRpc } from 'partyrpc/server'
import { randomSolution } from './lib/words/solutions'
import { createIdToken, verifyIdToken } from './lib/id-tokens'

type GameConnection = PartyKitConnection & {
  userId?: string
}

type PlayerState = {
  guesses: Array<string>
}

type Context = { solution: string; players: Record<string, PlayerState> }

type YouAreResponse = {
  type: 'youAre'
  userId: string
  token?: string
}

type FullGameResponse = { type: 'fullGame' }

type PartyResponses = YouAreResponse | FullGameResponse

const party = createPartyRpc<PartyResponses, Context>()

export const safeGame = party.events({
  whoami: {
    schema: v.object({ token: v.nullable(v.string()) }),
    async onMessage(message, ws: GameConnection, room, ctx) {
      if (Object.keys(ctx.players).length >= 2) {
        return party.send(ws, { type: 'fullGame' })
      }

      if (message.token !== null) {
        const userId = await verifyIdToken(
          message.token,
          room.env.JWT_SECRET as string
        )

        if (userId) {
          ws.userId = userId
          return party.send(ws, { type: 'youAre', userId })
        }
      }

      const { userId, token } = await createIdToken(
        room.env.JWT_SECRET as string
      )
      ws.userId = userId
      party.send(ws, { type: 'youAre', userId, token })
    },
  },
})

export type SafeGameEvents = typeof safeGame.events
export type SafeGameResponses = typeof safeGame.responses

const context: Context = {
  solution: randomSolution(),
  players: {},
}

export default {
  async onConnect(ws, room) {
    ws.addEventListener('message', evt => {
      safeGame.onMessage(evt.data, ws, room, context)
    })
  },
} satisfies PartyKitServer
