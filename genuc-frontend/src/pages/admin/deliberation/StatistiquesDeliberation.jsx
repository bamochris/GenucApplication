// src/pages/admin/deliberation/StatistiquesDeliberation.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import deliberationService from '../../../services/deliberationService';
import StatsCards from '../../../components/deliberation/StatsCards';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Line, AreaChart, Area
} from 'recharts';
import '../../Dashboard.css';

export default function StatistiquesDeliberation() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [classements, setClassements] = useState([]);
  const [evolution, setEvolution] = useState([]);
  const [annee, setAnnee] = useState('');
  const [anneesDisponibles] = useState(['2024-2025', '2025-2026']);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Stats avancées
      const statsData = await deliberationService.getStatsAvancees(user.universiteId, annee || '2025-2026');
      setStats(statsData);

      // Evolution (simulée si le service ne la fournit pas)
      const evol = statsData.evolution || [
        { annee: '2022-2023', tauxReussite: 65, total: 450 },
        { annee: '2023-2024', tauxReussite: 70, total: 480 },
        { annee: '2024-2025', tauxReussite: 75, total: 510 },
        { annee: '2025-2026', tauxReussite: 78, total: 550 },
      ];
      setEvolution(evol);

      // Classements (simulés)
      const classData = statsData.classements || [
        { type: 'UNIVERSITE', nom: 'Kabamba Jean', matricule: '2026-001', moyenne: 18.5, promotion: 'L3', filiere: 'Informatique' },
        { type: 'FACULTE', nom: 'Ilunga Marie', matricule: '2026-045', moyenne: 17.8, promotion: 'M1', filiere: 'Réseaux' },
        { type: 'DEPARTEMENT', nom: 'Kasongo Paul', matricule: '2026-012', moyenne: 16.9, promotion: 'L2', filiere: 'Génie Logiciel' },
      ];
      setClassements(classData);
    } catch (err) {
      setError('Erreur lors du chargement des statistiques');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user.universiteId, annee]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const COLORS = ['#28a745', '#fd7e14', '#dc3545', '#007bff'];

  const pieData = stats ? [
    { name: 'PA', value: stats.pa || 0 },
    { name: 'PD', value: stats.pd || 0 },
    { name: 'PP', value: stats.pp || 0 },
    { name: 'CJ', value: stats.cj || 0 }
  ] : [];

  const evolutionData = evolution.map(item => ({
    annee: item.annee,
    tauxReussite: item.tauxReussite || 0,
    effectif: item.total || 0,
  }));

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement des statistiques...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Statistiques Délibération</h1>
          <p className="page-sub">Analyse des résultats académiques</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>Année :</label>
          <select 
            value={annee} 
            onChange={e => setAnnee(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd' }}
          >
            <option value="">Toutes</option>
            {anneesDisponibles.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <button className="btn-outline" onClick={loadData}>
            🔄 Actualiser
          </button>
        </div>
      </div>

      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      {stats && <StatsCards stats={stats} />}

      <div className="dash-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 20 }}>
        <div className="card">
          <h3 className="card-title">📊 Répartition par statut</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={pieData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#185FA5" name="Effectif" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="card-title">🧩 Répartition en pourcentage</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {evolutionData.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">📈 Évolution du taux de réussite</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="annee" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="tauxReussite" stroke="#28a745" fill="#28a745" fillOpacity={0.3} name="Taux de réussite (%)" />
              <Line type="monotone" dataKey="effectif" stroke="#007bff" name="Effectif total" strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">🏆 Classements</h3>
        {classements.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucun classement disponible</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            {classements.map((c, idx) => (
              <div key={idx} style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {c.type === 'UNIVERSITE' && '🏛️ Major Université'}
                  {c.type === 'FACULTE' && '🏛️ Major Faculté'}
                  {c.type === 'DEPARTEMENT' && '📚 Major Département'}
                  {c.type === 'PROMOTION' && '🎓 Major Promotion'}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{c.nom}</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                  {c.matricule} – Moyenne : {c.moyenne?.toFixed(2)} / 20
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {c.promotion} · {c.filiere}
                </div>
                <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                  <span className="badge badge-success">🏅</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}