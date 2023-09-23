import type * as Party from 'partykit/server'
import { uid } from 'uid/secure'

export type LobbyMessage = { type: 'join'; game: string }

export default class Server implements Party.PartyKitServer {
  constructor(readonly party: Party.Party) {
    this.party = party
  }

  onConnect() {
    const connected = [...this.party.getConnections()].length

    if (connected % 2 === 0) {
      const pairs = []
      let nextPair = []

      for (const ws of this.party.getConnections()) {
        nextPair.push(ws)

        if (nextPair.length === 2) {
          pairs.push(nextPair)
          nextPair = []
        }
      }

      for (const pair of pairs) {
        const joinMessage: LobbyMessage = {
          type: 'join',
          game: uid(6),
        }

        for (const ws of pair) {
          ws.send(JSON.stringify(joinMessage))
        }
      }
    }
  }
}
