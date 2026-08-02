// src/pages/professeur/notes/HistoriqueNotes.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

export default function HistoriqueNotes() {
  const { user } = useAuth();
  const [historique, setHistorique] = useState([]);
  const [cours, setCours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCours, setFilterCours] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [user.id]);

  const loadData = async () => {
    try {
      const [coursRes, histRes] = await Promise.all([
        api.get(`/api/cours/professeur/${user.id}`),
        api.get(`/api/professeur/notes/historique/${user.id}`)
      ]);
      setCours(coursRes.data);
      setHistorique(histRes.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError("Impossible de charger l'historique des notes");
    } finally {
      setLoading(false);
    }
  };

  const filtered = historique.filter(h => {
    const matchCours = filterCours ? h.coursId === parseInt(filterCours) : true;
    const matchStatut = filterStatut ? h.statut === filterStatut : true;
    return matchCours && matchStatut;
  });

  if (loading) return <div className="dashboard-loading"><div className="loader"></div><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">📜 Historique des notes</h2>
      </div>

      {error && <div className="alert-erreur">{error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontWeight: 600 }}>Cours :</label>
          <select
            value={filterCours}
            onChange={e => setFilterCours(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
          >
            <option value="">Tous</option>
            {cours.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
          </select>
          <label style={{ fontWeight: 600 }}>Statut :</label>
          <select
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
          >
            <option value="">Tous</option>
            <option value="EN_COURS">En cours</option>
            <option value="SOUMISE">Soumise</option>
            <option value="VALIDEE">Validée</option>
            <option value="PUBLIEE">Publiée</option>
          </select>
          <button className="btn-outline" onClick={() => { setFilterCours(''); setFilterStatut(''); }}>
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>Aucune note trouvée</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Cours</th>
                <th>Note</th>
                <th>Mention</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(n => (
                <tr key={n.id}>
                  <td>{n.etudiant}</td>
                  <td>{n.coursCode}</td>
                  <td style={{ fontWeight: 600, color: n.noteFinale >= 10 ? '#1D9E75' : '#cc0000' }}>
                    {n.noteFinale}/20
                  </td>
                  <td>{n.mention || '-'}</td>
                  <td>
                    <span className={`badge ${n.statut === 'PUBLIEE' ? 'badge-success' : n.statut === 'VALIDEE' ? 'badge-warning' : 'badge-neutral'}`}>
                      {n.statut}
                    </span>
                  </td>
                  <td>{new Date(n.creeLe).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}