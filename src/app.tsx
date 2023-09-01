import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Landing } from '@/pages/landing'
import { Game } from '@/pages/game'
import { ThemeProvider } from '@/contexts/theme-context'
import { Layout } from '@/components/layout'
import { Lobby } from '@/pages/lobby'
import { AuthProvider } from '@/contexts/auth-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'

const queryClient = new QueryClient()

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Landing />} />
                <Route path="lobby" element={<Lobby />} />
                <Route path="game/:gameId" element={<Game />} />
              </Route>
            </Routes>
            <Toaster />
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
