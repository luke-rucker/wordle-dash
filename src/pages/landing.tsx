import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export function Landing() {
  return (
    <div className="flex-grow flex flex-col items-center justify-center">
      <main className="max-w-xl w-full container">
        <h2 className="mb-5 text-5xl font-semibold tracking-tight">
          Wordle, but you{' '}
          <span
            role="img"
            aria-label="dashing away"
            className=" inline-block rotate-180 text-5xl leading-none"
          >
            💨
          </span>{' '}
          race against other people.
        </h2>

        <p className="text-lg text-muted-foreground mb-7">
          Your favorite word game, with a twist. Take the competition out of the
          groupchat and onto the race course.
        </p>

        <div className="flex items-center space-x-4">
          <Button size="lg" asChild>
            <Link to="lobby">Play</Link>
          </Button>

          <Button disabled size="lg" variant="secondary">
            Play a Friend
          </Button>
        </div>
      </main>
    </div>
  )
}
