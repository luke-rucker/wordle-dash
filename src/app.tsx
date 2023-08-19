import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Landing } from '@/pages/landing'
import { Game } from '@/pages/game'
import { ThemeProvider } from '@/contexts/theme-context'

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route index element={<Landing />} />
          <Route path="game/:gameId" element={<Game />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  )
}
