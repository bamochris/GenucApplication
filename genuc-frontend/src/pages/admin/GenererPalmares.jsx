// src/pages/admin/GenererPalmares.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function GenererPalmares() {
  const { user } = useAuth();
  const [universites, setUniversites] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    universiteId: '',
    anneeAcademique: '',
    niveau: 'L3',
    topN: 3,
    seuilMoyenne: 14,
    mentionsCibles: ['DISTINCTION', 'GRANDE_DISTINCTION', 'TRES_GRANDE_DISTINCTION'],
    autoGeneration: false,
    dateGeneration: '',
    emailTemplate: ''
  });

  useEffect(() => {
    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, []);

  const loadInitialData = async () => {
    try {
      const [uniRes, anneesRes] = await Promise.all([
        api.get('/api/universites/public'),
        api.get('/api/palmares/public/annees')
      ]);
      setUniversites(uniRes.data || []);
      setAnnees(anneesRes.data || []);
      if (anneesRes.data.length > 0) {
        setForm(prev => ({ ...prev, anneeAcademique: anneesRes.data[0] }));
      }
      if (user?.universiteId) {
        setForm(prev => ({ ...prev, universiteId: user.universiteId.toString() }));
      }
    } catch (err) {
      setError('Erreur chargement des données');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setResult(null);

    try {
      const payload = {
        ...form,
        universiteId: parseInt(form.universiteId),
        topN: parseInt(form.topN),
        seuilMoyenne: parseFloat(form.seuilMoyenne),
        mentionsCibles: form.mentionsCibles,
        autoGeneration: form.autoGeneration,
        dateGeneration: form.dateGeneration || null
      };

      const response = await api.post('/api/palmares/generer', payload);
      setResult(response.data);
      setMessage(`✅ ${response.data.total || 0} lauréats générés avec succès !`);
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  const toggleMention = (mention) => {
    setForm(prev => ({
      ...prev,
      mentionsCibles: prev.mentionsCibles.includes(mention)
        ? prev.mentionsCibles.filter(m => m !== mention)
        : [...prev.mentionsCibles, mention]
    }));
  };

  // ★ Fonction définie avec le bon nom
  const handleGenererAuto = async () => {
    if (!form.universiteId || !form.anneeAcademique) {
      setError('Veuillez sélectionner une université et une année');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/api/palmares/generer-auto', {
        universiteId: parseInt(form.universiteId),
        anneeAcademique: form.anneeAcademique
      });
      setMessage(`✅ ${response.data.total || 0} lauréats générés automatiquement !`);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🏆 Générer le palmarès</h1>
          <p className="page-sub">Paramétrez et générez le palmarès des meilleurs étudiants</p>
        </div>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Université *</label>
              <select
                value={form.universiteId}
                onChange={e => setForm({...form, universiteId: e.target.value})}
                required
              >
                <option value="">-- Sélectionner --</option>
                {universites.map(u => (
                  <option key={u.id} value={u.id}>{u.nom}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Année académique *</label>
              <select
                value={form.anneeAcademique}
                onChange={e => setForm({...form, anneeAcademique: e.target.value})}
                required
              >
                <option value="">-- Sélectionner --</option>
                {annees.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Niveau cible</label>
              <select
                value={form.niveau}
                onChange={e => setForm({...form, niveau: e.target.value})}
              >
                <option value="L3">Licence 3</option>
                <option value="M2">Master 2</option>
                <option value="D3">Doctorat 3</option>
                <option value="L1">Licence 1</option>
                <option value="L2">Licence 2</option>
                <option value="M1">Master 1</option>
                <option value="D1">Doctorat 1</option>
                <option value="D2">Doctorat 2</option>
              </select>
            </div>

            <div className="form-group">
              <label>Nombre de meilleurs par filière</label>
              <input
                type="number"
                min="1"
                max="20"
                value={form.topN}
                onChange={e => setForm({...form, topN: parseInt(e.target.value) || 3})}
              />
            </div>

            <div className="form-group">
              <label>Seuil de moyenne minimum</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="20"
                value={form.seuilMoyenne}
                onChange={e => setForm({...form, seuilMoyenne: parseFloat(e.target.value) || 14})}
              />
              <small style={{ color: 'var(--text-muted)' }}>Seuil minimum pour être considéré</small>
            </div>

            <div className="form-group">
              <label>Mentions à inclure</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {['DISTINCTION', 'GRANDE_DISTINCTION', 'TRES_GRANDE_DISTINCTION', 'SATISFACTION', 'REUSSITE'].map(m => (
                  <label key={m} style={{
                    cursor: 'pointer',
                    padding: '4px 12px',
                    borderRadius: 12,
                    background: form.mentionsCibles.includes(m) ? '#0B1F4A' : '#f0f0f0',
                    color: form.mentionsCibles.includes(m) ? 'white' : '#333',
                    fontSize: 11,
                    transition: 'all 0.2s'
                  }}>
                    <input
                      type="checkbox"
                      checked={form.mentionsCibles.includes(m)}
                      onChange={() => toggleMention(m)}
                      style={{ display: 'none' }}
                    />
                    {m.replace('_', ' ')}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / span 2', borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
              <h4 style={{ marginBottom: 8 }}>⚙️ Options avancées</h4>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.autoGeneration}
                    onChange={e => setForm({...form, autoGeneration: e.target.checked})}
                  />
                  Génération automatique
                </label>
                {form.autoGeneration && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <label style={{ fontSize: 12 }}>Date de génération :</label>
                    <input
                      type="date"
                      value={form.dateGeneration}
                      onChange={e => setForm({...form, dateGeneration: e.target.value})}
                      style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd' }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Template d'email (optionnel)</label>
              <textarea
                rows="3"
                value={form.emailTemplate}
                onChange={e => setForm({...form, emailTemplate: e.target.value})}
                placeholder="Personnalisez le message envoyé aux lauréats..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? '⏳ Génération...' : '🚀 Générer le palmarès'}
            </button>
            {/* ★ Correction du nom de la fonction ici */}
            <button type="button" className="btn-outline" onClick={handleGenererAuto} disabled={loading}>
              ⚡ Génération automatique
            </button>
          </div>
        </form>

        {result && (
          <div style={{ marginTop: 20, padding: 16, background: 'rgba(24,95,165,0.12)', borderRadius: 8 }}>
            <h4>📊 Résultat de la génération</h4>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 8 }}>
              <div className="stat-card" style={{ padding: 12 }}>
                <div className="stat-value" style={{ color: '#185FA5' }}>{result.total || 0}</div>
                <div className="stat-label">Total générés</div>
              </div>
              <div className="stat-card" style={{ padding: 12 }}>
                <div className="stat-value" style={{ color: 'var(--color-success-text)' }}>{result.valides || 0}</div>
                <div className="stat-label">Déjà validés</div>
              </div>
              <div className="stat-card" style={{ padding: 12 }}>
                <div className="stat-value" style={{ color: '#ff9800' }}>{result.enAttente || 0}</div>
                <div className="stat-label">En attente</div>
              </div>
              <div className="stat-card" style={{ padding: 12 }}>
                <div className="stat-value">{result.annee || form.anneeAcademique}</div>
                <div className="stat-label">Année</div>
              </div>
            </div>
            {result.filieres && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Répartition par filière :</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {Object.entries(result.filieres).map(([filiere, count]) => (
                    <span key={filiere} className="badge badge-neutral">
                      {filiere}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}