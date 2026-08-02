// src/pages/chef/ChefEnseignants.jsx
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function ChefEnseignants() {
  const { user } = useAuth();
  const [enseignants, setEnseignants] = useState([]);
  const [coursCounts, setCoursCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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
      const res = await api.get('/api/utilisateurs', {
        params: { role: 'ENSEIGNANT', departementId }
      });
      const list = res.data?.utilisateurs || res.data?.content || res.data || [];
      setEnseignants(Array.isArray(list) ? list : []);

      const coursRes = await api.get('/api/cours', { params: { departementId } }).catch(() => ({ data: [] }));
      const coursList = Array.isArray(coursRes.data) ? coursRes.data : [];
      const counts = {};
      coursList.forEach(c => {
        const pid = c.professeurId || c.professeur?.id;
        if (pid) counts[pid] = (counts[pid] || 0) + 1;
      });
      setCoursCounts(counts);
    } catch (err) {
      setError('Erreur lors du chargement des enseignants');
      toast.error(err.response?.data?.erreur || err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const filtered = enseignants.filter(e => {
    const term = search.toLowerCase();
    return (e.nomComplet || '').toLowerCase().includes(term) || (e.email || '').toLowerCase().includes(term);
  });

  if (loading) return <div className="page"><div className="loading">Chargement...</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">👨‍🏫 Enseignants du département</h1>
          <p className="page-sub">{departementId ? `Département #${departementId}` : 'Non rattaché'}</p>
        </div>
        <button className="btn-outline" onClick={chargerDonnees}>🔄 Rafraîchir</button>
      </div>

      {error && <div className="alert alert-erreur">{error}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="🔍 Rechercher par nom ou email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%',
            maxWidth: 420,
            padding: '10px 14px',
            border: '1.5px solid #e2e8f0',
            borderRadius: 8,
            fontSize: 14,
          }}
        />
      </div>

      <div className="card">
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 32, color: '#666' }}>Aucun enseignant trouvé.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom complet</th>
                <th>Email</th>
                <th>Téléphone</th>
                <th>Cours assignés</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td>{e.nomComplet}</td>
                  <td>{e.email}</td>
                  <td>{e.telephone || '—'}</td>
                  <td>{coursCounts[e.id] || 0}</td>
                  <td>
                    <span className={`badge ${e.actif ? 'badge-success' : 'badge-danger'}`}>
                      {e.actif ? 'Actif' : 'Inactif'}
                    </span>
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
