import { cn } from '@/lib/utils'
import {
  Laptop,
  Icon as LucideIcon,
  LucideProps,
  Moon,
  SunMedium,
  Loader2,
  Share,
  Settings,
  ArrowBigLeft,
  LogIn,
  LogOut,
  User,
  BarChart3,
} from 'lucide-react'

export type Icon = LucideIcon

export const Icons = {
  Backspace: ArrowBigLeft,
  Sun: SunMedium,
  Moon,
  Laptop,
  Share,
  Settings,
  Stats: BarChart3,
  LogIn,
  LogOut,
  User,
  Spinner: (props: LucideProps) => (
    <Loader2 {...props} className={cn('animate-spin', props.className)} />
  ),
}
