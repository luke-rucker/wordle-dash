import { Cell } from '@/components/cell'
import { GoogleButton } from '@/components/google-button'
import { Icons } from '@/components/icons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { useTheme } from '@/contexts/theme-context'
import {
  AnonProfileData,
  ProfileData,
  anonProfileSchema,
  profileSchema,
} from '@/lib/profiles'
import { supabase } from '@/lib/supabase'
import { cn, countries, countryCodes, getFlag } from '@/lib/utils'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { LetterStatus } from '@party/lib/words/compare'
import * as RadioGroup from '@radix-ui/react-radio-group'
import {
  useQuery,
  useUpsertMutation,
} from '@supabase-cache-helpers/postgrest-react-query'
import { useSession } from '@supabase/auth-helpers-react'
import { Alpha2Code } from 'i18n-iso-countries'
import { useForm } from 'react-hook-form'
import { useLocalStorage } from 'usehooks-ts'
import ReactGA from 'react-ga4'

export function Settings() {
  const session = useSession()

  return (
    <div className="flex-grow container py-6 md:py-16">
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
          This is how Worlde Dash will look.
        </p>

        <ThemeSwitcher />
      </div>
    </div>
  )
}

function AnonProfileForm() {
  const [username, setUsername] = useLocalStorage('username', '')

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
          ReactGA.event('updated_profile', { user_type: 'anon' })
        })}
        className="space-y-8"
      >
        <Alert>
          <Icons.Info className="h-4 w-4" />
          <AlertTitle>You're signed out</AlertTitle>
          <AlertDescription>
            You can sign into or create your account to save your stats and
            compete on the leaderboard.
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

        <div className="flex items-center space-x-4">
          <Button>Save</Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => setUsername('')}
          >
            Clear
          </Button>
        </div>
      </form>
    </Form>
  )
}

function ProfileForm({ userId }: { userId: string }) {
  const profile = useQuery(
    supabase
      .from('profiles')
      .select('username,country')
      .eq('id', userId)
      .limit(1)
      .single()
  )

  const form = useForm<ProfileData>({
    resolver: valibotResolver(profileSchema),
    values: {
      username: profile.data?.username ?? '',
      country: (profile.data?.country as Alpha2Code) ?? 'US',
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
        ReactGA.event('updated_profile', { user_type: 'verified' })
      },
      onError: err => {
        if (err.code === '23505') {
          form.setError(
            'username',
            {
              message: 'Username is already taken',
            },
            { shouldFocus: true }
          )
        } else {
          toaster.toast({
            title: 'Uh oh! Something went wrong.',
            variant: 'destructive',
          })
        }
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
            <FormItem className="max-w-[300px]">
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

        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Country</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        'w-[300px] justify-between',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value
                        ? `${getFlag(field.value)} ${countries[field.value]}`
                        : 'Select country'}
                      <Icons.ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search countries..." />
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup>
                      <ScrollArea className="h-[300px]">
                        {countryCodes.map(countryCode => (
                          <CommandItem
                            value={`${countryCode} ${countries[countryCode]}`}
                            key={countryCode}
                            onSelect={() => {
                              form.setValue('country', countryCode)
                            }}
                          >
                            <Icons.Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                countryCode === field.value
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            {getFlag(countryCode)} {countries[countryCode]}
                          </CommandItem>
                        ))}
                      </ScrollArea>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>
                This is the country that will be displayed to your opponents and
                on the leaderboard.
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

const rows: Array<Array<LetterStatus>> = [
  ['a', 'a', 'c', 'p', 'a'],
  ['p', 'a', 'c', 'a', 'a'],
  ['p', 'p', 'c', 'a', 'a'],
  ['c', 'p', 'c', 'a', 'a'],
  ['c', 'a', 'c', 'c', 'a'],
  ['c', 'c', 'c', 'c', 'c'],
]

function ThemeSwitcher() {
  const theme = useTheme()

  return (
    <RadioGroup.Root
      onValueChange={v => theme.set(v as 'light' | 'dark')}
      defaultValue={theme.current}
      aria-label="Theme"
      className="flex space-x-6"
    >
      <div>
        <RadioGroup.Item
          id="l"
          value="light"
          className={cn(
            'grid grid-cols-5 gap-1 border-2 rounded p-3 bg-white border-white focus:outline-none',
            theme.current === 'light' && 'border-primary'
          )}
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
          <RadioGroup.Indicator />
        </RadioGroup.Item>

        <label htmlFor="l" className="block text-center pt-1">
          Light
        </label>
      </div>

      <div>
        <RadioGroup.Item
          id="d"
          value="dark"
          className={cn(
            'grid grid-cols-5 gap-1 border-2 rounded p-3 bg-[#04080F] border-[#04080F] focus:outline-none',
            theme.current === 'dark' && 'border-primary'
          )}
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
          <RadioGroup.Indicator />
        </RadioGroup.Item>

        <label htmlFor="d" className="block text-center pt-1">
          Dark
        </label>
      </div>
    </RadioGroup.Root>
  )
}
