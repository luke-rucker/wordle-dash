import { AuthModal } from '@/components/auth-modal'
import { Icons } from '@/components/icons'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { useSession } from '@supabase/auth-helpers-react'
import { Link, Outlet } from 'react-router-dom'

export function Layout() {
  const session = useSession()

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

            <h1 className="text-xl font-bold tracking-tight">Wordle Dash</h1>
          </Link>

          <div className="flex items-center space-x-2 md:space-x-3">
            <ThemeSwitcher />

            <Button asChild size="icon" variant="ghost">
              <Link to="/">
                <Icons.Stats className="h-6 w-6" />
              </Link>
            </Button>

            {session ? (
              <ProfileDropdown
                id={session.user.id}
                email={session.user.email!}
              />
            ) : (
              <AuthModal />
            )}
          </div>
        </div>
      </header>

      <Outlet />
    </div>
  )
}

function ProfileDropdown({ id, email }: { id: string; email: string }) {
  const profile = useQuery(supabase.from('profiles').select('*').eq('id', id))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{profile.data![0].username![0]}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile.data![0].username}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <Icons.User className="h-4 w-4 mr-2" />
          Profile
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => supabase.auth.signOut()}>
          <Icons.LogOut className="h-4 w-4 mr-2" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
