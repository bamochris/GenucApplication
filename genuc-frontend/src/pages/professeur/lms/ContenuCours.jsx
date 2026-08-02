import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../../api/axios';
import '../ProfesseurDashboard.css';

const TAB_CHAPITRES = 'chapitres';
const TAB_QUIZ = 'quiz';
const TAB_DEVOIRS = 'devoirs';

export default function ContenuCours() {
  const { id } = useParams();
  const [cours, setCours] = useState(null);
  const [chapitres, setChapitres] = useState([]);
  const [tab, setTab] = useState(TAB_CHAPITRES);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  /* Nouveau chapitre */
  const [form, setForm] = useState({ titre: '', description: '', ordre: 1 });
  const [fichier, setFichier] = useState(null);
  const fileRef = useRef(null);

  /* Quiz */
  const [quiz, setQuiz] = useState([]);
  const [nouvelleQuestion, setNouvelleQuestion] = useState({ question: '', choixA: '', choixB: '', choixC: '', choixD: '', correct: 'A' });

  /* Devoirs */
  const [devoirs, setDevoirs] = useState([]);
  const [nouveauDevoir, setNouveauDevoir] = useState({ titre: '', description: '', dateLimit: '', points: 20 });

  useEffect(() => {
    Promise.all([
      api.get(`/api/cours/${id}`),
      api.get(`/api/lms/cours/${id}/chapitres`),
      api.get(`/api/lms/cours/${id}/quiz`),
      api.get(`/api/lms/cours/${id}/devoirs`),
    ]).then(([cRes, chRes, qRes, dRes]) => {
      setCours(cRes.data);
      setChapitres(chRes.data || []);
      setQuiz(qRes.data || []);
      setDevoirs(dRes.data || []);
    }).catch(() => setError('Erreur de chargement')).finally(() => setLoading(false));
  }, [id]);

  const ajouterChapitre = async (e) => {
    e.preventDefault();
    if (!form.titre.trim()) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('titre', form.titre);
      fd.append('description', form.description);
      fd.append('ordre', form.ordre);
      if (fichier) fd.append('fichier', fichier);
      const res = await api.post(`/api/lms/cours/${id}/chapitres`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setChapitres(prev => [...prev, res.data]);
      setForm({ titre: '', description: '', ordre: chapitres.length + 2 });
      setFichier(null);
      if (fileRef.current) fileRef.current.value = '';
      setMessage('Chapitre ajouté avec succès');
    } catch { setError('Erreur lors de l\'ajout du chapitre'); }
    finally { setUploading(false); }
  };

  const supprimerChapitre = async (chapId) => {
    try {
      await api.delete(`/api/lms/chapitres/${chapId}`);
      setChapitres(prev => prev.filter(c => c.id !== chapId));
    } catch { setError('Erreur lors de la suppression'); }
  };

  const ajouterQuestion = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/api/lms/cours/${id}/quiz`, nouvelleQuestion);
      setQuiz(prev => [...prev, res.data]);
      setNouvelleQuestion({ question: '', choixA: '', choixB: '', choixC: '', choixD: '', correct: 'A' });
      setMessage('Question ajoutée');
    } catch { setError('Erreur quiz'); }
  };

  const ajouterDevoir = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/api/lms/cours/${id}/devoirs`, nouveauDevoir);
      setDevoirs(prev => [...prev, res.data]);
      setNouveauDevoir({ titre: '', description: '', dateLimit: '', points: 20 });
      setMessage('Devoir créé');
    } catch { setError('Erreur devoir'); }
  };

  if (loading) return <div className="dashboard-loading"><div className="loader" /><p>Chargement...</p></div>;

  return (
    <div className="professeur-dashboard">
      <div className="section-header">
        <div>
          <Link to="/professeur/mes-cours" style={{ fontSize: 13, color: '#185FA5', textDecoration: 'none' }}>← Mes cours</Link>
          <h2 className="section-title" style={{ marginTop: 4 }}>
            Contenu LMS — {cours?.titre || `Cours #${id}`}
          </h2>
        </div>
        <Link to={`/professeur/cours/${id}/statistiques-apprentissage`} className="btn-primary" style={{ textDecoration: 'none', fontSize: 13 }}>
          📊 Statistiques
        </Link>
      </div>

      {message && <div className="alert-success" style={{ marginBottom: 16 }}>{message}</div>}
      {error && <div className="alert-erreur" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg-secondary)', borderRadius: 8, padding: 4 }}>
        {[
          { key: TAB_CHAPITRES, label: `📚 Chapitres (${chapitres.length})` },
          { key: TAB_QUIZ, label: `❓ Quiz (${quiz.length})` },
          { key: TAB_DEVOIRS, label: `📝 Devoirs (${devoirs.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '8px 12px', border: 'none', borderRadius: 6, cursor: 'pointer',
            background: tab === t.key ? 'var(--bg-card)' : 'transparent',
            fontWeight: tab === t.key ? 700 : 400,
            boxShadow: tab === t.key ? '0 1px 4px var(--shadow-color, rgba(0,0,0,0.1))' : 'none',
            color: tab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: 13,
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── TAB CHAPITRES ── */}
      {tab === TAB_CHAPITRES && (
        <div className="dash-grid" style={{ gridTemplateColumns: '1fr 360px' }}>
          <div>
            {chapitres.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                Aucun chapitre. Ajoutez votre premier contenu →
              </div>
            ) : (
              chapitres.map((ch, i) => (
                <div key={ch.id} className="card" style={{ marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8, background: '#185FA5',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, flexShrink: 0,
                  }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{ch.titre}</div>
                    {ch.description && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>{ch.description}</div>}
                    {ch.fichierUrl && (
                      <a href={ch.fichierUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#185FA5' }}>
                        {ch.type === 'VIDEO' ? '🎬' : ch.type === 'PDF' ? '📄' : '📎'} {ch.nomFichier || 'Voir le fichier'}
                      </a>
                    )}
                  </div>
                  <button onClick={() => supprimerChapitre(ch.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger-text)', cursor: 'pointer', fontSize: 16 }}>🗑</button>
                </div>
              ))
            )}
          </div>

          <div className="card">
            <h3 className="card-title">Ajouter un chapitre</h3>
            <form onSubmit={ajouterChapitre} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Titre *</label>
                <input value={form.titre} onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                  placeholder="ex: Introduction à l'algèbre"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }} required />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} placeholder="Objectifs du chapitre..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13, resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Fichier (vidéo / PDF / document)</label>
                <input ref={fileRef} type="file" accept="video/*,.pdf,.ppt,.pptx,.doc,.docx"
                  onChange={e => setFichier(e.target.files[0])}
                  style={{ fontSize: 12 }} />
                {fichier && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{fichier.name} ({(fichier.size / 1024 / 1024).toFixed(1)} Mo)</div>}
              </div>
              <button type="submit" className="btn-primary" disabled={uploading} style={{ marginTop: 4 }}>
                {uploading ? 'Envoi en cours...' : '+ Ajouter le chapitre'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB QUIZ ── */}
      {tab === TAB_QUIZ && (
        <div className="dash-grid" style={{ gridTemplateColumns: '1fr 360px' }}>
          <div>
            {quiz.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Aucune question de quiz</div>
            ) : quiz.map((q, i) => (
              <div key={q.id} className="card" style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Q{i + 1}. {q.question}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 13 }}>
                  {['A', 'B', 'C', 'D'].map(l => (
                    <div key={l} style={{
                      padding: '6px 10px', borderRadius: 6,
                      background: q.correct === l ? '#d4edda' : '#f8f9fa',
                      border: q.correct === l ? '1px solid #28a745' : '1px solid #dee2e6',
                      color: q.correct === l ? '#155724' : '#333',
                    }}>
                      <strong>{l}.</strong> {q[`choix${l}`]}
                      {q.correct === l && <span style={{ float: 'right' }}>✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="card-title">Nouvelle question</h3>
            <form onSubmit={ajouterQuestion} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <textarea value={nouvelleQuestion.question} onChange={e => setNouvelleQuestion(q => ({ ...q, question: e.target.value }))}
                placeholder="Question..." rows={2} required
                style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13, resize: 'vertical' }} />
              {['A', 'B', 'C', 'D'].map(l => (
                <input key={l} value={nouvelleQuestion[`choix${l}`]}
                  onChange={e => setNouvelleQuestion(q => ({ ...q, [`choix${l}`]: e.target.value }))}
                  placeholder={`Choix ${l}`} required
                  style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }} />
              ))}
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>Réponse correcte</label>
                <select value={nouvelleQuestion.correct} onChange={e => setNouvelleQuestion(q => ({ ...q, correct: e.target.value }))}
                  style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13, width: '100%' }}>
                  {['A', 'B', 'C', 'D'].map(l => <option key={l} value={l}>Choix {l}</option>)}
                </select>
              </div>
              <button type="submit" className="btn-primary">+ Ajouter la question</button>
            </form>
          </div>
        </div>
      )}

      {/* ── TAB DEVOIRS ── */}
      {tab === TAB_DEVOIRS && (
        <div className="dash-grid" style={{ gridTemplateColumns: '1fr 360px' }}>
          <div>
            {devoirs.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>Aucun devoir créé</div>
            ) : devoirs.map(d => (
              <div key={d.id} className="card" style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{d.titre}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{d.description}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12 }}>
                    <div style={{ color: '#185FA5', fontWeight: 600 }}>{d.points} pts</div>
                    <div style={{ color: 'var(--color-danger-text)' }}>Limite : {d.dateLimit ? new Date(d.dateLimit).toLocaleDateString('fr-FR') : '—'}</div>
                    <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{d.nbSoumissions || 0} soumissions</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="card-title">Nouveau devoir</h3>
            <form onSubmit={ajouterDevoir} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input value={nouveauDevoir.titre} onChange={e => setNouveauDevoir(d => ({ ...d, titre: e.target.value }))}
                placeholder="Titre du devoir" required
                style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }} />
              <textarea value={nouveauDevoir.description} onChange={e => setNouveauDevoir(d => ({ ...d, description: e.target.value }))}
                placeholder="Description et consignes..." rows={3}
                style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13, resize: 'vertical' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Date limite</label>
                  <input type="datetime-local" value={nouveauDevoir.dateLimit}
                    onChange={e => setNouveauDevoir(d => ({ ...d, dateLimit: e.target.value }))}
                    style={{ width: '100%', padding: '7px 8px', borderRadius: 6, border: '1px solid #ddd', fontSize: 12 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Points max</label>
                  <input type="number" min={1} max={100} value={nouveauDevoir.points}
                    onChange={e => setNouveauDevoir(d => ({ ...d, points: parseInt(e.target.value) }))}
                    style={{ width: '100%', padding: '7px 8px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13 }} />
                </div>
              </div>
              <button type="submit" className="btn-primary">+ Créer le devoir</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
