// src/pages/admin/deliberation/HistoriqueAudit.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import deliberationService from '../../../services/deliberationService';
import '../../Dashboard.css';

export default function HistoriqueAudit() {
  const { user } = useAuth();
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtreAction, setFiltreAction] = useState('');
  const [filtreUtilisateur, setFiltreUtilisateur] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const loadHistorique = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await deliberationService.getAudit(user.universiteId, {
        action: filtreAction || undefined,
        utilisateur: filtreUtilisateur || undefined,
        dateDebut: dateDebut || undefined,
        dateFin: dateFin || undefined
      });
      setHistorique(data.content || []);
    } catch (err) {
      setError('Erreur lors du chargement de l\'historique');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.universiteId, filtreAction, filtreUtilisateur, dateDebut, dateFin]);

  useEffect(() => {
    loadHistorique();
  }, [loadHistorique]);

  const getActionColor = (action) => {
    const map = {
      'VALIDATION': 'badge-success',
      'MODIFICATION': 'badge-warning',
      'SUPPRESSION': 'badge-danger',
      'SIGNATURE': 'badge-info',
      'IMPORT': 'badge-primary',
      'CONSOLIDATION': 'badge-secondary',
      'PUBLICATION': 'badge-primary'
    };
    return map[action] || 'badge-neutral';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de l'historique...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🔍 Historique & Audit</h1>
          <p className="page-sub">Traçabilité de toutes les actions du module Délibération</p>
        </div>
        <button className="btn-outline" onClick={loadHistorique}>
          🔄 Actualiser
        </button>
      </div>

      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      {/* Filtres */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div className="form-group">
            <label>Action</label>
            <select value={filtreAction} onChange={e => setFiltreAction(e.target.value)}>
              <option value="">Toutes</option>
              <option value="VALIDATION">Validation</option>
              <option value="MODIFICATION">Modification</option>
              <option value="SUPPRESSION">Suppression</option>
              <option value="SIGNATURE">Signature</option>
              <option value="IMPORT">Import</option>
              <option value="CONSOLIDATION">Consolidation</option>
              <option value="PUBLICATION">Publication</option>
            </select>
          </div>
          <div className="form-group">
            <label>Utilisateur</label>
            <input
              type="text"
              value={filtreUtilisateur}
              onChange={e => setFiltreUtilisateur(e.target.value)}
              placeholder="Nom ou email"
            />
          </div>
          <div className="form-group">
            <label>Date début</label>
            <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Date fin</label>
            <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="btn-outline" onClick={() => {
            setFiltreAction('');
            setFiltreUtilisateur('');
            setDateDebut('');
            setDateFin('');
          }}>
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Tableau */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Détails</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {historique.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>Aucune trace trouvée</td></tr>
              ) : (
                historique.map(h => (
                  <tr key={h.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(h.createdAt || h.date).toLocaleDateString('fr-FR')}
                      <br />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date(h.createdAt || h.date).toLocaleTimeString('fr-FR')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getActionColor(h.action)}`}>
                        {h.action}
                      </span>
                    </td>
                    <td><strong>{h.userEmail || h.utilisateur}</strong></td>
                    <td>{h.role || '-'}</td>
                    <td style={{ fontSize: 13 }}>
                      {h.newValue || h.details || h.objet || '-'}
                      {h.ancienneValeur && h.nouvelleValeur && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                          <span style={{ color: '#dc3545' }}>{h.ancienneValeur}</span>
                          {' → '}
                          <span style={{ color: '#28a745' }}>{h.nouvelleValeur}</span>
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{h.ip || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}