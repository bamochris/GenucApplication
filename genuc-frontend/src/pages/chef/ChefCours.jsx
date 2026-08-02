// src/pages/chef/ChefCours.jsx
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function ChefCours() {
  const { user } = useAuth();
  const [cours, setCours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('TOUS');

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
      const res = await api.get('/api/cours', { params: { departementId } });
      const list = Array.isArray(res.data) ? res.data : [];
      setCours(list);
    } catch (err) {
      setError('Erreur lors du chargement des cours');
      toast.error(err.response?.data?.erreur || err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const statuses = Array.from(new Set(cours.map(c => c.statut).filter(Boolean)));

  const filtered = filter === 'TOUS' ? cours : cours.filter(c => c.statut === filter);

  const effTotal = filtered.reduce((acc, c) => acc + (c.effectif || c.nbInscrits || 0), 0);

  if (loading) return <div className="page"><div className="loading">Chargement...</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📚 Cours du département</h1>
          <p className="page-sub">{departementId ? `Département #${departementId} — ${filtered.length} cours, ${effTotal} étudiants` : 'Non rattaché'}</p>
        </div>
        <button className="btn-outline" onClick={chargerDonnees}>🔄 Rafraîchir</button>
      </div>

      {error && <div className="alert alert-erreur">{error}</div>}

      {statuses.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button
            className={filter === 'TOUS' ? 'btn-primary' : 'btn-outline'}
            onClick={() => setFilter('TOUS')}
            style={{ fontSize: 13 }}
          >
            Tous
          </button>
          {statuses.map(s => (
            <button
              key={s}
              className={filter === s ? 'btn-primary' : 'btn-outline'}
              onClick={() => setFilter(s)}
              style={{ fontSize: 13 }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="card">
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', padding: 32, color: '#666' }}>Aucun cours trouvé.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Nom</th>
                <th>Professeur</th>
                <th>Promotion</th>
                <th>Effectif</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td><span className="uni-code">{c.code || c.codeCours || c.id}</span></td>
                  <td>{c.titre || c.nom}</td>
                  <td>{c.professeur?.nomComplet || c.professeurNom || '—'}</td>
                  <td>{c.promotion?.libelle || c.promotionLibelle || '—'}</td>
                  <td>{c.effectif ?? c.nbInscrits ?? '—'}</td>
                  <td>
                    <span className={`badge ${c.statut === 'VALIDE' || c.statut === 'ACTIF' ? 'badge-success' : c.statut === 'EN_ATTENTE' ? 'badge-warning' : 'badge-neutral'}`}>
                      {c.statut || '—'}
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
