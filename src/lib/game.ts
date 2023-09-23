import { GameContext } from '@/contexts/game-context'
import * as React from 'react'

export function useGame() {
  const gameContext = React.useContext(GameContext)
  if (!gameContext) {
    throw new Error('useGame must be used within a GameContext.Provider')
  }
  return gameContext
}
