// src/pages/admin/FilieresGestion.jsx
// Gestion avancée des filières avec CRUD et toggle inscriptions
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/axios';
import { DOCUMENTS_CATALOGUE, DOCUMENTS_PAR_DEFAUT, parseDocumentsRequis } from '../../utils/documentsInscription';
import '../Dashboard.css';

// État « documents » du formulaire : { [key]: { inclus, obligatoire } }
const docsVersEtat = (liste) => {
  const etat = {};
  DOCUMENTS_CATALOGUE.forEach(c => {
    const entree = (liste || []).find(d => d.key === c.key);
    etat[c.key] = { inclus: !!entree, obligatoire: !!entree?.obligatoire };
  });
  return etat;
};

const FORM_VIDE = {
  nom: '',
  code: '',
  description: '',
  niveau: 'LICENCE',
  dureeAnnees: 3,
  creditsTotal: 180,
  conditionsAdmission: '',
  testAdmissionRequis: false,
};

export default function FilieresGestion() {
  const { departementId } = useParams();
  const [departement, setDepartement] = useState(null);
  const [filieres, setFilieres] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editionId, setEditionId] = useState(null);
  const [form, setForm] = useState(FORM_VIDE);
  const [docs, setDocs] = useState(() => docsVersEtat(DOCUMENTS_PAR_DEFAUT));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [desactiverModal, setDesactiverModal] = useState({ open: false, id: null, actif: true });

  const niveaux = ['LICENCE', 'MASTER', 'DOCTORAT', 'CYCLE_COURT', 'SPECIALISATION'];

  // Chargement initial
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const deptRes = await api.get(`/api/departements/public/${departementId}`);
        setDepartement(deptRes.data);
        await rechargerFilieres();
      } catch (err) {
        setError('Erreur lors du chargement des données');
        setFilieres([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [departementId]);

  // Rechargement des filières
  const rechargerFilieres = useCallback(async () => {
    try {
      const res = await api.get(`/api/departements/public/${departementId}/filieres`);
      setFilieres(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError('Erreur lors du rechargement des filières');
    }
  }, [departementId]);

  // Soumission (ajout ou modification)
  const ajouterOuModifierFiliere = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const documentsRequis = JSON.stringify(
      Object.entries(docs)
        .filter(([, v]) => v.inclus)
        .map(([key, v]) => ({ key, obligatoire: v.obligatoire }))
    );
    try {
      if (editionId) {
        // actif / inscriptionsOuvertes doivent accompagner le PUT : le backend
        // recopie ces booléens depuis le corps, les omettre les remettrait à false.
        const existante = filieres.find(f => f.id === editionId);
        await api.put(`/api/filieres/${editionId}`, {
          ...form,
          documentsRequis,
          actif: existante?.actif ?? true,
          inscriptionsOuvertes: existante?.inscriptionsOuvertes ?? true,
        });
        setMessage('✅ Filière modifiée avec succès');
      } else {
        await api.post(`/api/departements/${departementId}/filieres`, { ...form, documentsRequis });
        setMessage('✅ Filière ajoutée avec succès');
      }
      setShowForm(false);
      setEditionId(null);
      setForm(FORM_VIDE);
      setDocs(docsVersEtat(DOCUMENTS_PAR_DEFAUT));
      await rechargerFilieres();
    } catch (err) {
      setError(err.response?.data?.erreur || err.response?.data?.message || '❌ Erreur lors de l\'opération');
    }
  };

  // Basculer l'ouverture des inscriptions
  const toggleInscriptions = async (id, currentStatus) => {
    try {
      await api.patch(`/api/filieres/${id}/toggle-inscriptions`);
      setMessage(`Inscriptions ${currentStatus ? 'fermées' : 'ouvertes'} avec succès`);
      await rechargerFilieres();
    } catch (err) {
      setError('Erreur lors du changement de statut');
    }
  };

  // Désactiver / réactiver une filière (toggle du statut actif)
  const desactiverFiliere = (id, actif) => setDesactiverModal({ open: true, id, actif });

  const confirmerDesactiver = async () => {
    const { id, actif } = desactiverModal;
    setDesactiverModal({ open: false, id: null, actif: true });
    try {
      // /api/filieres/{id}/activer bascule le statut actif (toggle) ; il n'existe
      // pas de route dédiée "désactiver" côté backend.
      await api.patch(`/api/filieres/${id}/activer`);
      setMessage(actif ? '✅ Filière désactivée' : '✅ Filière réactivée');
      await rechargerFilieres();
    } catch (err) {
      setError(`Erreur lors de la ${actif ? 'désactivation' : 'réactivation'}`);
    }
  };

  // Pré-remplir le formulaire pour l'édition
  const handleEdit = (filiere) => {
    setEditionId(filiere.id);
    setForm({
      nom: filiere.nom,
      code: filiere.code || '',
      description: filiere.description || '',
      niveau: filiere.niveau,
      dureeAnnees: filiere.dureeAnnees,
      creditsTotal: filiere.creditsTotal,
      conditionsAdmission: filiere.conditionsAdmission || '',
      testAdmissionRequis: !!filiere.testAdmissionRequis,
    });
    setDocs(docsVersEtat(parseDocumentsRequis(filiere.documentsRequis) || DOCUMENTS_PAR_DEFAUT));
    setShowForm(true);
  };

  // Annuler le formulaire
  const annulerFormulaire = () => {
    setShowForm(false);
    setEditionId(null);
    setForm(FORM_VIDE);
    setDocs(docsVersEtat(DOCUMENTS_PAR_DEFAUT));
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📖 Filières - {departement?.nom}</h1>
          <p className="page-sub">Gestion des filières d'études</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annuler' : '➕ Nouvelle filière'}
        </button>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur" onClick={() => setError('')}>{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">{editionId ? 'Modifier' : 'Ajouter'} une filière</h2>
          <form onSubmit={ajouterOuModifierFiliere} className="form-grid">
            <div className="form-group">
              <label>Nom *</label>
              <input value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Code</label>
              <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Niveau *</label>
              <select value={form.niveau} onChange={e => setForm({...form, niveau: e.target.value})}>
                {niveaux.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Durée (années)</label>
              <input type="number" value={form.dureeAnnees} onChange={e => setForm({...form, dureeAnnees: parseInt(e.target.value)})} />
            </div>
            <div className="form-group">
              <label>Crédits total</label>
              <input type="number" value={form.creditsTotal} onChange={e => setForm({...form, creditsTotal: parseInt(e.target.value)})} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows="3" />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Exigences d'admission (affichées publiquement)</label>
              <textarea
                value={form.conditionsAdmission}
                onChange={e => setForm({...form, conditionsAdmission: e.target.value})}
                rows="3"
                placeholder={"Ex : Diplôme d'État avec 60% minimum\nSection scientifique exigée\nTest d'admission en mathématiques"}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                Une exigence par ligne. Les candidats les verront sur la fiche publique de la filière et dans le formulaire d'inscription.
              </small>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label
                title="Tout candidat à cette filière devra réussir le test d'admission avant validation, même avec un bon diplôme."
                style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: 10, padding: '12px 14px' }}
              >
                <input
                  type="checkbox"
                  checked={!!form.testAdmissionRequis}
                  onChange={e => setForm({ ...form, testAdmissionRequis: e.target.checked })}
                  style={{ marginTop: 3 }}
                />
                <span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>📝 Exiger un test d'admission</span>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                    Si coché, <strong>tous</strong> les candidats de cette filière devront réussir le test d'admission avant validation
                    (en plus de la règle automatique appliquée aux candidats ayant moins de 60&nbsp;% au diplôme d'État).
                  </span>
                </span>
              </label>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Documents à téléverser lors de l'inscription (affichés publiquement)</label>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: '10px 14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 6 }}>
                {DOCUMENTS_CATALOGUE.map(c => {
                  const d = docs[c.key];
                  return (
                    <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 1, minWidth: 0 }}>
                        <input
                          type="checkbox"
                          checked={d.inclus}
                          onChange={e => setDocs(prev => ({ ...prev, [c.key]: { ...prev[c.key], inclus: e.target.checked } }))}
                        />
                        <span style={{ fontSize: 13, color: d.inclus ? 'var(--text-primary)' : 'var(--text-muted)' }}>{c.label}</span>
                      </label>
                      <label
                        title="Le candidat ne pourra pas soumettre son dossier sans ce document"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: d.inclus ? 'pointer' : 'not-allowed', opacity: d.inclus ? 1 : 0.4, flexShrink: 0 }}
                      >
                        <input
                          type="checkbox"
                          disabled={!d.inclus}
                          checked={d.obligatoire}
                          onChange={e => setDocs(prev => ({ ...prev, [c.key]: { ...prev[c.key], obligatoire: e.target.checked } }))}
                        />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Obligatoire</span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 10 }}>
              <button type="button" className="btn-outline" onClick={annulerFormulaire}>Annuler</button>
              <button type="submit" className="btn-primary">
                {editionId ? '💾 Modifier' : '💾 Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h2 className="card-title">Filières existantes ({filieres.length})</h2>
        {filieres.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
            Aucune filière. Cliquez sur "Nouvelle filière" pour commencer.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
            {filieres.map(f => (
              <div key={f.id} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="uni-code">{f.code || '—'}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{f.nom}</div>
                  </div>
                  <span className={`badge ${f.actif ? 'badge-success' : 'badge-danger'}`}>
                    {f.niveau}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  📅 {f.dureeAnnees} ans • 🎓 {f.creditsTotal} crédits
                </div>
                {f.description && (
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>{f.description.substring(0, 100)}...</p>
                )}
                <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <span className={`badge ${f.inscriptionsOuvertes ? 'badge-success' : 'badge-danger'}`}>
                    {f.inscriptionsOuvertes ? 'Inscriptions ouvertes' : 'Inscriptions fermées'}
                  </span>
                  {f.testAdmissionRequis && (
                    <span className="badge badge-warning" title="Cette filière exige un test d'admission">
                      📝 Test d'admission
                    </span>
                  )}
                  <button
                    className="btn-outline"
                    style={{ fontSize: 11, padding: '4px 12px' }}
                    onClick={() => toggleInscriptions(f.id, f.inscriptionsOuvertes)}
                  >
                    {f.inscriptionsOuvertes ? 'Fermer' : 'Ouvrir'}
                  </button>
                  <button
                    className="btn-outline"
                    style={{ fontSize: 11, padding: '4px 12px' }}
                    onClick={() => handleEdit(f)}
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    className={f.actif ? 'btn-danger' : 'btn-outline'}
                    style={{ fontSize: 11, padding: '4px 12px' }}
                    onClick={() => desactiverFiliere(f.id, f.actif)}
                  >
                    {f.actif ? '🗑️ Désactiver' : '✅ Réactiver'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {desactiverModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 380, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>
              {desactiverModal.actif ? '🗑️ Désactiver la filière' : '✅ Réactiver la filière'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 18 }}>
              {desactiverModal.actif
                ? 'Désactiver cette filière ? Les nouvelles inscriptions seront bloquées.'
                : 'Réactiver cette filière ? Elle redeviendra visible et accessible aux inscriptions.'}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setDesactiverModal({ open: false, id: null, actif: true })}>Annuler</button>
              <button className={desactiverModal.actif ? 'btn-danger' : 'btn-primary'} onClick={confirmerDesactiver}>
                {desactiverModal.actif ? 'Désactiver' : 'Réactiver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}