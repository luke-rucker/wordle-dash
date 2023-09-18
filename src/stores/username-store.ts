import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type UsernameState = {
  username: string | null
  setUsername: (username: string | null) => void
}

export const useUsernameStore = create<UsernameState>()(
  persist(
    set => ({
      username: null,
      setUsername: username => set(() => ({ username })),
    }),
    {
      name: 'username',
    }
  )
)
