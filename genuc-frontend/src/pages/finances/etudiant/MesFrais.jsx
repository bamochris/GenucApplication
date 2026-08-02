// src/pages/finances/etudiant/MesFrais.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../FinanceDashboard.css';

export default function MesFrais() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dettes, setDettes] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    paye: 0,
    reste: 0,
    pourcentage: 0
  });

  const inscriptionId = user?.inscriptionId;

  useEffect(() => {
    if (inscriptionId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [inscriptionId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/etudiant/frais/a-payer`);
      const data = res.data || [];
      setDettes(data);

      const total = data.reduce((sum, d) => sum + d.montant, 0);
      const paye = data.reduce((sum, d) => sum + (d.paye || 0), 0);
      const reste = data.reduce((sum, d) => sum + (d.reste || d.montant), 0);
      setStats({
        total,
        paye,
        reste,
        pourcentage: total > 0 ? (paye / total) * 100 : 0
      });
    } catch (err) {
      console.error('Erreur chargement frais:', err);
      setError('Impossible de charger vos frais');
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut, reste) => {
    if (reste === 0) return 'badge-success';
    if (statut === 'PARTIEL') return 'badge-warning';
    return 'badge-danger';
  };

  const getStatutLabel = (statut, reste) => {
    if (reste === 0) return '✅ Payé';
    if (statut === 'PARTIEL') return '🔄 Partiel';
    return '⏳ En attente';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de vos frais...</p>
      </div>
    );
  }

  return (
    <div className="finance-dashboard">
      <div className="section-header">
        <h2 className="section-title">📋 Frais à payer</h2>
      </div>

      {error && (
        <div className="alert-erreur" onClick={() => setError(null)}>{error}</div>
      )}

      {/* Résumé */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card" style={{ borderLeftColor: '#185FA5' }}>
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total.toFixed(2)} USD</div>
            <div className="stat-label">Total des frais</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#1D9E75' }}>
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: 'var(--color-success-text)' }}>{stats.paye.toFixed(2)} USD</div>
            <div className="stat-label">Déjà payé</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: stats.reste > 0 ? '#cc0000' : '#1D9E75' }}>
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: stats.reste > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)' }}>
              {stats.reste.toFixed(2)} USD
            </div>
            <div className="stat-label">{stats.reste > 0 ? 'Reste à payer' : 'Soldé ✓'}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{Math.round(stats.pourcentage)}%</div>
            <div className="stat-label">Progression</div>
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span>Progression du paiement</span>
          <span style={{ fontWeight: 600 }}>{Math.round(stats.pourcentage)}%</span>
        </div>
        <div style={{ background: 'var(--bg-secondary)', height: 12, borderRadius: 6, overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(100, stats.pourcentage)}%`,
              background: stats.pourcentage >= 80 ? '#1D9E75' : '#185FA5',
              height: '100%',
              transition: 'width 0.6s ease'
            }}
          />
        </div>
      </div>

      {/* Liste des frais */}
      <div className="card">
        <h3 className="card-title">Détail des frais</h3>
        {dettes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
            ✅ Aucun frais à payer. Vous êtes à jour !
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Libellé</th>
                  <th>Montant</th>
                  <th>Payé</th>
                  <th>Reste</th>
                  <th>Échéance</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {dettes.map(d => (
                  <tr key={d.id}>
                    <td className="uni-code">{d.code}</td>
                    <td>{d.libelle}</td>
                    <td>{d.montant.toFixed(2)} USD</td>
                    <td>{d.paye?.toFixed(2) || '0.00'} USD</td>
                    <td style={{ fontWeight: 600, color: d.reste > 0 ? '#cc0000' : '#1D9E75' }}>
                      {d.reste.toFixed(2)} USD
                    </td>
                    <td>{d.dateEcheance ? new Date(d.dateEcheance).toLocaleDateString('fr-FR') : '-'}</td>
                    <td>
                      <span className={`badge ${getStatutBadge(d.statut, d.reste)}`}>
                        {getStatutLabel(d.statut, d.reste)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action */}
      <div className="card" style={{ marginTop: 20, background: 'rgba(24,95,165,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 32 }}>💳</span>
          <div>
            <h4 style={{ margin: 0, color: '#185FA5' }}>Effectuer un paiement</h4>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
              Rendez-vous à la caisse ou effectuez un paiement en ligne.
            </p>
          </div>
          <Link to="/etudiant/paiements" className="btn-primary" style={{ marginLeft: 'auto', textDecoration: 'none' }}>
            💳 Payer maintenant
          </Link>
        </div>
      </div>
    </div>
  );
}
