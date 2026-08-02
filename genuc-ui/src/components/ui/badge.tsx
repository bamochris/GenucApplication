import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-primary/25 bg-primary/12 text-primary',
        neutral: 'border-border bg-white/[0.04] text-muted-foreground',
        success: 'border-success/25 bg-success/12 text-[hsl(152,55%,64%)]',
        warning: 'border-[hsl(38,90%,55%)]/25 bg-[hsl(38,90%,55%)]/12 text-[hsl(38,90%,66%)]',
        danger: 'border-destructive/30 bg-destructive/12 text-[hsl(0,80%,72%)]',
        info: 'border-[hsl(212,92%,62%)]/25 bg-[hsl(212,92%,62%)]/12 text-[hsl(212,92%,74%)]',
        violet: 'border-[hsl(263,70%,68%)]/25 bg-[hsl(263,70%,68%)]/12 text-[hsl(263,70%,80%)]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { badgeVariants }
