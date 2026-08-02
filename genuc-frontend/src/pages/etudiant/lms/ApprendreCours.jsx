import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';

export default function ApprendreCours() {
  const { id } = useParams();
  const { user } = useAuth();
  const [cours, setCours] = useState(null);
  const [chapitres, setChapitres] = useState([]);
  const [chapitreActif, setChapitreActif] = useState(null);
  const [progression, setProgression] = useState({});
  const [quiz, setQuiz] = useState([]);
  const [reponsesQuiz, setReponsesQuiz] = useState({});
  const [quizSoumis, setQuizSoumis] = useState(false);
  const [scoreQuiz, setScoreQuiz] = useState(null);
  const [devoirs, setDevoirs] = useState([]);
  const [fichierDevoir, setFichierDevoir] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('contenu');

  useEffect(() => {
    Promise.all([
      api.get(`/api/cours/${id}`),
      api.get(`/api/lms/cours/${id}/chapitres`),
      api.get(`/api/lms/cours/${id}/quiz`),
      api.get(`/api/lms/cours/${id}/devoirs`),
      api.get(`/api/lms/cours/${id}/ma-progression`),
    ]).then(([cRes, chRes, qRes, dRes, pRes]) => {
      setCours(cRes.data);
      const chs = chRes.data || [];
      setChapitres(chs);
      if (chs.length > 0) setChapitreActif(chs[0]);
      setQuiz(qRes.data || []);
      setDevoirs(dRes.data || []);
      setProgression(pRes.data?.chapitresVus || {});
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const marquerVu = async (chapId) => {
    if (progression[chapId]) return;
    try {
      await api.post(`/api/lms/chapitres/${chapId}/marquer-vu`);
      setProgression(prev => ({ ...prev, [chapId]: true }));
    } catch {}
  };

  const soumettreQuiz = async () => {
    if (Object.keys(reponsesQuiz).length < quiz.length) {
      alert('Répondez à toutes les questions avant de soumettre.');
      return;
    }
    try {
      const res = await api.post(`/api/lms/cours/${id}/quiz/soumettre`, { reponses: reponsesQuiz });
      setScoreQuiz(res.data.score);
      setQuizSoumis(true);
    } catch {}
  };

  const soumettreDevoir = async (devoirId) => {
    const f = fichierDevoir[devoirId];
    if (!f) return;
    const fd = new FormData();
    fd.append('fichier', f);
    fd.append('etudiantId', user.id);
    try {
      await api.post(`/api/lms/devoirs/${devoirId}/soumettre`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setDevoirs(prev => prev.map(d => d.id === devoirId ? { ...d, soumis: true } : d));
    } catch {}
  };

  const totalVus = Object.values(progression).filter(Boolean).length;
  const pct = chapitres.length ? Math.round((totalVus / chapitres.length) * 100) : 0;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12, background: 'var(--bg-secondary)' }}>
      <div style={{ width: 40, height: 40, border: '4px solid #ddd', borderTop: '4px solid #185FA5', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'var(--text-muted)' }}>Chargement du cours...</p>
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-secondary)', fontFamily: '-apple-system,sans-serif' }}>
      {/* Sidebar chapitres */}
      <aside style={{ width: 280, background: '#0B1F4A', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Link to="/etudiant/mes-cours" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, textDecoration: 'none' }}>← Mes cours</Link>
          <div style={{ fontWeight: 700, fontSize: 15, marginTop: 8, lineHeight: 1.3 }}>{cours?.titre}</div>
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
              <span>Progression</span><span>{pct}%</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 4, height: 6 }}>
              <div style={{ background: '#9FE1CB', height: '100%', borderRadius: 4, width: `${pct}%`, transition: 'width 0.4s' }} />
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {chapitres.map((ch, i) => (
            <button key={ch.id} onClick={() => { setChapitreActif(ch); setTab('contenu'); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '12px 16px', background: chapitreActif?.id === ch.id ? 'rgba(255,255,255,0.12)' : 'transparent',
                border: 'none', color: 'white', cursor: 'pointer', textAlign: 'left',
                borderLeft: chapitreActif?.id === ch.id ? '3px solid #9FE1CB' : '3px solid transparent',
              }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                background: progression[ch.id] ? '#1D9E75' : 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
              }}>
                {progression[ch.id] ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 13, lineHeight: 1.3 }}>{ch.titre}</span>
            </button>
          ))}

          {quiz.length > 0 && (
            <button onClick={() => setTab('quiz')} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '12px 16px', background: tab === 'quiz' ? 'rgba(255,255,255,0.12)' : 'transparent',
              border: 'none', color: 'white', cursor: 'pointer', textAlign: 'left',
              borderLeft: tab === 'quiz' ? '3px solid #f5a623' : '3px solid transparent',
            }}>
              <span style={{ fontSize: 18 }}>❓</span>
              <span style={{ fontSize: 13 }}>Quiz du cours {quizSoumis ? `— ${scoreQuiz}%` : ''}</span>
            </button>
          )}

          {devoirs.length > 0 && (
            <button onClick={() => setTab('devoirs')} style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '12px 16px', background: tab === 'devoirs' ? 'rgba(255,255,255,0.12)' : 'transparent',
              border: 'none', color: 'white', cursor: 'pointer', textAlign: 'left',
              borderLeft: tab === 'devoirs' ? '3px solid #9b59b6' : '3px solid transparent',
            }}>
              <span style={{ fontSize: 18 }}>📝</span>
              <span style={{ fontSize: 13 }}>Devoirs ({devoirs.filter(d => d.soumis).length}/{devoirs.length})</span>
            </button>
          )}
        </div>
      </aside>

      {/* Zone principale */}
      <main style={{ flex: 1, overflowY: 'auto', padding: 32 }}>

        {/* ── Contenu chapitre ── */}
        {tab === 'contenu' && chapitreActif && (
          <div style={{ maxWidth: 820 }}>
            <h1 style={{ fontSize: 24, color: 'var(--text-primary)', marginBottom: 8 }}>{chapitreActif.titre}</h1>
            {chapitreActif.description && <p style={{ color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.7 }}>{chapitreActif.description}</p>}

            {chapitreActif.fichierUrl && (
              chapitreActif.type === 'VIDEO' ? (
                <video
                  controls style={{ width: '100%', borderRadius: 12, marginBottom: 24, maxHeight: 450 }}
                  onPlay={() => marquerVu(chapitreActif.id)}
                  src={chapitreActif.fichierUrl}
                />
              ) : chapitreActif.type === 'PDF' ? (
                <iframe
                  src={chapitreActif.fichierUrl} title={chapitreActif.titre}
                  style={{ width: '100%', height: 520, border: 'none', borderRadius: 12, marginBottom: 24 }}
                  onLoad={() => marquerVu(chapitreActif.id)}
                />
              ) : (
                <a href={chapitreActif.fichierUrl} target="_blank" rel="noopener noreferrer"
                  onClick={() => marquerVu(chapitreActif.id)}
                  style={{ display: 'inline-block', padding: '12px 20px', background: '#185FA5', color: 'white', borderRadius: 8, textDecoration: 'none', marginBottom: 24 }}>
                  📎 Télécharger le document
                </a>
              )
            )}

            {!progression[chapitreActif.id] && (
              <button onClick={() => marquerVu(chapitreActif.id)} style={{
                padding: '10px 22px', background: '#1D9E75', color: 'white',
                border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, marginBottom: 24,
              }}>
                ✓ Marquer comme terminé
              </button>
            )}
            {progression[chapitreActif.id] && (
              <div style={{ color: '#1D9E75', fontWeight: 600, marginBottom: 24, fontSize: 14 }}>✓ Chapitre terminé</div>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              {chapitres.findIndex(c => c.id === chapitreActif.id) > 0 && (
                <button onClick={() => setChapitreActif(chapitres[chapitres.findIndex(c => c.id === chapitreActif.id) - 1])}
                  style={{ padding: '10px 20px', border: '1px solid #ddd', borderRadius: 8, background: 'var(--bg-card)', cursor: 'pointer' }}>
                  ← Précédent
                </button>
              )}
              <div />
              {chapitres.findIndex(c => c.id === chapitreActif.id) < chapitres.length - 1 && (
                <button onClick={() => { marquerVu(chapitreActif.id); setChapitreActif(chapitres[chapitres.findIndex(c => c.id === chapitreActif.id) + 1]); }}
                  style={{ padding: '10px 20px', background: '#185FA5', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                  Suivant →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Quiz ── */}
        {tab === 'quiz' && (
          <div style={{ maxWidth: 640 }}>
            <h2 style={{ fontSize: 22, color: 'var(--text-primary)', marginBottom: 20 }}>Quiz du cours</h2>
            {quizSoumis ? (
              <div style={{ textAlign: 'center', padding: 48, background: 'var(--bg-card)', borderRadius: 16 }}>
                <div style={{ fontSize: 64 }}>{scoreQuiz >= 50 ? '🎉' : '😕'}</div>
                <div style={{ fontSize: 28, fontWeight: 700, marginTop: 16, color: scoreQuiz >= 50 ? '#1D9E75' : '#cc0000' }}>
                  {scoreQuiz}%
                </div>
                <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
                  {scoreQuiz >= 50 ? 'Félicitations ! Vous avez réussi le quiz.' : 'Continuez à étudier les chapitres et réessayez.'}
                </p>
                <button onClick={() => { setQuizSoumis(false); setReponsesQuiz({}); }}
                  style={{ marginTop: 20, padding: '10px 24px', background: '#185FA5', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                  Réessayer
                </button>
              </div>
            ) : (
              <div>
                {quiz.map((q, i) => (
                  <div key={q.id} style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 14, color: 'var(--text-primary)' }}>Q{i + 1}. {q.question}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {['A', 'B', 'C', 'D'].map(l => (
                        <label key={l} style={{
                          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                          border: `2px solid ${reponsesQuiz[q.id] === l ? '#185FA5' : '#eee'}`,
                          background: reponsesQuiz[q.id] === l ? '#f0f4ff' : 'white',
                          transition: 'all 0.15s',
                        }}>
                          <input type="radio" name={`q${q.id}`} value={l}
                            checked={reponsesQuiz[q.id] === l}
                            onChange={() => setReponsesQuiz(r => ({ ...r, [q.id]: l }))}
                            style={{ display: 'none' }} />
                          <span style={{
                            width: 22, height: 22, borderRadius: '50%', border: '2px solid',
                            borderColor: reponsesQuiz[q.id] === l ? '#185FA5' : '#ccc',
                            background: reponsesQuiz[q.id] === l ? '#185FA5' : 'white',
                            flexShrink: 0,
                          }} />
                          <span style={{ fontSize: 13 }}><strong>{l}.</strong> {q[`choix${l}`]}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <button onClick={soumettreQuiz} style={{
                  width: '100%', padding: '14px', background: '#185FA5', color: 'white',
                  border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 15, fontWeight: 600,
                }}>
                  Soumettre le quiz
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Devoirs ── */}
        {tab === 'devoirs' && (
          <div style={{ maxWidth: 700 }}>
            <h2 style={{ fontSize: 22, color: 'var(--text-primary)', marginBottom: 20 }}>Mes devoirs</h2>
            {devoirs.map(d => (
              <div key={d.id} style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 24, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 16 }}>{d.titre}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{d.description}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12 }}>
                    <div style={{ fontWeight: 600, color: '#185FA5' }}>{d.points} pts</div>
                    {d.dateLimit && (
                      <div style={{ color: new Date(d.dateLimit) < new Date() ? '#cc0000' : '#f5a623', marginTop: 2 }}>
                        Limite : {new Date(d.dateLimit).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>
                </div>
                {d.soumis ? (
                  <div style={{ padding: '10px 14px', background: 'rgba(29,158,117,0.12)', borderRadius: 8, color: '#1D9E75', fontSize: 13, fontWeight: 600 }}>
                    ✓ Devoir soumis {d.noteObtenue !== undefined ? `— Note : ${d.noteObtenue}/${d.points}` : '(en attente de correction)'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input type="file" onChange={e => setFichierDevoir(f => ({ ...f, [d.id]: e.target.files[0] }))}
                      style={{ flex: 1, fontSize: 12 }} />
                    <button onClick={() => soumettreDevoir(d.id)}
                      disabled={!fichierDevoir[d.id]}
                      style={{
                        padding: '8px 16px', background: fichierDevoir[d.id] ? '#185FA5' : '#ccc',
                        color: 'white', border: 'none', borderRadius: 6, cursor: fichierDevoir[d.id] ? 'pointer' : 'default',
                        fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                      }}>
                      Soumettre
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
