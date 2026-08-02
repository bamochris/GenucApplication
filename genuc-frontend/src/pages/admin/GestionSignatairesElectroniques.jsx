// src/pages/admin/GestionSignatairesElectroniques.jsx
/**
 * 🖋️ Signataires électroniques de l'université
 * Chaque université peut enregistrer plusieurs responsables habilités à signer
 * (recteur, doyen, secrétaire académique...) et choisir, pour chaque type de document
 * (attestation, diplôme, lettre d'acceptation...), quel signataire s'applique par défaut.
 */
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import signataireService from '../../services/signataireService';
import toast from 'react-hot-toast';
import '../Dashboard.css';

const TYPES_DOCUMENT = [
  { value: 'ATTESTATION', label: 'Attestations' },
  { value: 'DIPLOME', label: 'Diplômes' },
  { value: 'LETTRE_ACCEPTATION', label: "Lettres d'acceptation" },
  { value: 'RELEVE_NOTES', label: 'Relevés de notes' },
  { value: 'BULLETIN', label: 'Bulletins' },
];

const ROLES_SUGGERES = [
  'RECTEUR', 'DOYEN', 'CHEF_DEPARTEMENT', 'SECRETAIRE_ACADEMIQUE', 'ADMIN_UNIVERSITE',
];

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

