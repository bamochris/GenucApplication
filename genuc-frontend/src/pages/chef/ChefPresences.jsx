// src/pages/chef/ChefPresences.jsx
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function ChefPresences() {
  const { user } = useAuth();
  const [presences, setPresences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [coursList, setCoursList] = useState([]);
  const [selectedCours, setSelectedCours] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const departementId = user?.departementId;

  useEffect(() => {
    if (departementId) {
      chargerCours();
      chargerPresences();
    } else setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departementId]);

  const chargerCours = async () => {
    try {
      const res = await api.get('/api/cours', { params: { departementId } });
      const list = Array.isArray(res.data) ? res.data : [];
      setCoursList(list);
      if (list.length > 0 && !selectedCours) setSelectedCours(list[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const chargerPresences = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { departementId };
      if (selectedCours) params.coursId = selectedCours;
      if (dateFilter) params.date = dateFilter;
      const res = await api.get('/api/presences', { params });
      const list = Array.isArray(res.data) ? res.data : [];
      setPresences(list);
    } catch (err) {
      setError('Erreur lors du chargement des présences');
      toast.error(err.response?.data?.erreur || err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (departementId) chargerPresences();
  }, [selectedCours, dateFilter]);

  const marquer = async (presenceId, present) => {
    try {
      await api.patch(`/api/presences/${presenceId}/marquer`, { present });
      toast.success('Présence mise à jour');
      chargerPresences();
    } catch (err) {
      toast.error(err.response?.data?.erreur || err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  if (loading) return <div className="page"><div className="loading">Chargement...</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">✅ Présences du département</h1>
          <p className="page-sub">{departementId ? `Département #${departementId}` : 'Non rattaché'}</p>
        </div>
        <button className="btn-outline" onClick={chargerPresences}>🔄 Rafraîchir</button>
      </div>

      {error && <div className="alert alert-erreur">{error}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <select
            value={selectedCours}
            onChange={e => setSelectedCours(e.target.value)}
            style={{
              padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, minWidth: 220,
            }}
          >
            <option value="">Tous les cours</option>
            {coursList.map(c => (
              <option key={c.id} value={c.id}>{c.titre || c.nom || c.code || `Cours #${c.id}`}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            style={{
              padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14,
            }}
          />
        </div>
      </div>

      <div className="card">
        {presences.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 32, color: '#666' }}>Aucune présence enregistrée.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Cours</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {presences.map(p => (
                <tr key={p.id}>
                  <td>{p.inscription?.etudiant?.nomComplet || p.etudiant?.nomComplet || '—'}</td>
                  <td>{p.cours?.titre || p.cours?.nom || '—'}</td>
                  <td>{p.date || '—'}</td>
                  <td>
                    <span className={`badge ${p.present ? 'badge-success' : 'badge-danger'}`}>
                      {p.present ? 'Présent' : 'Absent'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-outline" onClick={() => marquer(p.id, !p.present)}>
                      Marquer {p.present ? 'absent' : 'présent'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
