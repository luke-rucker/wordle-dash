import type { PartyKitServer } from 'partykit/server'

export default {
  onConnect(websocket, room) {
    // This is invoked whenever a user joins a room
    websocket.send('hello from room: ' + room.id)
  },
  // optionally, you can respond to HTTP requests as well
  onRequest(request, room) {
    return new Response('hello from room: ' + room.id)
  },
} satisfies PartyKitServer
