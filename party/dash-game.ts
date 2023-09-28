import type * as Party from 'partykit/server'
import { createPartyRpc } from 'partyrpc/server'
import { User, tokens } from './lib/tokens'
import * as Dash from './lib/dash-game'
import { nullable, object, string, length } from 'valibot'
import { attachments } from '@party/lib/attachments'
import { SOLUTION_SIZE } from '@party/lib/constants'
import { MAIN_ROOM } from '@party/main'
import { type Supabase, createSupabaseClient } from '@party/lib/supabase'
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
      let user: User | null = null
      let token: string | undefined

      if (message.token !== null) {
        user = await tokens.verify(
          message.token,
          party.env.JWT_SECRET as string
        )
      }

      if (user === null) {
        const issued = await tokens.issue(party.env.JWT_SECRET as string)
        user = issued.user
        token = issued.token
      }

      if (game.isFull() && !game.hasPlayer(user.id)) {
        return rpc.send(ws, { type: 'fullGame' })
      }

      attachments.set(ws, { user })
      game.addPlayer({
        ...user,
        username: message.username,
        country: attachments.get(ws).country,
      })
      rpc.send(ws, {
        type: 'welcome',
        userId: user.id,
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
      const { user } = attachments.get(ws)
      if (!user) return
      if (
        game.players[user.id].currentGuess.length === SOLUTION_SIZE &&
        message.guess !== null
      )
        return
      game.typeGuess(user.id, message.guess)
      broadcastGame(game, party)
    },
  },
  submitGuess: {
    schema: object({}),
    onMessage(message, ws, party, game) {
      const { user } = attachments.get(ws)
      if (!user) return

      if (game.players[user.id].currentGuess.length !== SOLUTION_SIZE) return

      if (!isValidGuess(game.players[user.id].currentGuess)) {
        return rpc.send(ws, { type: 'badGuess' })
      }

      game.submitGuess(user.id)

      if (!game.isGameOver()) {
        broadcastGame(game, party)
      }
    },
  },
})

function broadcastGame(game: Dash.Game, party: Party.Party, skip?: string) {
  for (const ws of party.getConnections()) {
    const { user } = attachments.get(ws)
    if (!user || user.id === skip) return
    rpc.send(ws, {
      type: 'tick',
      game: game.stateForPlayer(user.id),
    })
  }
}

export type SafeGameEvents = typeof safeGame.events
export type SafeGameResponses = typeof safeGame.responses

export default class Server implements Party.PartyServer {
  private game?: Dash.Game

  private supabase: Supabase

  constructor(readonly party: Party.Party) {
    this.party = party
    this.supabase = createSupabaseClient(this.party.env)
  }

  async onStart() {
    const { data } = await this.supabase.rpc('random_solution').throwOnError()

    this.game = new Dash.Game({
      solution: data!,
      onGameOver: () => {
        if (!this.game || !this.game.gameOver) return

        this.updateStats().catch(err => console.log(err))

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
    const country =
      new URL(ctx.request.url).searchParams.get('country') ??
      (ctx.request.cf?.country as string | null)

    attachments.set(ws, { country })
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

  private async updateConnections(type: 'connect' | 'disconnect') {
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

  private async updateStats() {
    const gameOver = this.game?.gameOver
    if (!this.game || !gameOver) return

    if (gameOver.type === 'win') {
      const winner = gameOver.playerId
      const loser = Object.keys(this.game.players).filter(
        player => player !== winner
      )[0]

      await Promise.all([
        this.game.players[winner].type === 'verified'
          ? this.supabase
              .rpc('set_win', { user_id: winner, game_type: false })
              .throwOnError()
          : Promise.resolve(),
        loser && this.game.players[loser].type === 'verified'
          ? this.supabase
              .rpc('set_loss', { user_id: winner, game_type: false })
              .throwOnError()
          : Promise.resolve(),
      ])
    } else if (gameOver.type === 'timeLimit') {
      const loser = gameOver.playerId
      const winner = Object.keys(this.game.players).filter(
        player => player !== loser
      )[0]

      await Promise.all([
        winner && this.game.players[winner].type === 'verified'
          ? this.supabase
              .rpc('set_win', { user_id: winner, game_type: false })
              .throwOnError()
          : Promise.resolve(),
        this.game.players[loser].type === 'verified'
          ? this.supabase
              .rpc('set_loss', { user_id: winner, game_type: false })
              .throwOnError()
          : Promise.resolve(),
      ])
    }
  }
}
