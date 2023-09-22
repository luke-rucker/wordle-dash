import { AuthModal } from '@/components/auth-modal'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnonProfileData, anonProfileSchema } from '@/lib/profiles'
import { supabase } from '@/lib/supabase'
import { useUsernameStore } from '@/stores/username-store'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useQuery } from '@supabase-cache-helpers/postgrest-react-query'
import { useSession } from '@supabase/auth-helpers-react'
import { useForm } from 'react-hook-form'

export function Landing() {
  return (
    <main className="flex-grow flex flex-col items-center justify-center">
      <div className="w-full max-w-lg px-8 md:px-0">
        <h2 className="mb-5 text-5xl font-semibold tracking-tight">
          <span
            role="img"
            aria-label="dashing away"
            className=" inline-block rotate-180 text-5xl leading-none"
          >
            💨
          </span>
          Wordle Dash
        </h2>

        <p className="text-xl text-muted-foreground mb-7">Pick a game mode</p>

        <Tabs defaultValue="coop">
          <TabsList className="grid w-full grid-cols-2 h-fit">
            <TabsTrigger value="coop" className="flex flex-col">
              Co-Op <p className="text-xs">1034 Online</p>
            </TabsTrigger>
            <TabsTrigger value="dash" className="flex flex-col">
              Dash <p className="text-xs">754 Online</p>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="coop">
            <Card>
              <CardHeader>
                <CardTitle>Co-Op</CardTitle>
                <CardDescription>
                  Take turns trying to guess the hidden word with your opponent.
                  Whoever guesses it first, wins.
                </CardDescription>
              </CardHeader>

              <CardFooter>
                <EnsureUsername>
                  <div className="flex flex-col md:flex-row gap-4">
                    <Button className="w-full">Play</Button>

                    <Button className="w-full">Invite a friend</Button>
                  </div>
                </EnsureUsername>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="dash">
            <Card>
              <CardHeader>
                <CardTitle>Dash</CardTitle>
                <CardDescription>
                  Race against your opponent to guess the word first on separate
                  boards. Be careful not to run out of guesses.
                </CardDescription>
              </CardHeader>

              <CardFooter>
                <EnsureUsername>
                  <div className="flex flex-col md:flex-row gap-4">
                    <Button className="w-full">Play</Button>

                    <Button className="w-full">Invite a friend</Button>
                  </div>
                </EnsureUsername>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

function EnsureUsername({ children }: { children: React.ReactNode }) {
  const session = useSession()
  const profile = useQuery(
    supabase
      .from('profiles')
      .select('username')
      .eq('id', session?.user.id as string),
    { enabled: !!session }
  )

  const username = useUsernameStore(state => state.username)

  if (session) {
    return (
      <div className="w-full">
        <p className="mb-3">
          Playing as {profile.data![0].username}.{' '}
          <Button
            variant="link"
            onClick={() => supabase.auth.signOut()}
            className="px-0 text-base"
          >
            Sign Out
          </Button>
        </p>

        {children}
      </div>
    )
  }

  if (username) {
    return (
      <div className="w-full">
        <p className="mb-3">
          Playing as {username}
          {'. '}
          <AuthModal
            variant="signUp"
            trigger={
              <Button variant="link" className="px-0 text-base">
                Sign up to save your stats
              </Button>
            }
          />
        </p>

        {children}
      </div>
    )
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold">Play with an Account</h3>
      <p className="text-xs text-muted-foreground mb-6">
        When you play with an account you can save the stats of your games.
      </p>

      <div className="flex items-center space-x-2">
        <AuthModal
          variant="signIn"
          trigger={<Button className="w-full">Sign In</Button>}
        />
        <AuthModal
          variant="signUp"
          trigger={<Button className="w-full">Sign Up</Button>}
        />
      </div>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or play as
          </span>
        </div>
      </div>

      <AnonProfileForm />
    </div>
  )
}

function AnonProfileForm() {
  const form = useForm<AnonProfileData>({
    resolver: valibotResolver(anonProfileSchema),
    values: {
      username: '',
    },
  })

  const setUsername = useUsernameStore(state => state.setUsername)

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(data => {
          setUsername(data.username)
        })}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="wordle-speedster" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className="w-full" variant="secondary">
          Play
        </Button>
      </form>
    </Form>
  )
}
