import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Landing } from '@/pages/landing'
import { Lobby } from '@/pages/lobby'
import { Game } from '@/pages/game'

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Landing />} />
        <Route path="lobby" element={<Lobby />} />
        <Route path="lobby/:lobbyId" />
        <Route path="game/:gameId" element={<Game />} />
      </Routes>
    </BrowserRouter>
  )
}
