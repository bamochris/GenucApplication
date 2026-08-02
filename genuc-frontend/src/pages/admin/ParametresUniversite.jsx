// src/pages/admin/ParametresUniversite.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function ParametresUniversite() {
  const { user } = useAuth();
  const [parametres, setParametres] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const universiteId = user?.universiteId;

  // ─── Modules des portails (activable/désactivable par l'admin) ───
  const MODULES_CATALOGUE = [
    { cle: 'bibliotheque', icone: '📚', label: 'Bibliothèque',       desc: 'Catalogue, emprunts et réservations (portails étudiant et professeur)' },
    { cle: 'palmares',     icone: '🏆', label: 'Palmarès',           desc: 'Classements et meilleurs étudiants' },
    { cle: 'attestations', icone: '📜', label: 'Attestations',       desc: 'Demandes et délivrance d\'attestations' },
    { cle: 'recours',      icone: '⚖️', label: 'Recours',            desc: 'Dépôt et suivi des recours après délibération' },
    { cle: 'calendrier',   icone: '📅', label: 'Calendrier',         desc: 'Calendrier académique visible par les étudiants' },
    { cle: 'cartes',       icone: '🪪', label: 'Cartes d\'étudiant', desc: 'Cartes numériques et QR codes' },
    { cle: 'social',       icone: '🤝', label: 'Vie sociale',        desc: 'Dossiers sociaux et accompagnement' },
    { cle: 'stages',       icone: '💼', label: 'Stages',             desc: 'Offres et suivi des stages' },
    { cle: 'emplois',      icone: '🧑‍💻', label: 'Emplois',          desc: 'Offres d\'emploi et insertion professionnelle' },
  ];
  const [modules, setModules] = useState({});
  const [modulesMsg, setModulesMsg] = useState('');

  useEffect(() => {
    if (!universiteId) return;
    api.get(`/api/universites/public/${universiteId}`)
      .then(r => {
        try { setModules(JSON.parse(r.data?.modulesActifs || '{}')); }
        catch { setModules({}); }
      })
      .catch(() => {});
  }, [universiteId]);

  const sauverModules = async () => {
    setModulesMsg(''); setError('');
    try {
      await api.put(`/api/universites/${universiteId}`, {
        modulesActifs: JSON.stringify(modules),
      });
      setModulesMsg('✅ Modules enregistrés — les menus des portails sont mis à jour à la prochaine connexion.');
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de l\'enregistrement des modules');
    }
  };

  useEffect(() => {
    if (universiteId) loadParametres();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [universiteId]);

  const loadParametres = async () => {
    try {
      const res = await api.get(`/api/parametres/universite/${universiteId}`);
      setParametres(res.data);
    } catch (err) {
      setError("Erreur chargement des paramètres");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.put(`/api/parametres/universite/${universiteId}`, parametres);
      setMessage('Paramètres mis à jour avec succès');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleChange = (field, value) => {
    setParametres({ ...parametres, [field]: value });
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (!parametres) return <div className="alert-erreur">Aucun paramètre trouvé</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ Paramètres de l'université</h1>
          <p className="page-sub">Configurez les frais, les délais et les options avancées</p>
        </div>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}

      {/* ═══ Modules des portails ═══ */}
      <div className="card" style={{ marginBottom: 18 }}>
        <h3 className="card-title">🧩 Modules des portails</h3>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 14px' }}>
          Activez ou désactivez les options visibles dans les portails étudiant et professeur
          de votre université. Un module désactivé disparaît de leurs menus.
        </p>
        {modulesMsg && <div className="alert-success" onClick={() => setModulesMsg('')}>{modulesMsg}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {MODULES_CATALOGUE.map(m => {
            const actif = modules[m.cle] !== false;
            return (
              <label key={m.cle} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                borderRadius: 10, cursor: 'pointer',
                border: `1.5px solid ${actif ? 'rgba(29,158,117,0.5)' : 'var(--border-color)'}`,
                background: actif ? 'rgba(29,158,117,0.07)' : 'var(--bg-secondary)',
                opacity: actif ? 1 : 0.7, transition: 'all 0.2s',
              }}>
                <input
                  type="checkbox"
                  checked={actif}
                  onChange={e => setModules(prev => ({ ...prev, [m.cle]: e.target.checked }))}
                  style={{ width: 17, height: 17, accentColor: '#1D9E75' }}
                />
                <span style={{ fontSize: 20 }}>{m.icone}</span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>
                    {m.label}
                    <span style={{
                      marginLeft: 8, fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 10,
                      background: actif ? 'rgba(29,158,117,0.15)' : 'rgba(128,128,128,0.15)',
                      color: actif ? '#1D9E75' : 'var(--text-muted)',
                    }}>
                      {actif ? 'ACTIF' : 'DÉSACTIVÉ'}
                    </span>
                  </span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{m.desc}</span>
                </span>
              </label>
            );
          })}
        </div>
        <div style={{ marginTop: 14, textAlign: 'right' }}>
          <button type="button" className="btn-primary" onClick={sauverModules}>
            💾 Enregistrer les modules
          </button>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="form-grid">
          <h3 style={{ gridColumn: '1 / span 2', color: 'var(--text-primary)', marginBottom: 0 }}>💰 Frais</h3>

          <div className="form-group">
            <label>Frais d'inscription (USD)</label>
            <input
              type="number"
              step="0.01"
              value={parametres.fraisInscription}
              onChange={e => handleChange('fraisInscription', parseFloat(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Frais de relevé de notes (USD)</label>
            <input
              type="number"
              step="0.01"
              value={parametres.fraisReleve}
              onChange={e => handleChange('fraisReleve', parseFloat(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Frais de diplôme (USD)</label>
            <input
              type="number"
              step="0.01"
              value={parametres.fraisDiplome}
              onChange={e => handleChange('fraisDiplome', parseFloat(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label>Frais par crédit (USD) — 0 = désactivé</label>
            <input
              type="number"
              step="0.01"
              value={parametres.fraisParCredit}
              onChange={e => handleChange('fraisParCredit', parseFloat(e.target.value))}
            />
          </div>

          <h3 style={{ gridColumn: '1 / span 2', color: 'var(--text-primary)', marginTop: 16, marginBottom: 0 }}>📋 Délibération</h3>

          <div className="form-group">
            <label>Délibération automatique</label>
            <select
              value={parametres.deliberationAutomatique}
              onChange={e => handleChange('deliberationAutomatique', e.target.value === 'true')}
            >
              <option value="true">✅ Activée</option>
              <option value="false">❌ Désactivée</option>
            </select>
          </div>
          <div className="form-group">
            <label>Jours avant publication</label>
            <input
              type="number"
              min="1"
              value={parametres.nbJoursPublication}
              onChange={e => handleChange('nbJoursPublication', parseInt(e.target.value))}
            />
          </div>

          <h3 style={{ gridColumn: '1 / span 2', color: 'var(--text-primary)', marginTop: 16, marginBottom: 0 }}>📝 Inscriptions</h3>

          <div className="form-group">
            <label>Inscriptions multiples</label>
            <select
              value={parametres.inscriptionMultiple}
              onChange={e => handleChange('inscriptionMultiple', e.target.value === 'true')}
            >
              <option value="true">✅ Autorisées</option>
              <option value="false">❌ Interdites</option>
            </select>
          </div>
          <div className="form-group">
            <label>Délai validation dossier (jours)</label>
            <input
              type="number"
              min="1"
              value={parametres.delaiValidationDossier}
              onChange={e => handleChange('delaiValidationDossier', parseInt(e.target.value))}
            />
          </div>

          <h3 style={{ gridColumn: '1 / span 2', color: 'var(--text-primary)', marginTop: 16, marginBottom: 0 }}>🔔 Notifications</h3>

          <div className="form-group">
            <label>Email de notification</label>
            <select
              value={parametres.emailNotification}
              onChange={e => handleChange('emailNotification', e.target.value === 'true')}
            >
              <option value="true">✅ Activé</option>
              <option value="false">❌ Désactivé</option>
            </select>
          </div>
          <div className="form-group">
            <label>SMS de notification</label>
            <select
              value={parametres.smsNotification}
              onChange={e => handleChange('smsNotification', e.target.value === 'true')}
            >
              <option value="true">✅ Activé</option>
              <option value="false">❌ Désactivé</option>
            </select>
          </div>

          <h3 style={{ gridColumn: '1 / span 2', color: 'var(--text-primary)', marginTop: 16, marginBottom: 0 }}>✉️ Messagerie de l'université</h3>

          <div className="form-group">
            <label>Adresse email de messagerie</label>
            <input
              type="email"
              value={parametres.emailMessagerie || ''}
              onChange={e => handleChange('emailMessagerie', e.target.value)}
              placeholder="messagerie@universite.cd"
            />
          </div>
          <div className="form-group">
            <label>Nom affiché de l'expéditeur</label>
            <input
              type="text"
              value={parametres.nomExpediteurMessagerie || ''}
              onChange={e => handleChange('nomExpediteurMessagerie', e.target.value)}
              placeholder="Université Exemple"
            />
          </div>

          <div style={{ gridColumn: '1 / span 2', fontSize: 12, color: 'var(--text-muted)', marginTop: -4 }}>
            Cette identité est utilisée pour les emails académiques et administratifs hors inscription. Les emails d'inscription restent envoyés via campusgenuc@gmail.com.
          </div>

          <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2', marginTop: 16 }}>
            💾 Enregistrer les paramètres
          </button>
        </form>
      </div>
    </div>
  );
}