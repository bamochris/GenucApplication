// Variante « premium » (bleu nuit & or) du tableau de bord Comptabilité générale.
import { FaArrowDown, FaArrowUp, FaBalanceScale, FaBook, FaWallet } from 'react-icons/fa';
import {
  PremiumPage, PremiumHeader, Kpi, KpiGrid, Panel, Empty, Row, alpha,
  GOLD, TEAL, BLUE, RED,
} from '../premium/kit';

const money = (v) => `${Number(v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;

export default function ComptabiliteDashboardPremium({ balance, budgets = [], error }) {
  const comptes = balance ? Object.entries(balance).filter(([k]) => !k.startsWith('_')) : [];
  const solde = balance?._solde || 0;
  return (
    <PremiumPage>
      <PremiumHeader
        initials="CG"
        eyebrow="Comptabilité générale"
        title="Balance, grand livre & budget"
        subtitle="Situation comptable de l'établissement"
      />

      {error && (
        <div className="tw-mb-4 tw-rounded-lg tw-border tw-px-4 tw-py-3 tw-text-sm" style={{ borderColor: alpha(RED, 0.3), background: alpha(RED, 0.1), color: 'hsl(0 80% 78%)' }}>{error}</div>
      )}

      <KpiGrid>
        <Kpi icon={FaArrowDown} label="Total Débit" value={money(balance?._totalDebit)} tone={BLUE} delay={0} />
        <Kpi icon={FaArrowUp} label="Total Crédit" value={money(balance?._totalCredit)} tone={TEAL} delay={70} />
        <Kpi icon={FaBalanceScale} label="Solde" value={money(solde)} tone={solde < 0 ? RED : GOLD} delay={140} />
      </KpiGrid>

      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-2">
        <Panel title="Balance comptable" icon={FaWallet}>
          {comptes.length === 0 ? (
            <Empty>Aucun compte à afficher.</Empty>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-2">
              {comptes.map(([compte, valeur]) => (
                <div key={compte} className="tw-flex tw-items-center tw-justify-between tw-rounded-lg tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-px-3 tw-py-2.5 tw-text-sm">
                  <span className="tw-truncate tw-text-muted-foreground">{compte}</span>
                  <span className="tw-font-semibold tw-text-foreground">{valeur} USD</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title={`Budgets ${new Date().getFullYear()}`} icon={FaBook}>
          {budgets.length === 0 ? (
            <Empty>Aucun budget défini.</Empty>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-2.5">
              {budgets.map((b, i) => {
                const restant = (b.montantTotal || 0) - (b.montantUtilise || 0);
                return (
                  <Row
                    key={b.id || i}
                    icon={FaBook}
                    iconTone={GOLD}
                    title={`${b.libelle || ''}`}
                    subtitle={`${b.categorie || ''} · ${b.montantUtilise || 0}/${b.montantTotal || 0} USD`}
                    right={<span className="tw-text-sm tw-font-bold" style={{ color: restant < 0 ? RED : TEAL }}>{restant} USD</span>}
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
