// Variante « premium » (bleu nuit & or) du tableau de bord Service Social.
import {
  FaFolderOpen, FaHourglassHalf, FaHandHoldingUsd, FaMoneyBillWave,
  FaSyncAlt, FaPause, FaCheck, FaTimes, FaHandsHelping,
} from 'react-icons/fa';
import {
  PremiumPage, PremiumHeader, Kpi, KpiGrid, Panel, Empty, Row, Pill,
  SmallButton, GOLD, TEAL, BLUE, RED, alpha,
} from '../premium/kit';

function statutTone(s) {
  if (s === 'VALIDE' || s === 'ACTIVE' || s === 'ACCORDEE') return TEAL;
  if (s === 'REJETE' || s === 'REFUSEE') return RED;
  if (s === 'TERMINEE') return 'hsl(214 20% 68%)';
  return GOLD; // EN_ATTENTE / EN_ETUDE / SUSPENDUE
}

export default function SocialDashboardPremium({
  stats = {}, dossiers = [], bourses = [], aides = [], message, error,
  onRefresh, onSelectDossier, onTraiterAide, onSuspendreBourse, onTerminerBourse,
}) {
  return (
    <PremiumPage>
      <PremiumHeader
        initials="SS"
        eyebrow="Service social"
        title="Dossiers, bourses & aides"
        subtitle="Gestion de l'accompagnement social"
        badges={onRefresh && (
          <button type="button" onClick={onRefresh} className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-white/10 tw-bg-white/[0.04] tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-text-muted-foreground hover:tw-text-foreground">
            <FaSyncAlt /> Rafraîchir
          </button>
        )}
      />

      {message && (
        <div className="tw-mb-4 tw-rounded-lg tw-border tw-px-4 tw-py-3 tw-text-sm" style={{ borderColor: alpha(TEAL, 0.3), background: alpha(TEAL, 0.1), color: TEAL }}>{message}</div>
      )}
      {error && (
        <div className="tw-mb-4 tw-rounded-lg tw-border tw-px-4 tw-py-3 tw-text-sm" style={{ borderColor: alpha(RED, 0.3), background: alpha(RED, 0.1), color: 'hsl(0 80% 78%)' }}>{error}</div>
      )}

      <KpiGrid>
        <Kpi icon={FaFolderOpen} label="Total dossiers" value={stats.totalDossiers || 0} tone={GOLD} delay={0} />
        <Kpi icon={FaHourglassHalf} label="En attente" value={stats.enAttente || 0} tone={(stats.enAttente || 0) > 0 ? RED : TEAL} delay={70} />
        <Kpi icon={FaHandHoldingUsd} label="Bourses actives" value={stats.boursesActives || 0} tone={TEAL} delay={140} />
        <Kpi icon={FaMoneyBillWave} label="Montant total bourses" value={`${(stats.montantTotalBourses || 0).toLocaleString('fr-FR')} USD`} tone={BLUE} delay={210} />
      </KpiGrid>

      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-2">
        <Panel title={`Dossiers en attente (${dossiers.length})`} icon={FaFolderOpen}>
          {dossiers.length === 0 ? (
            <Empty>Aucun dossier en attente.</Empty>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-2.5">
              {dossiers.slice(0, 6).map((d, i) => (
                <Row
                  key={d.id || i}
                  icon={FaFolderOpen}
                  iconTone={GOLD}
                  title={`${d.etudiant?.prenom || ''} ${d.etudiant?.nom || ''}`}
                  subtitle={`${d.numeroDossier || ''} · ${d.demandeBourse ? 'Demande bourse' : 'Aide sociale'}`}
                  right={onSelectDossier && <SmallButton tone={BLUE} onClick={() => onSelectDossier(d)}>Traiter</SmallButton>}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title={`Bourses actives (${bourses.length})`} icon={FaHandHoldingUsd}>
          {bourses.length === 0 ? (
            <Empty>Aucune bourse active.</Empty>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-2.5">
              {bourses.slice(0, 6).map((b, i) => (
                <Row
                  key={b.id || i}
                  icon={FaHandHoldingUsd}
                  iconTone={TEAL}
                  title={`${b.dossierSocial?.etudiant?.prenom || ''} ${b.dossierSocial?.etudiant?.nom || ''}`}
                  subtitle={`${b.type || ''} · ${b.montantParMois || 0} USD/mois`}
                  right={
                    b.statut === 'ACTIVE' && (onSuspendreBourse || onTerminerBourse) ? (
                      <div className="tw-flex tw-gap-1.5">
                        {onSuspendreBourse && <SmallButton tone={GOLD} icon={FaPause} onClick={() => onSuspendreBourse(b.id)}>Suspendre</SmallButton>}
                        {onTerminerBourse && <SmallButton tone={TEAL} icon={FaCheck} onClick={() => onTerminerBourse(b.id)}>Terminer</SmallButton>}
                      </div>
                    ) : <Pill tone={statutTone(b.statut)}>{b.statut}</Pill>
                  }
                />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <div className="tw-mt-4">
        <Panel title={`Aides sociales récentes (${aides.length})`} icon={FaHandsHelping}>
          {aides.length === 0 ? (
            <Empty>Aucune aide sociale enregistrée.</Empty>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-2.5">
              {aides.slice(0, 6).map((a, i) => {
                const pending = a.statut === 'EN_ATTENTE' || a.statut === 'EN_TRAITEMENT';
                return (
                  <Row
                    key={a.id || i}
                    icon={FaHandsHelping}
                    iconTone={BLUE}
                    title={`${a.etudiant?.prenom || ''} ${a.etudiant?.nom || ''} · ${a.type || ''}`}
                    subtitle={`${a.montantEstime || 0} USD · ${a.dateDemande ? new Date(a.dateDemande).toLocaleDateString('fr-FR') : ''}`}
                    right={
                      pending && onTraiterAide ? (
                        <div className="tw-flex tw-gap-1.5">
                          <SmallButton tone={TEAL} icon={FaCheck} onClick={() => onTraiterAide(a.id, 'ACCORDEE')}>Accorder</SmallButton>
                          <SmallButton danger icon={FaTimes} onClick={() => onTraiterAide(a.id, 'REFUSEE')}>Refuser</SmallButton>
                        </div>
                      ) : <Pill tone={statutTone(a.statut)}>{a.statut}</Pill>
                    }
                  />
                );
              })}
            </div>
          )}
        </Panel>
      </div>
    </PremiumPage>
  );
}
