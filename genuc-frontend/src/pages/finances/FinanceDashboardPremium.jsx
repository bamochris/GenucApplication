// Variante « premium » (bleu nuit & or) du tableau de bord Finances (adaptatif par rôle).
import { Link } from 'react-router-dom';
import {
  FaMoneyBillWave, FaCheckCircle, FaClipboardList, FaExclamationTriangle,
  FaCreditCard, FaReceipt, FaFileInvoiceDollar, FaCalendarAlt, FaChartLine,
} from 'react-icons/fa';
import {
  PremiumPage, PremiumHeader, HeaderBadge, Kpi, KpiGrid, Panel, PanelLink,
  Row, ActionTiles, PrimaryButton, GOLD, TEAL, BLUE, PURPLE, RED,
} from '../premium/kit';

function actionsForRole(role) {
  if (role === 'ETUDIANT') {
    return [
      { icon: FaCreditCard, label: 'Mes frais', to: '/finances/etudiant/mes-frais', tone: BLUE },
      { icon: FaReceipt, label: 'Mes reçus', to: '/finances/etudiant/recus', tone: TEAL },
      { icon: FaFileInvoiceDollar, label: 'État financier', to: '/finances/etudiant/etat-financier', tone: GOLD },
      { icon: FaCalendarAlt, label: 'Plan de paiement', to: '/finances/etudiant/plan-paiement', tone: PURPLE },
    ];
  }
  return [
    { icon: FaMoneyBillWave, label: 'Gestion des frais', to: '/finances/admin/frais', tone: BLUE },
    { icon: FaClipboardList, label: 'Affectations', to: '/finances/admin/affectations', tone: TEAL },
    { icon: FaChartLine, label: 'Recouvrement', to: '/finances/rapports/recouvrement', tone: GOLD },
    { icon: FaExclamationTriangle, label: 'Dettes', to: '/finances/rapports/dettes', tone: RED },
  ];
}

