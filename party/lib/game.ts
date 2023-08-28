import { randomSolution } from './words/solutions'
import { type LetterStatus, compare } from './words/compare'
import { SOLUTION_SIZE } from '@party/lib/constants'

export type Guess = { raw: string; computed: Array<LetterStatus> }

export type PlayerState = {
  username: string | null
  online: boolean
  guesses: Array<Guess>
  currentGuess: string
}

export type OtherPlayerState = {
  username: string | null
  online: boolean
  guesses: Array<Array<LetterStatus>>
  currentGuess: number
}

export type GameState = {
  you: PlayerState
  others: Array<OtherPlayerState>
}

export class Game {
  solution = randomSolution()

  players: Record<string, PlayerState> = {}

  maxPlayers = 2

  isFull = () => Object.keys(this.players).length >= this.maxPlayers

  addPlayer(id: string, username: string | null) {
    if (this.hasPlayer(id)) {
      this.setOnline(id, true)
    } else {
      this.players[id] = {
        currentGuess: '',
        guesses: [],
        online: true,
        username,
      }
    }
  }

  hasPlayer(id: string) {
    return this.players[id] !== undefined
  }

  setOnline(id: string, online: boolean) {
    this.players[id].online = online
  }

  setUsername(id: string, username: string | null) {
    this.players[id].username = username
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
    if (this.players[id].guesses.length >= 6) return
    const guess = this.players[id].currentGuess
    if (guess.length !== 6) return
    const letterStatuses = compare(guess, this.solution)
    this.players[id].guesses.push({ raw: guess, computed: letterStatuses })
    this.players[id].currentGuess = ''
  }
}
