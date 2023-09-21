import { AuthModal } from '@/components/auth-modal'
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
import { cn } from '@/lib/utils'
import { useUsernameStore } from '@/stores/username-store'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { LetterStatus } from '@party/lib/words/compare'
import { useSession } from '@supabase/auth-helpers-react'
import { useForm } from 'react-hook-form'
import { Output, maxLength, minLength, object, string } from 'valibot'

export function Settings() {
  const session = useSession()

  return (
    <div className="container py-12">
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

        {session ? <ProfileForm /> : <AnonProfileForm />}

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
            <div className="pt-2 flex items-center gap-2">
              <AuthModal
                variant="signIn"
                trigger={
                  <Button className="flex-grow" type="button">
                    Sign In
                  </Button>
                }
              />

              <AuthModal
                variant="signUp"
                trigger={
                  <Button className="flex-grow" type="button">
                    Sign Up
                  </Button>
                }
              />
            </div>
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

function ProfileForm() {
  return null
}

function ThemeSwitcher() {
  const rows: Array<Array<LetterStatus>> = [
    ['absent', 'absent', 'correct', 'present', 'absent'],
    ['present', 'absent', 'correct', 'absent', 'absent'],
    ['present', 'present', 'correct', 'absent', 'absent'],
    ['correct', 'present', 'correct', 'absent', 'absent'],
    ['correct', 'absent', 'correct', 'correct', 'absent'],
    ['correct', 'correct', 'correct', 'correct', 'correct'],
  ]

  const theme = useTheme()

  return (
    <div className="flex space-x-6">
      <div>
        <button
          className={cn(
            'grid grid-cols-5 gap-1 border-2 rounded p-2',
            theme.current === 'light' && 'border-primary'
          )}
          onClick={() => theme.set('light')}
        >
          {rows.flatMap((statuses, row) =>
            statuses.map((status, index) => (
              <LightCell key={`${row}-${index}`} status={status} />
            ))
          )}
        </button>

        <p className="text-center">Light</p>
      </div>

      <div>
        <button
          className={cn(
            'grid grid-cols-5 gap-1 border-2 rounded p-2',
            theme.current === 'dark' && 'border-primary'
          )}
          onClick={() => theme.set('dark')}
        >
          {rows.flatMap((statuses, row) =>
            statuses.map((status, index) => (
              <LightCell key={`${row}-${index}`} status={status} />
            ))
          )}
        </button>

        <p className="text-center">Dark</p>
      </div>
    </div>
  )
}

function LightCell({ status }: { status: LetterStatus }) {
  return (
    <div
      className={cn('h-5 w-5', {
        'bg-gray-600': status === 'absent',
        'bg-yellow-300': status === 'present',
        'bg-green-600': status === 'correct',
      })}
    />
  )
}
