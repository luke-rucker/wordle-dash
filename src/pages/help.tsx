import { Separator } from '@/components/ui/separator'

export function Help() {
  return (
    <div className="flex-grow container py-6 md:py-16">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Help</h2>

        <p className="text-muted-foreground">
          Manage your account settings and visual preferences.
        </p>
      </div>

      <Separator className="my-6" />
    </div>
  )
}