export default function FinanceDashboardPremium({ role, stats = {}, evolution = {}, dettesRecentes = [] }) {
  const isAdmin = ['ADMIN_UNIVERSITE', 'COMPTABLE', 'SUPER_ADMIN'].includes(role);
  const isRecteur = role === 'RECTEUR';
  const isEtudiant = role === 'ETUDIANT';
  const isCaissier = role === 'CAISSIER';
  const evoEntries = Object.entries(evolution || {});
  const evoMax = Math.max(...evoEntries.map(([, v]) => v), 1);
  const evoTotal = evoEntries.reduce((a, [, v]) => a + v, 0);

  return (
    <PremiumPage>
      <PremiumHeader
        initials="FI"
        eyebrow="Finances"
        title="Tableau de bord financier"
        subtitle="Frais, recettes et recouvrement"
        badges={<HeaderBadge tone="muted">Année {stats.annee || ''}</HeaderBadge>}
      />

      <ActionTiles actions={actionsForRole(role)} title="Actions rapides" />

      <div className="tw-mt-4">
        <KpiGrid>
          <Kpi icon={FaMoneyBillWave} label="Total frais" value={stats.totalFrais || 0} tone={GOLD} delay={0} />
          <Kpi icon={FaCheckCircle} label="Frais actifs" value={stats.totalActifs || 0} tone={TEAL} delay={70} />
          <Kpi icon={FaClipboardList} label="Affectations" value={stats.totalAffectations || 0} tone={BLUE} delay={140} />
          <Kpi icon={FaExclamationTriangle} label="Dettes actives" value={`${(stats.totalDettes || 0).toLocaleString('fr-FR')} USD`} tone={(stats.totalDettes || 0) > 0 ? RED : TEAL} delay={210} />
        </KpiGrid>
      </div>

      {/* Évolution des recettes (admin/recteur) */}
      {(isAdmin || isRecteur) && evoEntries.length > 0 && (
        <div className="tw-mt-4">
          <Panel title={`Évolution des recettes ${new Date().getFullYear()}`} icon={FaChartLine}>
            <div className="tw-flex tw-h-44 tw-items-end tw-gap-1.5 tw-pt-4">
              {evoEntries.map(([mois, montant]) => (
                <div key={mois} className="tw-flex tw-flex-1 tw-flex-col tw-items-center tw-gap-1.5">
                  <div className="tw-w-full tw-rounded-t" style={{ height: `${Math.max(4, (montant / evoMax) * 150)}px`, background: montant > 0 ? `linear-gradient(180deg, ${GOLD}, hsl(41 84% 45%))` : 'hsl(214 33% 22% / 0.5)', minHeight: 4, transition: 'height 0.6s ease' }} />
                  <span className="tw-text-[9px] tw-text-muted-foreground">{mois.substring(0, 3)}</span>
                </div>
              ))}
            </div>
            <p className="tw-mt-2 tw-text-center tw-text-xs tw-text-muted-foreground">Total annuel : {evoTotal.toLocaleString('fr-FR')} USD</p>
          </Panel>
        </div>
      )}

      {/* Principaux débiteurs (admin/recteur) */}
      {(isAdmin || isRecteur) && dettesRecentes.length > 0 && (
        <div className="tw-mt-4">
          <Panel title="Principaux débiteurs" icon={FaExclamationTriangle} action={<PanelLink to="/finances/rapports/dettes">Rapport</PanelLink>}>
            <div className="tw-flex tw-flex-col tw-gap-2.5">
              {dettesRecentes.map((d, i) => (
                <Row
                  key={i}
                  icon={FaExclamationTriangle}
                  iconTone={RED}
                  title={`${d.etudiant || ''} · ${d.promotion || ''}`}
                  subtitle={d.matricule || ''}
                  right={<span className="tw-text-sm tw-font-bold" style={{ color: RED }}>{d.totalDette} USD</span>}
                />
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* Résumé étudiant */}
      {isEtudiant && (
        <div className="tw-mt-4">
          <Panel title="Votre situation financière" icon={FaFileInvoiceDollar}>
            <p className="tw-mb-3 tw-text-sm tw-text-muted-foreground">Consultez vos frais à payer, votre historique et vos reçus dans les sections dédiées.</p>
            <div className="tw-flex tw-flex-wrap tw-gap-2.5">
              <PrimaryButton to="/finances/etudiant/mes-frais" icon={FaCreditCard}>Frais à payer</PrimaryButton>
              <Link to="/finances/etudiant/etat-financier" className="tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-primary/25 tw-bg-primary/10 tw-px-4 tw-text-sm tw-font-semibold tw-text-primary hover:tw-bg-primary/15">
                <FaFileInvoiceDollar /> État financier
              </Link>
            </div>
          </Panel>
        </div>
      )}

      {/* Résumé caissier */}
      {isCaissier && (
        <div className="tw-mt-4">
          <Panel title="Caisse — Aujourd'hui" icon={FaMoneyBillWave}>
            <p className="tw-mb-3 tw-text-sm tw-text-muted-foreground">Gérez les encaissements, consultez le journal et clôturez la journée.</p>
            <div className="tw-flex tw-flex-wrap tw-gap-2.5">
              <PrimaryButton to="/finances/caissier/encaissement" icon={FaMoneyBillWave}>Encaissement</PrimaryButton>
              <Link to="/finances/caissier/journal" className="tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-primary/25 tw-bg-primary/10 tw-px-4 tw-text-sm tw-font-semibold tw-text-primary hover:tw-bg-primary/15">
                <FaClipboardList /> Journal
              </Link>
              <Link to="/finances/caissier/cloture" className="tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-white/10 tw-bg-white/[0.04] tw-px-4 tw-text-sm tw-font-semibold tw-text-muted-foreground hover:tw-text-foreground">
                Clôture
              </Link>
            </div>
          </Panel>
        </div>
      )}
    </PremiumPage>
  );
}
