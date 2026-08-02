// src/pages/etudiant/cours/DetailCours.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import sanitizeHtml from '../../../utils/sanitizeHtml';
import '../EtudiantDashboard.css';

export default function DetailCours() {
  const { coursId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cours, setCours] = useState(null);
  const [lecons, setLecons] = useState([]);
  const [progression, setProgression] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedLecon, setSelectedLecon] = useState(null);
  const [message, setMessage] = useState('');
  const [leconsCompleteesIds, setLeconsCompleteesIds] = useState([]);
  const [nbQuiz, setNbQuiz] = useState(0);
  const [seancesLive, setSeancesLive] = useState([]);

  const inscriptionId = user?.inscriptionId;

  useEffect(() => {
    if (!inscriptionId) {
      setMessage('❌ Aucune inscription trouvée');
      setLoading(false);
      return;
    }
    if (!coursId) {
      navigate('/etudiant/mes-cours');
      return;
    }
    loadCoursDetail();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId, coursId, navigate]);

  const loadCoursDetail = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await api.get(`/api/etudiant/portal/${inscriptionId}/cours/${coursId}`);
      const data = response.data;
      setCours(data.cours);
      
      // Trier les leçons par ordre
      const leconsTriees = (data.lecons || []).sort((a, b) => a.ordre - b.ordre);
      setLecons(leconsTriees);
      setProgression(data.progression || 0);
      setNbQuiz(data.nbQuiz || 0);
      setSeancesLive(data.seancesLive || []);

      // Récupérer les IDs des leçons complétées
      const completedIds = leconsTriees
        .filter(l => l.estCompletee)
        .map(l => l.id);
      setLeconsCompleteesIds(completedIds);

      // Sélectionner la première leçon non complétée, ou la première
      if (leconsTriees.length > 0) {
        const firstIncomplete = leconsTriees.find(l => !l.estCompletee);
        setSelectedLecon(firstIncomplete || leconsTriees[0]);
      }
    } catch (err) {
      console.error('Erreur chargement cours:', err);
      setMessage('❌ Erreur lors du chargement du cours');
    } finally {
      setLoading(false);
    }
  };

  const marquerComplete = async (leconId) => {
    try {
      await api.post(`/api/etudiant/portal/${inscriptionId}/cours/${coursId}/lecon/${leconId}/complete`, {
        tempsMinutes: 5
      });
      setMessage('✅ Leçon marquée comme complétée !');
      loadCoursDetail();
    } catch (err) {
      console.error(err);
      setMessage('❌ Erreur lors du marquage de la leçon');
    }
  };

  const isLeconCompletee = (leconId) => {
    return leconsCompleteesIds.includes(leconId);
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'VIDEO': return '🎬';
      case 'DOCUMENT': return '📄';
      case 'TEXTE': return '📝';
      case 'QUIZ': return '🧠';
      case 'MIXTE': return '📦';
      default: return '📌';
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'VIDEO': return 'Vidéo';
      case 'DOCUMENT': return 'Document';
      case 'TEXTE': return 'Texte';
      case 'QUIZ': return 'Quiz';
      case 'MIXTE': return 'Contenu mixte';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement du cours...</p>
      </div>
    );
  }

  if (!cours) {
    return (
      <div className="etudiant-dashboard">
        <div className="card">
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
            Cours introuvable.
          </p>
          <Link to="/etudiant/mes-cours" className="btn-primary" style={{ textDecoration: 'none' }}>
            ← Retour aux cours
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="etudiant-dashboard">
      {/* En-tête du cours */}
      <div className="section-header">
        <div>
          <h2 className="section-title" style={{ marginBottom: 4 }}>{cours.titre}</h2>
          <p className="page-sub" style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {cours.code} • {cours.professeur || 'Professeur non assigné'} • {cours.credits} crédits
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to={`/etudiant/quiz/cours/${coursId}`} className="btn-outline" style={{ textDecoration: 'none' }}>
            📝 Quiz ({nbQuiz})
          </Link>
          <button className="btn-outline" onClick={() => navigate('/etudiant/mes-cours')}>
            ← Retour
          </button>
        </div>
      </div>

      {message && (
        <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>
          {message}
        </div>
      )}

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

      {/* Séances live à venir */}
      {seancesLive.length > 0 && (
        <div className="card" style={{ marginBottom: 20, background: 'rgba(24,95,165,0.12)' }}>
          <h3 className="card-title">🟢 Séances en direct à venir</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {seancesLive.map(s => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-card)', borderRadius: 6 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{s.titre}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {new Date(s.dateDebut).toLocaleString('fr-FR')} • {s.plateforme}
                  </div>
                </div>
                <a href={s.lienReunion} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ fontSize: 12, textDecoration: 'none', padding: '6px 14px' }}>
                  🔗 Rejoindre
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contenu principal : leçons + affichage */}
      <div className="dash-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
        {/* Sidebar - Liste des leçons */}
        <div className="card" style={{ maxHeight: '600px', overflowY: 'auto' }}>
          <h3 className="card-title" style={{ marginBottom: 12 }}>📖 Leçons ({lecons.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lecons.map((lecon, idx) => {
              const estCompletee = isLeconCompletee(lecon.id);
              const estActive = selectedLecon?.id === lecon.id;
              return (
                <button
                  key={lecon.id}
                  className={`btn-outline ${estActive ? 'active' : ''}`}
                  onClick={() => setSelectedLecon(lecon)}
                  style={{
                    textAlign: 'left',
                    justifyContent: 'space-between',
                    display: 'flex',
                    alignItems: 'center',
                    background: estActive ? '#0B1F4A' : '',
                    color: estActive ? 'white' : '',
                    border: estCompletee ? '2px solid #1D9E75' : undefined,
                    padding: '10px 14px'
                  }}
                >
                  <span>
                    <span style={{ marginRight: 8 }}>{getTypeIcon(lecon.type)}</span>
                    {idx + 1}. {lecon.titre}
                  </span>
                  {estCompletee && (
                    <span style={{ color: estActive ? '#9FE1CB' : '#1D9E75', fontSize: 14 }}>✅</span>
                  )}
                </button>
              );
            })}
          </div>
          {nbQuiz > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
              <Link to={`/etudiant/quiz/cours/${coursId}`} className="btn-primary" style={{ textDecoration: 'none', display: 'block', textAlign: 'center', fontSize: 13 }}>
                📝 Voir les quiz ({nbQuiz})
              </Link>
            </div>
          )}
        </div>

        {/* Contenu de la leçon sélectionnée */}
        <div className="card">
          {selectedLecon ? (
            <>
              <div className="card-header" style={{ marginBottom: 12 }}>
                <div>
                  <h3 className="card-title" style={{ margin: 0 }}>{selectedLecon.titre}</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    {getTypeIcon(selectedLecon.type)} {getTypeLabel(selectedLecon.type)}
                    {selectedLecon.dureeSecondes && ` • ⏱️ ${Math.round(selectedLecon.dureeSecondes / 60)} min`}
                  </div>
                </div>
                <div>
                  {isLeconCompletee(selectedLecon.id) ? (
                    <span className="badge badge-success">✅ Complétée</span>
                  ) : (
                    <span className="badge badge-neutral">⏳ Non complétée</span>
                  )}
                </div>
              </div>

              {selectedLecon.description && (
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{selectedLecon.description}</p>
              )}

              <div className="lecon-content" style={{ marginTop: 8 }}>
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
                      Votre navigateur ne supporte pas la lecture de vidéos.
                    </video>
                  ) : (
                    <div className="alert-erreur" style={{ textAlign: 'center', padding: 40 }}>
                      🎬 Vidéo non disponible
                    </div>
                  )
                )}

                {selectedLecon.type === 'DOCUMENT' && (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📄</div>
                    <h4>{selectedLecon.documentNom || 'Document'}</h4>
                    {selectedLecon.documentUrl ? (
                      <a href={selectedLecon.documentUrl} className="btn-primary" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'inline-block' }}>
                        📥 Télécharger
                      </a>
                    ) : (
                      <p style={{ color: 'var(--text-muted)' }}>Document en cours de préparation</p>
                    )}
                  </div>
                )}

                {selectedLecon.type === 'TEXTE' && (
                  <div
                    className="contenu-html"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedLecon.contenuHtml) }}
                    style={{ lineHeight: 1.6, padding: '0 8px' }}
                  />
                )}

                {selectedLecon.type === 'QUIZ' && (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
                    <h4>Quiz : {selectedLecon.titre}</h4>
                    <p style={{ color: 'var(--text-muted)' }}>Testez vos connaissances sur cette leçon.</p>
                    <Link to={`/etudiant/quiz/cours/${coursId}`} className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                      🚀 Démarrer le quiz
                    </Link>
                  </div>
                )}

                {selectedLecon.type === 'MIXTE' && (
                  <div style={{ padding: 16 }}>
                    <div className="alert-info" style={{ padding: 12, background: 'rgba(24,95,165,0.12)', borderRadius: 8, marginBottom: 16 }}>
                      ℹ️ Cette leçon contient du contenu mixte.
                    </div>
                    {selectedLecon.contenuHtml && (
                      <div
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedLecon.contenuHtml) }}
                        style={{ lineHeight: 1.6 }}
                      />
                    )}
                    {selectedLecon.videoUrl && (
                      <video controls style={{ width: '100%', borderRadius: 8, marginTop: 12 }}>
                        <source src={selectedLecon.videoUrl} type="video/mp4" />
                      </video>
                    )}
                    {selectedLecon.documentUrl && (
                      <a href={selectedLecon.documentUrl} className="btn-outline" target="_blank" rel="noopener noreferrer" style={{ marginTop: 12, display: 'inline-block', textDecoration: 'none' }}>
                        📥 Télécharger le document
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Bouton "Marquer comme terminée" */}
              {!isLeconCompletee(selectedLecon.id) && (
                <button
                  className="btn-success"
                  style={{ marginTop: 20, width: '100%', padding: '12px' }}
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
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
              <p>Sélectionnez une leçon pour commencer</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
