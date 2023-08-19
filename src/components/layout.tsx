import { SettingsModal } from '@/components/settings-modal'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { Outlet } from 'react-router-dom'

export function Layout() {
  return (
    <div className="h-full flex flex-col">
      <header className="border-b h-16">
        <div className="flex items-center justify-between h-16 container">
          <div className="flex items-center space-x-1">
            <div
              role="img"
              aria-label="dashing away"
              className="rotate-180 text-xl leading-none"
            >
              💨
            </div>

            <h1 className="text-xl font-bold tracking-tight">Word Dash</h1>
          </div>

          <div className="flex items-center space-x-2">
            <SettingsModal />

            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <Outlet />
    </div>
  )
}
