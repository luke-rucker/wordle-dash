import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
} from '@/components/ui/select'
import { usePet, useSettingsStore, useUsername } from '@/stores/settings-store'
import * as React from 'react'

export function SettingsModal() {
  const [open, setOpen] = React.useState(false)

  const savedUsername = useUsername()
  const savedPet = usePet()

  const [username, setUsername] = React.useState(savedUsername)
  const [pet, setPet] = React.useState(savedPet)

  const setSettings = useSettingsStore(state => state.setSettings)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost">
          <Icons.Settings className="w-4 h-4" />
          <span className="sr-only">Edit Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Settings</DialogTitle>
          <DialogDescription>
            Make changes to your settings here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <form
          id="settings"
          className="grid gap-4 py-4"
          onSubmit={e => {
            e.preventDefault()
            setSettings({
              username,
              pet,
            })
            setOpen(false)
          }}
        >
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input
              id="username"
              placeholder="WordleMaster"
              value={username || ''}
              onChange={e => setUsername(e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pet" className="text-right">
              Pet
            </Label>
            <Select value={pet} onValueChange={val => setPet(val as any)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Pick your favorite pet" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Pets</SelectLabel>
                  <SelectItem value="dog">Dogs</SelectItem>
                  <SelectItem value="cat">Cats</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </form>

        <DialogFooter>
          <Button type="submit" form="settings">
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
