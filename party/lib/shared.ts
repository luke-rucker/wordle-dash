import type { LetterStatus } from '@party/lib/words/compare'

export type Guess = { raw: string; computed: Array<LetterStatus> }

export type TimeToGuess = 30 | 60 | 8

export type Solution = {
  word: string
  wordle_solution?: string
}
