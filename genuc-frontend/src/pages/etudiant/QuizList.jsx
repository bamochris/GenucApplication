// src/pages/etudiant/QuizList.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import quizService from '../../services/quizService';
import '../Dashboard.css';

export default function QuizList() {
  const { coursId } = useParams();
  const [quizs, setQuizs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coursTitre, setCoursTitre] = useState('');

  useEffect(() => {
    if (coursId) loadQuizs();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [coursId]);

  const loadQuizs = async () => {
    try {
      const res = await quizService.getQuizByCours(coursId);
      setQuizs(res.data);
      if (res.data.length > 0) {
        setCoursTitre(res.data[0]?.cours?.titre || 'Cours');
      }
    } catch (err) {
      setError("Erreur chargement des quiz");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (quiz) => {
    const now = new Date();
    const debut = new Date(quiz.dateDebut);
    const fin = new Date(quiz.dateFin);

    if (quiz.statut === 'PUBLIE') {
      if (now < debut) return { label: 'À venir', className: 'badge-warning' };
      if (now > fin) return { label: 'Terminé', className: 'badge-neutral' };
      return { label: 'Disponible', className: 'badge-success' };
    }
    return { label: 'Brouillon', className: 'badge-neutral' };
  };

  if (loading) return <div className="loading">Chargement des quiz...</div>;
  if (error) return <div className="alert-erreur">{error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📝 Quiz – {coursTitre}</h1>
          <p className="page-sub">Testez vos connaissances</p>
        </div>
        <Link to={`/etudiant/cours/${coursId}`} className="btn-outline" style={{ textDecoration: 'none' }}>
          ← Retour au cours
        </Link>
      </div>

      {quizs.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            Aucun quiz disponible pour ce cours pour le moment.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {quizs.map(quiz => {
            const status = getStatusBadge(quiz);
            const isAvailable = status.label === 'Disponible';

            return (
              <div key={quiz.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h2 className="card-title" style={{ marginBottom: 4 }}>{quiz.titre}</h2>
                  <span className={`badge ${status.className}`}>{status.label}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>{quiz.description}</p>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                  ⏱️ Durée : {quiz.dureeMinutes} min &nbsp;|&nbsp;
                  📝 Note sur {quiz.noteSur} &nbsp;|&nbsp;
                  🏆 Seuil : {quiz.seuilReussite}/{quiz.noteSur}
                  {quiz.tentativeMax && ` &nbsp;|&nbsp; 🔄 ${quiz.tentativeMax} tentatives`}
                </div>
                {quiz.dateDebut && quiz.dateFin && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                    📅 Du {new Date(quiz.dateDebut).toLocaleDateString('fr-FR')}
                    {' au '}
                    {new Date(quiz.dateFin).toLocaleDateString('fr-FR')}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <Link
                    to={`/etudiant/quiz/${quiz.id}/tentative`}
                    className="btn-primary"
                    style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}
                  >
                    {isAvailable ? '🚀 Démarrer' : '📊 Voir'}
                  </Link>
                  <Link
                    to={`/etudiant/quiz/${quiz.id}/resultats`}
                    className="btn-outline"
                    style={{ textDecoration: 'none', textAlign: 'center' }}
                  >
                    📊 Résultats
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}