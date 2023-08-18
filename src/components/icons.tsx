import { cn } from '@/lib/utils'
import {
  Laptop,
  Icon as LucideIcon,
  LucideProps,
  Moon,
  SunMedium,
  Loader2,
} from 'lucide-react'

export type Icon = LucideIcon

export const Icons = {
  Sun: SunMedium,
  Moon,
  Laptop,
  Spinner: (props: LucideProps) => (
    <Loader2 {...props} className={cn('animate-spin', props.className)} />
  ),
}
