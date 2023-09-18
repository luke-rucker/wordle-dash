import type { GameOverState, PlayerState } from '@party/lib/game'
import * as React from 'react'

export type GameOverValue = {
  state: GameOverState
  game: Record<string, PlayerState>
}

export const GameOverContext = React.createContext<GameOverValue | null>(null)

export function useGameOver() {
  return React.useContext(GameOverContext)
}
