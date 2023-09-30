import { CoopGameContext } from '@/contexts/coop-game-context'
import { DashGameContext } from '@/contexts/dash-game-context'
import * as React from 'react'

export function useDashGame() {
  const gameContext = React.useContext(DashGameContext)
  if (!gameContext) {
    throw new Error(
      'useCoopGame must be used within a DashGameContext.Provider'
    )
  }
  return gameContext
}

export function useCoopGame() {
  const gameContext = React.useContext(CoopGameContext)
  if (!gameContext) {
    throw new Error(
      'useCoopGame must be used within a CoopGameContext.Provider'
    )
  }
  return gameContext
}
