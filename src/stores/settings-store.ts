import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Pet = 'dog' | 'cat'

type Settings = { username: string | null; pet: Pet }

type SettingsState = Settings & {
  setSettings: (settings: Settings) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      username: null,
      pet: 'dog',
      setSettings: settings =>
        set(() => ({ username: settings.username, pet: settings.pet })),
    }),
    {
      name: 'settings',
    }
  )
)

export const useUsername = () => useSettingsStore(state => state.username)
export const usePet = () => useSettingsStore(state => state.pet)
