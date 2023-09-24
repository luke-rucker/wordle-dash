import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { Link, Outlet } from 'react-router-dom'

export function Layout() {
  return (
    <div className="h-full flex flex-col">
      <header className="border-b h-16">
        <div className="flex items-center justify-between h-16 container">
          <Link to="/" className="flex items-center space-x-1">
            <div
              role="img"
              aria-label="dashing away"
              className="rotate-180 text-xl leading-none"
            >
              💨
            </div>

            <h1 className="text-xl font-semibold tracking-tight">
              Wordle Dash
            </h1>
          </Link>

          <div className="flex items-center space-x-2 md:space-x-3">
            <Button asChild size="icon" variant="ghost">
              <Link to="/">
                <Icons.Stats className="h-6 w-6" />
              </Link>
            </Button>

            <Button asChild size="icon" variant="ghost">
              <Link to="settings">
                <Icons.Settings className="h-6 w-6" />
              </Link>
            </Button>

            <Button asChild size="icon" variant="ghost">
              <Link to="/">
                <Icons.Help className="h-6 w-6" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <Outlet />

      <footer className="py-4 mt-4 border-t">
        <div className="container flex items-center justify-between text-muted-foreground">
          © {new Date().getFullYear()} Wordle Dash
          <ul className="flex items-center space-x-3">
            <li>
              <a href="mailto:hello@wordledash.com" className="hover:underline">
                Feedback
              </a>
            </li>

            <li role="separator">|</li>

            <li>
              <Link to="/privacy" className="hover:underline">
                Privacy
              </Link>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  )
}
