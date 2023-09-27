import type * as Party from 'partykit/server'
import { createPartyRpc } from 'partyrpc/server'
import { tokens } from './lib/tokens'
import * as Dash from './lib/dash-game'
import { nullable, object, string, length } from 'valibot'
import { attachments } from '@party/lib/attachments'
import { SOLUTION_SIZE } from '@party/lib/constants'
import { MAIN_ROOM } from '@party/main'
import { createSupabaseClient } from '@party/lib/supabase'
import { isValidGuess } from '@party/lib/words/valid-guesses'

type ReadyResponse = { type: 'ready' }

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

type BadGuessResponse = {
  type: 'badGuess'
}

type PartyResponses =
  | ReadyResponse
  | WelcomeResponse
  | FullGameResponse
  | TickResponse
  | GameOverResponse
  | BadGuessResponse

const rpc = createPartyRpc<PartyResponses, Dash.Game>()

export const safeGame = rpc.events({
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

      if (game.isGameOver()) {
        rpc.broadcast(party, {
          type: 'gameOver',
          state: game.gameOver!,
          game: game.players,
        })
      }
    },
  },
  typeGuess: {
    schema: object({
      guess: nullable(string([length(1)])),
    }),
    onMessage(message, ws, party, game) {
      const { userId } = attachments.get(ws)
      if (!userId) return
      if (
        game.players[userId].currentGuess.length === SOLUTION_SIZE &&
        message.guess !== null
      )
        return
      game.typeGuess(userId, message.guess)
      broadcastGame(game, party)
    },
  },
  submitGuess: {
    schema: object({}),
    onMessage(message, ws, party, game) {
      const { userId } = attachments.get(ws)
      if (!userId) return

      if (game.players[userId].currentGuess.length !== SOLUTION_SIZE) return

      if (!isValidGuess(game.players[userId].currentGuess)) {
        return rpc.send(ws, { type: 'badGuess' })
      }

      game.submitGuess(userId)

      if (!game.isGameOver()) {
        broadcastGame(game, party)
      }
    },
  },
})

function broadcastGame(game: Dash.Game, party: Party.Party, skip?: string) {
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

export default class Server implements Party.PartyServer {
  private game?: Dash.Game

  constructor(readonly party: Party.Party) {
    this.party = party
  }

  async onStart() {
    const supabase = createSupabaseClient(this.party.env)
    const { data } = await supabase.rpc('random_solution').throwOnError()

    this.game = new Dash.Game({
      solution: data!,
      onGameOver: () => {
        if (!this.game || !this.game.gameOver) return
        rpc.broadcast(this.party, {
          type: 'gameOver',
          state: this.game.gameOver,
          game: this.game.players,
        })
      },
    })

    rpc.broadcast(this.party, { type: 'ready' })
  }

  async onConnect(
    ws: Party.PartyConnection,
    ctx: Party.PartyConnectionContext
  ) {
    attachments.set(ws, { country: ctx.request.cf?.country as string | null })
    this.updateConnections('connect')
    if (this.game) {
      rpc.send(ws, { type: 'ready' })
    }
  }

  onMessage(message: string | ArrayBuffer, ws: Party.PartyConnection) {
    if (!this.game) return
    safeGame.onMessage(message, ws, this.party, this.game)
  }

  async onClose() {
    await this.updateConnections('disconnect')
  }

  async updateConnections(type: 'connect' | 'disconnect') {
    const mainParty = this.party.context.parties.main
    const mainRoom = mainParty.get(MAIN_ROOM)

    await mainRoom.fetch({
      method: 'POST',
      body: JSON.stringify({
        type,
        gameType: 'dash',
      }),
    })
  }
}
