import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../../api/axios';
import './ProfesseurDashboard.css';

const LABELS = {
  clarte: 'Clarté', ponctualite: 'Ponctualité',
  disponibilite: 'Disponibilité', maitrise: 'Maîtrise', methode: 'Méthode péda.',
};

export default function MonEvaluation() {
  const { user } = useAuth();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/api/evaluations/professeur/${user.id}`)
      .then(r => setEvaluation(r.data))
      .catch(() => setError('Impossible de charger votre évaluation'))
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <div className="dashboard-loading"><div className="loader" /><p>Chargement...</p></div>;

  const radarData = evaluation ? Object.entries(LABELS).map(([key, label]) => ({
    critere: label,
    note: evaluation.moyennes?.[key] || 0,
  })) : [];

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <h2 className="section-title">Mon évaluation par les étudiants</h2>
      </div>

      {error && <div style={{ padding: 30, textAlign: 'center', color: 'var(--color-danger-text)' }}>{error}</div>}

      {!error && (!evaluation || evaluation.nbEvaluations === 0) ? (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>Aucune évaluation disponible pour l'instant.</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>Les étudiants évaluent anonymement en fin de semestre.</p>
        </div>
      ) : evaluation && (
        <>
          {/* Note globale */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
            <div className="stat-card" style={{ gridColumn: 'span 1' }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: '#185FA5' }}>
                {evaluation.noteGlobale?.toFixed(1)}<span style={{ fontSize: 18 }}>/5</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Note globale</div>
              <div style={{ display: 'flex', gap: 2, marginTop: 8, justifyContent: 'center' }}>
                {[1,2,3,4,5].map(i => (
                  <span key={i} style={{ fontSize: 18, color: i <= Math.round(evaluation.noteGlobale) ? '#f5a623' : '#ddd' }}>★</span>
                ))}
              </div>
            </div>
            {[
              { label: 'Évaluations reçues', value: evaluation.nbEvaluations, color: '#185FA5' },
              { label: 'Cours évalués', value: evaluation.nbCours, color: '#1D9E75' },
              { label: 'Recommanderaient', value: `${evaluation.pctRecommande || 0}%`, color: '#f5a623' },
            ].map(k => (
              <div key={k.label} className="stat-card">
                <div style={{ fontSize: 28, fontWeight: 700, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{k.label}</div>
              </div>
            ))}
          </div>

          <div className="dash-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 24 }}>
            {/* Radar */}
            <div className="card">
              <h3 className="card-title">Évaluation par critère</h3>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="critere" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10 }} />
                  <Radar dataKey="note" stroke="#185FA5" fill="#185FA5" fillOpacity={0.3} />
                  <Tooltip formatter={v => `${v}/5`} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Détail critères */}
            <div className="card">
              <h3 className="card-title">Détail par critère</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {Object.entries(LABELS).map(([key, label]) => {
                  const val = evaluation.moyennes?.[key] || 0;
                  const pct = (val / 5) * 100;
                  return (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                        <span style={{ color: 'var(--text-primary)' }}>{label}</span>
                        <span style={{ fontWeight: 700, color: pct >= 60 ? 'var(--color-success-text)' : pct >= 40 ? '#f5a623' : 'var(--color-danger-text)' }}>
                          {val.toFixed(1)}/5
                        </span>
                      </div>
                      <div style={{ background: 'var(--bg-secondary)', borderRadius: 4, height: 8 }}>
                        <div style={{
                          background: pct >= 60 ? '#1D9E75' : pct >= 40 ? '#f5a623' : '#cc0000',
                          height: '100%', borderRadius: 4, width: `${pct}%`, transition: 'width 0.6s',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Commentaires anonymes */}
          {(evaluation.commentaires || []).length > 0 && (
            <div className="card">
              <h3 className="card-title">Commentaires des étudiants (anonymes)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {evaluation.commentaires.map((c, i) => (
                  <div key={i} style={{
                    padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 10,
                    borderLeft: '4px solid #185FA5', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6,
                    fontStyle: 'italic',
                  }}>
                    "{c}"
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
