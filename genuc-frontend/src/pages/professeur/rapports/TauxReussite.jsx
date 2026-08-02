// src/pages/professeur/rapports/TauxReussite.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function TauxReussite() {
  const { user } = useAuth();
  const [cours, setCours] = useState([]);
  const [selectedCours, setSelectedCours] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [annee, setAnnee] = useState('2024-2025');

  useEffect(() => {
    loadCours();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadCours = async () => {
    try {
      const res = await api.get(`/api/cours/professeur/${user.id}`);
      setCours(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const loadStats = async (coursId) => {
    if (!coursId) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/rapports/reussite/${coursId}/${annee}`);
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCours = (e) => {
    const id = e.target.value;
    setSelectedCours(id);
    if (id) loadStats(id);
    else setStats(null);
  };

  const handleAnneeChange = (e) => {
    setAnnee(e.target.value);
    if (selectedCours) loadStats(selectedCours);
  };

  if (loading && cours.length === 0) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">📊 Taux de réussite</h2>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
            <label>Cours</label>
            <select value={selectedCours} onChange={handleSelectCours}>
              <option value="">-- Sélectionner --</option>
              {cours.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.titre}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: 150 }}>
            <label>Année</label>
            <select value={annee} onChange={handleAnneeChange}>
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
            </select>
          </div>
          <button className="btn-primary" onClick={() => selectedCours && loadStats(selectedCours)}>Rafraîchir</button>
        </div>
      </div>

      {!selectedCours && (
        <div className="card">
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Sélectionnez un cours pour voir les statistiques</p>
        </div>
      )}

      {stats && selectedCours && (
        <div>
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-value" style={{ color: stats.tauxReussite >= 70 ? 'var(--color-success-text)' : stats.tauxReussite >= 50 ? '#ff9800' : 'var(--color-danger-text)' }}>
                {stats.tauxReussite}%
              </div>
              <div className="stat-label">Taux de réussite</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.nbReussis}</div>
              <div className="stat-label">Réussis</div>
            </div>
            <div className="stat-card" style={{ borderLeftColor: '#cc0000' }}>
              <div className="stat-value">{stats.nbEchecs}</div>
              <div className="stat-label">Échecs</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.moyenne}</div>
              <div className="stat-label">Moyenne générale</div>
            </div>
          </div>

          {stats.evolution && stats.evolution.length > 0 && (
            <div className="card">
              <h3 className="card-title">Évolution des résultats</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Période</th>
                    <th>Étudiants</th>
                    <th>Réussis</th>
                    <th>Taux</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.evolution.map((e, idx) => (
                    <tr key={idx}>
                      <td>{e.periode}</td>
                      <td>{e.total}</td>
                      <td>{e.reussis}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, background: 'var(--bg-secondary)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${e.taux}%`, background: e.taux >= 70 ? '#1D9E75' : e.taux >= 50 ? '#ff9800' : '#cc0000', height: '100%' }} />
                          </div>
                          <span>{e.taux}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {stats.repartition && (
            <div className="card" style={{ marginTop: 20 }}>
              <h3 className="card-title">Répartition des notes</h3>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {Object.entries(stats.repartition).map(([mention, count]) => (
                  <div key={mention} style={{
                    padding: '12px 20px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    textAlign: 'center',
                    flex: 1,
                    minWidth: 100
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 20 }}>{count}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{mention}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}