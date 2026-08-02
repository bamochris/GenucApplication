// src/pages/etudiant/QuizAttempt.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function QuizAttempt() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [tentative, setTentative] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [reponses, setReponses] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const inscriptionId = user?.inscriptionId;

  useEffect(() => {
    const startAttempt = async () => {
      try {
        setLoading(true);
        // 1. Démarrer la tentative
        const res = await api.post('/api/quiz/tentative', { quizId, inscriptionId });
        setTentative(res.data);

        // 2. Récupérer les détails du quiz
        const quizRes = await api.get(`/api/quiz/${quizId}`);
        const quizData = quizRes.data;
        setQuiz(quizData);
        setQuestions(quizData.questions || []);
        setTimeLeft(quizData.dureeMinutes * 60);

        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || "Impossible de démarrer le quiz");
      } finally {
        setLoading(false);
      }
    };
    startAttempt();
  }, [quizId, inscriptionId]);

  // Timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          soumettreQuiz(); // auto soumission
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [timeLeft]);

  const handleChange = (questionId, value, isMulti = false) => {
    if (isMulti) {
      const current = reponses[questionId] || [];
      if (current.includes(value)) {
        setReponses(prev => ({
          ...prev,
          [questionId]: current.filter(v => v !== value)
        }));
      } else {
        setReponses(prev => ({
          ...prev,
          [questionId]: [...current, value]
        }));
      }
    } else {
      setReponses(prev => ({ ...prev, [questionId]: value }));
    }
  };

  const soumettreQuiz = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.post(`/api/quiz/tentative/${tentative.id}/soumettre`, { reponses });
      navigate(`/etudiant/quiz/${quizId}/resultats`);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la soumission du quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) return <div className="page"><div className="loading">Préparation du quiz...</div></div>;
  if (error) return <div className="page"><div className="alert-erreur">{error}</div></div>;
  if (!quiz) return null;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{quiz.titre}</h1>
          <p className="page-sub">Tentative #{tentative?.tentativeNumero || 1}</p>
        </div>
        <div className="badge" style={{ background: timeLeft < 60 ? '#cc0000' : '#0B1F4A', color: 'white', fontSize: 16, padding: '8px 16px' }}>
          ⏱️ {formatTime(timeLeft)}
        </div>
      </div>

      <div className="card">
        <form onSubmit={(e) => { e.preventDefault(); soumettreQuiz(); }}>
          {questions.map((q, idx) => (
            <div key={q.id} style={{ marginBottom: 28, borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 15 }}>
                {idx + 1}. {q.texte}
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>({q.points} pts)</span>
              </div>

              {q.type === 'QCM' && (
                <div>
                  {q.reponses.map(rep => (
                    <label key={rep.id} style={{ display: 'block', marginBottom: 6, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        value={rep.texte}
                        checked={(reponses[q.id] || []).includes(rep.texte)}
                        onChange={(e) => handleChange(q.id, rep.texte, true)}
                      /> {rep.texte}
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'UNIQUE' && (
                <div>
                  {q.reponses.map(rep => (
                    <label key={rep.id} style={{ display: 'block', marginBottom: 6, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name={`q${q.id}`}
                        value={rep.texte}
                        checked={reponses[q.id] === rep.texte}
                        onChange={() => handleChange(q.id, rep.texte)}
                      /> {rep.texte}
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'VRAI_FAUX' && (
                <div>
                  <label style={{ marginRight: 16, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name={`q${q.id}`}
                      value="VRAI"
                      checked={reponses[q.id] === 'VRAI'}
                      onChange={() => handleChange(q.id, 'VRAI')}
                    /> Vrai
                  </label>
                  <label style={{ cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name={`q${q.id}`}
                      value="FAUX"
                      checked={reponses[q.id] === 'FAUX'}
                      onChange={() => handleChange(q.id, 'FAUX')}
                    /> Faux
                  </label>
                </div>
              )}

              {q.type === 'TEXTE' && (
                <textarea
                  rows="3"
                  className="form-control"
                  style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid #ddd' }}
                  value={reponses[q.id] || ''}
                  onChange={(e) => handleChange(q.id, e.target.value)}
                  placeholder="Écrivez votre réponse..."
                />
              )}
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {Object.keys(reponses).length} / {questions.length} réponses
            </div>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ padding: '12px 40px' }}>
              {submitting ? '⏳ Soumission...' : '📤 Soumettre le quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
