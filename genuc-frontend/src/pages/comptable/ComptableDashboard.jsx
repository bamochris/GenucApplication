// src/pages/comptable/ComptableDashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDesign } from '../../context/DesignContext';
import api from '../../api/axios';
import QuickActionsGrid from '../../components/QuickActionsGrid';
import '../Dashboard.css';
import AvatarUtilisateur from '../../components/AvatarUtilisateur';
import ComptableDashboardPremium from './ComptableDashboardPremium';

export default function ComptableDashboard() {
  const { user } = useAuth();
  const { design } = useDesign();
  const [stats, setStats] = useState(null);
  const [paiementsRecents, setPaiementsRecents] = useState([]);
  const [, setDepensesRecentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const universiteId = user?.universiteId;

  useEffect(() => {
    if (universiteId) {
      loadData();
    } else {
      setLoading(false);
      setError('Aucune université associée à votre compte.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [universiteId]);

  const loadData = async () => {
    try {
      // Récupérer les statistiques financières (via l'endpoint existant ou un nouveau)
      // On utilise l'endpoint /api/universites/${universiteId}/stats qui donne des chiffres globaux
      const statsRes = await api.get(`/api/universites/${universiteId}/stats`).catch(() => ({ data: {} }));
      setStats(statsRes.data || {});

      // Récupérer les paiements récents (validés) – on utilise l'endpoint des paiements
      const paiementsRes = await api.get(`/api/paiements/gestion/universite/${universiteId}`).catch(() => ({ data: [] }));
      const paiementsRecents = (paiementsRes.data || [])
        .sort((a, b) => new Date(b.datePaiement || b.creeLe) - new Date(a.datePaiement || a.creeLe))
        .slice(0, 5);
      setPaiementsRecents(paiementsRecents);

      // Récupérer les dépenses récentes
      const depensesRes = await api.get(`/api/depenses/universite/${universiteId}`).catch(() => ({ data: [] }));
      const depensesRecentes = (depensesRes.data || [])
        .sort((a, b) => new Date(b.dateDepense || b.creeLe) - new Date(a.dateDepense || a.creeLe))
        .slice(0, 5);
      setDepensesRecentes(depensesRecentes);

    } catch (err) {
      console.error('Erreur chargement données comptable :', err);
      setError('Impossible de charger les données du tableau de bord.');
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut) => {
    switch(statut) {
      case 'VALIDE': return 'badge-success';
      case 'EN_ATTENTE': return 'badge-warning';
      case 'REJETE': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

  const getStatutLabel = (statut) => {
    switch(statut) {
      case 'VALIDE': return '✅ Validé';
      case 'EN_ATTENTE': return '⏳ En attente';
      case 'REJETE': return '❌ Rejeté';
      default: return statut;
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading">Chargement du tableau de bord Comptable...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="alert-erreur">{error}</div>
      </div>
    );
  }

  // ── Variante « premium » (opt-in, réversible) ──────────────────────────
  if (design === 'premium') {
    return <ComptableDashboardPremium user={user} stats={stats} paiementsRecents={paiementsRecents} />;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">💰 Tableau de bord – Comptable</h1>
          <p className="page-sub">
            Bienvenue, <AvatarUtilisateur taille={22} style={{ marginRight: 7 }} />{user?.nomComplet || user?.email} – Gérez les finances de l'université
          </p>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          📅 {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Statistiques financières */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E6F1FB' }}>💰</div>
          <div>
            <div className="stat-value">{stats?.totalPaiements || 0} USD</div>
            <div className="stat-label">Total encaissé</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#E1F5EE' }}>📊</div>
          <div>
            <div className="stat-value">{stats?.paiementsEnAttente || 0}</div>
            <div className="stat-label">Paiements en attente</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FAEEDA' }}>💳</div>
          <div>
            <div className="stat-value">{stats?.nbEtudiants || 0}</div>
            <div className="stat-label">Étudiants</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#FBEAF0' }}>📉</div>
          <div>
            <div className="stat-value">{stats?.totalDepenses || 0} USD</div>
            <div className="stat-label">Total dépenses</div>
          </div>
        </div>
      </div>

      {/* Grille principale */}
      <div className="dash-grid">
        {/* Paiements récents */}
        <div className="card">
          <div className="card-head">
            <h2 className="card-title">💳 Paiements récents</h2>
          </div>
          {paiementsRecents.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucun paiement récent.</p>
          ) : (
            <div className="activity-list">
              {paiementsRecents.map(p => (
                <div key={p.id} className="activity-item">
                  <div className="activity-dot" style={{ background: '#185FA5' }}></div>
                  <div style={{ flex: 1 }}>
                    <div className="activity-text">
                      <strong>{p.montant} {p.devise}</strong> – {p.type?.replace('_', ' ')}
                    </div>
                    <div className="activity-meta">
                      Réf: {p.reference} • {p.inscription?.etudiant?.nomComplet || p.inscriptionId}
                      <span className={`badge ${getStatutBadge(p.statut)}`} style={{ marginLeft: 8 }}>
                        {getStatutLabel(p.statut)}
                      </span>
                    </div>
                  </div>
                  <Link to="/finances/admin/historique" className="btn-outline" style={{ fontSize: 11, padding: '4px 10px' }}>
                    Voir
                  </Link>
                </div>
              ))}
            </div>
          )}
          <Link to="/finances/admin/historique" style={{ marginTop: 12, display: 'block', textAlign: 'center', fontSize: 12 }}>
            Voir tous les paiements →
          </Link>
        </div>

        {/* Dépenses récentes */}
        <div className="card">
          <div className="card-head">
            <h2 className="card-title">📊 Dépenses récentes</h2>
          </div>
          {/* NOTE : le suivi des dépenses par université n'a pas encore d'endpoint backend
              dédié (seule la trésorerie globale existe) — cette section reste vide tant
              que ce n'est pas construit côté API. */}
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
            Aucune dépense récente.
          </p>
        </div>
      </div>

      {/* Actions rapides (boîtes de dialogue) */}
      <div className="card" style={{ marginTop: 20, marginBottom: 20 }}>
        <div className="card-head">
          <h2 className="card-title">⚡ Actions rapides</h2>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/comptable/comptes" className="btn-primary" style={{ fontSize: 12 }}>💳 Gérer les paiements</Link>
          <Link to="/comptable/ecritures" className="btn-outline" style={{ fontSize: 12 }}>📝 Écritures</Link>
          <Link to="/comptable/budgets" className="btn-outline" style={{ fontSize: 12 }}>📊 Budgets</Link>
          <Link to="/comptable/balance" className="btn-outline" style={{ fontSize: 12 }}>⚖️ Balance</Link>
          <Link to="/comptable/rapports" className="btn-outline" style={{ fontSize: 12 }}>📄 Rapports</Link>
          <Link to="/comptable/validation-paie" className="btn-outline" style={{ fontSize: 12 }}>💰 Validation paie RH</Link>
        </div>
      </div>

      {/* QuickActionsGrid existant */}
      <div className="card">
        <div className="card-head">
          <h2 className="card-title">📈 Rapports & statistiques</h2>
        </div>
        <QuickActionsGrid
          actions={[
            {
              icon: '📊', label: 'Évolution financière', to: '/finances/rapports/evolution',
              color: '#854F0B', bg: '#FAEEDA',
              description: 'Vue d\'ensemble de l\'évolution des encaissements.',
              applyLabel: 'Afficher',
              fields: [
                { name: 'periode', label: 'Période', type: 'select', options: ['Année en cours', 'Semestre en cours', '12 derniers mois'] },
              ],
            },
            {
              icon: '💸', label: 'Taux de recouvrement', to: '/finances/rapports/recouvrement',
              color: '#1D9E75', bg: '#E1F5EE',
              description: 'Taux de recouvrement des frais par promotion.',
              applyLabel: 'Générer',
              fields: [
                { name: 'promotion', label: 'Promotion', type: 'select', options: ['Toutes', 'L1', 'L2', 'L3', 'M1', 'M2'] },
              ],
            },
            {
              icon: '🏦', label: 'Dettes étudiantes', to: '/finances/rapports/dettes',
              color: '#185FA5', bg: '#E6F1FB',
              description: 'Détails des dettes par promotion et par étudiant.',
              applyLabel: 'Afficher',
              fields: [
                { name: 'statut', label: 'Statut', type: 'select', options: ['Toutes', 'En retard', 'Soldées'] },
              ],
            },
          ]}
        />
      </div>
    </div>
  );
}