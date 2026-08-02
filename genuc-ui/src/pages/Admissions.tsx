import { motion } from 'framer-motion'
import { Plus, GripVertical, Clock, GraduationCap } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/misc'

type Candidate = { name: string; filiere: string; ref: string; pct: number; exetat: boolean }
type Column = { key: string; title: string; tone: string; dot: string; items: Candidate[] }

const columns: Column[] = [
  {
    key: 'new',
    title: 'Nouveaux dossiers',
    tone: 'default',
    dot: 'bg-primary',
    items: [
      { name: 'Amina Sow', filiere: 'Génie logiciel', ref: 'HADOS-2026-000142', pct: 72, exetat: true },
      { name: 'Yannick Ilunga', filiere: 'Droit privé', ref: 'HADOS-2026-000151', pct: 58, exetat: true },
      { name: 'Divine Mputu', filiere: 'Comptabilité', ref: 'HADOS-2026-000160', pct: 81, exetat: false },
    ],
  },
  {
    key: 'verify',
    title: 'Vérification agent',
    tone: 'info',
    dot: 'bg-[hsl(212,92%,62%)]',
    items: [
      { name: 'Fatou Ndiaye', filiere: 'Médecine générale', ref: 'HADOS-2026-000119', pct: 88, exetat: true },
      { name: 'Patrick Kasongo', filiere: 'Data Science', ref: 'HADOS-2026-000122', pct: 64, exetat: true },
    ],
  },
  {
    key: 'test',
    title: 'Test d’admission',
    tone: 'warning',
    dot: 'bg-[hsl(38,90%,55%)]',
    items: [
      { name: 'Josué Mbala', filiere: 'Médecine générale', ref: 'HADOS-2026-000108', pct: 54, exetat: true },
      { name: 'Rachel Onya', filiere: 'Génie logiciel', ref: 'HADOS-2026-000131', pct: 49, exetat: false },
    ],
  },
  {
    key: 'valid',
    title: 'Admission validée',
    tone: 'success',
    dot: 'bg-[hsl(152,55%,55%)]',
    items: [
      { name: 'Grace Mbuyi', filiere: 'Data Science', ref: 'HADOS-2026-000090', pct: 91, exetat: true },
      { name: 'Emmanuel Kalala', filiere: 'Finance', ref: 'HADOS-2026-000077', pct: 85, exetat: true },
      { name: 'Sarah Lutumba', filiere: 'Langues', ref: 'HADOS-2026-000101', pct: 76, exetat: true },
    ],
  },
]

function CandidateCard({ c, index }: { c: Candidate; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -2 }}
      className="group cursor-grab rounded-lg border border-border/60 bg-white/[0.03] p-3.5 transition-colors hover:border-primary/30"
    >
      <div className="mb-2 flex items-start gap-2.5">
        <Avatar initials={c.name.split(' ').map((p) => p[0]).join('')} seed={index} className="h-8 w-8" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
          <p className="truncate text-xs text-muted-foreground">{c.filiere}</p>
        </div>
        <GripVertical className="h-4 w-4 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p className="mb-2.5 font-mono text-[11px] text-muted-foreground/80">{c.ref}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant={c.pct >= 60 ? 'success' : 'warning'}>
          <GraduationCap className="h-3 w-3" /> {c.pct}%
        </Badge>
        {c.exetat ? (
          <Badge variant="info">EXETAT</Badge>
        ) : (
          <Badge variant="danger">EXETAT manquant</Badge>
        )}
      </div>
    </motion.div>
  )
}

export default function Admissions() {
  return (
    <>
      <PageHeader
        eyebrow="Scolarité"
        title="Admissions"
        subtitle="Suivi des dossiers par étape du processus d’admission — campagne 2025–2026."
        actions={
          <Button size="sm">
            <Plus /> Nouveau dossier
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((col, ci) => (
          <motion.section
            key={col.key}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: ci * 0.08, duration: 0.5 }}
            className="glass flex flex-col rounded-xl p-3"
          >
            <header className="mb-3 flex items-center gap-2 px-1">
              <span className={`h-2.5 w-2.5 rounded-full ${col.dot}`} />
              <h2 className="text-sm font-semibold text-foreground">{col.title}</h2>
              <Badge variant="neutral" className="ml-auto">
                {col.items.length}
              </Badge>
            </header>
            <div className="flex flex-col gap-2.5">
              {col.items.map((c, i) => (
                <CandidateCard key={c.ref} c={c} index={i} />
              ))}
              <button className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                <Plus className="h-3.5 w-3.5" /> Ajouter
              </button>
            </div>
            <p className="mt-3 flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground/70">
              <Clock className="h-3 w-3" /> Mise à jour il y a 5 min
            </p>
          </motion.section>
        ))}
      </div>
    </>
  )
}
