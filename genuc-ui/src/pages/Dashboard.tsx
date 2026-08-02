import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Users, GraduationCap, Wallet, ClipboardCheck, Plus, Download, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/misc'
import { StatCard, type Stat } from '@/components/dashboard/StatCard'
import { EnrollmentTrend, FacultyBars, AdmissionDonut } from '@/components/dashboard/charts'
import { admissionSplit, activity, students } from '@/lib/data'

const stats: Stat[] = [
  { label: 'Étudiants inscrits', value: '6 462', delta: 12.4, hint: '+712 ce trimestre', icon: Users, spark: [30, 42, 38, 55, 60, 72, 68, 85] },
  { label: 'Dossiers d’admission', value: '318', delta: 8.1, hint: '18 en attente', icon: ClipboardCheck, spark: [20, 28, 26, 40, 46, 52, 60, 66] },
  { label: 'Revenus (trim.)', value: '528 k$', delta: 5.6, hint: 'Frais + scolarité', icon: Wallet, spark: [40, 44, 50, 48, 58, 62, 70, 74] },
  { label: 'Taux de réussite', value: '87,3 %', delta: -1.2, hint: 'Session 2024–2025', icon: GraduationCap, spark: [70, 72, 68, 74, 71, 69, 66, 64] },
]

const toneDot: Record<string, string> = {
  gold: 'bg-primary',
  blue: 'bg-[hsl(212,92%,62%)]',
  green: 'bg-[hsl(152,55%,55%)]',
  violet: 'bg-[hsl(263,70%,68%)]',
}

const statusVariant = { Actif: 'success', 'En attente': 'warning', Diplômé: 'info', Suspendu: 'danger' } as const

export default function Dashboard() {
  return (
    <>
      <PageHeader
        eyebrow="Bonjour, Christian 👋"
        title="Vue d’ensemble"
        subtitle="Pilotage en temps réel des inscriptions, admissions et finances — Haute École de Commerce, Kinshasa."
        actions={
          <>
            <Button variant="secondary" size="sm">
              <Download /> Exporter
            </Button>
            <Button size="sm">
              <Plus /> Nouvel étudiant
            </Button>
          </>
        }
      />

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <StatCard key={s.label} stat={s} index={i} />
        ))}
      </div>

      {/* Charts principaux */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Tendance des inscriptions</CardTitle>
                <CardDescription>Inscriptions et revenus sur 8 mois</CardDescription>
              </div>
              <Badge variant="success">
                <TrendingUp className="h-3.5 w-3.5" /> +18,6 %
              </Badge>
            </CardHeader>
            <CardContent>
              <EnrollmentTrend />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34, duration: 0.5 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Modes d’admission</CardTitle>
              <CardDescription>Répartition de la campagne 2025</CardDescription>
            </CardHeader>
            <CardContent>
              <AdmissionDonut />
              <ul className="mt-4 space-y-2">
                {admissionSplit.map((d) => (
                  <li key={d.name} className="flex items-center gap-2 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="ml-auto font-semibold text-foreground">{d.value}%</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts secondaires + listes */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader>
              <CardTitle>Effectifs par faculté</CardTitle>
              <CardDescription>Répartition des étudiants actifs</CardDescription>
            </CardHeader>
            <CardContent>
              <FacultyBars />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.46, duration: 0.5 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Activité récente</CardTitle>
              <CardDescription>Derniers événements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activity.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${toneDot[a.tone]}`} />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">{a.who}</span>{' '}
                      <span className="text-muted-foreground">{a.action}</span>
                    </p>
                    <p className="text-xs text-muted-foreground/80">{a.when}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Aperçu table */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.52, duration: 0.5 }}
        className="mt-4"
      >
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Inscriptions récentes</CardTitle>
              <CardDescription>Les 5 derniers dossiers traités</CardDescription>
            </div>
            <Link to="/students" className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}>
              Voir tout
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y divide-border/50">
              {students.slice(0, 5).map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 py-3">
                  <Avatar initials={s.avatar} seed={i} className="h-10 w-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.matricule} · {s.faculty}
                    </p>
                  </div>
                  <Badge variant="neutral" className="hidden sm:inline-flex">
                    {s.year}
                  </Badge>
                  <Badge variant={statusVariant[s.status]}>{s.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}
