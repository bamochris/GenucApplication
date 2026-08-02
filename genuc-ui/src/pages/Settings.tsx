import { useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Bell, ShieldCheck, Check } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input, Label, Select } from '@/components/ui/input'
import { Switch, Separator } from '@/components/ui/misc'

function ToggleRow({
  title,
  desc,
  defaultOn = false,
}: {
  title: string
  desc: string
  defaultOn?: boolean
}) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch checked={on} onChange={setOn} label={title} />
    </div>
  )
}

const sections = [
  { icon: Building2, label: 'Établissement', active: true },
  { icon: Bell, label: 'Notifications', active: false },
  { icon: ShieldCheck, label: 'Sécurité', active: false },
]

export default function Settings() {
  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Paramètres"
        subtitle="Configuration de l’établissement, des notifications et de la sécurité."
        actions={
          <Button size="sm">
            <Check /> Enregistrer
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
        {/* Sous-navigation */}
        <motion.aside initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <Card className="lg:sticky lg:top-24">
            <nav className="flex flex-row gap-1 p-2 lg:flex-col">
              {sections.map((s) => (
                <button
                  key={s.label}
                  className={
                    s.active
                      ? 'flex flex-1 items-center gap-2.5 rounded-lg bg-primary/12 px-3 py-2.5 text-sm font-semibold text-primary'
                      : 'flex flex-1 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground'
                  }
                >
                  <s.icon className="h-[18px] w-[18px]" />
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              ))}
            </nav>
          </Card>
        </motion.aside>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="space-y-4"
        >
          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Profil de l’établissement</CardTitle>
                <CardDescription>Informations affichées aux candidats.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Nom de l’établissement</Label>
                  <Input defaultValue="Haute École de Commerce — Kinshasa" />
                </div>
                <div>
                  <Label>Sigle</Label>
                  <Input defaultValue="HEC-KIN" />
                </div>
                <div>
                  <Label>Devise</Label>
                  <Select defaultValue="usd">
                    <option value="usd">USD / CDF</option>
                    <option value="cdf">CDF</option>
                    <option value="eur">EUR</option>
                  </Select>
                </div>
                <div>
                  <Label>Frais de dossier</Label>
                  <Input defaultValue="50" />
                </div>
                <div>
                  <Label>Année académique</Label>
                  <Select defaultValue="2025">
                    <option value="2025">2025–2026</option>
                    <option value="2024">2024–2025</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Alertes du secrétariat et des admissions.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="divide-y divide-border/50 py-0">
              <ToggleRow title="Nouveau dossier reçu" desc="E-mail à l’agent d’admissions à chaque soumission." defaultOn />
              <ToggleRow title="Paiement confirmé" desc="Notification lors de la confirmation par webhook." defaultOn />
              <ToggleRow title="Test d’admission" desc="Rappel quand un candidat doit être convoqué." />
              <ToggleRow title="Résumé hebdomadaire" desc="Rapport des inscriptions chaque lundi." defaultOn />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Sécurité</CardTitle>
                <CardDescription>Protection des comptes administrateurs.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="py-0">
              <div className="divide-y divide-border/50">
                <ToggleRow title="Authentification à deux facteurs (2FA)" desc="TOTP obligatoire pour les administrateurs." defaultOn />
                <ToggleRow title="Vérification EXETAT" desc="Bloquer la validation sans vérification (diplôme ≥ 2022)." defaultOn />
                <ToggleRow title="Journal d’audit" desc="Tracer toutes les actions sensibles." defaultOn />
              </div>
              <Separator className="my-4" />
              <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-destructive/25 bg-destructive/[0.06] p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-[hsl(0,80%,74%)]">Réinitialiser les sessions</p>
                  <p className="text-xs text-muted-foreground">Déconnecte tous les appareils administrateurs.</p>
                </div>
                <Button variant="destructive" size="sm">
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  )
}
