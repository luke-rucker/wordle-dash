import { randomSolution } from './words/solutions'

type Status = ''

type Guess = { raw: string; computed: Array<Status> }

type PlayerState = {
  guesses: Array<Guess>
}

export class Game {
  solution = randomSolution()

  players: Record<string, PlayerState> = {}

  maxPlayers = 2

  isFull = () => Object.keys(this.players).length >= this.maxPlayers

  addPlayer(id: string) {
    if (this.players[id]) return
    this.players[id] = { guesses: [] }
  }
}
