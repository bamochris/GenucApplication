// Variante « premium » (bleu nuit & or) du tableau de bord Chef de département.
import {
  FaClipboardCheck, FaGraduationCap, FaBook, FaChalkboardTeacher,
  FaChartBar, FaSyncAlt,
} from 'react-icons/fa';
import {
  PremiumPage, PremiumHeader, Kpi, KpiGrid, Panel, Empty, Row,
  ActionTiles, GOLD, TEAL, BLUE, PURPLE, RED, initialsOf,
} from '../premium/kit';

const ACTIONS = [
  { icon: FaClipboardCheck, label: 'Gérer les notes', to: '/chef/notes', tone: TEAL },
  { icon: FaGraduationCap, label: 'Délibérations', to: '/chef/deliberations', tone: BLUE },
  { icon: FaBook, label: 'Cours du département', to: '/chef/cours', tone: GOLD },
  { icon: FaChalkboardTeacher, label: 'Enseignants', to: '/chef/enseignants', tone: PURPLE },
  { icon: FaChartBar, label: 'Statistiques', to: '/chef/statistiques', tone: TEAL },
];

function ActionBtn({ onClick, tone, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tw-inline-flex tw-h-8 tw-shrink-0 tw-items-center tw-rounded-md tw-px-3 tw-text-xs tw-font-semibold tw-transition hover:tw-brightness-110"
      style={{ background: tone.replace(')', ' / 0.14)'), color: tone, border: `1px solid ${tone.replace(')', ' / 0.3)')}` }}
    >
      {children}
    </button>
  );
}

export default function ChefDashboardPremium({
  user, notesAValider = [], deliberations = [], departementId,
  onRefresh, onValiderNote, onPreparerDeliberation,
}) {
  return (
    <PremiumPage>
      <PremiumHeader
        initials={initialsOf(user?.nomComplet || user?.email)}
        eyebrow="Chef de département"
        title="Tableau de bord — Département"
        subtitle={`${user?.nomComplet || ''} · ${departementId ? `Département #${departementId}` : 'Non rattaché'}`}
        badges={onRefresh && (
          <button type="button" onClick={onRefresh} className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-white/10 tw-bg-white/[0.04] tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-text-muted-foreground hover:tw-text-foreground">
            <FaSyncAlt /> Rafraîchir
          </button>
        )}
      />

      <KpiGrid>
        <Kpi icon={FaClipboardCheck} label="Notes à valider" value={notesAValider.length} hint={notesAValider.length > 0 ? 'À traiter' : 'À jour'} tone={notesAValider.length > 0 ? RED : TEAL} delay={0} />
        <Kpi icon={FaGraduationCap} label="Délibérations en cours" value={deliberations.length} tone={BLUE} delay={70} />
      </KpiGrid>

      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-2">
        <Panel title="Notes en attente de validation" icon={FaClipboardCheck}>
          {notesAValider.length === 0 ? (
            <Empty>Aucune note en attente.</Empty>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-2.5">
              {notesAValider.slice(0, 8).map((n, i) => (
                <Row
                  key={n.id || i}
                  icon={FaClipboardCheck}
                  iconTone={BLUE}
                  title={n.inscription?.etudiant?.nomComplet || n.inscriptionId || 'Étudiant'}
                  subtitle={`${n.cours?.titre || 'Cours'} · Note ${n.noteFinale ?? '—'}`}
                  right={onValiderNote && <ActionBtn tone={TEAL} onClick={() => onValiderNote(n.id)}>Valider</ActionBtn>}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Délibérations à préparer" icon={FaGraduationCap}>
          {deliberations.length === 0 ? (
            <Empty>Aucune délibération en cours.</Empty>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-2.5">
              {deliberations.slice(0, 8).map((d, i) => (
                <Row
                  key={d.id || i}
                  icon={FaGraduationCap}
                  iconTone={GOLD}
                  title={d.inscription?.etudiant?.nomComplet || d.inscriptionId || 'Étudiant'}
                  subtitle={`Année ${d.anneeAcademique || '—'}`}
                  right={onPreparerDeliberation && <ActionBtn tone={BLUE} onClick={() => onPreparerDeliberation(d.inscriptionId, d.anneeAcademique)}>Préparer</ActionBtn>}
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
