import type {
  GameOverState,
  GameState,
  PlayerState,
} from '@party/lib/coop-game'
import type { PlayAgainState } from '@party/lib/play-again'
import * as React from 'react'

export type GameValue = {
  userId: string
  game: GameState
  badGuess: boolean
  gameOver?: {
    state: GameOverState
    game: Record<string, PlayerState>
  }
  playAgain?: PlayAgainState
}

export const CoopGameContext = React.createContext<GameValue | null>(null)
