// src/pages/chef/ChefDeliberations.jsx
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function ChefDeliberations() {
  const { user } = useAuth();
  const [delibs, setDelibs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const departementId = user?.departementId;

  useEffect(() => {
    if (departementId) chargerDonnees();
    else setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departementId]);

  const chargerDonnees = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/deliberation', {
        params: { departementId, type: 'DEPARTEMENT' }
      });
      const list = Array.isArray(res.data) ? res.data : [];
      setDelibs(list);
    } catch (err) {
      setError('Erreur lors du chargement des délibérations');
      toast.error(err.response?.data?.erreur || err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const ouvrir = (d) => {
    if (d.statut === 'VALIDEE') {
      toast.success('Délibération validée — prête pour publication');
    } else if (d.statut === 'BROUILLON') {
      toast('Délibération en brouillon — modification possible', { icon: '✏️' });
    } else {
      toast('Délibération en cours de traitement');
    }
  };

  if (loading) return <div className="page"><div className="loading">Chargement...</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">⚖️ Délibérations du département</h1>
          <p className="page-sub">{departementId ? `Département #${departementId}` : 'Non rattaché'}</p>
        </div>
        <button className="btn-outline" onClick={chargerDonnees}>🔄 Rafraîchir</button>
      </div>

      {error && <div className="alert alert-erreur">{error}</div>}

      <div className="card">
        {delibs.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 32, color: '#666' }}>Aucune délibération trouvée.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Session</th>
                <th>Année académique</th>
                <th>Type</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {delibs.map(d => (
                <tr key={d.id}>
                  <td>{d.session || '—'}</td>
                  <td>{d.anneeAcademique || d.annee || '—'}</td>
                  <td>{d.type || '—'}</td>
                  <td>
                    <span className={`badge ${d.statut === 'VALIDEE' ? 'badge-success' : d.statut === 'BROUILLON' ? 'badge-warning' : 'badge-neutral'}`}>
                      {d.statut || '—'}
                    </span>
                  </td>
                  <td>{d.dateDeliberation || d.date || '—'}</td>
                  <td>
                    <button className="btn-outline" onClick={() => ouvrir(d)}>Voir</button>
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
