// Variante « premium » (bleu nuit & or) du tableau de bord Comptable.
import {
  FaMoneyBillWave, FaHourglassHalf, FaUserGraduate, FaChartPie,
  FaCreditCard, FaFileAlt, FaChartLine, FaReceipt,
} from 'react-icons/fa';
import {
  PremiumPage, PremiumHeader, HeaderBadge, Kpi, KpiGrid, Panel, PanelLink,
  Empty, Row, Pill, ActionTiles, GOLD, TEAL, BLUE, PURPLE, RED, initialsOf,
} from '../premium/kit';

const ACTIONS = [
  { icon: FaCreditCard, label: 'Gérer les paiements', to: '/finances/admin/historique', tone: TEAL },
  { icon: FaFileAlt, label: 'Rapports financiers', to: '/finances/rapports/dettes', tone: BLUE },
  { icon: FaChartLine, label: 'Statistiques', to: '/finances/rapports/evolution', tone: GOLD },
];

function statutTone(s) {
  if (s === 'VALIDE') return TEAL;
  if (s === 'REJETE') return RED;
  return GOLD;
}
function statutLabel(s) {
  if (s === 'VALIDE') return 'Validé';
  if (s === 'REJETE') return 'Rejeté';
  if (s === 'EN_ATTENTE') return 'En attente';
  return s || '—';
}

export default function ComptableDashboardPremium({ user, stats, paiementsRecents = [] }) {
  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <PremiumPage>
      <PremiumHeader
        initials={initialsOf(user?.nomComplet || user?.email)}
        eyebrow="Comptabilité"
        title="Tableau de bord — Comptable"
        subtitle={`Bienvenue, ${user?.nomComplet || user?.email}`}
        badges={<HeaderBadge tone="muted">📅 <span className="tw-capitalize">{dateStr}</span></HeaderBadge>}
      />

      <KpiGrid>
        <Kpi icon={FaMoneyBillWave} label="Total encaissé" value={`${(stats?.totalPaiements || 0).toLocaleString('fr-FR')} USD`} tone={TEAL} delay={0} />
        <Kpi icon={FaHourglassHalf} label="Paiements en attente" value={stats?.paiementsEnAttente || 0} tone={GOLD} delay={70} />
        <Kpi icon={FaUserGraduate} label="Étudiants" value={stats?.nbEtudiants || 0} tone={BLUE} delay={140} />
        <Kpi icon={FaChartPie} label="Total dépenses" value={`${(stats?.totalDepenses || 0).toLocaleString('fr-FR')} USD`} tone={PURPLE} delay={210} />
      </KpiGrid>

      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-2">
        <Panel title="Paiements récents" icon={FaCreditCard} action={<PanelLink to="/finances/admin/historique">Tout voir</PanelLink>}>
          {paiementsRecents.length === 0 ? (
            <Empty>Aucun paiement récent.</Empty>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-2.5">
              {paiementsRecents.map((p, i) => (
                <Row
                  key={p.id || i}
                  icon={FaReceipt}
                  iconTone={BLUE}
                  title={`${p.montant || 0} ${p.devise || ''} · ${(p.type || '').replace('_', ' ')}`}
                  subtitle={`Réf ${p.reference || '—'} · ${p.inscription?.etudiant?.nomComplet || p.inscriptionId || ''}`}
                  right={<Pill tone={statutTone(p.statut)}>{statutLabel(p.statut)}</Pill>}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Dépenses récentes" icon={FaChartPie}>
          <Empty>Aucune dépense récente.</Empty>
        </Panel>
      </div>

      <ActionTiles actions={ACTIONS} />
    </PremiumPage>
  );
}
