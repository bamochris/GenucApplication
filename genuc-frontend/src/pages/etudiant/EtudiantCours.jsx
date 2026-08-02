// src/pages/etudiant/EtudiantCours.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function EtudiantCours() {
  const { user } = useAuth();
  const [cours, setCours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const inscriptionId = user?.inscriptionId;

  useEffect(() => {
    if (!inscriptionId) {
      setError("Aucune inscription trouvée");
      setLoading(false);
      return;
    }
    loadCours();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId]);

  const loadCours = async () => {
    try {
      const response = await api.get(`/api/etudiant/portal/${inscriptionId}/cours`);
      setCours(response.data);
    } catch (err) {
      setError(err.response?.data?.erreur || "Erreur de chargement des cours");
    } finally {
      setLoading(false);
    }
  };

  const getProgressionColor = (progression) => {
    if (progression >= 80) return '#1D9E75';
    if (progression >= 50) return '#185FA5';
    if (progression >= 30) return '#854F0B';
    return '#cc0000';
  };

  if (loading) return <div className="page"><div className="loading">Chargement des cours...</div></div>;
  if (error) return <div className="page"><div className="alert-erreur">{error}</div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📚 Mes cours</h1>
          <p className="page-sub">Accédez à vos matières, supports et suivez votre progression</p>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {cours.length} cours disponibles
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {cours.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
              Aucun cours disponible pour votre niveau.
              <br />
              <span style={{ fontSize: 12 }}>Les cours apparaîtront ici une fois publiés par votre professeur.</span>
            </p>
          </div>
        ) : (
          cours.map(c => (
            <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              {/* En-tête du cours */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#185FA5' }}>{c.code}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{c.titre}</div>
                </div>
                {c.estComplete && (
                  <span className="badge badge-success" style={{ fontSize: 10 }}>✅ Terminé</span>
                )}
              </div>

              {/* Professeur */}
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                👨‍🏫 {c.professeur || 'Professeur non assigné'}
              </div>

              {/* Description */}
              {c.description && (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.4 }}>
                  {c.description.substring(0, 100)}...
                </p>
              )}

              {/* Progression */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>Progression</span>
                  <span style={{ fontWeight: 600, color: getProgressionColor(c.progression) }}>
                    {c.progression}%
                  </span>
                </div>
                <div style={{ background: 'var(--bg-secondary)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${c.progression}%`,
                      background: getProgressionColor(c.progression),
                      height: '100%',
                      transition: 'width 0.5s ease'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  <span>{c.leconsCompletees || 0} leçons complétées</span>
                  <span>{c.nbLecons || 0} leçons totales</span>
                </div>
              </div>

              {/* Boutons d'action */}
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                <Link
                  to={`/etudiant/cours/${c.id}`}
                  className="btn-primary"
                  style={{ flex: 1, textAlign: 'center', textDecoration: 'none', fontSize: 13, padding: '8px' }}
                >
                  {c.progression > 0 ? '📖 Continuer' : '🚀 Commencer'}
                </Link>
                <Link
                  to={`/etudiant/quiz/cours/${c.id}`}
                  className="btn-outline"
                  style={{ textDecoration: 'none', fontSize: 13, padding: '8px 12px' }}
                  title="Voir les quiz"
                >
                  📝
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
