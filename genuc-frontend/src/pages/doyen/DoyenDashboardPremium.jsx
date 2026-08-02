// Variante « premium » (bleu nuit & or) du tableau de bord Doyen.
import {
  FaBuilding, FaUserGraduate, FaClipboardCheck, FaBalanceScale,
  FaChartBar, FaBook,
} from 'react-icons/fa';
import {
  PremiumPage, PremiumHeader, HeaderBadge, Kpi, KpiGrid, Panel, PanelLink,
  Empty, Row, Pill, ActionTiles, GOLD, TEAL, BLUE, RED, PURPLE, initialsOf,
} from '../premium/kit';

const ACTIONS = [
  { icon: FaClipboardCheck, label: 'Valider des notes', to: '/doyen/notes/valider', tone: TEAL },
  { icon: FaBalanceScale, label: 'Délibérations', to: '/doyen/deliberations', tone: BLUE },
  { icon: FaBuilding, label: 'Départements', to: '/doyen/departements', tone: GOLD },
  { icon: FaChartBar, label: 'Statistiques', to: '/doyen/statistiques', tone: PURPLE },
];

export default function DoyenDashboardPremium({ user, stats, notesEnAttente = [], departements = [] }) {
  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <PremiumPage>
      <PremiumHeader
        initials={initialsOf(user?.nomComplet || user?.email)}
        eyebrow="Décanat"
        title="Tableau de bord — Doyen"
        subtitle={`${user?.nomComplet || user?.email} · Gérez votre faculté`}
        badges={<HeaderBadge tone="muted">📅 <span className="tw-capitalize">{dateStr}</span></HeaderBadge>}
      />

      <KpiGrid>
        <Kpi icon={FaBuilding} label="Départements" value={stats?.nbDepartements || 0} tone={GOLD} delay={0} />
        <Kpi icon={FaUserGraduate} label="Étudiants" value={stats?.nbEtudiants || 0} tone={BLUE} delay={70} />
        <Kpi icon={FaClipboardCheck} label="Notes à valider" value={notesEnAttente.length} hint={notesEnAttente.length > 0 ? 'À traiter' : 'À jour'} tone={notesEnAttente.length > 0 ? RED : TEAL} delay={140} />
        <Kpi icon={FaBalanceScale} label="Délibérations en cours" value={stats?.nbDélibérationsEnCours || 0} tone={PURPLE} delay={210} />
      </KpiGrid>

      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-2">
        <Panel title="Notes en attente de validation" icon={FaClipboardCheck} action={<PanelLink to="/doyen/notes">Tout voir</PanelLink>}>
          {notesEnAttente.length === 0 ? (
            <Empty>Aucune note en attente de validation.</Empty>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-2.5">
              {notesEnAttente.slice(0, 6).map((n, i) => (
                <Row
                  key={n.id || i}
                  icon={FaClipboardCheck}
                  iconTone={BLUE}
                  title={n.inscription?.etudiant?.nomComplet || n.inscriptionId || 'Étudiant'}
                  subtitle={`${n.cours?.titre || 'Cours'} · ${n.appreciation || 'Sans appréciation'}`}
                  right={<Pill tone={GOLD}>{n.noteFinale ?? '—'}</Pill>}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Départements de la faculté" subtitle={`${departements.length} département(s)`} icon={FaBook}>
          {departements.length === 0 ? (
            <Empty>Aucun département.</Empty>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-2.5">
              {departements.slice(0, 8).map((d, i) => (
                <Row key={d.id || i} icon={FaBuilding} iconTone={GOLD} title={d.nom} subtitle={`${d.code || ''}${d.type ? ` · ${d.type}` : ''}`} />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <ActionTiles actions={ACTIONS} />
    </PremiumPage>
  );
}
