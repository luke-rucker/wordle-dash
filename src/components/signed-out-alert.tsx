import { AuthModal } from '@/components/auth-modal'
import { Icons } from '@/components/icons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export function SignedOutAlert({
  redirectTo,
  className,
}: {
  redirectTo?: string
  className?: string
}) {
  return (
    <Alert className={className}>
      <Icons.Info className="h-4 w-4" />
      <AlertTitle>You're signed out</AlertTitle>
      <AlertDescription>
        You can sign into or create your account to save your stats and compete
        on the global leaderboard.
        <AuthModal
          variant="signUp"
          redirectTo={redirectTo}
          trigger={<Button className="mt-2 block w-full">Sign up</Button>}
        />
      </AlertDescription>
    </Alert>
  )
}
