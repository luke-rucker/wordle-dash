import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'
import { type AuthError } from '@supabase/supabase-js'
import { useMutation } from '@tanstack/react-query'
import * as React from 'react'

export function AuthModal({
  trigger,
  variant = 'signIn',
  redirectTo,
}: {
  trigger: React.ReactNode
  variant: 'signUp' | 'signIn'
  redirectTo?: string
}) {
  const [open, setOpen] = React.useState(false)

  const { toast } = useToast()

  const signInWithGoogle = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo
            ? `${window.location.origin}${redirectTo}`
            : undefined,
        },
      })
      console.log({ error })
      if (error) throw error
    },
    onError: (err: AuthError) =>
      toast({
        variant: 'destructive',
        title: 'Uh oh!',
        description: err.message,
      }),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {variant === 'signIn'
              ? 'Sign in to Wordle Dash'
              : 'Sign up for Wordle Dash'}
          </DialogTitle>
          <DialogDescription>
            {variant === 'signIn'
              ? 'Welcome back :)'
              : 'Users with an account can save their stats across devices.'}
          </DialogDescription>
        </DialogHeader>

        <Button
          className="w-full"
          disabled={signInWithGoogle.isLoading}
          onClick={() => signInWithGoogle.mutate()}
        >
          {signInWithGoogle.isLoading ? (
            <Icons.Spinner className="mr-2 h-4 w-4" />
          ) : null}
          Continue with Google
        </Button>
      </DialogContent>
    </Dialog>
  )
}
