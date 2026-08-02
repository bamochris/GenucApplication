// Variante « premium » (bleu nuit & or) du tableau de bord Super Admin GENUC.
import {
  FaUniversity, FaBook, FaUserGraduate, FaMoneyBillWave, FaPlusCircle,
  FaGraduationCap, FaClipboardList, FaTrophy, FaEdit, FaTrash, FaCog,
} from 'react-icons/fa';
import {
  PremiumPage, PremiumHeader, HeaderBadge, Kpi, KpiGrid, Panel, PanelLink,
  Empty, Pill, ActionTiles, SmallButton, SmallLink, GOLD, TEAL, BLUE, PURPLE,
} from '../premium/kit';

const ACTIONS = [
  { icon: FaPlusCircle, label: 'Enregistrer université', to: '/superadmin/enregistrement-universite', tone: BLUE },
  { icon: FaGraduationCap, label: 'Universités', to: '/universites', tone: TEAL },
  { icon: FaClipboardList, label: 'Dossiers', to: '/admin/dossiers', tone: GOLD },
  { icon: FaTrophy, label: 'Palmarès', to: '/admin/generer-palmares', tone: PURPLE },
];

export default function SuperAdminDashboardPremium({
  user, stats = {}, universites = [], onToggleInscriptions, onEdit, onDelete,
}) {
  return (
    <PremiumPage>
      <PremiumHeader
        initials="GU"
        eyebrow="Super administration"
        title="Super Administration GENUC"
        subtitle={`Bienvenue, ${user?.nomComplet || user?.email || 'Super Admin'} · Vue nationale`}
        badges={<HeaderBadge icon={FaCog} tone="muted">Plateforme nationale</HeaderBadge>}
      />

      <KpiGrid>
        <Kpi icon={FaUniversity} label="Universités" value={stats.totalUniversites || 0} tone={GOLD} delay={0} />
        <Kpi icon={FaBook} label="Départements" value={stats.totalDepartements || 0} tone={BLUE} delay={70} />
        <Kpi icon={FaUserGraduate} label="Étudiants" value={(stats.totalEtudiants || 0).toLocaleString('fr-FR')} tone={TEAL} delay={140} />
        <Kpi icon={FaMoneyBillWave} label="Paiements" value={`${(stats.totalPaiements || 0).toLocaleString('fr-FR')} USD`} tone={PURPLE} delay={210} />
      </KpiGrid>

      <ActionTiles actions={ACTIONS} title="Actions rapides" />

      <div className="tw-mt-4">
        <Panel
          title="Universités connectées"
          subtitle={`${universites.length} établissement(s)`}
          icon={FaUniversity}
          action={<PanelLink to="/superadmin/enregistrement-universite">Ajouter</PanelLink>}
        >
          {universites.length === 0 ? (
            <Empty>Aucune université connectée.</Empty>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-2.5">
              {universites.map((uni) => (
                <div key={uni.id} className="tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-rounded-lg tw-border tw-border-white/[0.06] tw-bg-white/[0.03] tw-p-3">
                  <span className="tw-grid tw-h-10 tw-w-10 tw-shrink-0 tw-place-items-center tw-rounded-lg tw-bg-gradient-to-br tw-from-primary/80 tw-to-[hsl(38,80%,48%)] tw-text-xs tw-font-extrabold tw-text-[hsl(222,47%,10%)]">
                    {(uni.code || uni.nom || '?').slice(0, 3).toUpperCase()}
                  </span>
                  <div className="tw-min-w-0 tw-flex-1">
                    <p className="tw-truncate tw-text-sm tw-font-semibold tw-text-foreground">{uni.nom}</p>
                    <p className="tw-truncate tw-text-xs tw-text-muted-foreground">{uni.code || '—'} · {uni.ville || '—'}</p>
                  </div>
                  <Pill tone={uni.inscriptionsOuvertes ? TEAL : GOLD}>{uni.inscriptionsOuvertes ? 'Ouvertes' : 'Fermées'}</Pill>
                  <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-1.5">
                    <SmallLink to={`/admin/universite/${uni.id}`} tone={BLUE}>Gérer</SmallLink>
                    {onToggleInscriptions && (
                      <SmallButton tone={GOLD} onClick={() => onToggleInscriptions(uni.id)}>
                        {uni.inscriptionsOuvertes ? 'Fermer' : 'Ouvrir'}
                      </SmallButton>
                    )}
                    {onEdit && <SmallButton tone={TEAL} icon={FaEdit} onClick={() => onEdit(uni)} title="Modifier">Modifier</SmallButton>}
                    {onDelete && <SmallButton danger icon={FaTrash} onClick={() => onDelete(uni)} title="Supprimer">Supprimer</SmallButton>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </PremiumPage>
  );
}
