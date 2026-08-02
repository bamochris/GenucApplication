// src/pages/admin/AlertesDashboard.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function AlertesDashboard() {
  const { user } = useAuth();
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const universiteId = user?.universiteId;

  useEffect(() => {
    if (universiteId) loadAlertes();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [universiteId]);

  const loadAlertes = async () => {
    try {
      const res = await api.get(`/api/alertes/universite/${universiteId}`);
      setAlertes(res.data);
    } catch (err) {
      setError('Erreur chargement des alertes');
    } finally {
      setLoading(false);
    }
  };

  const marquerVue = async (id) => {
    try {
      await api.patch(`/api/alertes/${id}/vue`);
      loadAlertes();
    } catch (err) {
      console.error(err);
    }
  };

  const marquerToutesVues = async () => {
    try {
      await api.patch(`/api/alertes/universite/${universiteId}/tout-vu`);
      loadAlertes();
    } catch (err) {
      console.error(err);
    }
  };

  const getNiveauBadge = (niveau) => {
    switch(niveau) {
      case 'CRITICAL': return 'badge-danger';
      case 'WARNING': return 'badge-warning';
      default: return 'badge-neutral';
    }
  };

  if (loading) return <div className="loading">Chargement des alertes...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">⚠️ Alertes et notifications</h1>
          <p className="page-sub">Consultez les alertes importantes de votre université</p>
        </div>
        <button className="btn-outline" onClick={marquerToutesVues}>
          ✅ Tout marquer comme vu
        </button>
      </div>

      {error && <div className="alert-erreur">{error}</div>}

      {alertes.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
            Aucune alerte pour le moment.
          </p>
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Niveau</th>
                <th>Catégorie</th>
                <th>Message</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {alertes.map(a => (
                <tr key={a.id} style={{ background: a.vue ? 'transparent' : '#f0f7ff' }}>
                  <td>{new Date(a.creeLe).toLocaleString('fr-FR')}</td>
                  <td>
                    <span className={`badge ${getNiveauBadge(a.niveau)}`}>
                      {a.niveau}
                    </span>
                  </td>
                  <td>{a.categorie}</td>
                  <td>{a.message}</td>
                  <td>
                    <span className={`badge ${a.vue ? 'badge-neutral' : 'badge-warning'}`}>
                      {a.vue ? 'Vu' : 'Non vu'}
                    </span>
                  </td>
                  <td>
                    {!a.vue && (
                      <button className="btn-outline" style={{ fontSize: 11 }} onClick={() => marquerVue(a.id)}>
                        Marquer vu
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}