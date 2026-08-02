// src/pages/professeur/presences/HistoriquePresences.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function HistoriquePresences() {
  const { user } = useAuth();
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCours, setFilterCours] = useState('');
  const [coursList, setCoursList] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadData = async () => {
    try {
      const [coursRes, histRes] = await Promise.all([
        api.get(`/api/cours/professeur/${user.id}`),
        api.get(`/api/professeur/presences/historique/${user.id}`)
      ]);
      setCoursList(coursRes.data);
      setHistorique(histRes.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError("Impossible de charger l'historique des présences");
    } finally {
      setLoading(false);
    }
  };

  const filtered = filterCours
    ? historique.filter(h => h.coursId === parseInt(filterCours))
    : historique;

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">📋 Historique des présences</h2>
      </div>

      {error && <div className="alert-erreur">{error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 600 }}>Filtrer par cours :</label>
          <select
            value={filterCours}
            onChange={e => setFilterCours(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
          >
            <option value="">Tous les cours</option>
            {coursList.map(c => (
              <option key={c.id} value={c.id}>{c.code} - {c.titre}</option>
            ))}
          </select>
          <button className="btn-outline" onClick={() => setFilterCours('')}>Réinitialiser</button>
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucune présence enregistrée</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Cours</th>
                <th>Étudiant</th>
                <th>Statut</th>
                <th>Heure</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>{new Date(p.date).toLocaleDateString('fr-FR')}</td>
                  <td>{p.coursCode} - {p.coursTitre}</td>
                  <td>{p.etudiant}</td>
                  <td>
                    <span style={{
                      color: p.justifie ? '#ff9800' : p.present ? '#1D9E75' : '#cc0000',
                      fontWeight: 600
                    }}>
                      {p.justifie ? 'Justifié' : p.present ? 'Présent' : 'Absent'}
                    </span>
                  </td>
                  <td>{p.heure || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}