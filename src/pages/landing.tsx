import { buttonVariants } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export function Landing() {
  return (
    <>
      <h1>Word Dash</h1>

      <Link className={buttonVariants()} to="lobby">
        Play
      </Link>
    </>
  )
}
