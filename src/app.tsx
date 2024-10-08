import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Landing } from '@/pages/landing'
import { DashGame } from '@/pages/dash-game'
import { ThemeProvider } from '@/contexts/theme-context'
import { Layout } from '@/components/layout'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { Toaster } from '@/components/ui/toaster'
import { supabase } from '@/lib/supabase'
import { EnsureProfile } from '@/components/ensure-profile'
import { Settings } from '@/pages/settings'
import { CoopGame } from '@/pages/coop-game'
import { Splash } from '@/components/splash'
import { Stats } from '@/pages/stats'
import { Help } from '@/pages/help'
import { Privacy } from '@/pages/privacy'

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
                  <Route path="stats" element={<Stats />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="help" element={<Help />} />
                  <Route path="privacy" element={<Privacy />} />
                  <Route path="coop/:gameId" element={<CoopGame />} />
                  <Route path="dash/:gameId" element={<DashGame />} />
                  <Route path="*" element={<Splash type="404" />} />
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
