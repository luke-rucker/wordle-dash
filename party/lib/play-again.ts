export type PlayAgainState = Record<string, boolean>

export class PlayAgain {
  private expectedPlayers: number

  players: PlayAgainState

  constructor(options: { expectedPlayers: number }) {
    this.expectedPlayers = options.expectedPlayers
    this.players = {}
  }

  agree(id: string) {
    this.players[id] = true
  }

  everyoneWantsTo() {
    return (
      Object.keys(this.players).filter(player => this.players[player])
        .length === this.expectedPlayers
    )
  }

  someoneWantsTo() {
    return Object.keys(this.players).length > 0
  }

  iWantTo(id: string) {
    return this.players[id] ?? false
  }
}
