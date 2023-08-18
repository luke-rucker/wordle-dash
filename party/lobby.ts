import type { PartyKitServer } from 'partykit/server'
import { uid } from 'uid/secure'

export const MAIN_LOBBY = 'main'

export type LobbyMessage = { type: 'join'; game: string }

export default {
  onConnect(ws, room) {
    if (room.connections.size % 2 === 0) {
      const pairs = []
      let nextPair = []

      for (const ws of room.connections.values()) {
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
  },
} satisfies PartyKitServer
