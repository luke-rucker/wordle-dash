import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Landing } from '@/pages/landing'
import { Game } from '@/pages/game'
import { ThemeProvider } from '@/contexts/theme-context'
import { Layout } from '@/components/layout'
import { Lobby } from '@/pages/lobby'

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="lobby" element={<Lobby />} />
            <Route path="game/:gameId" element={<Game />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  )
}
