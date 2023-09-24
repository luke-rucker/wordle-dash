import type * as Party from 'partykit/server'
import { createPartyRpc } from 'partyrpc/server'
import { tokens } from './lib/tokens'
import * as Dash from './lib/dash-game'
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
  game: Dash.GameState
}

type GameOverResponse = {
  type: 'gameOver'
  state: Dash.GameOverState
  game: Dash.Game['players']
}

type PongResponse = { type: 'pong' }

type PartyResponses =
  | WelcomeResponse
  | FullGameResponse
  | PongResponse
  | TickResponse
  | GameOverResponse

const rpc = createPartyRpc<PartyResponses, Dash.Game>()

export const safeGame = rpc.events({
  ping: {
    schema: optional(string()),
    onMessage(message, ws, party, game) {
      rpc.send(ws, { type: 'pong' })
    },
  },
  knockKnock: {
    schema: object({
      token: nullable(string()),
      username: string(),
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

      if (userId === null) {
        const newToken = await tokens.issue(party.env.JWT_SECRET as string)
        userId = newToken.userId
        token = newToken.token
      }

      if (game.isFull() && !game.hasPlayer(userId)) {
        return rpc.send(ws, { type: 'fullGame' })
      }

      attachments.set(ws, { userId })
      game.addPlayer(userId, message.username, attachments.get(ws).country)
      rpc.send(ws, {
        type: 'welcome',
        userId,
        token,
      })
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

function broadcastGame(game: Dash.Game, party: Party.Party, skip?: string) {
  for (const ws of party.getConnections()) {
    const { userId } = attachments.get(ws)
    console.log(userId)
    if (!userId || userId === skip) return
    rpc.send(ws, {
      type: 'tick',
      game: game.stateForPlayer(userId),
    })
  }
}

export type SafeGameEvents = typeof safeGame.events
export type SafeGameResponses = typeof safeGame.responses

export default class Server implements Party.PartyServer {
  private game?: Dash.Game

  constructor(readonly party: Party.Party) {
    this.party = party
  }

  onStart() {
    this.game = new Dash.Game()
  }

  onConnect(ws: Party.PartyConnection, ctx: Party.PartyConnectionContext) {
    attachments.set(ws, { country: ctx.request.cf?.country as string | null })
  }

  onMessage(message: string | ArrayBuffer, ws: Party.PartyConnection) {
    safeGame.onMessage(message, ws, this.party, this.game!)
  }
}
