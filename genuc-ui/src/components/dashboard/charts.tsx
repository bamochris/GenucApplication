import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from 'recharts'
import { CHART, enrollmentTrend, facultyBars, admissionSplit } from '@/lib/data'

type TooltipEntry = { name?: string; value?: number | string; color?: string }

function ChartTooltip({
  active,
  payload,
  label,
  suffix,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
  suffix?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-strong rounded-lg border border-border/70 px-3 py-2 text-xs shadow-xl">
      {label && <p className="mb-1 font-semibold text-foreground">{label}</p>}
      {payload.map((e, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full" style={{ background: e.color }} />
          <span className="text-muted-foreground">{e.name}</span>
          <span className="ml-auto font-semibold text-foreground">
            {e.value}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  )
}

export function EnrollmentTrend() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={enrollmentTrend} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="areaGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.gold} stopOpacity={0.42} />
            <stop offset="100%" stopColor={CHART.gold} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="areaBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.blue} stopOpacity={0.3} />
            <stop offset="100%" stopColor={CHART.blue} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 6" stroke={CHART.grid} vertical={false} />
        <XAxis dataKey="mois" tickLine={false} axisLine={false} tick={{ fill: CHART.axis, fontSize: 12 }} dy={8} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: CHART.axis, fontSize: 12 }} width={44} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: CHART.gold, strokeOpacity: 0.3 }} />
        <Area
          type="monotone"
          dataKey="inscriptions"
          name="Inscriptions"
          stroke={CHART.gold}
          strokeWidth={2.5}
          fill="url(#areaGold)"
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="revenus"
          name="Revenus (k$)"
          stroke={CHART.blue}
          strokeWidth={2.5}
          fill="url(#areaBlue)"
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function FacultyBars() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={facultyBars} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 6" stroke={CHART.grid} vertical={false} />
        <XAxis dataKey="faculte" tickLine={false} axisLine={false} tick={{ fill: CHART.axis, fontSize: 11 }} dy={8} interval={0} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: CHART.axis, fontSize: 12 }} width={44} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(41,84%,60%,0.06)' }} />
        <Bar dataKey="etudiants" name="Étudiants" radius={[7, 7, 0, 0]} maxBarSize={44}>
          {facultyBars.map((_, i) => (
            <Cell key={i} fill={i % 2 === 0 ? CHART.gold : CHART.blue} fillOpacity={0.9} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function AdmissionDonut() {
  const total = admissionSplit.reduce((s, d) => s + d.value, 0)
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Tooltip content={<ChartTooltip suffix="%" />} />
          <Pie
            data={admissionSplit}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={92}
            paddingAngle={3}
            stroke="none"
          >
            {admissionSplit.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-foreground">{total}%</span>
        <span className="text-[11px] text-muted-foreground">Taux d’admission</span>
      </div>
    </div>
  )
}
