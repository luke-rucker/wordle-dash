import { type LetterStatus, compare } from './words/compare'
import { MAX_GUESSES, SOLUTION_SIZE } from '@party/lib/constants'
import type { User } from './tokens'
import { Guess, Solution, TimeToGuess } from '@party/lib/shared'

export type PlayerState = User & {
  username: string
  country: string | null
  guessBy?: number
  guesses: Array<Guess>
  currentGuess: string
}

export type OtherPlayerState = User & {
  username: string
  country: string | null
  guessBy?: number
  guesses: Array<Array<LetterStatus>>
  currentGuess: number
}

export type GameState = {
  you: PlayerState
  others: Array<OtherPlayerState>
}

export type GameOverState =
  | {
      type: 'win' | 'outOfGuesses' | 'timeLimit'
      solution: Solution
      playerId: string
    }
  | { type: 'noGuesses'; solution: Solution }

export class Game {
  _timeToGuess?: TimeToGuess | null

  solution: Solution

  maxPlayers = 2

  players: Record<string, PlayerState>

  timers: Record<string, NodeJS.Timeout>

  gameOver?: GameOverState

  onGameOver?: () => Promise<void>

  constructor(options: {
    solution: Solution
    timeToGuess?: TimeToGuess
    onGameOver?: () => Promise<void>
  }) {
    this.solution = options.solution
    this.timeToGuess = options.timeToGuess ?? 30

    this.onGameOver = options.onGameOver
    this.players = {}
    this.timers = {}
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
      guesses: [],
    }

    if (this.isFull() && this.hasTimeToGuess()) {
      const guessBy = Date.now() + this.timeToGuess * 1000

      Object.keys(this.players).forEach(player => {
        this.players[player].guessBy = guessBy

        this.timers[player] = setTimeout(() => {
          if (this.isGameOver()) return
          const others = Object.keys(this.players).filter(id => id !== player)

          if (others.some(player => this.players[player].guesses.length > 0)) {
            this.setGameOver({
              type: 'timeLimit',
              playerId: player,
              solution: this.solution,
            })
          } else {
            this.setGameOver({ type: 'noGuesses', solution: this.solution })
          }
        }, this.timeToGuess * 1000)
      })
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
    if (this.isGameOver()) return

    const guess = this.players[id].currentGuess
    if (guess.length !== SOLUTION_SIZE) return

    const letterStatuses = compare(guess, this.solution.word)
    this.players[id].guesses.push({ raw: guess, computed: letterStatuses })
    this.players[id].currentGuess = ''

    this.checkGameOver()
    if (this.isGameOver()) return

    if (this.hasTimeToGuess()) {
      clearTimeout(this.timers[id])
      this.players[id].guessBy = Date.now() + this.timeToGuess * 1000
      this.timers[id] = setTimeout(() => {
        if (this.isGameOver()) return
        this.setGameOver({
          type: 'timeLimit',
          playerId: id,
          solution: this.solution,
        })
      }, this.timeToGuess * 1000)
    }
  }

  isGameOver() {
    return !!this.gameOver
  }

  setGameOver(gameOver: GameOverState) {
    this.gameOver = gameOver
    Object.keys(this.timers).forEach(player =>
      clearTimeout(this.timers[player])
    )
    if (this.onGameOver) this.onGameOver()
  }

  checkGameOver() {
    if (this.isGameOver()) return

    for (const playerId of Object.keys(this.players)) {
      const player = this.players[playerId]
      if (player.guesses.length === MAX_GUESSES) {
        this.setGameOver({
          type: 'outOfGuesses',
          playerId,
          solution: this.solution,
        })
        return
      }

      if (
        player.guesses.find(guess =>
          guess.computed.every(status => status === 'c')
        )
      ) {
        this.setGameOver({
          type: 'win',
          playerId,
          solution: this.solution,
        })
        return
      }
    }
  }
}
