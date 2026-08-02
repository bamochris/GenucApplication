// src/pages/admin/deliberation/PreDeliberation.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import deliberationService from '../../../services/deliberationService';
import StatutBadge from '../../../components/deliberation/StatutBadge';
import '../../Dashboard.css';

export default function PreDeliberation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('TOUS');
  const [annee, setAnnee] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Utiliser getListe ou un endpoint spécifique de pré-délibération
      const response = await deliberationService.getListe(user.universiteId, annee || undefined);
      setData(response.content || []);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.universiteId, annee]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Statistiques
  const stats = {
    total: data.length,
    pa: data.filter(s => {
      const statut = s.statut || s.decision;
      return statut === 'PA' || statut === 'ADMIS' || statut === 'DIPLOME';
    }).length,
    pd: data.filter(s => {
      const statut = s.statut || s.decision;
      return statut === 'PD' || statut === 'ADMIS_RATTRAPAGE';
    }).length,
    pp: data.filter(s => {
      const statut = s.statut || s.decision;
      return statut === 'PP' || statut === 'REDOUBLE';
    }).length,
    cj: data.filter(s => {
      const statut = s.statut || s.decision;
      return statut === 'CJ' || statut === 'EXCLU';
    }).length,
    tauxReussite: data.length > 0 
      ? ((data.filter(s => {
          const statut = s.statut || s.decision;
          return statut === 'PA' || statut === 'ADMIS' || statut === 'DIPLOME' || statut === 'PD' || statut === 'ADMIS_RATTRAPAGE';
        }).length / data.length) * 100).toFixed(1)
      : 0
  };

  const getStatutFromItem = (item) => {
    return item.statut || item.decision;
  };

  const filteredData = filter === 'TOUS' 
    ? data 
    : data.filter(s => getStatutFromItem(s) === filter);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de la pré-délibération...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 Pré-délibération</h1>
          <p className="page-sub">Récapitulatif avant délibération officielle</p>
        </div>
        <button className="btn-outline" onClick={loadData}>
          🔄 Actualiser
        </button>
      </div>

      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      {/* Cartes statistiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="card" style={{ padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.total}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total étudiants</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: 'center', borderLeft: '4px solid #28a745' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#28a745' }}>{stats.pa}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PA</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: 'center', borderLeft: '4px solid #fd7e14' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#fd7e14' }}>{stats.pd}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PD</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: 'center', borderLeft: '4px solid #dc3545' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#dc3545' }}>{stats.pp}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>PP</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: 'center', borderLeft: '4px solid #007bff' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#007bff' }}>{stats.cj}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>CJ</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: 'center', borderLeft: '4px solid #6f42c1' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#6f42c1' }}>{stats.tauxReussite}%</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Taux réussite</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontWeight: 600 }}>Filtrer par statut :</label>
          {['TOUS', 'PA', 'PD', 'PP', 'CJ'].map(s => (
            <button
              key={s}
              className={filter === s ? 'btn-primary' : 'btn-outline'}
              style={{ fontSize: 12, padding: '4px 14px' }}
              onClick={() => setFilter(s)}
            >
              {s === 'TOUS' ? 'Tous' : s}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 12 }}>Année :</label>
            <select 
              value={annee} 
              onChange={e => setAnnee(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd' }}
            >
              <option value="">Toutes</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Matricule</th>
                <th>Nom</th>
                <th>Moyenne S1</th>
                <th>Moyenne S2</th>
                <th>Moyenne Générale</th>
                <th>Crédits S1</th>
                <th>Crédits S2</th>
                <th>Total Crédits</th>
                <th>Dette</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr><td colSpan="10" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 30 }}>Aucun étudiant trouvé</td></tr>
              ) : (
                filteredData.map(s => {
                  const statut = s.statut || s.decision;
                  return (
                    <tr key={s.id}>
                      <td><span className="uni-code">{s.matricule}</span></td>
                      <td>{s.nom} {s.prenom}</td>
                      <td>{s.moyenneS1?.toFixed(2) || '-'}</td>
                      <td>{s.moyenneS2?.toFixed(2) || '-'}</td>
                      <td><strong>{s.moyenneGenerale?.toFixed(2) || s.moyenne?.toFixed(2) || '-'}</strong></td>
                      <td>{s.creditsS1 || 0}</td>
                      <td>{s.creditsS2 || 0}</td>
                      <td>{s.creditsValides || s.creditsTotal || 0}</td>
                      <td>
                        {s.dette > 0 ? (
                          <span style={{ color: '#dc3545', fontWeight: 600 }}>{s.dette} UE</span>
                        ) : (
                          <span style={{ color: '#28a745' }}>Aucune</span>
                        )}
                      </td>
                      <td>
                        <StatutBadge statut={statut} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
        <button 
          className="btn-outline" 
          onClick={() => {
            window.open(`/api/deliberation/export?universiteId=${user.universiteId}`, '_blank', 'noopener,noreferrer');
          }}
        >
          📥 Exporter Excel
        </button>
        <button 
          className="btn-primary"
          onClick={() => navigate('/admin/deliberation/semestre/S1')}
        >
          ➡️ Passer à la délibération
        </button>
      </div>
    </div>
  );
}