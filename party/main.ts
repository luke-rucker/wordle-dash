import type { GameType } from '@party/lobby'
import type * as Party from 'partykit/server'

export const MAIN_ROOM = 'main'

export type SyncConnections = {
  type: 'sync'
  coop: number
  dash: number
}

export type ConnectionUpdate = {
  type: 'update'
  game: GameType
  count: number
}

export type MainMessage = SyncConnections | ConnectionUpdate

export default class Server implements Party.PartyKitServer {
  dash?: number

  coop?: number

  options: Party.PartyServerOptions = {
    hibernate: true,
  }

  constructor(readonly party: Party.Party) {
    this.party = party
  }

  async onConnect(ws: Party.PartyConnection) {
    this.dash = this.dash ?? (await this.party.storage.get('dash')) ?? 0
    this.coop = this.coop ?? (await this.party.storage.get('coop')) ?? 0

    ws.send(
      JSON.stringify(<SyncConnections>{
        type: 'sync',
        dash: this.dash,
        coop: this.coop,
      })
    )
  }

  async onRequest(request: Party.PartyRequest) {
    if (request.method === 'POST') {
      const update = (await request.json()) as {
        type: 'connect' | 'disconnect'
        gameType: GameType
      }

      if (update.gameType === 'dash') {
        this.dash = this.dash ?? (await this.party.storage.get('dash')) ?? 0
        if (update.type === 'connect') this.dash += 1
        if (update.type === 'disconnect') this.dash = Math.max(0, this.dash - 1)
        this.party.broadcast(
          JSON.stringify(<ConnectionUpdate>{
            type: 'update',
            game: 'dash',
            count: this.dash,
          })
        )
        await this.party.storage.put('dash', this.dash)
      } else if (update.gameType === 'coop') {
        this.coop = this.coop ?? (await this.party.storage.get('coop')) ?? 0
        if (update.type === 'connect') this.coop += 1
        if (update.type === 'disconnect') this.coop = Math.max(0, this.coop - 1)
        this.party.broadcast(
          JSON.stringify(<ConnectionUpdate>{
            type: 'update',
            game: 'coop',
            count: this.coop,
          })
        )
        await this.party.storage.put('coop', this.coop)
      }
    }

    return new Response(undefined, { status: 204 })
  }
}
