import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { supabase } from '@/lib/supabase'
import { type User, type Session, PostgrestError } from '@supabase/supabase-js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { valibotResolver } from '@hookform/resolvers/valibot'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { Output, maxLength, minLength, object, regex, string } from 'valibot'
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
import { Icons } from '@/components/icons'

type AuthContextValue = {
  session: Session | null
  user?: User
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = React.useState(true)
  const [session, setSession] = React.useState<Session | null>(null)

  const profile = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session!.user.id!)
        .throwOnError()
      return res.data![0]
    },
    enabled: !!session,
  })

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = React.useMemo(
    () => ({ session, user: session?.user }),
    [session]
  )

  if (isLoading || profile.isLoading) {
    return <div>Loading</div>
  }

  return (
    <AuthContext.Provider value={value}>
      {!profile.data?.username ? <CompleteProfileModal /> : null}
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const authContext = React.useContext(AuthContext)
  if (!authContext) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return authContext
}

const completeProfileSchema = object({
  username: string('A username is required', [
    minLength(3, 'Needs to be at least 3 characters'),
    maxLength(24, 'Cannot be more than 24 characters'),
    regex(
      /^[a-zA-Z0-9-_]+$/,
      'Must only include letters, numbers, dashes, and underscores'
    ),
  ]),
})

type CompleteProfileData = Output<typeof completeProfileSchema>

function CompleteProfileModal() {
  const { user } = useAuth()

  const form = useForm<CompleteProfileData>({
    resolver: valibotResolver(completeProfileSchema),
    values: {
      username: '',
    },
  })

  const queryClient = useQueryClient()

  const updateProfileMutation = useMutation({
    mutationFn: async (profile: CompleteProfileData) => {
      await supabase
        .from('profiles')
        .update(profile)
        .eq('id', user!.id)
        .throwOnError()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries(['me'])
    },
    onError: (err: PostgrestError) => {
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
  })

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
              updateProfileMutation.mutate(data)
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
            disabled={updateProfileMutation.isLoading}
          >
            {updateProfileMutation.isLoading ? (
              <Icons.Spinner className="mr-2 h-4 w-4" />
            ) : null}
            Save
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
