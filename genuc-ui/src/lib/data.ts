// Données de démonstration (statique) pour la vitrine UI.

export const CHART = {
  gold: 'hsl(41, 84%, 60%)',
  goldSoft: 'hsl(41, 80%, 72%)',
  blue: 'hsl(212, 92%, 62%)',
  teal: 'hsl(180, 70%, 52%)',
  violet: 'hsl(263, 70%, 68%)',
  rose: 'hsl(342, 78%, 64%)',
  grid: 'hsl(214, 33%, 24%)',
  axis: 'hsl(214, 20%, 62%)',
}

export const enrollmentTrend = [
  { mois: 'Sep', inscriptions: 820, revenus: 142 },
  { mois: 'Oct', inscriptions: 1120, revenus: 205 },
  { mois: 'Nov', inscriptions: 1340, revenus: 268 },
  { mois: 'Déc', inscriptions: 990, revenus: 231 },
  { mois: 'Jan', inscriptions: 1680, revenus: 342 },
  { mois: 'Fév', inscriptions: 1890, revenus: 398 },
  { mois: 'Mar', inscriptions: 2150, revenus: 471 },
  { mois: 'Avr', inscriptions: 2380, revenus: 528 },
]

export const facultyBars = [
  { faculte: 'Informatique', etudiants: 1240 },
  { faculte: 'Droit', etudiants: 980 },
  { faculte: 'Médecine', etudiants: 1520 },
  { faculte: 'Économie', etudiants: 1105 },
  { faculte: 'Lettres', etudiants: 640 },
  { faculte: 'Sciences', etudiants: 870 },
]

export const admissionSplit = [
  { name: 'Admission directe', value: 62, color: CHART.gold },
  { name: 'Test d’admission', value: 26, color: CHART.blue },
  { name: 'Transfert', value: 12, color: CHART.violet },
]

export type Student = {
  id: string
  name: string
  matricule: string
  faculty: string
  program: string
  year: string
  status: 'Actif' | 'En attente' | 'Diplômé' | 'Suspendu'
  fees: 'Payé' | 'Partiel' | 'Impayé'
  avatar: string
}

const initials = (n: string) =>
  n.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()

const raw: Omit<Student, 'avatar'>[] = [
  { id: '1', name: 'Amina Sow', matricule: 'HECKIN202500142', faculty: 'Informatique', program: 'Génie logiciel', year: 'L3', status: 'Actif', fees: 'Payé' },
  { id: '2', name: 'Jean-Pierre Kabasele', matricule: 'HECKIN202500087', faculty: 'Droit', program: 'Droit privé', year: 'L2', status: 'Actif', fees: 'Partiel' },
  { id: '3', name: 'Fatou Ndiaye', matricule: 'HECKIN202500311', faculty: 'Médecine', program: 'Médecine générale', year: 'L1', status: 'En attente', fees: 'Impayé' },
  { id: '4', name: 'Christian Bamo', matricule: 'HECKIN202400021', faculty: 'Économie', program: 'Finance', year: 'M1', status: 'Diplômé', fees: 'Payé' },
  { id: '5', name: 'Grace Mbuyi', matricule: 'HECKIN202500256', faculty: 'Informatique', program: 'Data Science', year: 'L3', status: 'Actif', fees: 'Payé' },
  { id: '6', name: 'Olivier Tshibangu', matricule: 'HECKIN202500198', faculty: 'Sciences', program: 'Physique', year: 'L2', status: 'Suspendu', fees: 'Impayé' },
  { id: '7', name: 'Sarah Lutumba', matricule: 'HECKIN202500403', faculty: 'Lettres', program: 'Langues', year: 'L1', status: 'Actif', fees: 'Partiel' },
  { id: '8', name: 'Emmanuel Kalala', matricule: 'HECKIN202400174', faculty: 'Économie', program: 'Comptabilité', year: 'M2', status: 'Actif', fees: 'Payé' },
]

export const students: Student[] = raw.map((s) => ({ ...s, avatar: initials(s.name) }))

export const activity = [
  { who: 'Amina Sow', action: 'a soumis son dossier d’inscription', when: 'il y a 4 min', tone: 'gold' as const },
  { who: 'Service Admissions', action: 'a validé 12 candidatures — Médecine', when: 'il y a 22 min', tone: 'blue' as const },
  { who: 'Fatou Ndiaye', action: 'paiement des frais confirmé (webhook)', when: 'il y a 1 h', tone: 'green' as const },
  { who: 'Agent d’admissions', action: 'a convoqué 3 candidats au test', when: 'il y a 2 h', tone: 'violet' as const },
]
