import {
  LayoutDashboard,
  GraduationCap,
  Users,
  ClipboardCheck,
  Wallet,
  CalendarDays,
  BookOpen,
  BarChart3,
  ShieldCheck,
  Settings,
  Building2,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = { label: string; to: string; icon: LucideIcon; badge?: string }
export type NavSection = { title: string; items: NavItem[] }

export const navSections: NavSection[] = [
  {
    title: 'Pilotage',
    items: [
      { label: 'Tableau de bord', to: '/', icon: LayoutDashboard },
      { label: 'Analytique', to: '/analytics', icon: BarChart3 },
    ],
  },
  {
    title: 'Scolarité',
    items: [
      { label: 'Étudiants', to: '/students', icon: Users, badge: '2.4k' },
      { label: 'Admissions', to: '/admissions', icon: ClipboardCheck, badge: '18' },
      { label: 'Inscription', to: '/enroll', icon: GraduationCap },
      { label: 'Programmes', to: '/programs', icon: BookOpen },
      { label: 'Emploi du temps', to: '/schedule', icon: CalendarDays },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Facultés', to: '/faculties', icon: Building2 },
      { label: 'Finances', to: '/finance', icon: Wallet },
      { label: 'Conformité', to: '/compliance', icon: ShieldCheck },
      { label: 'Paramètres', to: '/settings', icon: Settings },
    ],
  },
]
