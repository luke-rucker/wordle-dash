import type { GameOverState, GameState, PlayerState } from '@party/lib/game'
import * as React from 'react'

export type GameValue = {
  userId: string
  game: GameState
  gameOver?: {
    state: GameOverState
    game: Record<string, PlayerState>
  }
}

export const GameContext = React.createContext<GameValue | null>(null)

export function useGame() {
  const gameContext = React.useContext(GameContext)
  if (!gameContext) {
    throw new Error('useGame must be used within a GameContext.Provider')
  }
  return gameContext
}
