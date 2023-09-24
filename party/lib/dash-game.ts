import { randomSolution } from './words/solutions'
import { type LetterStatus, compare } from './words/compare'
import { MAX_GUESSES, SOLUTION_SIZE } from '@party/lib/constants'

export type Guess = { raw: string; computed: Array<LetterStatus> }

export type PlayerState = {
  id: string
  username: string
  country: string | null
  guesses: Array<Guess>
  currentGuess: string
}

export type OtherPlayerState = {
  id: string
  username: string
  country: string | null
  guesses: Array<Array<LetterStatus>>
  currentGuess: number
}

export type GameState = {
  you: PlayerState
  others: Array<OtherPlayerState>
}

export type GameOverState = {
  type: 'win' | 'outOfGuesses'
  playerId: string
}

export class Game {
  solution = randomSolution()

  players: Record<string, PlayerState> = {}

  maxPlayers = 2

  isFull = () => Object.keys(this.players).length >= this.maxPlayers

  addPlayer(id: string, username: string, country: string | null) {
    if (!this.hasPlayer(id)) {
      this.players[id] = {
        id,
        username,
        country,
        currentGuess: '',
        guesses: [],
      }
    }
  }

  hasPlayer(id: string) {
    return this.players[id] !== undefined
  }

  stateForPlayer(id: string): GameState {
    return {
      you: this.players[id],
      others: Object.keys(this.players)
        .filter(playerId => playerId !== id)
        .map(playerId => {
          const state = this.players[playerId]
          return {
            ...state,
            currentGuess: state.currentGuess.length,
            guesses: state.guesses.map(guess => guess.computed),
          }
        }),
    }
  }

  typeGuess(id: string, guess: string | null) {
    if (guess === null) {
      const newGuess = this.players[id].currentGuess.slice(0, -1)
      this.players[id].currentGuess = newGuess
      return
    }

    const oldGuess = this.players[id].currentGuess
    if (oldGuess.length >= SOLUTION_SIZE) return
    this.players[id].currentGuess = oldGuess + guess
  }

  submitGuess(id: string) {
    // TODO: add guess validation
    if (this.isGameOver()) return

    const guess = this.players[id].currentGuess
    if (guess.length !== SOLUTION_SIZE) return
    const letterStatuses = compare(guess, this.solution)
    this.players[id].guesses.push({ raw: guess, computed: letterStatuses })
    this.players[id].currentGuess = ''
  }

  isGameOver() {
    return !!this.computeGameOver()
  }

  computeGameOver(): GameOverState | undefined {
    for (const playerId of Object.keys(this.players)) {
      const player = this.players[playerId]
      if (player.guesses.length === MAX_GUESSES) {
        return {
          type: 'outOfGuesses',
          playerId,
        }
      }

      if (
        player.guesses.find(guess =>
          guess.computed.every(status => status === 'c')
        )
      ) {
        return {
          type: 'win',
          playerId,
        }
      }
    }
  }
}
