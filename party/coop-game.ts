import type * as Party from 'partykit/server'
import { createPartyRpc } from 'partyrpc/server'
import { User, tokens } from './lib/tokens'
import * as Coop from './lib/coop-game'
import { nullable, object, string, length } from 'valibot'
import { attachments } from '@party/lib/attachments'
import { SOLUTION_SIZE } from '@party/lib/constants'
import { MAIN_ROOM } from '@party/main'
import { type Supabase, createSupabaseClient } from '@party/lib/supabase'
import { isValidGuess } from '@party/lib/words/valid-guesses'
import { TimeToGuess } from '@party/lib/shared'
import { PlayAgain, PlayAgainState } from '@party/lib/play-again'
import { uid } from 'uid/secure'

type ReadyResponse = { type: 'ready' }

type WelcomeResponse = {
  type: 'welcome'
  userId: string
  token?: string
}

type FullGameResponse = { type: 'fullGame' }

type TickResponse = {
  type: 'tick'
  game: Coop.GameState
}

type GameOverResponse = {
  type: 'gameOver'
  state: Coop.GameOverState
  game: Coop.Game['players']
}

type BadGuessResponse = {
  type: 'badGuess'
}

type PlayAgainResponse = {
  type: 'playAgain'
  playAgain: PlayAgainState
}

type NewGameResponse = {
  type: 'newGame'
  gameId: string
}

type GoHomeResponse = { type: 'goHome' }

type PartyResponses =
  | ReadyResponse
  | WelcomeResponse
  | FullGameResponse
  | TickResponse
  | GameOverResponse
  | BadGuessResponse
  | PlayAgainResponse
  | NewGameResponse
  | GoHomeResponse

type Context = { game: Coop.Game; playAgain: PlayAgain }

const rpc = createPartyRpc<PartyResponses, Context>()

export const safeGame = rpc.events({
  knockKnock: {
    schema: object({
      token: nullable(string()),
      username: string(),
    }),
    async onMessage(message, ws, party, { game, playAgain }) {
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

      if (playAgain.someoneWantsTo()) {
        rpc.broadcast(party, {
          type: 'playAgain',
          playAgain: playAgain.players,
        })
      }
    },
  },
  typeGuess: {
    schema: object({
      guess: nullable(string([length(1)])),
    }),
    onMessage(message, ws, party, { game }) {
      const { user } = attachments.get(ws)
      if (!user) return
      if (game.currentTurn !== user.id) return
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
    onMessage(message, ws, party, { game }) {
      const { user } = attachments.get(ws)
      if (!user) return

      if (game.currentTurn !== user.id) return
      if (game.players[user.id].currentGuess.length !== SOLUTION_SIZE) return

      if (!isValidGuess(game.players[user.id].currentGuess)) {
        return rpc.send(ws, { type: 'badGuess' })
      }

      game.submitGuess(user.id)
      broadcastGame(game, party)
    },
  },
  playAgain: {
    schema: object({}),
    async onMessage(message, ws, party, { game, playAgain }) {
      const { user } = attachments.get(ws)
      if (!user) return
      if (!game.isGameOver() || !game.isFull()) return

      if ([...party.getConnections()].length < 2) {
        return rpc.broadcast(party, { type: 'goHome' })
      }

      playAgain.agree(user.id)

      if (playAgain.everyoneWantsTo()) {
        const gameId = uid(6)
        const gameParty = party.context.parties.coopGame
        const gameRoom = gameParty.get(gameId)

        const timeToGuess = game.timeToGuess ? game.timeToGuess : 8

        await gameRoom.fetch({
          method: 'POST',
          body: JSON.stringify({
            timeToGuess,
          }),
        })

        rpc.broadcast(party, {
          type: 'newGame',
          gameId,
        })
      } else {
        rpc.broadcast(party, {
          type: 'playAgain',
          playAgain: playAgain.players,
        })
      }
    },
  },
})

function broadcastGame(game: Coop.Game, party: Party.Party) {
  for (const ws of party.getConnections()) {
    const { user } = attachments.get(ws)
    if (!user) return
    rpc.send(ws, {
      type: 'tick',
      game: game.stateForPlayer(user.id),
    })
  }
}

export type SafeCoopEvents = typeof safeGame.events
export type SafeCoopResponses = typeof safeGame.responses

export default class Server implements Party.Server {
  private game?: Coop.Game

  private playAgain?: PlayAgain

  private supabase: Supabase

  constructor(readonly party: Party.Party) {
    this.party = party
    this.supabase = createSupabaseClient(this.party.env)
  }

  async onStart() {
    await this.setupGame()
    rpc.broadcast(this.party, { type: 'ready' })
  }

  async onRequest(req: Party.Request) {
    if (req.method === 'POST') {
      if (!this.game) return new Response(undefined, { status: 204 })

      const init = (await req.json()) as {
        timeToGuess: TimeToGuess
      }

      this.game.timeToGuess = init.timeToGuess
    }

    return new Response(undefined, { status: 204 })
  }

  async onConnect(ws: Party.Connection, ctx: Party.ConnectionContext) {
    const country =
      new URL(ctx.request.url).searchParams.get('country') ??
      (ctx.request.cf?.country as string | null)

    attachments.set(ws, { country })
    this.updateConnections('connect')

    if (this.game) {
      rpc.send(ws, { type: 'ready' })
    }
  }

  onMessage(message: string | ArrayBuffer, ws: Party.Connection) {
    if (!this.game || !this.playAgain) return
    safeGame.onMessage(message, ws, this.party, {
      game: this.game,
      playAgain: this.playAgain,
    })
  }

  async onClose() {
    if (this.playAgain && this.playAgain.someoneWantsTo()) {
      rpc.broadcast(this.party, { type: 'goHome' })
    }

    await this.updateConnections('disconnect').catch(err => console.log(err))
  }

  private async updateConnections(type: 'connect' | 'disconnect') {
    const mainParty = this.party.context.parties.main
    const mainRoom = mainParty.get(MAIN_ROOM)

    await mainRoom.fetch({
      method: 'POST',
      body: JSON.stringify({
        type,
        gameType: 'coop',
      }),
    })
  }

  private async setupGame() {
    const { data } = await this.supabase.rpc('random_solution').throwOnError()
    if (!data) throw new Error('no solution returned')

    this.game = new Coop.Game({
      solution: data[0],
      onGameOver: () => this.handleGameOver(),
    })
    this.playAgain = new PlayAgain({ expectedPlayers: 2 })
  }

  private async handleGameOver() {
    if (!this.game || !this.game.gameOver) return

    await this.updateStats().catch(err => console.log(err))

    rpc.broadcast(this.party, {
      type: 'gameOver',
      state: this.game.gameOver,
      game: this.game.players,
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
              .rpc('set_win', { user_id: winner, game_type: true })
              .throwOnError()
          : Promise.resolve(),
        loser && this.game.players[loser].type === 'verified'
          ? this.supabase
              .rpc('set_loss', { user_id: loser, game_type: true })
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
              .rpc('set_win', { user_id: winner, game_type: true })
              .throwOnError()
          : Promise.resolve(),
        this.game.players[loser].type === 'verified'
          ? this.supabase
              .rpc('set_loss', { user_id: loser, game_type: true })
              .throwOnError()
          : Promise.resolve(),
      ])
    }
  }
}
