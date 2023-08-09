import usePartySocket from 'partysocket/react'

export function App() {
  const socket = usePartySocket({
    host: 'localhost:1999',
    party: 'lobby',
    room: 'main',
    onOpen(e) {
      console.log(e)
    },
    onMessage(event) {
      console.log(event)
    },
  })

  return <h1>Helloooo</h1>
}
