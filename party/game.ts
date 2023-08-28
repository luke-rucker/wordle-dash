import type {
  PartyKitConnection,
  PartyKitRoom,
  PartyKitServer,
} from 'partykit/server'
import * as v from 'valibot'
import { createPartyRpc } from 'partyrpc/server'
import { createIdToken, verifyIdToken } from './lib/id-tokens'
import { Game, GameState } from './lib/game'

type GameConnection = PartyKitConnection & {
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

const party = createPartyRpc<PartyResponses, Game>()

export const safeGame = party.events({
  ping: {
    schema: v.never(),
    onMessage(message, ws, room, game) {
      party.send(ws, { type: 'pong' })
    },
  },
  whoami: {
    schema: v.object({
      token: v.nullable(v.string()),
      username: v.nullable(v.string()),
    }),
    async onMessage(message, ws: GameConnection, room, game) {
      let userId: string | null = null
      let token: string | undefined

      if (message.token !== null) {
        userId = await verifyIdToken(
          message.token,
          room.env.JWT_SECRET as string
        )
      }

      if (message.token === null || userId === null) {
        const newToken = await createIdToken(room.env.JWT_SECRET as string)
        userId = newToken.userId
        token = newToken.token
      }

      if (game.isFull() && !game.hasPlayer(userId)) {
        return party.send(ws, { type: 'fullGame' })
      }

      ws.userId = userId
      game.addPlayer(userId, message.username)
      party.send(ws, {
        type: 'welcome',
        userId,
        token,
      })
      broadcastGame({ game, room })
    },
  },
  updateUsername: {
    schema: v.object({
      username: v.nullable(v.string()),
    }),
    onMessage(message, ws: GameConnection, room, game) {
      if (!ws.userId) return
      game.setUsername(ws.userId, message.username)
      broadcastGame({ game, room })
    },
  },
  typeGuess: {
    schema: v.object({
      guess: v.nullable(v.string([v.length(1)])),
    }),
    onMessage(message, ws: GameConnection, room, game) {
      if (!ws.userId) return
      game.typeGuess(ws.userId, message.guess)
      broadcastGame({ game, room })
    },
  },
  submitGuess: {
    schema: v.never(),
    onMessage(message, ws: GameConnection, room, game) {
      if (!ws.userId) return
      game.submitGuess(ws.userId)
      broadcastGame({ game, room })
    },
  },
})

function broadcastGame({
  game,
  room,
  skip,
}: {
  game: Game
  room: PartyKitRoom
  skip?: string
}) {
  room.connections.forEach((ws: GameConnection) => {
    if (!ws.userId || ws.userId === skip) return
    const tick: TickResponse = {
      type: 'tick',
      game: game.stateForPlayer(ws.userId),
    }
    ws.send(JSON.stringify(tick))
  })
}

export type SafeGameEvents = typeof safeGame.events
export type SafeGameResponses = typeof safeGame.responses

const game = new Game()

export default {
  async onConnect(ws: GameConnection, room) {
    ws.addEventListener('close', () => {
      if (ws.userId) {
        game.setOnline(ws.userId, false)
        broadcastGame({ game, room })
      }
    })

    ws.addEventListener('message', evt => {
      safeGame.onMessage(evt.data, ws, room, game)
    })
  },
} satisfies PartyKitServer
