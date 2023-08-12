import type { PartyKitServer } from 'partykit/server'
import { uid } from 'uid/secure'

export const MAIN_LOBBY = 'main'

export type LobbyMessage = { type: 'join'; game: string }

export default {
  onConnect(connection, room) {
    if (room.id === MAIN_LOBBY) {
      if (room.connections.size % 2 === 0) {
        const pairs = []
        let nextPair = []

        for (const connection of room.connections.values()) {
          nextPair.push(connection)

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

          for (const connection of pair) {
            connection.send(JSON.stringify(joinMessage))
          }
        }
      }
    }
  },
} satisfies PartyKitServer
