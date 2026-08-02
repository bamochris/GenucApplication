import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Sparkles, ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function Placeholder({ title, eyebrow }: { title: string; eyebrow?: string }) {
  return (
    <>
      <PageHeader eyebrow={eyebrow ?? 'Module'} title={title} subtitle="Cet écran fait partie de la suite GENUC." />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">« {title} » — en préparation</h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Ce module s’intègre au même système de design (bleu nuit &amp; or, surfaces en verre) que le tableau de bord.
              </p>
            </div>
            <Link to="/" className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}>
              <ArrowLeft /> Retour au tableau de bord
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </>
  )
}
