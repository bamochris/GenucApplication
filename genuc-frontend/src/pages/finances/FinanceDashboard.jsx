// src/pages/finances/FinanceDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDesign } from '../../context/DesignContext';
import api from '../../api/axios';
import QuickActionsGrid from '../../components/QuickActionsGrid';
import FinanceDashboardPremium from './FinanceDashboardPremium';
import './FinanceDashboard.css';

// Actions rapides adaptées au rôle : un étudiant ne voit que ses pages
// financières ; le personnel (admin, comptable, caissier) voit la gestion.
const actionsFinancesParRole = (role) => {
  if (role === 'ETUDIANT') {
    return [
      { icon: '💳', label: 'Mes frais', to: '/finances/etudiant/mes-frais', color: '#185FA5', bg: '#E6F1FB', description: 'Consulter et payer mes frais académiques.', applyLabel: 'Ouvrir mes frais' },
      { icon: '🧾', label: 'Mes reçus', to: '/finances/etudiant/recus', color: '#1D9E75', bg: '#E1F5EE', description: 'Télécharger mes reçus de paiement.', applyLabel: 'Ouvrir les reçus' },
      { icon: '📄', label: 'État financier', to: '/finances/etudiant/etat-financier', color: '#854F0B', bg: '#FAEEDA', description: 'Voir ma situation financière globale.', applyLabel: 'Ouvrir' },
      { icon: '📅', label: 'Plan de paiement', to: '/finances/etudiant/plan-paiement', color: '#6B21A8', bg: '#F3E8FF', description: 'Consulter mon échéancier de paiement.', applyLabel: 'Ouvrir' },
    ];
  }
  return [
    { icon: '💰', label: 'Gestion des frais', to: '/finances/admin/frais', color: '#185FA5', bg: '#E6F1FB', description: 'Définir et gérer les frais académiques.', applyLabel: 'Ouvrir la gestion' },
    { icon: '📋', label: 'Affectations', to: '/finances/admin/affectations', color: '#1D9E75', bg: '#E1F5EE', description: 'Affecter les frais aux inscriptions.', applyLabel: 'Ouvrir les affectations' },
    { icon: '📈', label: 'Taux de recouvrement', to: '/finances/rapports/recouvrement', color: '#854F0B', bg: '#FAEEDA', description: 'Suivre le recouvrement des frais.', applyLabel: 'Ouvrir le rapport' },
    { icon: '⚠️', label: 'Dettes étudiantes', to: '/finances/rapports/dettes', color: '#993556', bg: '#FBEAF0', description: 'Consulter les dettes en cours.', applyLabel: 'Ouvrir le rapport' },
  ];
};

