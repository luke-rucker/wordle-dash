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
import { useToast } from '@/components/ui/use-toast'
import { ProfileData, profileSchema } from '@/lib/profiles'
import { supabase } from '@/lib/supabase'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { useUpsertMutation } from '@supabase-cache-helpers/postgrest-react-query'
import { useForm } from 'react-hook-form'

export function CompleteProfileModal({ userId }: { userId: string }) {
  const form = useForm<ProfileData>({
    resolver: valibotResolver(profileSchema),
    values: {
      username: '',
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
