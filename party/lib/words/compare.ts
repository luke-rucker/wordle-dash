export type LetterStatus = 'a' | 'p' | 'c'

export function compare(guess: string, solution: string): Array<LetterStatus> {
  const splitGuess = guess.split('')
  const splitSolution = solution.split('')

  const statuses: Array<LetterStatus> = Array.from(Array(guess.length))
  const solutionLettersAlreadyTaken = splitSolution.map(_ => false)

  splitGuess.forEach((letter, i) => {
    if (letter === splitSolution[i]) {
      statuses[i] = 'c'
      solutionLettersAlreadyTaken[i] = true
    }
  })

  splitGuess.forEach((letter, i) => {
    if (statuses[i]) return

    if (!splitSolution.includes(letter)) {
      statuses[i] = 'a'
      return
    }

    const indexOfPresentLetter = splitSolution.findIndex(
      (letterInSolution, i) =>
        letterInSolution === letter && !solutionLettersAlreadyTaken[i]
    )

    if (indexOfPresentLetter > -1) {
      statuses[i] = 'p'
      solutionLettersAlreadyTaken[indexOfPresentLetter] = true
    } else {
      statuses[i] = 'a'
    }
  })

  return statuses
}
