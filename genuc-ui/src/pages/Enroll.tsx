import { useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { User, GraduationCap, FileCheck2, Check, Upload, Info, type LucideIcon } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input, Label, Select, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/misc'

function Section({
  icon: Icon,
  step,
  title,
  desc,
  children,
}: {
  icon: LucideIcon
  step: number
  title: string
  desc: string
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <CardTitle>
            <span className="text-primary/80">Étape {step}.</span> {title}
          </CardTitle>
          <CardDescription>{desc}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

const Field = ({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) => (
  <div>
    <Label>{label}</Label>
    {children}
    {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
  </div>
)

export default function Enroll() {
  const [annee, setAnnee] = useState('2024')
  const exetatRequis = Number(annee) >= 2022

  return (
    <>
      <PageHeader
        eyebrow="Scolarité"
        title="Nouvelle inscription"
        subtitle="Créez le dossier d’un candidat. Aucun compte n’est requis pour démarrer."
        actions={
          <>
            <Button variant="secondary" size="sm">
              Enregistrer le brouillon
            </Button>
            <Button size="sm">
              <Check /> Soumettre le dossier
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4 lg:col-span-2"
        >
          <Section icon={User} step={1} title="Informations personnelles" desc="Identité et coordonnées du candidat.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nom">
                <Input placeholder="SOW" />
              </Field>
              <Field label="Prénom">
                <Input placeholder="Amina" />
              </Field>
              <Field label="Adresse e-mail">
                <Input type="email" placeholder="amina.sow@example.cd" />
              </Field>
              <Field label="Téléphone">
                <Input placeholder="+243 81 000 0000" />
              </Field>
              <Field label="Sexe">
                <Select defaultValue="F">
                  <option value="F">Féminin</option>
                  <option value="M">Masculin</option>
                </Select>
              </Field>
              <Field label="Date de naissance">
                <Input type="date" />
              </Field>
            </div>
          </Section>

          <Section icon={GraduationCap} step={2} title="Parcours académique" desc="Diplôme d’État et filière visée.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Faculté">
                <Select defaultValue="info">
                  <option value="info">Informatique</option>
                  <option value="droit">Droit</option>
                  <option value="med">Médecine</option>
                  <option value="eco">Économie</option>
                </Select>
              </Field>
              <Field label="Filière">
                <Select defaultValue="gl">
                  <option value="gl">Génie logiciel</option>
                  <option value="ds">Data Science</option>
                  <option value="rt">Réseaux & Télécoms</option>
                </Select>
              </Field>
              <Field label="École secondaire">
                <Input placeholder="Collège Boboto" />
              </Field>
              <Field label="Pourcentage au diplôme">
                <Input placeholder="72" />
              </Field>
              <Field label="Année d’obtention">
                <Input value={annee} onChange={(e) => setAnnee(e.target.value)} placeholder="2024" />
              </Field>
              <Field
                label="Code EXETAT"
                hint={exetatRequis ? 'Obligatoire pour un diplôme obtenu en 2022 ou après.' : 'À renseigner si disponible.'}
              >
                <Input placeholder="24-1-0123456" />
              </Field>
            </div>
            {exetatRequis && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-[hsl(212,92%,62%)]/20 bg-[hsl(212,92%,62%)]/[0.08] p-3 text-xs text-[hsl(212,92%,78%)]">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                Le code EXETAT sera vérifié sur la plateforme officielle par l’agent d’admissions.
              </div>
            )}
          </Section>

          <Section icon={FileCheck2} step={3} title="Pièces justificatives" desc="Documents requis par la filière.">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {['Photo passeport', 'Acte de naissance', 'Diplôme d’État', 'Relevé de notes'].map((doc, i) => (
                <label
                  key={doc}
                  className="group flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border/70 bg-white/[0.02] p-3.5 transition-colors hover:border-primary/40 hover:bg-white/[0.04]"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/[0.05] text-muted-foreground group-hover:text-primary">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{doc}</p>
                    <p className="text-xs text-muted-foreground">PDF ou image · 5 Mo max</p>
                  </div>
                  {i < 2 && <Badge variant="danger" className="ml-auto">Requis</Badge>}
                  <input type="file" className="sr-only" />
                </label>
              ))}
            </div>
            <Field label="Notes complémentaires" hint="Optionnel">
              <Textarea className="mt-3" placeholder="Informations utiles au traitement du dossier…" />
            </Field>
          </Section>
        </motion.div>

        {/* Résumé */}
        <motion.aside
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Récapitulatif</CardTitle>
              <CardDescription>Progression du dossier</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                {[
                  { label: 'Informations personnelles', done: true },
                  { label: 'Parcours académique', done: true },
                  { label: 'Pièces justificatives', done: false },
                  { label: 'Paiement des frais', done: false },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span
                      className={
                        s.done
                          ? 'grid h-6 w-6 place-items-center rounded-full bg-success/20 text-[hsl(152,55%,64%)]'
                          : 'grid h-6 w-6 place-items-center rounded-full border border-border text-muted-foreground'
                      }
                    >
                      {s.done ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />}
                    </span>
                    <span className={s.done ? 'text-sm text-foreground' : 'text-sm text-muted-foreground'}>{s.label}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="rounded-lg bg-white/[0.03] p-4">
                <p className="text-xs text-muted-foreground">Frais de dossier estimés</p>
                <p className="mt-1 text-2xl font-extrabold text-foreground">
                  50 <span className="text-base font-semibold text-muted-foreground">USD</span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Payables après soumission via TachPay.</p>
              </div>

              <Button className="w-full">
                <Check /> Soumettre le dossier
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                En soumettant, vous acceptez le règlement de l’établissement.
              </p>
            </CardContent>
          </Card>
        </motion.aside>
      </div>
    </>
  )
}
