import type { PartyConnection, Party, PartyKitServer } from 'partykit/server'
import * as v from 'valibot'
import { createPartyRpc } from 'partyrpc/server'
import { tokens } from './lib/tokens'
import { Game, GameState } from './lib/game'

type GameConnection = PartyConnection & {
  userId?: string
}

type WelcomeResponse = {
  type: 'welcome'
  userId: string
  token?: string
}

type FullGameResponse = { type: 'fullGame' }

type TickResponse = { type: 'tick'; game: GameState }

type PongResponse = { type: 'pong' }

type PartyResponses =
  | WelcomeResponse
  | FullGameResponse
  | PongResponse
  | TickResponse

const rpc = createPartyRpc<PartyResponses, Game>()

export const safeGame = rpc.events({
  ping: {
    schema: v.optional(v.string()),
    onMessage(message, ws, party, game) {
      rpc.send(ws, { type: 'pong' })
    },
  },
  whoami: {
    schema: v.object({
      token: v.nullable(v.string()),
      username: v.nullable(v.string()),
    }),
    async onMessage(message, ws: GameConnection, party, game) {
      let userId: string | null = null
      let token: string | undefined

      if (message.token !== null) {
        userId = await tokens.verify(
          message.token,
          party.env.JWT_SECRET as string
        )
      }

      if (message.token === null || userId === null) {
        const newToken = await tokens.issue(party.env.JWT_SECRET as string)
        userId = newToken.userId
        token = newToken.token
      }

      if (game.isFull() && !game.hasPlayer(userId)) {
        return rpc.send(ws, { type: 'fullGame' })
      }

      ws.userId = userId
      game.addPlayer(userId, message.username)
      rpc.send(ws, {
        type: 'welcome',
        userId,
        token,
      })
      broadcastGame({ game, party })
    },
  },
  updateUsername: {
    schema: v.object({
      username: v.nullable(v.string()),
    }),
    onMessage(message, ws: GameConnection, party, game) {
      if (!ws.userId) return
      game.setUsername(ws.userId, message.username)
      broadcastGame({ game, party })
    },
  },
  typeGuess: {
    schema: v.object({
      guess: v.nullable(v.string([v.length(1)])),
    }),
    onMessage(message, ws: GameConnection, party, game) {
      if (!ws.userId) return
      game.typeGuess(ws.userId, message.guess)
      broadcastGame({ game, party })
    },
  },
  submitGuess: {
    schema: v.object({}),
    onMessage(message, ws: GameConnection, party, game) {
      if (!ws.userId) return
      game.submitGuess(ws.userId)
      broadcastGame({ game, party })
    },
  },
})

function broadcastGame({
  game,
  party,
  skip,
}: {
  game: Game
  party: Party
  skip?: string
}) {
  for (const conn of party.getConnections()) {
    const ws = conn as GameConnection
    if (!ws.userId || ws.userId === skip) return
    const tick: TickResponse = {
      type: 'tick',
      game: game.stateForPlayer(ws.userId),
    }
    ws.send(JSON.stringify(tick))
  }
}

export type SafeGameEvents = typeof safeGame.events
export type SafeGameResponses = typeof safeGame.responses

const game = new Game()

export default {
  async onConnect(ws: GameConnection, party) {
    ws.addEventListener('close', () => {
      if (ws.userId) {
        game.setOnline(ws.userId, false)
        broadcastGame({ game, party })
      }
    })

    ws.addEventListener('message', evt => {
      safeGame.onMessage(evt.data, ws, party, game)
    })
  },
} satisfies PartyKitServer