export default function GestionSignatairesElectroniques() {
  const { user } = useAuth();
  const universiteId = user?.universiteId;

  const [signataires, setSignataires] = useState([]);
  const [regles, setRegles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ nomComplet: '', fonction: '', roleRattache: '', signatureImage: '' });
  const [saving, setSaving] = useState(false);

  const charger = useCallback(async () => {
    if (!universiteId) return;
    setLoading(true);
    try {
      const [sigRes, reglesRes] = await Promise.all([
        signataireService.lister(universiteId),
        signataireService.listerRegles(universiteId),
      ]);
      setSignataires(sigRes.data);
      setRegles(reglesRes.data);
    } catch (err) {
      toast.error('Erreur lors du chargement des signataires');
    } finally {
      setLoading(false);
    }
  }, [universiteId]);

  useEffect(() => {
    charger();
  }, [charger]);

  const ouvrirNouveau = () => {
    setEditingId(null);
    setForm({ nomComplet: '', fonction: '', roleRattache: '', signatureImage: '' });
    setShowForm(true);
  };

  const ouvrirEdition = (s) => {
    setEditingId(s.id);
    setForm({
      nomComplet: s.nomComplet, fonction: s.fonction,
      roleRattache: s.roleRattache || '', signatureImage: s.signatureImage || '',
    });
    setShowForm(true);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setForm((f) => ({ ...f, signatureImage: base64 }));
    } catch {
      toast.error("Erreur lors de la lecture de l'image");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nomComplet.trim() || !form.fonction.trim()) {
      toast.error('Nom complet et fonction sont obligatoires');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, roleRattache: form.roleRattache || null };
      if (editingId) {
        await signataireService.modifier(editingId, payload);
        toast.success('Signataire mis à jour');
      } else {
        await signataireService.creer(universiteId, payload);
        toast.success('Signataire ajouté');
      }
      setShowForm(false);
      charger();
    } catch (err) {
      toast.error(err.response?.data?.erreur || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActif = async (s) => {
    try {
      await signataireService.modifier(s.id, { actif: !s.actif });
      toast.success(s.actif ? 'Signataire désactivé' : 'Signataire réactivé');
      charger();
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleSupprimer = async (id) => {
    if (!window.confirm('Supprimer ce signataire ? Les documents déjà signés conservent leur signature.')) return;
    try {
      await signataireService.supprimer(id);
      toast.success('Signataire supprimé');
      charger();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleRegleChange = async (typeDocument, signataireId) => {
    if (!signataireId) return;
    try {
      await signataireService.definirRegle(universiteId, typeDocument, signataireId);
      toast.success('Règle mise à jour');
      charger();
    } catch (err) {
      toast.error(err.response?.data?.erreur || 'Erreur lors de la mise à jour de la règle');
    }
  };

  const regleParType = (type) => regles.find((r) => r.typeDocument === type);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>🖋️ Signataires électroniques</h1>
        <p className="text-muted">
          Gérez les responsables habilités à signer électroniquement les documents officiels de votre université.
        </p>
      </div>

      <div className="dashboard-toolbar" style={{ marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={ouvrirNouveau}>➕ Ajouter un signataire</button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Chargement...</span></div>
        </div>
      ) : (
        <>
          <div className="table-responsive" style={{ marginBottom: 32 }}>
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Signature</th>
                  <th>Nom</th>
                  <th>Fonction</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {signataires.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-muted py-4">Aucun signataire enregistré</td></tr>
                ) : signataires.map((s) => (
                  <tr key={s.id}>
                    <td>
                      {s.signatureImage
                        ? <img src={s.signatureImage} alt="Signature" style={{ height: 32, background: 'var(--bg-secondary)', borderRadius: 4 }} />
                        : <span className="text-muted">—</span>}
                    </td>
                    <td>{s.nomComplet}</td>
                    <td>{s.fonction}</td>
                    <td>
                      <span className={`badge ${s.actif ? 'badge-success' : 'badge-neutral'}`}>
                        {s.actif ? '🟢 Actif' : '⚪ Inactif'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-info" onClick={() => ouvrirEdition(s)}>✏️</button>
                        <button className="btn btn-sm btn-secondary" onClick={() => handleToggleActif(s)}>
                          {s.actif ? '⏸️' : '▶️'}
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleSupprimer(s.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 style={{ marginBottom: 12 }}>Signataire par défaut selon le type de document</h3>
          <p className="text-muted" style={{ marginTop: 0 }}>
            Utilisé automatiquement à la signature — reste modifiable au cas par cas si besoin.
          </p>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr><th>Type de document</th><th>Signataire par défaut</th></tr>
              </thead>
              <tbody>
                {TYPES_DOCUMENT.map((t) => {
                  const regle = regleParType(t.value);
                  return (
                    <tr key={t.value}>
                      <td>{t.label}</td>
                      <td>
                        <select
                          className="form-control"
                          value={regle?.signataireId || ''}
                          onChange={(e) => handleRegleChange(t.value, e.target.value)}
                          style={{ maxWidth: 320 }}
                        >
                          <option value="">— Non configuré (aucune signature) —</option>
                          {signataires.filter((s) => s.actif).map((s) => (
                            <option key={s.id} value={s.id}>{s.nomComplet} ({s.fonction})</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showForm && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1050
        }}>
          <div className="modal-content" style={{
            background: 'var(--bg-card)', borderRadius: 12, padding: 24, maxWidth: 500, width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0 }}>{editingId ? '✏️ Modifier le signataire' : '➕ Nouveau signataire'}</h2>
              <button className="btn-close" onClick={() => setShowForm(false)}>✕</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Nom complet *</label>
                <input
                  className="form-control"
                  value={form.nomComplet}
                  onChange={(e) => setForm({ ...form, nomComplet: e.target.value })}
                  placeholder="Ex : Prof. Jean MUKENDI"
                  required
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Fonction *</label>
                <input
                  className="form-control"
                  value={form.fonction}
                  onChange={(e) => setForm({ ...form, fonction: e.target.value })}
                  placeholder="Ex : Recteur, Doyen de la Faculté des Sciences..."
                  required
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Rôle rattaché (optionnel)</label>
                <select
                  className="form-control"
                  value={form.roleRattache}
                  onChange={(e) => setForm({ ...form, roleRattache: e.target.value })}
                  style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
                >
                  <option value="">—</option>
                  {ROLES_SUGGERES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Image de la signature (PNG/JPG)</label>
                <input type="file" accept="image/*" onChange={handleImageChange} />
                {form.signatureImage && (
                  <img src={form.signatureImage} alt="Aperçu" style={{ height: 50, marginTop: 8, background: 'var(--bg-secondary)', borderRadius: 4 }} />
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement...' : '💾 Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
