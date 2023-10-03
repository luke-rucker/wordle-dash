import { MAX_GUESSES, SOLUTION_SIZE } from '@party/lib/constants'
import type { Guess, Solution, TimeToGuess } from '@party/lib/shared'
import type { User } from '@party/lib/tokens'
import { compare } from '@party/lib/words/compare'

export type PlayerState = User & {
  username: string
  country: string | null
  currentGuess: string
}

export type OtherPlayerState = User & {
  username: string
  country: string | null
  currentGuess: number
}

export type GameState = {
  you: PlayerState & { isCurrentTurn: boolean }
  others: Array<OtherPlayerState & { isCurrentTurn: boolean }>
  guesses: Array<Guess>
  maxGuesses: number
  guessBy?: number
}

export type GameOverState = {
  type: 'win' | 'timeLimit'
  solution: Solution
  playerId: string
}

export class Game {
  private _timeToGuess?: TimeToGuess | null

  solution: Solution

  maxPlayers = 2

  maxGuesses = MAX_GUESSES

  guesses: Array<Guess>

  players: Record<string, PlayerState>

  currentTurn: string

  timer?: NodeJS.Timeout

  guessBy?: number

  gameOver?: GameOverState

  onGameOver?: () => Promise<void>

  constructor(options: {
    solution: Solution
    timeToGuess?: TimeToGuess
    onGameOver?: () => Promise<void>
  }) {
    this.solution = options.solution
    this.timeToGuess = options.timeToGuess ?? 30

    this.players = {}
    this.guesses = []
    this.currentTurn = ''
    this.onGameOver = options.onGameOver
  }

  set timeToGuess(timeToGuess: TimeToGuess) {
    if (timeToGuess === 8) this._timeToGuess = null
    else this._timeToGuess = timeToGuess
  }

  get timeToGuess() {
    return this._timeToGuess!
  }

  hasTimeToGuess = () => typeof this.timeToGuess === 'number'

  isFull = () => Object.keys(this.players).length >= this.maxPlayers

  addPlayer(user: {
    id: string
    type: User['type']
    username: string
    country: string | null
  }) {
    if (this.hasPlayer(user.id)) return

    this.players[user.id] = {
      ...user,
      currentGuess: '',
    }

    if (this.isFull()) {
      const players = Object.keys(this.players)
      this.currentTurn = players[Math.floor(Math.random() * players.length)]

      if (this.hasTimeToGuess()) {
        this.guessBy = Date.now() + this.timeToGuess * 1000
        this.timer = setTimeout(() => {
          this.setGameOver({
            type: 'timeLimit',
            playerId: this.currentTurn,
            solution: this.solution,
          })
        }, this.timeToGuess * 1000)
      }
    }
  }

  typeGuess(id: string, guess: string | null) {
    if (this.currentTurn !== id) return

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
    if (this.isGameOver() || this.currentTurn !== id) return

    const guess = this.players[id].currentGuess
    if (guess.length !== SOLUTION_SIZE) return

    const letterStatuses = compare(guess, this.solution.word)
    this.guesses.push({ raw: guess, computed: letterStatuses })
    this.players[id].currentGuess = ''

    if (letterStatuses.every(status => status === 'c')) {
      return this.setGameOver({
        type: 'win',
        playerId: id,
        solution: this.solution,
      })
    }

    const other = Object.keys(this.players).filter(player => player !== id)[0]
    this.currentTurn = other

    if (this.guesses.length >= this.maxGuesses - 1) {
      this.maxGuesses += 1
    }

    if (this.hasTimeToGuess()) {
      clearTimeout(this.timer)
      this.guessBy = Date.now() + this.timeToGuess * 1000
      this.timer = setTimeout(() => {
        if (this.isGameOver()) return
        this.setGameOver({
          type: 'timeLimit',
          playerId: other,
          solution: this.solution,
        })
      }, this.timeToGuess * 1000)
    }
  }

  hasPlayer(id: string) {
    return this.players[id] !== undefined
  }

  isGameOver() {
    return !!this.gameOver
  }

  setGameOver(gameOver: GameOverState) {
    this.gameOver = gameOver
    clearTimeout(this.timer)
    if (this.onGameOver) this.onGameOver()
  }

  stateForPlayer(id: string): GameState {
    return {
      guesses: this.guesses,
      maxGuesses: this.maxGuesses,
      guessBy: this.guessBy,
      you: { ...this.players[id], isCurrentTurn: this.currentTurn === id },
      others: Object.keys(this.players)
        .filter(playerId => playerId !== id)
        .map(playerId => {
          const state = this.players[playerId]
          return {
            ...state,
            currentGuess: state.currentGuess.length,
            isCurrentTurn: this.currentTurn === playerId,
          }
        }),
    }
  }
}
