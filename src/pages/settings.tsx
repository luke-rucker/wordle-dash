import { Cell } from '@/components/cell'
import { GoogleButton } from '@/components/google-button'
import { Icons } from '@/components/icons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { useTheme } from '@/contexts/theme-context'
import { ProfileData, profileSchema } from '@/lib/profiles'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { useUsernameStore } from '@/stores/username-store'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { LetterStatus } from '@party/lib/words/compare'
import {
  useQuery,
  useUpsertMutation,
} from '@supabase-cache-helpers/postgrest-react-query'
import { useSession } from '@supabase/auth-helpers-react'
import { useForm } from 'react-hook-form'
import { Output, maxLength, minLength, object, string } from 'valibot'

export function Settings() {
  const session = useSession()

  return (
    <div className="container py-6 md:py-12">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>

        <p className="text-muted-foreground">
          Manage your account settings and visual preferences.
        </p>
      </div>

      <Separator className="my-6" />

      <div className="max-w-lg">
        <h3 className="text-lg font-medium">Profile</h3>
        <p className="text-sm text-muted-foreground mb-6">
          This is how other players will see you.
        </p>

        {session ? (
          <ProfileForm userId={session.user.id} />
        ) : (
          <AnonProfileForm />
        )}

        <h3 className="text-lg font-medium mt-8">Theme</h3>
        <p className="text-sm text-muted-foreground mb-6">
          This is how other players will see you.
        </p>

        <ThemeSwitcher />
      </div>
    </div>
  )
}

const anonProfileSchema = object({
  username: string('A username is required', [
    minLength(3, 'Needs to be at least 3 characters'),
    maxLength(24, 'Cannot be more than 24 characters'),
  ]),
})

type AnonProfileData = Output<typeof anonProfileSchema>

function AnonProfileForm() {
  const { username, setUsername } = useUsernameStore()

  const form = useForm<AnonProfileData>({
    resolver: valibotResolver(anonProfileSchema),
    values: {
      username: username ?? '',
    },
  })

  const toaster = useToast()

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(data => {
          setUsername(data.username)
          toaster.toast({
            title: 'Updated your profile successfully.',
          })
        })}
        className="space-y-8"
      >
        <Alert>
          <Icons.Info className="h-4 w-4" />
          <AlertTitle>You're signed out</AlertTitle>
          <AlertDescription>
            You can sign into or create your account and save your stats across
            devices.
            <GoogleButton redirectTo="/settings" className="mt-2" />
          </AlertDescription>
        </Alert>

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="wordle-speedster" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button>Save</Button>
      </form>
    </Form>
  )
}

function ProfileForm({ userId }: { userId: string }) {
  const profile = useQuery(
    supabase.from('profiles').select('username').eq('id', userId)
  )

  const form = useForm<ProfileData>({
    resolver: valibotResolver(profileSchema),
    values: {
      username: profile.data ? profile.data[0].username ?? '' : '',
    },
  })

  const toaster = useToast()

  const updateProfile = useUpsertMutation(
    supabase.from('profiles'),
    ['id'],
    null,
    {
      onSuccess: () => {
        toaster.toast({
          title: 'Updated your profile successfully.',
        })
      },
      onError: err => {
        form.setError(
          'username',
          {
            message:
              err.code === '23505'
                ? 'Username is already taken'
                : 'Something went wrong!',
          },
          { shouldFocus: true }
        )
      },
    }
  )

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(data =>
          updateProfile.mutate([{ ...data, id: userId }])
        )}
        className="space-y-8"
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
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center space-x-4">
          <Button type="submit" disabled={updateProfile.isLoading}>
            {updateProfile.isLoading ? (
              <Icons.Spinner className="mr-2 h-4 w-4" />
            ) : null}
            Save
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => supabase.auth.signOut()}
          >
            <Icons.LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </form>
    </Form>
  )
}

function ThemeSwitcher() {
  const rows: Array<Array<LetterStatus>> = [
    ['a', 'a', 'c', 'p', 'a'],
    ['p', 'a', 'c', 'a', 'a'],
    ['p', 'p', 'c', 'a', 'a'],
    ['c', 'p', 'c', 'a', 'a'],
    ['c', 'a', 'c', 'c', 'a'],
    ['c', 'c', 'c', 'c', 'c'],
  ]

  const theme = useTheme()

  return (
    <div className="flex space-x-6">
      <div>
        <button
          className={cn(
            'grid grid-cols-5 gap-1 border-2 rounded p-3 bg-white border-white',
            theme.current === 'light' && 'border-primary'
          )}
          onClick={() => theme.set('light')}
        >
          {rows.flatMap((statuses, row) =>
            statuses.map((status, index) => (
              <Cell
                key={`${row}-${index}`}
                status={status}
                className="h-5 w-5"
              />
            ))
          )}
        </button>

        <p className="text-center">Light</p>
      </div>

      <div>
        <button
          className={cn(
            'grid grid-cols-5 gap-1 border-2 rounded p-3 bg-[#04080F] border-[#04080F]',
            theme.current === 'dark' && 'border-primary'
          )}
          onClick={() => theme.set('dark')}
        >
          {rows.flatMap((statuses, row) =>
            statuses.map((status, index) => (
              <Cell
                key={`${row}-${index}`}
                status={status}
                className="h-5 w-5 text-xs"
              />
            ))
          )}
        </button>

        <p className="text-center">Dark</p>
      </div>
    </div>
  )
}
