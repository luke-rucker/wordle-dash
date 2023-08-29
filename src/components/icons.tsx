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
} from 'lucide-react'

export type Icon = LucideIcon

export const Icons = {
  Backspace: ArrowBigLeft,
  Sun: SunMedium,
  Moon,
  Laptop,
  Share,
  Settings,
  Spinner: (props: LucideProps) => (
    <Loader2 {...props} className={cn('animate-spin', props.className)} />
  ),
}
