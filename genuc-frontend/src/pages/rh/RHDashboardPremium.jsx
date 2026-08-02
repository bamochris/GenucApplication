// Variante « premium » (bleu nuit & or) du tableau de bord RH.
import {
  FaUsers, FaChalkboardTeacher, FaClipboardList, FaUserCheck, FaUserPlus,
  FaCalendarAlt, FaMoneyBillWave, FaFileContract, FaGraduationCap,
  FaSyncAlt, FaExclamationTriangle,
} from 'react-icons/fa';
import {
  PremiumPage, PremiumHeader, PrimaryButton, Kpi, KpiGrid, Panel, PanelLink,
  Empty, Row, Pill, SmallLink, ActionTiles, GOLD, TEAL, BLUE, PURPLE, RED, initialsOf, alpha,
} from '../premium/kit';

const ACTIONS = [
  { icon: FaUserPlus, label: 'Nouvel employé', to: '/rh/employes', tone: TEAL },
  { icon: FaCalendarAlt, label: 'Congés', to: '/rh/conges', tone: BLUE },
  { icon: FaMoneyBillWave, label: 'Paie', to: '/rh/paie', tone: GOLD },
  { icon: FaFileContract, label: 'Contrats', to: '/rh/employes', tone: PURPLE },
  { icon: FaGraduationCap, label: 'Emploi étudiant', to: '/admin/rh/gestion-emploi-etudiant', tone: TEAL },
];

export default function RHDashboardPremium({
  user, stats, employes = [], contratsExpirant = [], congesEnAttente = [],
  paieEnAttente = [], error, onRefresh,
}) {
  return (
    <PremiumPage>
      <PremiumHeader
        initials={initialsOf(user?.nomComplet || 'RH')}
        eyebrow="Ressources humaines"
        title="Portail RH"
        subtitle={`${user?.nomComplet || ''} · Gestion du personnel`}
        badges={
          <>
            {onRefresh && (
              <button type="button" onClick={onRefresh} className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-white/10 tw-bg-white/[0.04] tw-px-3 tw-py-1.5 tw-text-xs tw-font-medium tw-text-muted-foreground hover:tw-text-foreground">
                <FaSyncAlt /> Rafraîchir
              </button>
            )}
            <PrimaryButton to="/rh/employes" icon={FaUserPlus}>Nouvel employé</PrimaryButton>
          </>
        }
      />

      {error && (
        <div className="tw-mb-4 tw-rounded-lg tw-border tw-px-4 tw-py-3 tw-text-sm" style={{ borderColor: alpha(RED, 0.3), background: alpha(RED, 0.1), color: 'hsl(0 80% 78%)' }}>{error}</div>
      )}

      <KpiGrid>
        <Kpi icon={FaUsers} label="Total employés" value={stats?.totalPersonnel || 0} tone={GOLD} delay={0} />
        <Kpi icon={FaChalkboardTeacher} label="Enseignants" value={stats?.totalEnseignants || 0} tone={BLUE} delay={70} />
        <Kpi icon={FaClipboardList} label="Administratifs" value={stats?.totalAdministratifs || 0} tone={PURPLE} delay={140} />
        <Kpi icon={FaUserCheck} label="Employés actifs" value={stats?.totalActifs || 0} tone={TEAL} delay={210} />
      </KpiGrid>

      <div className="tw-mt-4 tw-grid tw-grid-cols-1 tw-gap-4 lg:tw-grid-cols-2">
        <Panel title="Derniers employés" icon={FaUsers} action={<PanelLink to="/rh/employes">Tout voir</PanelLink>}>
          {employes.length === 0 ? (
            <Empty>Aucun employé.</Empty>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-2.5">
              {employes.slice(0, 5).map((e, i) => (
                <Row
                  key={e.id || i}
                  icon={FaUsers}
                  iconTone={BLUE}
                  title={`${e.prenom || ''} ${e.nom || ''}`}
                  subtitle={`${e.matriculePersonnel || ''} · ${e.specialite || e.grade || '—'}`}
                  right={<Pill tone={e.statut === 'ACTIF' ? TEAL : GOLD}>{e.statut}</Pill>}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Contrats expirant" icon={FaExclamationTriangle}>
          {contratsExpirant.length === 0 ? (
            <Empty>Aucun contrat expirant dans les 30 jours.</Empty>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-2.5">
              {contratsExpirant.slice(0, 4).map((c, i) => (
                <Row
                  key={c.id || i}
                  icon={FaFileContract}
                  iconTone={RED}
                  title={`${c.personnel?.prenom || ''} ${c.personnel?.nom || ''} · ${c.fonction || ''}`}
                  subtitle={`Fin : ${c.dateFin ? new Date(c.dateFin).toLocaleDateString('fr-FR') : '—'}`}
                  right={<SmallLink to="/rh/employes" tone={GOLD}>Renouveler</SmallLink>}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title={`Congés en attente (${congesEnAttente.length})`} icon={FaCalendarAlt} action={<PanelLink to="/rh/conges">Gérer</PanelLink>}>
          {congesEnAttente.length === 0 ? (
            <Empty>Aucune demande de congé en attente.</Empty>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-2.5">
              {congesEnAttente.slice(0, 4).map((c, i) => (
                <Row
                  key={c.id || i}
                  icon={FaCalendarAlt}
                  iconTone={GOLD}
                  title={`${c.personnel?.prenom || ''} ${c.personnel?.nom || ''} · ${c.libelle || ''}`}
                  subtitle={`${c.dateDebut || ''} → ${c.dateFin || ''} (${c.nbJoursOuvrables || 0} j)`}
                  right={<SmallLink to="/rh/conges" tone={BLUE}>Traiter</SmallLink>}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title={`Paie en attente (${paieEnAttente.length})`} icon={FaMoneyBillWave} action={<PanelLink to="/rh/paie">Gérer</PanelLink>}>
          {paieEnAttente.length === 0 ? (
            <Empty>Aucun bulletin en attente de validation.</Empty>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-2.5">
              {paieEnAttente.slice(0, 4).map((p, i) => (
                <Row
                  key={p.id || i}
                  icon={FaMoneyBillWave}
                  iconTone={TEAL}
                  title={`${p.paie?.personnel?.prenom || ''} ${p.paie?.personnel?.nom || ''}`}
                  subtitle={`${p.paie?.mois || ''} ${p.paie?.annee || ''} · Net ${p.paie?.netAPayer || 0} USD`}
                  right={<SmallLink to="/rh/paie" tone={GOLD}>Valider</SmallLink>}
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
