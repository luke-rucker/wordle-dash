import { GoogleButton } from '@/components/google-button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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

        <GoogleButton redirectTo={redirectTo} />
      </DialogContent>
    </Dialog>
  )
}
