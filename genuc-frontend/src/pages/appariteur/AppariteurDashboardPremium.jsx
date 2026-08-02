// Variante « premium » (bleu nuit & or) du tableau de bord Appariteur.
import {
  FaBuilding, FaCheckCircle, FaCalendarAlt, FaSyncAlt,
  FaUsers, FaChartBar, FaDoorOpen, FaClock,
} from 'react-icons/fa';
import {
  PremiumPage, PremiumHeader, Kpi, KpiGrid, Panel, Empty, Row, Pill,
  ActionTiles, GOLD, TEAL, BLUE, PURPLE, RED,
} from '../premium/kit';

const ACTIONS = [
  { icon: FaCalendarAlt, label: 'Vacations', to: '/admin/vacations', tone: BLUE },
  { icon: FaBuilding, label: 'Salles', to: '/appariteur/salles', tone: TEAL },
  { icon: FaUsers, label: 'Étudiants', to: '/admin/utilisateurs', tone: GOLD },
  { icon: FaChartBar, label: 'Statistiques', to: '/admin/deliberation/statistiques', tone: PURPLE },
];

export default function AppariteurDashboardPremium({ stats, vacations, loading, error, onRefresh, activeTab, onTabChange }) {
  return (
    <PremiumPage>
      <PremiumHeader
        initials="AP"
        eyebrow="Appariteur"
        title="Gestion des salles d'examen"
        subtitle="Supervision des vacations et présences"
        badges={onRefresh && (
          <button type="button" onClick={onRefresh} className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-white/10 tw-bg-white/[0.04] tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-text-muted-foreground hover:tw-text-foreground">
            <FaSyncAlt /> Rafraîchir
          </button>
        )}
      />

      <KpiGrid>
        <Kpi icon={FaCalendarAlt} label="Vacations" value={vacations?.length || 0} tone={BLUE} delay={0} />
        <Kpi icon={FaUsers} label="Étudiants" value={stats?.nbEtudiants || 0} tone={GOLD} delay={70} />
        <Kpi icon={FaBuilding} label="Salles" value={stats?.totalSalles || 0} tone={TEAL} delay={140} />
        <Kpi icon={FaChartBar} label="Réussite" value={`${stats?.tauxReussite || 0}%`} tone={PURPLE} delay={210} />
      </KpiGrid>

      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-2">
        <Panel title="Vacations actives" icon={FaCalendarAlt} action={<span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{vacations?.length || 0}</span>}>
          {vacations?.length === 0 ? (
            <Empty>Aucune vacation active.</Empty>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-2.5">
              {vacations.slice(0, 8).map((v, i) => (
                <Row
                  key={v.id || i}
                  icon={FaClock}
                  iconTone={BLUE}
                  title={v.libelle || v.nom || 'Vacation'}
                  subtitle={v.dateDebut ? `Début : ${new Date(v.dateDebut).toLocaleDateString('fr-FR')}` : 'Date —'}
                  right={<Pill tone={TEAL}>{v.nombreInscriptions || v.inscriptions?.length || 0} inscrits</Pill>}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Fonctionnalités" icon={FaCheckCircle}>
          <div className="tw-flex tw-flex-col tw-gap-2.5">
            <Row icon={FaDoorOpen} iconTone={TEAL} title="Gestion vacations" subtitle="Création et suivi des vacations d'examen" />
            <Row icon={FaBuilding} iconTone={BLUE} title="Salles" subtitle="Planification et occupation des salles" />
            <Row icon={FaChartBar} iconTone={PURPLE} title="Statistiques" subtitle="Taux de réussite et présence" />
          </div>
        </Panel>
      </div>

      <ActionTiles actions={ACTIONS} />
    </PremiumPage>
  );
}
