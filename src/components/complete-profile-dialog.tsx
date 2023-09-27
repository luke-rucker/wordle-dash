import { Icons } from '@/components/icons'
import {
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialog,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  Form,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/use-toast'
import { ProfileData, profileSchema } from '@/lib/profiles'
import { supabase } from '@/lib/supabase'
import { cn, countries, countryCodes, getFlag } from '@/lib/utils'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useUpsertMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { useForm } from 'react-hook-form'

export function CompleteProfileModal({ userId }: { userId: string }) {
  const form = useForm<ProfileData>({
    resolver: valibotResolver(profileSchema),
    values: {
      username: '',
      country: 'US',
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
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Complete your Profile</AlertDialogTitle>
          <AlertDialogDescription>
            You need to pick a username. This is what you will be known by to
            other users.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form
            id="completeProfile"
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
                            ? `${getFlag(field.value)} ${
                                countries[field.value]
                              }`
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
                    This is the country that will be displayed to your opponents
                    and on the leaderboard.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <AlertDialogFooter>
          <AlertDialogAction
            type="submit"
            form="completeProfile"
            disabled={updateProfile.isLoading}
          >
            {updateProfile.isLoading ? (
              <Icons.Spinner className="mr-2 h-4 w-4" />
            ) : null}
            Save
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
