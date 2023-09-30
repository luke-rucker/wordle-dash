import type {
  GameOverState,
  GameState,
  PlayerState,
} from '@party/lib/coop-game'
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

export const CoopGameContext = React.createContext<GameValue | null>(null)
