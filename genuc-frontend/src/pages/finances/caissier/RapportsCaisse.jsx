// src/pages/finances/caissier/RapportsCaisse.jsx
import { useState, useEffect } from 'react';
import api from '../../../api/axios';
import '../FinanceDashboard.css';

export default function RapportsCaisse() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEncaissements: 0,
    totalAttente: 0,
    totalPartiel: 0,
    totalAnnule: 0,
    dernieresTransactions: []
  });
  const [error, setError] = useState('');

  useEffect(() => {
    chargerRapports();
  }, []);

  const chargerRapports = async () => {
    setLoading(true);
    setError('');
    try {
      // Récupérer l'historique des affectations (on pourrait avoir une API dédiée /stats)
      const res = await api.get('/api/admin/frais/historique');
      const data = res.data || [];

      // Calcul des statistiques
      const totalEncaissements = data
        .filter(a => a.statut === 'PAYE' || a.statut === 'PARTIEL')
        .reduce((sum, a) => sum + (a.montant - (a.reste || 0)), 0);

      const totalAttente = data.filter(a => a.statut === 'EN_ATTENTE').length;
      const totalPartiel = data.filter(a => a.statut === 'PARTIEL').length;
      const totalAnnule = data.filter(a => a.statut === 'ANNULE').length;

      // Dernières 5 transactions (triées par date)
      const dernieres = [...data]
        .sort((a, b) => new Date(b.dateAffectation) - new Date(a.dateAffectation))
        .slice(0, 5);

      setStats({
        totalEncaissements,
        totalAttente,
        totalPartiel,
        totalAnnule,
        dernieresTransactions: dernieres
      });
    } catch (err) {
      setError('Impossible de charger les rapports');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut) => {
    const map = {
      'EN_ATTENTE': 'badge-warning',
      'PARTIEL': 'badge-warning',
      'PAYE': 'badge-success',
      'ANNULE': 'badge-danger'
    };
    return map[statut] || 'badge-neutral';
  };

  const getStatutLabel = (statut) => {
    const map = {
      'EN_ATTENTE': '⏳ En attente',
      'PARTIEL': '🔄 Partiel',
      'PAYE': '✅ Payé',
      'ANNULE': '❌ Annulé'
    };
    return map[statut] || statut;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement des rapports...</p>
      </div>
    );
  }

  return (
    <div className="finance-dashboard">
      <div className="section-header">
        <h2 className="section-title">📊 Rapports de caisse</h2>
        <button className="btn-outline" onClick={chargerRapports} disabled={loading}>
          🔄 Actualiser
        </button>
      </div>

      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      {/* Cartes de statistiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#1D9E75' }}>{stats.totalEncaissements.toFixed(2)} USD</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total encaissé</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#F39C12' }}>{stats.totalAttente}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>En attente</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#E67E22' }}>{stats.totalPartiel}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Partiellement payés</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#E74C3C' }}>{stats.totalAnnule}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Annulés</div>
        </div>
      </div>

      {/* Dernières transactions */}
      <div className="card">
        <h3 className="card-title">🕒 Dernières transactions</h3>
        {stats.dernieresTransactions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucune transaction récente</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Frais</th>
                <th>Montant</th>
                <th>Payé</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.dernieresTransactions.map(a => (
                <tr key={a.id}>
                  <td>{a.inscription?.prenom} {a.inscription?.nom}</td>
                  <td>{a.frais?.libelle}</td>
                  <td>{a.montant} USD</td>
                  <td>{(a.montant - (a.reste || 0)).toFixed(2)} USD</td>
                  <td><span className={`badge ${getStatutBadge(a.statut)}`}>{getStatutLabel(a.statut)}</span></td>
                  <td>{new Date(a.dateAffectation).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}