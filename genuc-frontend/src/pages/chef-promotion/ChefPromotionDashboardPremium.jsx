// Variante « premium » (bleu nuit & or) du tableau de bord Chef de Promotion.
import {
  FaUserGraduate, FaCheckCircle, FaChartLine, FaPercentage, FaTrophy,
  FaClipboardList, FaSyncAlt, FaUserCheck,
} from 'react-icons/fa';
import {
  PremiumPage, PremiumHeader, Kpi, KpiGrid, Panel, Empty, PremiumSelect,
  GOLD, TEAL, BLUE, RED,
} from '../premium/kit';

export default function ChefPromotionDashboardPremium({
  promotions = [], selectedPromo, annee, effectifs, resultats, classement = [],
  presences, error, onSelectPromo, onSelectAnnee, onRefresh,
}) {
  return (
    <PremiumPage>
      <PremiumHeader
        initials="CP"
        eyebrow="Chef de promotion"
        title="Suivi de la promotion"
        subtitle="Effectifs, résultats et classement"
      />

      {error && (
        <div className="tw-mb-4 tw-rounded-lg tw-border tw-px-4 tw-py-3 tw-text-sm" style={{ borderColor: 'hsl(0 72% 55% / 0.3)', background: 'hsl(0 72% 55% / 0.1)', color: 'hsl(0 80% 78%)' }}>
          {error}
        </div>
      )}

      {/* Contrôles */}
      <Panel>
        <div className="tw-flex tw-flex-wrap tw-items-end tw-gap-3">
          <div className="tw-min-w-[220px] tw-flex-1">
            <PremiumSelect label="Promotion" value={selectedPromo || ''} onChange={(e) => onSelectPromo?.(e.target.value)}>
              {promotions.map((p) => (
                <option key={p.id} value={p.id}>{p.libelle}{p.filiere?.nom ? ` — ${p.filiere.nom}` : ''}</option>
              ))}
            </PremiumSelect>
          </div>
          <div className="tw-min-w-[160px]">
            <PremiumSelect label="Année académique" value={annee || ''} onChange={(e) => onSelectAnnee?.(e.target.value)}>
              <option value="2023-2024">2023-2024</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
            </PremiumSelect>
          </div>
          {onRefresh && (
            <button type="button" onClick={onRefresh} className="tw-inline-flex tw-h-10 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-primary/25 tw-bg-primary/10 tw-px-4 tw-text-sm tw-font-semibold tw-text-primary hover:tw-bg-primary/15">
              <FaSyncAlt /> Actualiser
            </button>
          )}
        </div>
      </Panel>

      {/* KPI */}
      {effectifs && resultats && (
        <div className="tw-mt-4">
          <KpiGrid>
            <Kpi icon={FaUserGraduate} label="Total étudiants" value={effectifs.total ?? 0} tone={GOLD} delay={0} />
            <Kpi icon={FaCheckCircle} label="Validés" value={effectifs.valides ?? 0} tone={TEAL} delay={70} />
            <Kpi icon={FaChartLine} label="Moyenne générale" value={resultats.moyenneGenerale ?? '—'} tone={BLUE} delay={140} />
            <Kpi icon={FaPercentage} label="Taux de réussite" value={`${resultats.tauxReussite ?? 0}%`} tone={(resultats.tauxReussite ?? 0) > 70 ? TEAL : RED} delay={210} />
          </KpiGrid>
        </div>
      )}

      {/* Présences */}
      {presences && (
        <div className="tw-mt-4">
          <Panel title="Présences aujourd'hui" icon={FaUserCheck}>
            <div className="tw-grid tw-grid-cols-2 tw-gap-2.5 sm:tw-grid-cols-4">
              {[
                { label: 'Total étudiants', value: presences.total, tone: BLUE },
                { label: 'Présents', value: presences.presents, tone: TEAL },
                { label: 'Absents', value: presences.absents, tone: RED },
                { label: 'Taux de présence', value: `${presences.tauxPresence ?? 0}%`, tone: (presences.tauxPresence ?? 0) >= 70 ? TEAL : RED },
              ].map((s) => (
                <div key={s.label} className="tw-rounded-lg tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-3 tw-text-center">
                  <p className="tw-text-xl tw-font-extrabold" style={{ color: s.tone }}>{s.value ?? 0}</p>
                  <p className="tw-text-xs tw-text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* Classement */}
      {classement.length > 0 && (
        <div className="tw-mt-4">
          <Panel title="Classement de la promotion" icon={FaTrophy}>
            <div className="tw-flex tw-flex-col tw-gap-2">
              {classement.slice(0, 10).map((e, i) => (
                <div key={e.inscriptionId || i} className="tw-flex tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-2.5">
                  <span className="tw-grid tw-h-8 tw-w-8 tw-shrink-0 tw-place-items-center tw-rounded-lg tw-text-xs tw-font-extrabold" style={{ background: i < 3 ? 'hsl(41 84% 60% / 0.16)' : 'hsl(214 33% 22% / 0.5)', color: i < 3 ? GOLD : 'hsl(214 20% 68%)' }}>
                    {i + 1}
                  </span>
                  <div className="tw-min-w-0 tw-flex-1">
                    <p className="tw-truncate tw-text-sm tw-font-semibold tw-text-foreground">{e.etudiant}</p>
                    <p className="tw-truncate tw-text-xs tw-text-muted-foreground">{e.matricule}</p>
                  </div>
                  <span className="tw-shrink-0 tw-text-sm tw-font-bold" style={{ color: i < 3 ? GOLD : 'hsl(210 40% 96%)' }}>{e.moyenne}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {!effectifs && !presences && classement.length === 0 && (
        <div className="tw-mt-4">
          <Panel icon={FaClipboardList} title="Aucune donnée">
            <Empty>Sélectionnez une promotion pour afficher les données.</Empty>
          </Panel>
        </div>
      )}
    </PremiumPage>
  );
}
