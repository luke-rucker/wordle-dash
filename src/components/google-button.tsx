import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { AuthError } from '@supabase/supabase-js'
import { useMutation } from '@tanstack/react-query'

export function GoogleButton({
  redirectTo,
  label = 'Continue with Google',
  className,
}: {
  redirectTo?: string
  label?: string
  className?: string
}) {
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
    <Button
      className={cn('w-full', className)}
      disabled={signInWithGoogle.isLoading}
      onClick={() => signInWithGoogle.mutate()}
    >
      {signInWithGoogle.isLoading ? (
        <Icons.Spinner className="mr-2 h-4 w-4" />
      ) : null}
      <Icons.Google className="mr-2 h-4 w-4" />
      {label}
    </Button>
  )
}
