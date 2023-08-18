import { buttonVariants } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export function Landing() {
  return (
    <div className="h-full flex flex-col">
      <header className="border-b flex items-center h-16 container">
        <h1 className="text-xl font-bold">Word Dash</h1>
      </header>

      <div className="flex-grow flex flex-col items-center justify-center">
        <main className="max-w-sm w-full container">
          <h2 className="text-5xl font-semibold">Word Dash</h2>

          <Link className={buttonVariants({ size: 'lg' })} to="lobby">
            Play
          </Link>
        </main>
      </div>
    </div>
  )
}
