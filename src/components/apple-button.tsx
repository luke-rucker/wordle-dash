import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { AuthError } from '@supabase/supabase-js'
import { useMutation } from '@tanstack/react-query'

export function AppleButton({
  redirectTo,
  label = 'Continue with Apple',
  className,
}: {
  redirectTo?: string
  label?: string
  className?: string
}) {
  const { toast } = useToast()

  const signInWithApple = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
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
      type="button"
      className={cn('w-full', className)}
      disabled={signInWithApple.isLoading}
      onClick={() => signInWithApple.mutate()}
    >
      {signInWithApple.isLoading ? (
        <Icons.Spinner className="mr-2 h-4 w-4" />
      ) : null}
      <Icons.Apple className="mr-2 h-4 w-4" />
      {label}
    </Button>
  )
}
