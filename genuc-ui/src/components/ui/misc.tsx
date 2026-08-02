import * as React from 'react'
import { cn } from '@/lib/utils'

// ── Progress ────────────────────────────────────────────────────────────
export function Progress({
  value = 0,
  className,
  indicatorClassName,
}: {
  value?: number
  className?: string
  indicatorClassName?: string
}) {
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-white/[0.06]', className)}
    >
      <div
        className={cn('h-full rounded-full bg-gradient-to-r from-primary to-[hsl(41,84%,52%)] transition-all', indicatorClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

// ── Avatar (initiales) ──────────────────────────────────────────────────
const avatarTones = [
  'from-[hsl(41,84%,60%)] to-[hsl(38,80%,48%)] text-[hsl(222,47%,10%)]',
  'from-[hsl(212,92%,62%)] to-[hsl(224,80%,52%)] text-white',
  'from-[hsl(263,70%,68%)] to-[hsl(272,70%,54%)] text-white',
  'from-[hsl(180,70%,52%)] to-[hsl(190,72%,42%)] text-[hsl(200,60%,10%)]',
  'from-[hsl(342,78%,64%)] to-[hsl(350,72%,52%)] text-white',
]

export function Avatar({
  initials,
  className,
  seed = 0,
}: {
  initials: string
  className?: string
  seed?: number
}) {
  const tone = avatarTones[Math.abs(seed) % avatarTones.length]
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold ring-1 ring-white/10',
        tone,
        className,
      )}
    >
      {initials}
    </span>
  )
}

// ── Separator ───────────────────────────────────────────────────────────
export function Separator({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-border/70', className)} />
}

// ── Kbd ─────────────────────────────────────────────────────────────────
export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
      {children}
    </kbd>
  )
}

// ── Switch (toggle accessible) ──────────────────────────────────────────
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        checked ? 'bg-primary' : 'bg-white/[0.12]',
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  )
}
