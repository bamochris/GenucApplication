// src/components/superadmin/ModifierUniversiteModal.jsx
// Formulaire de modification d'une université déjà créée : informations
// générales, adresse, contact, autorité (recteur) et logo. Les informations
// d'une université pouvant changer à tout moment (nouveau recteur, nouveau
// logo, déménagement...), cette boîte de dialogue permet de tout ajuster
// sans repasser par l'assistant de création. Protégée en amont par
// PasswordConfirmModal (voir SuperAdminDashboard.jsx).
import { useState } from 'react';
import api from '../../api/axios';
import { resolveFileUrl } from '../../utils/fileUrl';
import useDraggableDialog from '../../hooks/useDraggableDialog';
import './ModifierUniversiteModal.css';

const CHAMPS_GENERAUX = [
  { name: 'nom', label: 'Nom de l\'université', required: true },
  { name: 'code', label: 'Code / Sigle', required: true },
  { name: 'typeEtablissement', label: 'Type d\'établissement', placeholder: 'Université publique, privée, institut supérieur...' },
  { name: 'anneeFondation', label: 'Année de fondation', type: 'number' },
  { name: 'devise', label: 'Devise', placeholder: 'USD, CDF, USD/CDF' },
];

const CHAMPS_ADRESSE = [
  { name: 'adresse', label: 'Adresse' },
  { name: 'ville', label: 'Ville', required: true },
  { name: 'province', label: 'Province' },
  { name: 'commune', label: 'Commune' },
];

const CHAMPS_CONTACT = [
  { name: 'telephone', label: 'Téléphone' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'siteWeb', label: 'Site web' },
];

const CHAMPS_AUTORITE = [
  { name: 'recteurNom', label: 'Nom du recteur' },
  { name: 'recteurPostnom', label: 'Post-nom du recteur' },
  { name: 'recteurPrenom', label: 'Prénom du recteur' },
  { name: 'recteurTelephone', label: 'Téléphone du recteur' },
  { name: 'recteurEmail', label: 'Email du recteur', type: 'email' },
];

export default function ModifierUniversiteModal({ universite, onClose, onSaved }) {
  const [form, setForm] = useState(() => {
    const init = {};
    [...CHAMPS_GENERAUX, ...CHAMPS_ADRESSE, ...CHAMPS_CONTACT, ...CHAMPS_AUTORITE].forEach(c => {
      init[c.name] = universite[c.name] ?? '';
    });
    init.description = universite.description || '';
    return init;
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(resolveFileUrl(universite.logo));
  const [saving, setSaving] = useState(false);
  const [erreur, setErreur] = useState('');
  const { panelStyle, dragHandleProps } = useDraggableDialog();

  const set = (name, value) => setForm(f => ({ ...f, [name]: value }));

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom.trim() || !form.code.trim() || !form.ville.trim()) {
      setErreur('Nom, code et ville sont requis.');
      return;
    }
    setSaving(true);
    setErreur('');
    try {
      if (logoFile) {
        const fd = new FormData();
        fd.append('logo', logoFile);
        await api.post(`/api/universites/${universite.id}/logo`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      const payload = { ...form };
      if (payload.anneeFondation) payload.anneeFondation = parseInt(payload.anneeFondation, 10);
      await api.put(`/api/universites/${universite.id}`, payload);
      onSaved();
      onClose();
    } catch (err) {
      setErreur(err.response?.data?.message || err.response?.data?.erreur || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const renderChamps = (champs) => (
    <div className="mu-grid">
      {champs.map(c => (
        <div className="form-group" key={c.name}>
          <label htmlFor={`mu-${c.name}`}>{c.label}{c.required && ' *'}</label>
          <input
            id={`mu-${c.name}`}
            type={c.type || 'text'}
            placeholder={c.placeholder}
            value={form[c.name]}
            onChange={(e) => set(c.name, e.target.value)}
            disabled={saving}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="mu-overlay" onClick={onClose} role="presentation">
      <div
        className="mu-dialog dialog-resizable"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mu-title"
        onClick={(e) => e.stopPropagation()}
        style={panelStyle}
      >
        <div className="mu-header dialog-draggable-handle" {...dragHandleProps}>
          <h3 id="mu-title">✏️ Modifier {universite.nom}</h3>
          <button type="button" className="mu-close" onClick={onClose} aria-label="Fermer">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mu-body">
            {erreur && <div className="alert-erreur">{erreur}</div>}

            <div className="mu-section">
              <h4>Logo</h4>
              <div className="mu-logo-row">
                <div className="mu-logo-preview">
                  {logoPreview ? <img src={logoPreview} alt="Logo" /> : <span>Aucun logo</span>}
                </div>
                <input type="file" accept="image/*" onChange={handleLogoChange} disabled={saving} />
              </div>
            </div>

            <div className="mu-section">
              <h4>Informations générales</h4>
              {renderChamps(CHAMPS_GENERAUX)}
              <div className="form-group">
                <label htmlFor="mu-description">Description</label>
                <textarea
                  id="mu-description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="mu-section">
              <h4>Adresse</h4>
              {renderChamps(CHAMPS_ADRESSE)}
            </div>

            <div className="mu-section">
              <h4>Contact</h4>
              {renderChamps(CHAMPS_CONTACT)}
            </div>

            <div className="mu-section">
              <h4>Autorité (recteur)</h4>
              {renderChamps(CHAMPS_AUTORITE)}
            </div>
          </div>

          <div className="mu-footer">
            <button type="button" className="btn-outline" onClick={onClose} disabled={saving}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Appliquer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
