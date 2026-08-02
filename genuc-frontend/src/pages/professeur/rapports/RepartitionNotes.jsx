// src/pages/professeur/rapports/RepartitionNotes.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function RepartitionNotes() {
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
      const res = await api.get(`/api/rapports/repartition/${coursId}/${annee}`);
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (e) => {
    const id = e.target.value;
    setSelectedCours(id);
    if (id) loadStats(id);
    else setStats(null);
  };

  if (loading && cours.length === 0) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">📊 Répartition des notes</h2>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
            <label>Cours</label>
            <select value={selectedCours} onChange={handleSelect}>
              <option value="">-- Sélectionner --</option>
              {cours.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.titre}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: 150 }}>
            <label>Année</label>
            <select value={annee} onChange={e => { setAnnee(e.target.value); if (selectedCours) loadStats(selectedCours); }}>
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
            </select>
          </div>
        </div>
      </div>

      {!selectedCours && (
        <div className="card">
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Sélectionnez un cours</p>
        </div>
      )}

      {stats && selectedCours && (
        <div>
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-value">{stats.nbEtudiants}</div>
              <div className="stat-label">Étudiants</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.moyenne}</div>
              <div className="stat-label">Moyenne</div>
            </div>
            <div className="stat-card" style={{ borderLeftColor: '#1D9E75' }}>
              <div className="stat-value">{stats.noteMin}</div>
              <div className="stat-label">Note min</div>
            </div>
            <div className="stat-card" style={{ borderLeftColor: '#185FA5' }}>
              <div className="stat-value">{stats.noteMax}</div>
              <div className="stat-label">Note max</div>
            </div>
          </div>

          {stats.tranches && (
            <div className="card" style={{ marginTop: 20 }}>
              <h3 className="card-title">Répartition par tranches</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {stats.tranches.map(t => (
                  <div key={t.tranche}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                      <span>{t.tranche}</span>
                      <span>{t.nb} étudiants ({t.pourcentage}%)</span>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', height: 12, borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{
                        width: `${t.pourcentage}%`,
                        background: t.tranche.includes('18-20') ? '#1D9E75' :
                                    t.tranche.includes('16-18') ? '#185FA5' :
                                    t.tranche.includes('14-16') ? '#2196F3' :
                                    t.tranche.includes('12-14') ? '#4CAF50' :
                                    t.tranche.includes('10-12') ? '#ff9800' : '#cc0000',
                        height: '100%',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.details && stats.details.length > 0 && (
            <div className="card" style={{ marginTop: 20 }}>
              <h3 className="card-title">Détail des étudiants</h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Étudiant</th>
                    <th>Matricule</th>
                    <th>Note</th>
                    <th>Mention</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.details.map(d => (
                    <tr key={d.id}>
                      <td>{d.nom}</td>
                      <td className="uni-code">{d.matricule}</td>
                      <td style={{ fontWeight: 700, color: d.note >= 10 ? '#1D9E75' : '#cc0000' }}>{d.note}/20</td>
                      <td>{d.mention || '-'}</td>
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