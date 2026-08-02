// src/pages/finances/etudiant/HistoriquePaiements.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../FinanceDashboard.css';

export default function HistoriquePaiements() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [paiements, setPaiements] = useState([]);
  const [filterStatut, setFilterStatut] = useState('');
  const [filterDate, setFilterDate] = useState('');

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
      const res = await api.get(`/api/etudiant/frais/historique`);
      setPaiements(res.data || []);
    } catch (err) {
      console.error('Erreur chargement historique:', err);
      setError('Impossible de charger votre historique');
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut) => {
    const map = {
      'VALIDE': 'badge-success',
      'EN_ATTENTE': 'badge-warning',
      'REJETE': 'badge-danger',
      'REMBOURSE': 'badge-neutral'
    };
    return map[statut] || 'badge-neutral';
  };

  const getStatutLabel = (statut) => {
    const map = {
      'VALIDE': '✅ Validé',
      'EN_ATTENTE': '⏳ En attente',
      'REJETE': '❌ Rejeté',
      'REMBOURSE': '↩️ Remboursé'
    };
    return map[statut] || statut;
  };

  const handleTelechargerRecu = async (id, reference) => {
    try {
      const response = await api.get(`/api/etudiant/frais/recu/${id}`, {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recu_${reference || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage('✅ Reçu téléchargé avec succès');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError('❌ Erreur lors du téléchargement');
    }
  };

  const filtered = paiements.filter(p => {
    const matchStatut = filterStatut ? p.statut === filterStatut : true;
    const matchDate = filterDate ? p.datePaiement === filterDate : true;
    return matchStatut && matchDate;
  });

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de votre historique...</p>
      </div>
    );
  }

  return (
    <div className="finance-dashboard">
      <div className="section-header">
        <h2 className="section-title">📜 Historique des paiements</h2>
        <button className="btn-outline" onClick={loadData}>🔄 Rafraîchir</button>
      </div>

      {message && (
        <div className="alert-success" onClick={() => setMessage('')}>{message}</div>
      )}
      {error && (
        <div className="alert-erreur" onClick={() => setError(null)}>{error}</div>
      )}

      {/* Filtres */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontWeight: 600 }}>Statut :</label>
          <select
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
          >
            <option value="">Tous</option>
            <option value="VALIDE">Validé</option>
            <option value="EN_ATTENTE">En attente</option>
            <option value="REJETE">Rejeté</option>
            <option value="REMBOURSE">Remboursé</option>
          </select>
          <label style={{ fontWeight: 600 }}>Date :</label>
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
          />
          <button className="btn-outline" onClick={() => { setFilterStatut(''); setFilterDate(''); }}>
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Liste */}
      <div className="card">
        <h3 className="card-title">Vos paiements ({filtered.length})</h3>
        {filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
            {paiements.length === 0 
              ? 'Aucun paiement enregistré'
              : 'Aucun paiement ne correspond aux filtres'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Date</th>
                  <th>Montant</th>
                  <th>Type</th>
                  <th>Mode</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td className="uni-code">{p.reference}</td>
                    <td>{new Date(p.datePaiement).toLocaleDateString('fr-FR')}</td>
                    <td style={{ fontWeight: 600 }}>{p.montant.toFixed(2)} {p.devise}</td>
                    <td>{p.type?.replace('_', ' ')}</td>
                    <td>{p.modePaiement?.replace('_', ' ')}</td>
                    <td>
                      <span className={`badge ${getStatutBadge(p.statut)}`}>
                        {getStatutLabel(p.statut)}
                      </span>
                    </td>
                    <td>
                      {p.statut === 'VALIDE' && (
                        <button 
                          className="btn-outline" 
                          style={{ fontSize: 11, padding: '4px 10px' }}
                          onClick={() => handleTelechargerRecu(p.id, p.reference)}
                        >
                          🧾 Reçu
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
