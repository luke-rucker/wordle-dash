import type { PartyKitServer } from 'partykit/server'

export default {
  onConnect(websocket, room) {
    // TODO
  },
  // optionally, you can respond to HTTP requests as well
  onRequest(request, room) {
    return new Response('hello from room: ' + room.id)
  },
} satisfies PartyKitServer
