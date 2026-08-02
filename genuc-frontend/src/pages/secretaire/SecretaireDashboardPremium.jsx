// Variante « premium » (bleu nuit & or) du tableau de bord Secrétaire académique.
import {
  FaClipboardList, FaCheckCircle, FaBuilding, FaFileAlt, FaUserPlus,
  FaFileSignature, FaFolderOpen, FaChartBar, FaUserGraduate,
} from 'react-icons/fa';
import {
  PremiumPage, PremiumHeader, HeaderBadge, Kpi, KpiGrid, Panel, PanelLink,
  Empty, Row, Pill, SmallLink, ActionTiles, GOLD, TEAL, BLUE, PURPLE, RED, initialsOf,
} from '../premium/kit';

const ACTIONS = [
  { icon: FaClipboardList, label: 'Dossiers', to: '/admin/dossiers', tone: BLUE },
  { icon: FaUserPlus, label: 'Inscriptions', to: '/inscriptions', tone: TEAL },
  { icon: FaFileSignature, label: 'Attestations', to: '/admin/attestations', tone: GOLD },
  { icon: FaFileAlt, label: 'Test admission', to: '/secretaire/test-admission', tone: GOLD },
  { icon: FaFolderOpen, label: 'Documents', to: '/admin/documents', tone: PURPLE },
  { icon: FaChartBar, label: 'Statistiques', to: '/admin/statistiques', tone: TEAL },
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

export default function SecretaireDashboardPremium({
  user, stats, dossiersEnAttente = [], inscriptionsRecentes = [],
}) {
  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <PremiumPage>
      <PremiumHeader
        initials={initialsOf(user?.nomComplet || user?.email)}
        eyebrow="Secrétariat académique"
        title="Dossiers & inscriptions"
        subtitle={`Bienvenue, ${user?.nomComplet || user?.email}`}
        badges={<HeaderBadge tone="muted">📅 <span className="tw-capitalize">{dateStr}</span></HeaderBadge>}
      />

      <KpiGrid>
        <Kpi icon={FaClipboardList} label="Dossiers en attente" value={stats?.nbInscriptionsEnAttente ?? dossiersEnAttente.length} tone={GOLD} delay={0} />
        <Kpi icon={FaCheckCircle} label="Étudiants inscrits" value={stats?.nbEtudiants || 0} tone={TEAL} delay={70} />
        <Kpi icon={FaBuilding} label="Départements" value={stats?.nbDepartements || 0} tone={BLUE} delay={140} />
        <Kpi icon={FaFileAlt} label="Attestations à traiter" value={stats?.nbAttestationsEnAttente || 0} tone={PURPLE} delay={210} />
      </KpiGrid>

      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-2">
        <Panel title="Dossiers d'inscription en attente" icon={FaClipboardList} action={<PanelLink to="/admin/dossiers">Tout voir</PanelLink>}>
          {dossiersEnAttente.length === 0 ? (
            <Empty>Aucun dossier en attente de validation.</Empty>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-2.5">
              {dossiersEnAttente.slice(0, 5).map((d, i) => (
                <Row
                  key={d.id || i}
                  icon={FaClipboardList}
                  iconTone={BLUE}
                  title={`${d.prenom || ''} ${d.nom || ''} · ${d.niveauVise || ''}`}
                  subtitle={`${d.email || ''} · N° ${d.numeroDossier || ''}`}
                  right={<SmallLink to={`/admin/dossiers/${d.id}`} tone={GOLD}>Traiter</SmallLink>}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Inscriptions récentes" icon={FaUserGraduate}>
          {inscriptionsRecentes.length === 0 ? (
            <Empty>Aucune inscription récente.</Empty>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-2.5">
              {inscriptionsRecentes.map((ins, i) => (
                <Row
                  key={ins.id || i}
                  icon={FaUserGraduate}
                  iconTone={TEAL}
                  title={`${ins.prenom || ''} ${ins.nom || ''} · ${ins.niveau || ''}`}
                  subtitle={`Matricule : ${ins.matricule || '—'}`}
                  right={<Pill tone={statutTone(ins.statut)}>{statutLabel(ins.statut)}</Pill>}
                />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <ActionTiles actions={ACTIONS} />
    </PremiumPage>
  );
}
