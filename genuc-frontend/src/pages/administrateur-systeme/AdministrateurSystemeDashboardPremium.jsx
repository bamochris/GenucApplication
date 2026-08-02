// Variante « premium » (bleu nuit & or) du tableau de bord Administration Système.
import {
  FaListAlt, FaSignInAlt, FaTimesCircle, FaPercentage, FaUsers,
  FaClipboardList, FaDatabase, FaCog, FaShieldAlt,
} from 'react-icons/fa';
import {
  PremiumPage, PremiumHeader, Kpi, KpiGrid, Panel, Empty, Row, Pill,
  ActionTiles, GOLD, TEAL, BLUE, RED,
} from '../premium/kit';

const ACTIONS = [
  { icon: FaUsers, label: 'Utilisateurs', to: '/admin-systeme/utilisateurs', tone: GOLD },
  { icon: FaClipboardList, label: 'Audit', to: '/admin-systeme/audit', tone: BLUE },
  { icon: FaDatabase, label: 'Sauvegardes', to: '/admin-systeme/sauvegardes', tone: TEAL },
  { icon: FaCog, label: 'Paramètres', to: '/admin-systeme/parametres', tone: GOLD },
];

export default function AdministrateurSystemeDashboardPremium({ statsLogs = {}, logs = [] }) {
  return (
    <PremiumPage>
      <PremiumHeader
        initials="SY"
        eyebrow="Administration système"
        title="Audit & sécurité"
        subtitle="Journaux, connexions et paramètres de la plateforme"
      />

      <KpiGrid>
        <Kpi icon={FaListAlt} label="Total logs" value={statsLogs.totalLogs || 0} tone={GOLD} delay={0} />
        <Kpi icon={FaSignInAlt} label="Connexions" value={statsLogs.totalConnexions || 0} tone={BLUE} delay={70} />
        <Kpi icon={FaTimesCircle} label="Échecs de connexion" value={statsLogs.echecsConnexion || 0} tone={(statsLogs.echecsConnexion || 0) > 0 ? RED : TEAL} delay={140} />
        <Kpi icon={FaPercentage} label="Taux d'échec" value={`${statsLogs.tauxEchec || 0}%`} tone={(statsLogs.tauxEchec || 0) > 20 ? RED : TEAL} delay={210} />
      </KpiGrid>

      <div className="tw-mt-4">
        <Panel title="Dernières connexions" subtitle="10 événements les plus récents" icon={FaShieldAlt}>
          {logs.length === 0 ? (
            <Empty>Aucun log de connexion.</Empty>
          ) : (
            <div className="tw-flex tw-flex-col tw-gap-2.5">
              {logs.slice(0, 10).map((l, i) => (
                <Row
                  key={l.id || i}
                  icon={FaSignInAlt}
                  iconTone={l.success ? TEAL : RED}
                  title={l.userEmail || 'Utilisateur inconnu'}
                  subtitle={`${l.ipAddress || '—'} · ${l.createdAt ? new Date(l.createdAt).toLocaleString('fr-FR') : ''}`}
                  right={<Pill tone={l.success ? TEAL : RED}>{l.success ? 'OK' : 'Échec'}</Pill>}
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
