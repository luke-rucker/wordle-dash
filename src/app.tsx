import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Landing } from '@/pages/landing'
import { Game } from '@/pages/game'
import { ThemeProvider } from '@/contexts/theme-context'
import { Layout } from '@/components/layout'
import { Lobby } from '@/pages/lobby'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { Toaster } from '@/components/ui/toaster'
import { supabase } from '@/lib/supabase'
import { EnsureProfile } from '@/components/ensure-profile'
import { Settings } from '@/pages/settings'

const queryClient = new QueryClient()

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <SessionContextProvider supabaseClient={supabase}>
            <EnsureProfile>
              <Routes>
                <Route element={<Layout />}>
                  <Route index element={<Landing />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="lobby" element={<Lobby />} />
                  <Route path="game/:gameId" element={<Game />} />
                </Route>
              </Routes>
              <Toaster />
            </EnsureProfile>
          </SessionContextProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