export default function FinanceDashboard() {
  const { user } = useAuth();
  const { design } = useDesign();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalFrais: 0,
    totalActifs: 0,
    montantTotal: 0,
    totalAffectations: 0,
    totalDettes: 0,
    annee: ''
  });
  const [evolution, setEvolution] = useState([]);
  const [dettesRecentes, setDettesRecentes] = useState([]);

  const isAdmin = ['ADMIN_UNIVERSITE', 'COMPTABLE', 'SUPER_ADMIN'].includes(user?.role);
  const isCaissier = user?.role === 'CAISSIER';
  const isEtudiant = user?.role === 'ETUDIANT';
  const isRecteur = user?.role === 'RECTEUR';

  useEffect(() => {
    if (user?.universiteId) {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const annee = getCurrentAcademicYear();
      
      // Statistiques générales
      const statsRes = await api.get(`/api/admin/frais/statistiques?annee=${annee}`);
      setStats(statsRes.data);

      // Évolution des recettes (pour admin/recteur)
      if (isAdmin || isRecteur) {
        const evoRes = await api.get(`/api/rapports/financiers/evolution?annee=${new Date().getFullYear()}`);
        setEvolution(evoRes.data?.evolution || []);
      }

      // Dettes récentes (pour admin/recteur)
      if (isAdmin || isRecteur) {
        const dettesRes = await api.get(`/api/rapports/financiers/dettes`);
        setDettesRecentes(dettesRes.data?.slice(0, 5) || []);
      }
    } catch (err) {
      console.error('Erreur chargement dashboard finances:', err);
      setError('Impossible de charger les données financières');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentAcademicYear = () => {
    const year = new Date().getFullYear();
    return `${year}-${year + 1}`;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement des données financières...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="finance-dashboard">
        <div className="alert-erreur">{error}</div>
        <button className="btn-primary" onClick={loadData}>🔄 Réessayer</button>
      </div>
    );
  }

  // ── Variante « premium » (opt-in, réversible) ──────────────────────────
  if (design === 'premium') {
    return (
      <FinanceDashboardPremium
        role={user?.role}
        stats={stats}
        evolution={evolution}
        dettesRecentes={dettesRecentes}
      />
    );
  }

  return (
    <div className="finance-dashboard">
      <div className="section-header">
        <h2 className="section-title">📊 Tableau de bord financier</h2>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Année académique : {stats.annee || getCurrentAcademicYear()}
        </span>
      </div>

      {/* Actions rapides (adaptées au rôle) */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-head"><h2 className="card-title">⚡ Actions rapides</h2></div>
        <QuickActionsGrid actions={actionsFinancesParRole(user?.role)} />
      </div>

      {/* Statistiques clés */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalFrais || 0}</div>
            <div className="stat-label">Total frais</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#1D9E75' }}>
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: 'var(--color-success-text)' }}>{stats.totalActifs || 0}</div>
            <div className="stat-label">Frais actifs</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#185FA5' }}>
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalAffectations || 0}</div>
            <div className="stat-label">Affectations</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: stats.totalDettes > 0 ? '#cc0000' : '#1D9E75' }}>
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: stats.totalDettes > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)' }}>
              {stats.totalDettes?.toLocaleString()} USD
            </div>
            <div className="stat-label">Dettes actives</div>
          </div>
        </div>
      </div>

      {/* Évolution des recettes (admin/recteur) */}
      {(isAdmin || isRecteur) && Object.keys(evolution).length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">📈 Évolution des recettes {new Date().getFullYear()}</h3>
          <div className="evolution-chart" style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 180, paddingTop: 20 }}>
            {Object.entries(evolution).map(([mois, montant]) => {
              const max = Math.max(...Object.values(evolution), 1);
              const height = Math.max(4, (montant / max) * 150);
              return (
                <div key={mois} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ 
                    width: '100%', 
                    height: height, 
                    background: montant > 0 ? '#185FA5' : '#e0e0e0',
                    borderRadius: '4px 4px 0 0',
                    minHeight: 4,
                    transition: 'height 0.5s ease'
                  }} />
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4 }}>{mois.substring(0, 3)}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            Total annuel : {Object.values(evolution).reduce((a, b) => a + b, 0).toLocaleString()} USD
          </div>
        </div>
      )}

      {/* Dettes récentes (admin/recteur) */}
      {(isAdmin || isRecteur) && dettesRecentes.length > 0 && (
        <div className="card">
          <h3 className="card-title">💳 Principaux débiteurs</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Matricule</th>
                <th>Promotion</th>
                <th>Total dû</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {dettesRecentes.map((d, idx) => (
                <tr key={idx}>
                  <td>{d.etudiant}</td>
                  <td className="uni-code">{d.matricule}</td>
                  <td>{d.promotion}</td>
                  <td style={{ fontWeight: 600, color: '#cc0000' }}>{d.totalDette} USD</td>
                  <td>
                    <Link to="/finances/rapports/dettes" className="btn-outline" style={{ fontSize: 11, textDecoration: 'none' }}>📋 Voir</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pour l'étudiant : résumé personnel */}
      {isEtudiant && (
        <div className="card">
          <h3 className="card-title">📊 Votre situation financière</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Consultez vos frais à payer, votre historique et vos reçus dans les sections dédiées.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <Link to="/finances/etudiant/mes-frais" className="btn-primary">📋 Frais à payer</Link>
            <Link to="/finances/etudiant/etat-financier" className="btn-outline">📊 État financier</Link>
          </div>
        </div>
      )}

      {/* Pour le caissier : résumé de la caisse */}
      {isCaissier && (
        <div className="card">
          <h3 className="card-title">🏦 Caisse - Aujourd'hui</h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Gérez les encaissements, consultez le journal et clôturez la journée.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <Link to="/finances/caissier/encaissement" className="btn-primary">💵 Encaissement</Link>
            <Link to="/finances/caissier/journal" className="btn-outline">📋 Journal</Link>
            <Link to="/finances/caissier/cloture" className="btn-outline">🔒 Clôture</Link>
          </div>
        </div>
      )}
    </div>
  );
}