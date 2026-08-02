import { motion } from 'framer-motion'
import { Wallet, TrendingUp, Clock, HandCoins, Download, ArrowUpRight } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/misc'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatCard, type Stat } from '@/components/dashboard/StatCard'
import { EnrollmentTrend } from '@/components/dashboard/charts'
import { formatCurrency } from '@/lib/utils'

const stats: Stat[] = [
  { label: 'Revenus (trim.)', value: '528 k$', delta: 5.6, hint: 'Objectif 92 %', icon: Wallet, spark: [40, 44, 50, 48, 58, 62, 70, 74] },
  { label: 'Frais encaissés', value: '312 k$', delta: 9.2, hint: '1 284 paiements', icon: HandCoins, spark: [22, 30, 34, 40, 44, 50, 58, 63] },
  { label: 'En attente', value: '48 k$', delta: -3.1, hint: '96 dossiers', icon: Clock, spark: [30, 34, 32, 38, 36, 33, 30, 28] },
  { label: 'Taux de recouvrement', value: '86,7 %', delta: 2.4, hint: 'Vs 84,3 % (T-1)', icon: TrendingUp, spark: [60, 62, 64, 63, 68, 70, 72, 75] },
]

type Tx = { name: string; ref: string; method: string; amount: number; status: 'Confirmé' | 'En attente' | 'Échoué' }
const txs: Tx[] = [
  { name: 'Amina Sow', ref: 'TXP-20260721-YAQ4UD', method: 'Mobile Money', amount: 50, status: 'Confirmé' },
  { name: 'Jean-Pierre Kabasele', ref: 'TXP-20260721-K2M9PL', method: 'Carte bancaire', amount: 120, status: 'Confirmé' },
  { name: 'Fatou Ndiaye', ref: 'TXP-20260720-Q7B4TR', method: 'Mobile Money', amount: 50, status: 'En attente' },
  { name: 'Grace Mbuyi', ref: 'TXP-20260720-XZ1M8N', method: 'Virement', amount: 340, status: 'Confirmé' },
  { name: 'Olivier Tshibangu', ref: 'TXP-20260719-D0P3QW', method: 'Mobile Money', amount: 50, status: 'Échoué' },
]
const txVariant = { Confirmé: 'success', 'En attente': 'warning', Échoué: 'danger' } as const

export default function Finance() {
  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Finances"
        subtitle="Encaissements, recouvrement et flux de trésorerie — Haute École de Commerce."
        actions={
          <Button variant="secondary" size="sm">
            <Download /> Rapport financier
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <StatCard key={s.label} stat={s} index={i} />
        ))}
      </div>

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
                <CardTitle>Flux de revenus</CardTitle>
                <CardDescription>Encaissements des frais et scolarité</CardDescription>
              </div>
              <Badge variant="success">
                <ArrowUpRight className="h-3.5 w-3.5" /> +12,4 %
              </Badge>
            </CardHeader>
            <CardContent>
              <EnrollmentTrend />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34, duration: 0.5 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Moyens de paiement</CardTitle>
              <CardDescription>Répartition des encaissements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Mobile Money', pct: 58, color: 'hsl(41,84%,60%)' },
                { label: 'Carte bancaire', pct: 26, color: 'hsl(212,92%,62%)' },
                { label: 'Virement', pct: 16, color: 'hsl(263,70%,68%)' },
              ].map((m) => (
                <div key={m.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="font-semibold text-foreground">{m.pct}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: m.color }} />
                  </div>
                </div>
              ))}
              <div className="rounded-lg bg-white/[0.03] p-4">
                <p className="text-xs text-muted-foreground">Ticket moyen</p>
                <p className="mt-1 text-2xl font-extrabold text-foreground">{formatCurrency(94)}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42, duration: 0.5 }} className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Transactions récentes</CardTitle>
            <CardDescription>Paiements confirmés par webhook opérateur</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Étudiant</TableHead>
                  <TableHead className="hidden md:table-cell">Référence</TableHead>
                  <TableHead>Moyen</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead className="pr-6">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txs.map((t, i) => (
                  <TableRow key={t.ref}>
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar initials={t.name.split(' ').map((p) => p[0]).join('')} seed={i} className="h-9 w-9" />
                        <span className="text-sm font-semibold text-foreground">{t.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">{t.ref}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.method}</TableCell>
                    <TableCell className="font-semibold text-foreground">{formatCurrency(t.amount)}</TableCell>
                    <TableCell className="pr-6">
                      <Badge variant={txVariant[t.status]}>{t.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}
