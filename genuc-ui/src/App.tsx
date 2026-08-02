import { Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import Dashboard from '@/pages/Dashboard'
import Students from '@/pages/Students'
import Enroll from '@/pages/Enroll'
import Admissions from '@/pages/Admissions'
import Finance from '@/pages/Finance'
import Settings from '@/pages/Settings'
import Placeholder from '@/pages/Placeholder'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="enroll" element={<Enroll />} />
        <Route path="admissions" element={<Admissions />} />
        <Route path="finance" element={<Finance />} />
        <Route path="settings" element={<Settings />} />
        <Route path="analytics" element={<Placeholder title="Analytique" eyebrow="Pilotage" />} />
        <Route path="programs" element={<Placeholder title="Programmes" eyebrow="Scolarité" />} />
        <Route path="schedule" element={<Placeholder title="Emploi du temps" eyebrow="Scolarité" />} />
        <Route path="faculties" element={<Placeholder title="Facultés" eyebrow="Administration" />} />
        <Route path="compliance" element={<Placeholder title="Conformité" eyebrow="Administration" />} />
        <Route path="*" element={<Placeholder title="Page introuvable" eyebrow="404" />} />
      </Route>
    </Routes>
  )
}
