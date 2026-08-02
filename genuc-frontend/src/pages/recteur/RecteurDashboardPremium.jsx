// Variante « premium » (bleu nuit & or) du tableau de bord Recteur.
import {
  FaUserGraduate, FaChalkboardTeacher, FaBuilding, FaClipboardList,
  FaMoneyBillWave, FaChartBar, FaBalanceScale, FaChartPie, FaTrophy,
  FaGraduationCap,
} from 'react-icons/fa';
import {
  PremiumPage, PremiumHeader, HeaderBadge, Kpi, KpiGrid, Panel, PanelLink,
  Empty, Row, Ring, ActionTiles, GOLD, TEAL, BLUE, PURPLE, RED, initialsOf,
} from '../premium/kit';

const ACTIONS = [
  { icon: FaChartBar, label: 'Rapports', to: '/admin/rapports', tone: BLUE },
  { icon: FaMoneyBillWave, label: 'Finances', to: '/finances/dashboard', tone: TEAL },
  { icon: FaBalanceScale, label: 'Salle de jury', to: '/admin/deliberation/jury', tone: GOLD },
  { icon: FaChartPie, label: 'Stats délibération', to: '/admin/deliberation/statistiques', tone: PURPLE },
];

const money = (v) => `${(v || 0).toLocaleString('fr-FR')} USD`;

export default function RecteurDashboardPremium({ user, dashboard, palmaresStats }) {
  const d = dashboard || {};
  const eff = d.effectifs || {};
  const fin = d.finances || {};
  const res = d.resultats || {};
  const taux = res.tauxReussite || 0;
  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <PremiumPage>
      <PremiumHeader
        initials={initialsOf(user?.nomComplet || user?.email)}
        eyebrow="Rectorat"
        title="Tableau de bord — Recteur"
        subtitle={`${user?.nomComplet || ''} · ${d.universite || 'Université'}`}
        badges={<HeaderBadge tone="muted">📅 <span className="tw-capitalize">{dateStr}</span></HeaderBadge>}
      />

      <KpiGrid>
        <Kpi icon={FaUserGraduate} label="Étudiants" value={eff.totalEtudiants || 0} tone={GOLD} delay={0} />
        <Kpi icon={FaChalkboardTeacher} label="Enseignants" value={eff.totalEnseignants || 0} tone={BLUE} delay={70} />
        <Kpi icon={FaBuilding} label="Départements" value={eff.totalDepartements || 0} tone={TEAL} delay={140} />
        <Kpi icon={FaClipboardList} label="Inscriptions en attente" value={eff.inscriptionsEnAttente || 0} tone={(eff.inscriptionsEnAttente || 0) > 0 ? RED : TEAL} delay={210} />
      </KpiGrid>

      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-3">
        <Panel title="Finances" subtitle="Recettes" icon={FaMoneyBillWave} className="lg:tw-col-span-1">
          <div className="tw-flex tw-flex-col tw-gap-2.5">
            <div className="tw-rounded-lg tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-3">
              <p className="tw-text-xs tw-text-muted-foreground">Recettes du mois</p>
              <p className="tw-mt-1 tw-text-xl tw-font-bold" style={{ color: BLUE }}>{money(fin.recettesMois)}</p>
            </div>
            <div className="tw-rounded-lg tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-3">
              <p className="tw-text-xs tw-text-muted-foreground">Recettes de l'année</p>
              <p className="tw-mt-1 tw-text-xl tw-font-bold" style={{ color: TEAL }}>{money(fin.recettesAnnee)}</p>
            </div>
          </div>
        </Panel>

        <Panel title="Résultats académiques" icon={FaGraduationCap} className="lg:tw-col-span-2">
          <div className="tw-flex tw-flex-col tw-items-center tw-gap-6 sm:tw-flex-row sm:tw-gap-8">
            <Ring percent={taux} label="Taux de réussite" color={taux > 70 ? TEAL : GOLD} />
            <div className="tw-grid tw-w-full tw-grid-cols-2 tw-gap-2.5">
              <div className="tw-rounded-lg tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-3">
                <p className="tw-text-xs tw-text-muted-foreground">Admis</p>
                <p className="tw-mt-1 tw-text-lg tw-font-bold" style={{ color: TEAL }}>{res.totalAdmis || 0}</p>
              </div>
              <div className="tw-rounded-lg tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-3">
                <p className="tw-text-xs tw-text-muted-foreground">Diplômés</p>
                <p className="tw-mt-1 tw-text-lg tw-font-bold" style={{ color: BLUE }}>{res.totalDiplomes || 0}</p>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="tw-mt-4">
        <Panel title="Excellence académique — Palmarès" icon={FaTrophy} action={<PanelLink to="/palmares-public">Palmarès complet</PanelLink>}>
          {palmaresStats ? (
            <>
              <div className="tw-mb-4 tw-grid tw-grid-cols-2 tw-gap-2.5 sm:tw-grid-cols-4">
                {[
                  { label: 'Total lauréats', value: palmaresStats.totalLaureats || 0, tone: GOLD },
                  { label: 'Années', value: Object.keys(palmaresStats.parAnnee || {}).length, tone: TEAL },
                  { label: 'Filières', value: Object.keys(palmaresStats.parFiliere || {}).length, tone: BLUE },
                  { label: 'Mentions', value: Object.keys(palmaresStats.parMention || {}).length, tone: PURPLE },
                ].map((s) => (
                  <div key={s.label} className="tw-rounded-lg tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-3 tw-text-center">
                    <p className="tw-text-xl tw-font-extrabold" style={{ color: s.tone }}>{s.value}</p>
                    <p className="tw-text-xs tw-text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
              {palmaresStats.dernieresAnnees?.length > 0 ? (
                <div className="tw-flex tw-flex-col tw-gap-2.5">
                  {palmaresStats.dernieresAnnees.slice(0, 5).map((m, i) => (
                    <Row key={i} icon={FaTrophy} iconTone={GOLD} title={m.nom} subtitle={`${m.annee || ''} · ${m.mention?.replace('_', ' ') || ''}`} />
                  ))}
                </div>
              ) : (
                <Empty>Aucun lauréat enregistré.</Empty>
              )}
            </>
          ) : (
            <Empty>Aucune donnée de palmarès disponible.</Empty>
          )}
        </Panel>
      </div>

      <ActionTiles actions={ACTIONS} />
    </PremiumPage>
  );
}
