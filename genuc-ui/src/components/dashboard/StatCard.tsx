import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Stat = {
  label: string
  value: string
  delta: number
  hint: string
  icon: LucideIcon
  spark: number[]
}

function Sparkline({ points, up }: { points: number[]; up: boolean }) {
  const w = 96
  const h = 34
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const step = w / (points.length - 1)
  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${h - ((p - min) / range) * h}`)
    .join(' ')
  const stroke = up ? 'hsl(152,55%,55%)' : 'hsl(0,80%,68%)'
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="1" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill={`url(#sg-${up})`} />
      <path d={d} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function StatCard({ stat, index }: { stat: Stat; index: number }) {
  const up = stat.delta >= 0
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="glass group relative overflow-hidden rounded-xl p-5 shadow-glass"
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-80" />
      <div className="flex items-start justify-between">
        <div className="grid h-11 w-11 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <stat.icon className="h-5 w-5" />
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold',
            up ? 'bg-success/12 text-[hsl(152,55%,64%)]' : 'bg-destructive/12 text-[hsl(0,80%,72%)]',
          )}
        >
          {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {Math.abs(stat.delta)}%
        </span>
      </div>

      <div className="mt-4">
        <p className="text-sm text-muted-foreground">{stat.label}</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">{stat.value}</p>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <p className="text-xs text-muted-foreground">{stat.hint}</p>
        <Sparkline points={stat.spark} up={up} />
      </div>
    </motion.article>
  )
}
