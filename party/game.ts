import type * as Party from 'partykit/server'
import { createPartyRpc } from 'partyrpc/server'
import { tokens } from './lib/tokens'
import { GameOverState, Game, GameState } from './lib/game'
import { nullable, object, optional, string, length } from 'valibot'
import { attachments } from '@party/lib/attachments'

type WelcomeResponse = {
  type: 'welcome'
  userId: string
  token?: string
}

type FullGameResponse = { type: 'fullGame' }

type TickResponse = {
  type: 'tick'
  game: GameState
}

type GameOverResponse = {
  type: 'gameOver'
  state: GameOverState
  game: Game['players']
}

type PongResponse = { type: 'pong' }

type PartyResponses =
  | WelcomeResponse
  | FullGameResponse
  | PongResponse
  | TickResponse
  | GameOverResponse

const rpc = createPartyRpc<PartyResponses, Game>()

export const safeGame = rpc.events({
  ping: {
    schema: optional(string()),
    onMessage(message, ws, party, game) {
      rpc.send(ws, { type: 'pong' })
    },
  },
  whoami: {
    schema: object({
      token: nullable(string()),
      username: nullable(string()),
    }),
    async onMessage(message, ws, party, game) {
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

      attachments.set(ws, { userId })
      game.addPlayer(userId, message.username)
      rpc.send(ws, {
        type: 'welcome',
        userId,
        token,
      })
      broadcastGame(game, party)
    },
  },
  updateUsername: {
    schema: object({
      username: nullable(string()),
    }),
    onMessage(message, ws, party, game) {
      const { userId } = attachments.get(ws)
      if (!userId) return
      game.setUsername(userId, message.username)
      broadcastGame(game, party)
    },
  },
  typeGuess: {
    schema: object({
      guess: nullable(string([length(1)])),
    }),
    onMessage(message, ws, party, game) {
      const { userId } = attachments.get(ws)
      if (!userId) return
      game.typeGuess(userId, message.guess)
      broadcastGame(game, party)
    },
  },
  submitGuess: {
    schema: object({}),
    onMessage(message, ws, party, game) {
      const { userId } = attachments.get(ws)
      if (!userId) return

      game.submitGuess(userId)
      const gameOver = game.computeGameOver()

      if (gameOver) {
        rpc.broadcast(party, {
          type: 'gameOver',
          state: gameOver,
          game: game.players,
        })
      } else {
        broadcastGame(game, party)
      }
    },
  },
})

function broadcastGame(game: Game, party: Party.Party, skip?: string) {
  for (const ws of party.getConnections()) {
    const { userId } = attachments.get(ws)
    if (!userId || userId === skip) return
    rpc.send(ws, {
      type: 'tick',
      game: game.stateForPlayer(userId),
    })
  }
}

export type SafeGameEvents = typeof safeGame.events
export type SafeGameResponses = typeof safeGame.responses

const game = new Game()

export default class Server implements Party.PartyServer {
  constructor(readonly party: Party.Party) {
    this.party = party
  }

  onMessage(message: string | ArrayBuffer, ws: Party.PartyConnection) {
    safeGame.onMessage(message, ws, this.party, game)
  }
}
