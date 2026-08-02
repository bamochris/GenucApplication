// src/pages/etudiant/EtudiantCoursDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import sanitizeHtml from '../../utils/sanitizeHtml';
import '../Dashboard.css';

export default function EtudiantCoursDetail() {
  const { coursId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cours, setCours] = useState(null);
  const [lecons, setLecons] = useState([]);
  const [progression, setProgression] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedLecon, setSelectedLecon] = useState(null);
  const [error, setError] = useState(null);
  const [leconsCompleteesIds, setLeconsCompleteesIds] = useState([]);
  const [nbQuiz, setNbQuiz] = useState(0);

  const inscriptionId = user?.inscriptionId;

  useEffect(() => {
    if (!inscriptionId) {
      setError("Aucune inscription trouvée");
      setLoading(false);
      return;
    }
    loadCoursDetail();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId, coursId]);

  const loadCoursDetail = async () => {
    try {
      const response = await api.get(`/api/etudiant/portal/${inscriptionId}/cours/${coursId}`);
      const data = response.data;
      setCours(data.cours);
      setLecons(data.lecons || []);
      setProgression(data.progression || 0);
      setNbQuiz(data.nbQuiz || 0);

      // Récupérer les IDs des leçons complétées
      const completedIds = (data.lecons || [])
        .filter(l => l.estCompletee)
        .map(l => l.id);
      setLeconsCompleteesIds(completedIds);

      if (data.lecons && data.lecons.length > 0) {
        // Sélectionner la première leçon non complétée, ou la première
        const firstIncomplete = data.lecons.find(l => !l.estCompletee);
        setSelectedLecon(firstIncomplete || data.lecons[0]);
      }
    } catch (err) {
      setError(err.response?.data?.erreur || "Erreur de chargement du cours");
    } finally {
      setLoading(false);
    }
  };

  const marquerComplete = async (leconId) => {
    try {
      await api.post(`/api/etudiant/portal/${inscriptionId}/cours/${coursId}/lecon/${leconId}/complete`, {
        tempsMinutes: 5
      });
      // Recharger pour mettre à jour la progression
      loadCoursDetail();
    } catch (err) {
      console.error(err);
      setError('Erreur lors du marquage de la leçon comme complétée.');
    }
  };

  const isLeconCompletee = (leconId) => {
    return leconsCompleteesIds.includes(leconId);
  };

  if (loading) return <div className="page"><div className="loading">Chargement du cours...</div></div>;
  if (error) return <div className="page"><div className="alert-erreur">{error}</div></div>;
  if (!cours) return null;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{cours.titre}</h1>
          <p className="page-sub">{cours.code} • {cours.professeur || 'Professeur non assigné'}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to={`/etudiant/quiz/cours/${coursId}`} className="btn-outline" style={{ textDecoration: 'none' }}>
            📝 Quiz ({nbQuiz})
          </Link>
          <button className="btn-outline" onClick={() => navigate('/etudiant/mes-cours')}>
            ← Retour aux cours
          </button>
        </div>
      </div>

      {/* Barre de progression globale */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontWeight: 600 }}>Progression globale</span>
          <span style={{ fontWeight: 700, color: progression >= 80 ? '#1D9E75' : '#185FA5' }}>
            {progression}% complété
          </span>
        </div>
        <div style={{ background: 'var(--bg-secondary)', height: 10, borderRadius: 5, overflow: 'hidden' }}>
          <div
            style={{
              width: `${progression}%`,
              background: progression >= 80 ? '#1D9E75' : '#185FA5',
              height: '100%',
              transition: 'width 0.5s ease'
            }}
          />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
          {leconsCompleteesIds.length} / {lecons.length} leçons complétées
          {nbQuiz > 0 && ` • ${nbQuiz} quiz disponible(s)`}
        </div>
      </div>

      <div className="dash-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
        {/* Sidebar - Liste des leçons */}
        <div className="card">
          <h2 className="card-title">📖 Leçons ({lecons.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lecons.map((lecon, idx) => {
              const estCompletee = isLeconCompletee(lecon.id);
              return (
                <button
                  key={lecon.id}
                  className={`btn-outline ${selectedLecon?.id === lecon.id ? 'active' : ''}`}
                  onClick={() => setSelectedLecon(lecon)}
                  style={{
                    textAlign: 'left',
                    justifyContent: 'space-between',
                    display: 'flex',
                    alignItems: 'center',
                    background: selectedLecon?.id === lecon.id ? '#0B1F4A' : '',
                    color: selectedLecon?.id === lecon.id ? 'white' : '',
                    border: estCompletee ? '2px solid #1D9E75' : undefined,
                  }}
                >
                  <span>
                    {idx + 1}. {lecon.titre}
                  </span>
                  {estCompletee && <span style={{ color: selectedLecon?.id === lecon.id ? '#9FE1CB' : '#1D9E75' }}>✅</span>}
                </button>
              );
            })}
          </div>
          {nbQuiz > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
              <Link to={`/etudiant/quiz/cours/${coursId}`} className="btn-primary" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                📝 Voir les quiz ({nbQuiz})
              </Link>
            </div>
          )}
        </div>

        {/* Contenu de la leçon sélectionnée */}
        <div className="card">
          {selectedLecon ? (
            <>
              <div className="card-head">
                <h2 className="card-title">{selectedLecon.titre}</h2>
                {selectedLecon.description && (
                  <p className="page-sub" style={{ marginTop: 4 }}>{selectedLecon.description}</p>
                )}
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {isLeconCompletee(selectedLecon.id) ? '✅ Complétée' : '⏳ Non complétée'}
                </div>
              </div>

              <div className="lecon-content" style={{ marginTop: 16 }}>
                {selectedLecon.type === 'VIDEO' && (
                  selectedLecon.videoExterneUrl ? (
                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 8 }}>
                      <iframe
                        src={selectedLecon.videoExterneUrl.replace('watch?v=', 'embed/')}
                        title={selectedLecon.titre}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                        allowFullScreen
                      />
                    </div>
                  ) : selectedLecon.videoUrl ? (
                    <video controls style={{ width: '100%', borderRadius: 8 }}>
                      <source src={selectedLecon.videoUrl} type="video/mp4" />
                    </video>
                  ) : (
                    <div className="alert-erreur">Vidéo non disponible</div>
                  )
                )}

                {selectedLecon.type === 'DOCUMENT' && (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
                    <h4>{selectedLecon.documentNom || 'Document'}</h4>
                    {selectedLecon.documentUrl && (
                      <a href={selectedLecon.documentUrl} className="btn-primary" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                        📥 Télécharger
                      </a>
                    )}
                  </div>
                )}

                {selectedLecon.type === 'TEXTE' && (
                  <div
                    className="contenu-html"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedLecon.contenuHtml) }}
                    style={{ lineHeight: 1.6 }}
                  />
                )}
              </div>

              {!isLeconCompletee(selectedLecon.id) && (
                <button
                  className="btn-success"
                  style={{ marginTop: 20, width: '100%' }}
                  onClick={() => marquerComplete(selectedLecon.id)}
                >
                  ✓ Marquer cette leçon comme terminée
                </button>
              )}

              {isLeconCompletee(selectedLecon.id) && (
                <div className="alert-success" style={{ marginTop: 20, textAlign: 'center' }}>
                  ✅ Leçon complétée
                </div>
              )}
            </>
          ) : (
            <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              Sélectionnez une leçon pour commencer
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
