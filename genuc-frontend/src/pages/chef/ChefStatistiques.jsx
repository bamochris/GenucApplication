// src/pages/chef/ChefStatistiques.jsx
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function ChefStatistiques() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const departementId = user?.departementId;

  useEffect(() => {
    if (departementId) chargerStats();
    else setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departementId]);

  const chargerStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/statistiques/departement/${departementId}`);
      setStats(res.data || {});
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
      toast.error(err.response?.data?.erreur || err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="page"><div className="loading">Chargement...</div></div>;

  const kpis = [
    { label: 'Total étudiants', value: stats?.totalEtudiants ?? '—', icon: '🎓' },
    { label: 'Enseignants', value: stats?.totalEnseignants ?? '—', icon: '👨‍🏫' },
    { label: 'Cours', value: stats?.totalCours ?? '—', icon: '📚' },
    { label: 'Taux de réussite', value: stats?.tauxReussite != null ? `${stats.tauxReussite}%` : '—', icon: '📈' },
    { label: 'Moyenne département', value: stats?.moyenneDepartement != null ? `${stats.moyenneDepartement}/20` : '—', icon: '⭐' },
    { label: 'Présences', value: stats?.tauxPresence != null ? `${stats.tauxPresence}%` : '—', icon: '✅' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Statistiques du département</h1>
          <p className="page-sub">{departementId ? `Département #${departementId}` : 'Non rattaché'}</p>
        </div>
        <button className="btn-outline" onClick={chargerStats}>🔄 Rafraîchir</button>
      </div>

      {error && <div className="alert alert-erreur">{error}</div>}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 16,
        marginBottom: 20,
      }}>
        {kpis.map(k => (
          <div key={k.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{k.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{k.value}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>📉 Répartition par promotion</h3>
        {stats?.parPromotion && stats.parPromotion.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Promotion</th>
                <th>Étudiants</th>
                <th>Moyenne</th>
                <th>Taux réussite</th>
              </tr>
            </thead>
            <tbody>
              {stats.parPromotion.map((p, i) => (
                <tr key={i}>
                  <td>{p.promotion?.libelle || p.nom || '—'}</td>
                  <td>{p.effectif ?? '—'}</td>
                  <td>{p.moyenne != null ? `${p.moyenne}/20` : '—'}</td>
                  <td>{p.tauxReussite != null ? `${p.tauxReussite}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: 'center', padding: 24, color: '#666' }}>Aucune donnée disponible.</p>
        )}
      </div>
    </div>
  );
}
