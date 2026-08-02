// src/pages/finances/caissier/JournalCaisse.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../FinanceDashboard.css';

export default function JournalCaisse() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [operations, setOperations] = useState([]);
  const [caisse, setCaisse] = useState(null);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10));
  const [filterType, setFilterType] = useState('');
  const [stats, setStats] = useState({
    totalEncaissements: 0,
    totalDepenses: 0,
    solde: 0
  });

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [filterDate]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Récupérer la caisse du jour (404 = aucune caisse ouverte, état normal)
      const caisseRes = await api.get(`/api/caisse/universite/${user.universiteId}/ouverte`)
        .catch(err => (err.status === 404 ? { data: null } : Promise.reject(err)));
      setCaisse(caisseRes.data || null);

      // Récupérer les opérations via le caisseId
      const caisseId = caisseRes.data?.id;
      const opsRes = caisseId
        ? await api.get(`/api/caisse/operations/caisse/${caisseId}`)
        : { data: [] };
      const data = (opsRes.data || []).filter(o => !filterDate || o.date?.startsWith(filterDate));
      setOperations(data);

      // Calculer les stats
      const encaissements = data.filter(o => o.type === 'ENCAISSEMENT').reduce((sum, o) => sum + o.montant, 0);
      const depenses = data.filter(o => o.type === 'DEPENSE' || o.type === 'REMBOURSEMENT').reduce((sum, o) => sum + o.montant, 0);
      setStats({
        totalEncaissements: encaissements,
        totalDepenses: depenses,
        solde: encaissements - depenses
      });
    } catch (err) {
      console.error('Erreur chargement journal:', err);
      setError('Impossible de charger le journal de caisse');
    } finally {
      setLoading(false);
    }
  };

  const filteredOps = operations.filter(op => {
    if (filterType && op.type !== filterType) return false;
    return true;
  });

  const getTypeIcon = (type) => {
    const map = {
      'ENCAISSEMENT': '💰',
      'DEPENSE': '📤',
      'REMBOURSEMENT': '↩️'
    };
    return map[type] || '📌';
  };

  const getTypeColor = (type) => {
    const map = {
      'ENCAISSEMENT': '#1D9E75',
      'DEPENSE': '#cc0000',
      'REMBOURSEMENT': '#ff9800'
    };
    return map[type] || '#888';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement du journal...</p>
      </div>
    );
  }

  return (
    <div className="finance-dashboard">
      <div className="section-header">
        <h2 className="section-title">📋 Journal de caisse</h2>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {caisse ? '🟢 Caisse ouverte' : '🔴 Caisse fermée'}
        </span>
      </div>

      {error && (
        <div className="alert-erreur" onClick={() => setError(null)}>{error}</div>
      )}

      {/* Résumé du jour */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card" style={{ borderLeftColor: '#1D9E75' }}>
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: 'var(--color-success-text)' }}>{stats.totalEncaissements.toFixed(2)} USD</div>
            <div className="stat-label">Encaissements</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#cc0000' }}>
          <div className="stat-icon">📤</div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: 'var(--color-danger-text)' }}>{stats.totalDepenses.toFixed(2)} USD</div>
            <div className="stat-label">Sorties</div>
          </div>
        </div>
        <div className="stat-card" style={{ borderLeftColor: stats.solde >= 0 ? '#185FA5' : '#cc0000' }}>
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value" style={{ color: stats.solde >= 0 ? '#185FA5' : 'var(--color-danger-text)' }}>
              {stats.solde.toFixed(2)} USD
            </div>
            <div className="stat-label">Solde du jour</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">{operations.length}</div>
            <div className="stat-label">Opérations</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontWeight: 600 }}>Date :</label>
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
          />
          <label style={{ fontWeight: 600 }}>Type :</label>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
          >
            <option value="">Tous</option>
            <option value="ENCAISSEMENT">💰 Encaissements</option>
            <option value="DEPENSE">📤 Dépenses</option>
            <option value="REMBOURSEMENT">↩️ Remboursements</option>
          </select>
          <button className="btn-outline" onClick={loadData}>🔄 Rafraîchir</button>
        </div>
      </div>

      {/* Liste des opérations */}
      <div className="card">
        <h3 className="card-title">Opérations du {new Date(filterDate).toLocaleDateString('fr-FR')}</h3>
        {filteredOps.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucune opération pour cette date</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Heure</th>
                  <th>Type</th>
                  <th>Montant</th>
                  <th>Référence</th>
                  <th>Étudiant</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredOps.map(op => (
                  <tr key={op.id}>
                    <td>{new Date(op.dateOperation).toLocaleTimeString('fr-FR')}</td>
                    <td>
                      <span style={{ color: getTypeColor(op.type) }}>
                        {getTypeIcon(op.type)} {op.type}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: op.type === 'ENCAISSEMENT' ? '#1D9E75' : '#cc0000' }}>
                      {op.type === 'ENCAISSEMENT' ? '+' : '-'} {op.montant.toFixed(2)} USD
                    </td>
                    <td className="uni-code">{op.reference || '-'}</td>
                    <td>{op.etudiant || '-'}</td>
                    <td>{op.description || '-'}</td>
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