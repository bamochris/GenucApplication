// src/pages/etudiant/QuizResult.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function QuizResult() {
  const { quizId } = useParams();
  const { user } = useAuth();
  const [resultats, setResultats] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const inscriptionId = user?.inscriptionId;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [quizRes, resultsRes] = await Promise.all([
          api.get(`/api/quiz/${quizId}`),
          api.get(`/api/quiz/resultats/${inscriptionId}/${quizId}`)
        ]);
        setQuiz(quizRes.data);
        setResultats(resultsRes.data);
      } catch (err) {
        setError("Erreur chargement des résultats");
      } finally {
        setLoading(false);
      }
    };
    if (inscriptionId && quizId) loadData();
  }, [inscriptionId, quizId]);

  const getMeilleureTentative = () => {
    if (resultats.length === 0) return null;
    return resultats.reduce((best, current) =>
      (current.noteTotale > best.noteTotale) ? current : best
    );
  };

  if (loading) return <div className="loading">Chargement des résultats...</div>;
  if (error) return <div className="alert-erreur">{error}</div>;

  const meilleure = getMeilleureTentative();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Résultats – {quiz?.titre || 'Quiz'}</h1>
          <p className="page-sub">Consultez vos performances</p>
        </div>
        <Link to={`/etudiant/quiz/cours/${quiz?.cours?.id}`} className="btn-outline" style={{ textDecoration: 'none' }}>
          ← Retour aux quiz
        </Link>
      </div>

      {meilleure && (
        <div className="card" style={{ textAlign: 'center', marginBottom: 20, background: meilleure.reussi ? '#f0fdf4' : '#fef2f2' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{meilleure.reussi ? '🎉' : '😅'}</div>
          <h2 style={{ color: meilleure.reussi ? '#1D9E75' : '#cc0000' }}>
            {meilleure.reussi ? 'Félicitations !' : 'Continuez à vous entraîner !'}
          </h2>
          <div style={{ fontSize: 32, fontWeight: 700 }}>
            {meilleure.noteTotale} / {quiz?.noteSur || 20}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Meilleure tentative • {new Date(meilleure.dateFin).toLocaleDateString('fr-FR')}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">📋 Historique des tentatives</h2>
        {resultats.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>Aucune tentative pour ce quiz.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Tentative n°</th>
                <th>Date</th>
                <th>Note / {quiz?.noteSur || 20}</th>
                <th>Résultat</th>
              </tr>
            </thead>
            <tbody>
              {resultats.map(t => (
                <tr key={t.id}>
                  <td>{t.tentativeNumero}</td>
                  <td>{new Date(t.dateFin).toLocaleString('fr-FR')}</td>
                  <td style={{ fontWeight: 700, color: t.reussi ? '#1D9E75' : '#cc0000' }}>
                    {t.noteTotale}
                  </td>
                  <td>
                    <span className={`badge ${t.reussi ? 'badge-success' : 'badge-danger'}`}>
                      {t.reussi ? '✅ Réussi' : '❌ Échoué'}
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
