import * as React from 'react'
import { union, literal, type Output } from 'valibot'

const themeSchema = union([literal('light'), literal('dark')])

type Theme = Output<typeof themeSchema>

const ThemeContext = React.createContext<{
  current: Theme
  set: (theme: Theme | null) => void
} | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>(() => {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
      .matches
      ? 'dark'
      : 'light'

    const persistedTheme = localStorage.getItem('theme')

    if (!persistedTheme) {
      return systemTheme
    }

    try {
      return themeSchema.parse(persistedTheme)
    } catch (err) {
      return systemTheme
    }
  })

  const set = React.useCallback((theme: Theme | null) => {
    if (!theme) {
      localStorage.removeItem('theme')
    } else {
      localStorage.setItem('theme', theme)
    }

    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
      .matches
      ? 'dark'
      : 'light'

    const newTheme = theme ?? systemTheme
    setTheme(newTheme)

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const memoizedValue = React.useMemo(
    () => ({
      current: theme,
      set,
    }),
    [theme, set]
  )

  return (
    <ThemeContext.Provider value={memoizedValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const themeContext = React.useContext(ThemeContext)
  if (!themeContext) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return themeContext
}
