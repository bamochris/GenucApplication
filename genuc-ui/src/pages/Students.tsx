import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Search, Filter, Plus, MoreHorizontal, ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/misc'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { students, type Student } from '@/lib/data'
import { cn } from '@/lib/utils'

const statusVariant = { Actif: 'success', 'En attente': 'warning', Diplômé: 'info', Suspendu: 'danger' } as const
const feesVariant = { Payé: 'success', Partiel: 'warning', Impayé: 'danger' } as const
const filters = ['Tous', 'Actif', 'En attente', 'Diplômé', 'Suspendu'] as const

export default function Students() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<(typeof filters)[number]>('Tous')

  const rows = useMemo(() => {
    const pool = students.concat(students.map((s, i) => ({ ...s, id: `dup-${i}` }))) // + de lignes
    return pool.filter((s) => {
      const matchQ =
        !query ||
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.matricule.toLowerCase().includes(query.toLowerCase())
      const matchF = filter === 'Tous' || s.status === filter
      return matchQ && matchF
    })
  }, [query, filter])

  return (
    <>
      <PageHeader
        eyebrow="Scolarité"
        title="Étudiants"
        subtitle={`${rows.length} étudiants correspondent à votre recherche.`}
        actions={
          <>
            <Button variant="secondary" size="sm">
              <Download /> Export CSV
            </Button>
            <Link to="/enroll" className={cn(buttonVariants({ size: 'sm' }))}>
              <Plus /> Inscrire
            </Link>
          </>
        }
      />

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="overflow-hidden">
          {/* Barre d’outils */}
          <div className="flex flex-col gap-3 border-b border-border/60 p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher par nom ou matricule…"
                aria-label="Rechercher un étudiant"
                className="h-10 w-full rounded-lg border border-input bg-white/[0.03] pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-border/60 bg-white/[0.02] p-1">
              <Filter className="ml-1.5 h-4 w-4 shrink-0 text-muted-foreground" />
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    filter === f
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground',
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Étudiant</TableHead>
                <TableHead className="hidden md:table-cell">Faculté</TableHead>
                <TableHead className="hidden lg:table-cell">Programme</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Frais</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, 8).map((s: Student, i) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar initials={s.avatar} seed={i} className="h-9 w-9" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{s.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{s.matricule}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{s.faculty}</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{s.program}</TableCell>
                  <TableCell>
                    <Badge variant="neutral">{s.year}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[s.status]}>{s.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={feesVariant[s.fees]}>{s.fees}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border/60 p-4 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              Affichage de <span className="font-semibold text-foreground">1–8</span> sur{' '}
              <span className="font-semibold text-foreground">{rows.length}</span>
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft /> Précédent
              </Button>
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  className={cn(
                    'h-9 w-9 rounded-md text-sm font-medium transition-colors',
                    p === 1 ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-white/[0.05]',
                  )}
                >
                  {p}
                </button>
              ))}
              <Button variant="outline" size="sm">
                Suivant <ChevronRight />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </>
  )
}
