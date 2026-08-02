import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const CRITERES = [
  { key: 'clarte', label: 'Clarté des explications' },
  { key: 'ponctualite', label: 'Ponctualité et présence' },
  { key: 'disponibilite', label: 'Disponibilité pour les étudiants' },
  { key: 'maitrise', label: 'Maîtrise de la matière' },
  { key: 'methode', label: 'Méthode pédagogique' },
];

function EtoileRating({ value, onChange, disabled }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => !disabled && onChange(n)} style={{
          fontSize: 22, background: 'none', border: 'none', cursor: disabled ? 'default' : 'pointer',
          color: n <= value ? '#f5a623' : '#ddd', padding: 2,
          transition: 'transform 0.1s',
        }}
          onMouseEnter={e => { if (!disabled) e.target.style.transform = 'scale(1.2)'; }}
          onMouseLeave={e => { e.target.style.transform = 'scale(1)'; }}>
          ★
        </button>
      ))}
    </div>
  );
}

export default function EvaluationEnseignants() {
  const { user } = useAuth();
  const [cours, setCours] = useState([]);
  const [coursSelectionne, setCoursSelectionne] = useState('');
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    clarte: 0, ponctualite: 0, disponibilite: 0, maitrise: 0, methode: 0,
    commentaire: '',
  });

  useEffect(() => {
    Promise.all([
      api.get(`/api/cours/etudiant/${user.id}`),
      api.get(`/api/evaluations/mes-evaluations`),
    ]).then(([cRes, eRes]) => {
      setCours(cRes.data || []);
      setEvaluations(eRes.data || []);
    }).catch(() => setError('Erreur de chargement')).finally(() => setLoading(false));
  }, [user.id]);

  const dejaEvalue = (coursId) => evaluations.some(e => e.coursId === parseInt(coursId));

  const soumettre = async (e) => {
    e.preventDefault();
    if (!coursSelectionne) { setError('Sélectionnez un cours'); return; }
    const missing = CRITERES.find(c => form[c.key] === 0);
    if (missing) { setError(`Veuillez noter : ${missing.label}`); return; }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/api/evaluations/soumettre', { coursId: parseInt(coursSelectionne), ...form });
      setEvaluations(prev => [...prev, { coursId: parseInt(coursSelectionne) }]);
      setForm({ clarte: 0, ponctualite: 0, disponibilite: 0, maitrise: 0, methode: 0, commentaire: '' });
      setCoursSelectionne('');
      setMessage('Évaluation soumise anonymement. Merci pour votre retour !');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la soumission');
    } finally { setSubmitting(false); }
  };

  const coursDispo = cours.filter(c => !dejaEvalue(c.id));

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Chargement...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h2 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>Évaluation des enseignants</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
        Vos évaluations sont 100% anonymes. Elles aident à améliorer la qualité de l'enseignement.
      </p>

      {message && (
        <div style={{ padding: '12px 16px', background: 'rgba(29,158,117,0.12)', color: '#1D9E75', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
          {message}
        </div>
      )}
      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(220,53,69,0.10)', color: '#e05563', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
          {error}
        </div>
      )}

      {coursDispo.length === 0 ? (
        <div style={{ padding: 40, background: 'var(--bg-card)', borderRadius: 12, textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <p>Vous avez évalué tous vos enseignants. Merci !</p>
        </div>
      ) : (
        <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 28 }}>
          <form onSubmit={soumettre}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
                Sélectionner un cours *
              </label>
              <select value={coursSelectionne} onChange={e => setCoursSelectionne(e.target.value)} required
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }}>
                <option value="">-- Choisissez un cours --</option>
                {coursDispo.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.titre} ({c.professeurNom})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 24 }}>
              {CRITERES.map(c => (
                <div key={c.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{c.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <EtoileRating value={form[c.key]} onChange={v => setForm(f => ({ ...f, [c.key]: v }))} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 60 }}>
                      {form[c.key] === 0 ? 'Non noté' : ['', 'Mauvais', 'Passable', 'Bien', 'Très bien', 'Excellent'][form[c.key]]}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 8 }}>
                Commentaire (optionnel, anonyme)
              </label>
              <textarea value={form.commentaire} onChange={e => setForm(f => ({ ...f, commentaire: e.target.value }))}
                placeholder="Points positifs, suggestions d'amélioration..."
                rows={4} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '10px 14px', background: 'rgba(24,95,165,0.12)', borderRadius: 8 }}>
              <span style={{ fontSize: 16 }}>🔒</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Évaluation totalement anonyme — votre identité ne sera jamais révélée à l'enseignant.</span>
            </div>

            <button type="submit" disabled={submitting || !coursSelectionne} style={{
              width: '100%', padding: '13px', background: submitting ? '#aaa' : '#185FA5',
              color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: submitting ? 'default' : 'pointer',
            }}>
              {submitting ? 'Envoi en cours...' : 'Soumettre mon évaluation anonyme'}
            </button>
          </form>
        </div>
      )}

      {/* Déjà évalués */}
      {evaluations.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ color: 'var(--text-primary)', fontSize: 16, marginBottom: 12 }}>Cours déjà évalués</h3>
          {evaluations.map((e, i) => {
            const c = cours.find(c => c.id === e.coursId);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: '#1D9E75', fontSize: 16 }}>✓</span>
                <span>{c ? `${c.code} — ${c.titre}` : `Cours #${e.coursId}`}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
