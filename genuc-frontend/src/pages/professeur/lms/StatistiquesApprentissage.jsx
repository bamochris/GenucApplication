import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

const COLORS = ['#1D9E75', '#185FA5', '#f5a623', '#cc0000', '#9b59b6'];

export default function StatistiquesApprentissage() {
  const { id } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/api/lms/cours/${id}/statistiques`)
      .then(r => setStats(r.data))
      .catch(() => setError('Impossible de charger les statistiques'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="dashboard-loading"><div className="loader" /><p>Chargement...</p></div>;
  if (error) return <div className="card" style={{ color: 'var(--color-danger-text)', padding: 30 }}>{error}</div>;

  const completionData = stats?.chapitreCompletion || [];
  const quizData = stats?.quizResultats || [];
  const engagementData = [
    { name: 'Terminé', value: stats?.etudiants?.termines || 0 },
    { name: 'En cours', value: stats?.etudiants?.enCours || 0 },
    { name: 'Pas commencé', value: stats?.etudiants?.pasCommence || 0 },
  ];

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <div>
          <Link to={`/professeur/cours/${id}/contenu`} style={{ fontSize: 13, color: '#185FA5', textDecoration: 'none' }}>← Contenu du cours</Link>
          <h2 className="section-title" style={{ marginTop: 4 }}>Statistiques d'apprentissage</h2>
        </div>
      </div>

      {/* KPIs */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
        {[
          { label: 'Étudiants inscrits', value: stats?.totalEtudiants || 0, icon: '👨‍🎓', color: '#185FA5' },
          { label: 'Taux de complétion', value: `${stats?.tauxCompletion || 0}%`, icon: '✅', color: '#1D9E75' },
          { label: 'Note moy. quiz', value: `${stats?.moyenneQuiz || 0}/20`, icon: '❓', color: '#f5a623' },
          { label: 'Devoirs rendus', value: `${stats?.devoirsRendus || 0}/${stats?.totalDevoirs || 0}`, icon: '📝', color: '#9b59b6' },
        ].map(k => (
          <div key={k.label} className="stat-card">
            <div style={{ fontSize: 28, marginBottom: 8 }}>{k.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div className="dash-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 24 }}>
        {/* Complétion par chapitre */}
        <div className="card">
          <h3 className="card-title">Complétion par chapitre</h3>
          {completionData.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucune donnée</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={completionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="titre" tick={{ fontSize: 10 }} />
                <YAxis unit="%" />
                <Tooltip formatter={v => `${v}%`} />
                <Bar dataKey="completion" fill="#185FA5" name="Complété %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Répartition engagement */}
        <div className="card">
          <h3 className="card-title">Engagement des étudiants</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={engagementData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {engagementData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Résultats quiz */}
      {quizData.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 className="card-title">Résultats du quiz par étudiant</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Matricule</th>
                <th>Score quiz</th>
                <th>Tentatives</th>
                <th>Dernier passage</th>
                <th>Progression chapitres</th>
              </tr>
            </thead>
            <tbody>
              {quizData.map(e => (
                <tr key={e.etudiantId}>
                  <td>{e.prenom} {e.nom}</td>
                  <td className="uni-code">{e.matricule}</td>
                  <td style={{ fontWeight: 600, color: e.scoreQuiz >= 50 ? '#1D9E75' : '#cc0000' }}>
                    {e.scoreQuiz}%
                  </td>
                  <td>{e.nbTentatives}</td>
                  <td style={{ fontSize: 12 }}>{e.dernierPassage ? new Date(e.dernierPassage).toLocaleDateString('fr-FR') : '—'}</td>
                  <td>
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 4, height: 8, width: 120 }}>
                      <div style={{ background: '#1D9E75', height: '100%', borderRadius: 4, width: `${e.progressionChapitres}%` }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.progressionChapitres}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Liste étudiants à risque LMS */}
      {(stats?.aRisque || []).length > 0 && (
        <div className="card">
          <h3 className="card-title" style={{ color: 'var(--color-danger-text)' }}>⚠️ Étudiants sans activité depuis 7 jours</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {stats.aRisque.map(e => (
              <div key={e.id} style={{ padding: '8px 14px', background: 'rgba(220,53,69,0.10)', border: '1px solid #ffcccc', borderRadius: 8, fontSize: 13 }}>
                {e.prenom} {e.nom} — <span style={{ color: '#cc0000' }}>inactif {e.joursInactif}j</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
