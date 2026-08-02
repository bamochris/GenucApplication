// src/pages/professeur/rapports/PresencesPromotion.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function PresencesPromotion() {
  const { user } = useAuth();
  const [promotions, setPromotions] = useState([]);
  const [selectedPromotion, setSelectedPromotion] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState('mois');

  useEffect(() => {
    loadPromotions();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadPromotions = async () => {
    try {
      const res = await api.get(`/api/professeur/promotions/${user.id}`);
      setPromotions(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const loadStats = async (promotionId) => {
    if (!promotionId) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/professeur/presences/stats-promotion/${promotionId}/${periode}`);
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (e) => {
    const id = e.target.value;
    setSelectedPromotion(id);
    if (id) loadStats(id);
    else setStats(null);
  };

  if (loading && promotions.length === 0) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">📋 Présences par promotion</h2>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
            <label>Promotion</label>
            <select value={selectedPromotion} onChange={handleSelect}>
              <option value="">-- Sélectionner --</option>
              {promotions.map(p => (
                <option key={p.id} value={p.id}>{p.libelle} - {p.filiere}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: 150 }}>
            <label>Période</label>
            <select value={periode} onChange={e => { setPeriode(e.target.value); if (selectedPromotion) loadStats(selectedPromotion); }}>
              <option value="semaine">Semaine</option>
              <option value="mois">Mois</option>
              <option value="semestre">Semestre</option>
            </select>
          </div>
        </div>
      </div>

      {!selectedPromotion && (
        <div className="card">
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Sélectionnez une promotion</p>
        </div>
      )}

      {stats && selectedPromotion && (
        <div>
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-value">{stats.tauxPresence}%</div>
              <div className="stat-label">Taux de présence</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.totalEtudiants}</div>
              <div className="stat-label">Étudiants</div>
            </div>
            <div className="stat-card" style={{ borderLeftColor: '#ff9800' }}>
              <div className="stat-value">{stats.nbPresences}</div>
              <div className="stat-label">Présences enregistrées</div>
            </div>
            <div className="stat-card" style={{ borderLeftColor: '#cc0000' }}>
              <div className="stat-value">{stats.nbAbsences}</div>
              <div className="stat-label">Absences</div>
            </div>
          </div>

          {stats.eleves && stats.eleves.length > 0 && (
            <div className="card">
              <h3 className="card-title">Détail par étudiant</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Étudiant</th>
                    <th>Présences</th>
                    <th>Absences</th>
                    <th>Taux</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.eleves.map(e => (
                    <tr key={e.id}>
                      <td>{e.nom}</td>
                      <td>{e.presences}</td>
                      <td>{e.absences}</td>
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
        </div>
      )}
    </div>
  );
}