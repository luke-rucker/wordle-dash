import type { GameState } from '@party/lib/game'

export function createGameState(game: GameState, userId: string) {
  return {
    isFinished: () => {},
  }
}
