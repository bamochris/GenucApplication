// src/pages/professeur/presences/StatistiquesPresences.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function StatistiquesPresences() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCours, setSelectedCours] = useState('');
  const [coursList, setCoursList] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadData = async () => {
    try {
      const [coursRes, statsRes] = await Promise.all([
        api.get(`/api/cours/professeur/${user.id}`),
        api.get(`/api/professeur/presences/stats/${user.id}`)
      ]);
      setCoursList(coursRes.data);
      setStats(statsRes.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les statistiques de présence');
    } finally {
      setLoading(false);
    }
  };

  const loadCoursStats = async (coursId) => {
    try {
      const res = await api.get(`/api/professeur/presences/cours-stats/${coursId}`);
      setStats(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les statistiques de ce cours');
    }
  };

  const handleCoursChange = (e) => {
    const id = e.target.value;
    setSelectedCours(id);
    if (id) loadCoursStats(id);
    else loadData();
  };

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">📊 Statistiques des présences</h2>
      </div>

      {error && <div className="alert-erreur">{error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 600 }}>Cours :</label>
          <select
            value={selectedCours}
            onChange={handleCoursChange}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
          >
            <option value="">Tous les cours</option>
            {coursList.map(c => (
              <option key={c.id} value={c.id}>{c.code} - {c.titre}</option>
            ))}
          </select>
          <button className="btn-outline" onClick={() => { setSelectedCours(''); loadData(); }}>
            Réinitialiser
          </button>
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👨‍🎓</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalEtudiants || 0}</div>
              <div className="stat-label">Étudiants</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.tauxPresence || 0}%</div>
              <div className="stat-label">Taux de présence</div>
            </div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: '#ff9800' }}>
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalSeances || 0}</div>
              <div className="stat-label">Séances</div>
            </div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: '#ff9800' }}>
            <div className="stat-icon">📝</div>
            <div className="stat-content">
              <div className="stat-value">{stats.absencesJustifiees || 0}</div>
              <div className="stat-label">Absences justifiées</div>
            </div>
          </div>
        </div>
      )}

      {stats?.parCours && (
        <div className="card" style={{ marginTop: 20 }}>
          <h3 className="card-title">Détail par cours</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Cours</th>
                <th>Étudiants</th>
                <th>Taux présence</th>
                <th>Absences</th>
              </tr>
            </thead>
            <tbody>
              {stats.parCours.map(c => (
                <tr key={c.id}>
                  <td>{c.code} - {c.titre}</td>
                  <td>{c.nbEtudiants}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, background: 'var(--bg-secondary)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${c.taux}%`, background: c.taux > 70 ? '#1D9E75' : c.taux > 50 ? '#ff9800' : '#cc0000', height: '100%' }} />
                      </div>
                      <span>{c.taux}%</span>
                    </div>
                  </td>
                  <td>{c.nbAbsences}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}