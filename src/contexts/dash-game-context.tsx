import type {
  GameOverState,
  GameState,
  PlayerState,
} from '@party/lib/dash-game'
import * as React from 'react'

export type GameValue = {
  userId: string
  game: GameState
  badGuess: boolean
  gameOver?: {
    state: GameOverState
    game: Record<string, PlayerState>
  }
}

export const DashGameContext = React.createContext<GameValue | null>(null)
