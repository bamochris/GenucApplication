// src/pages/admin/GestionAttestations.jsx
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../../pages/Dashboard.css';

// ═══ Aligné avec l'énumération du backend ═══
const TYPES_ATTESTATION = [
  { value: 'INSCRIPTION', label: '📋 Attestation d\'inscription' },
  { value: 'FREQUENTATION', label: '📋 Attestation de fréquentation' },
  { value: 'REUSSITE', label: '🏆 Attestation de réussite' },
  { value: 'SCOLARITE', label: '📋 Attestation de scolarité' },
  { value: 'BOURSE', label: '💰 Attestation de bourse' },
  { value: 'CONDUITE', label: '✅ Attestation de bonne conduite' },
  { value: 'PHYSIQUE', label: '🏥 Attestation d\'aptitude physique' },
  { value: 'DIPLOME', label: '🎓 Attestation de diplôme' },
  { value: 'AUTRE', label: '📄 Autre' },
];

export default function GestionAttestations() {
  const { user } = useAuth();
  const [inscriptions, setInscriptions] = useState([]);
  const [selectedInscription, setSelectedInscription] = useState('');
  const [attestations, setAttestations] = useState([]);
  const [documentConfigs, setDocumentConfigs] = useState([]);
  const [fraisOptions, setFraisOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [configEditId, setConfigEditId] = useState(null);
  const [configSaving, setConfigSaving] = useState(false);
  const [rejetModal, setRejetModal] = useState({ open: false, id: null, motif: '' });
  const [emailModal, setEmailModal] = useState({ open: false, id: null, email: '' });
  const [form, setForm] = useState({
    inscriptionId: '',
    configCode: '',
    type: 'INSCRIPTION',
    motif: '',
    contenu: ''
  });
  const [configForm, setConfigForm] = useState({
    code: '',
    libelle: '',
    description: '',
    typeSource: 'ATTESTATION',
    attestationType: 'SCOLARITE',
    fraisCodeRequis: '',
    modeleContenu: '',
    actif: true,
    ordreAffichage: 0
  });

  const universiteId = user?.universiteId;
  const documentsAttestation = useMemo(
    () => documentConfigs.filter((doc) => doc.actif && doc.typeSource === 'ATTESTATION' && doc.attestationType),
    [documentConfigs]
  );

  // ─── Chargement des inscriptions ──────────────────────────────
  useEffect(() => {
    if (universiteId) {
      loadInscriptions();
      loadDocumentConfigs();
      loadFraisOptions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [universiteId]);

  const loadInscriptions = async () => {
    try {
      const res = await api.get(`/api/inscriptions/universite/${universiteId}`);
      setInscriptions(res.data);
    } catch (err) {
      setError('Erreur chargement des inscriptions');
    }
  };

  const loadDocumentConfigs = async () => {
    try {
      const res = await api.get('/api/documents-officiels/admin/configurations');
      setDocumentConfigs(res.data || []);
    } catch (err) {
      setError('Erreur chargement des documents configurés');
    }
  };

  const loadFraisOptions = async () => {
    try {
      const res = await api.get('/api/tachpay/admin/frais');
      setFraisOptions(res.data?.frais || []);
    } catch {
      setFraisOptions([]);
    }
  };

  // ─── Chargement des attestations d'un étudiant ────────────────
  const loadAttestations = async (inscriptionId) => {
    if (!inscriptionId) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/attestations/etudiant/${inscriptionId}`);
      setAttestations(res.data);
    } catch (err) {
      setError('Erreur chargement des attestations');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInscription = (e) => {
    const id = e.target.value;
    setSelectedInscription(id);
    setForm((prev) => ({ ...prev, inscriptionId: id }));
    if (id) loadAttestations(id);
    else setAttestations([]);
  };

  const applyConfigToForm = (code) => {
    const config = documentConfigs.find((doc) => doc.code === code);
    setForm((prev) => ({
      ...prev,
      configCode: code,
      type: config?.attestationType || prev.type,
      motif: config?.libelle || prev.motif,
      contenu: config?.modeleContenu || prev.contenu
    }));
  };

  // ─── Création d'une attestation (admin → directement validée) ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const selectedConfig = documentConfigs.find((doc) => doc.code === form.configCode);
      const payload = {
        inscriptionId: parseInt(form.inscriptionId),
        type: form.type,
        motif: form.motif,
        demandeurId: user.id,
        demandeurNom: user.nomComplet || user.email,
        codeDocument: selectedConfig?.code || null,
        libelleDocument: selectedConfig?.libelle || null,
        // Optionnel : contenu personnalisé
        contenuPersonnalise: form.contenu || null
      };

      // L'admin crée directement une attestation validée
      await api.post('/api/attestations/admin/creer', payload);
      setMessage('✅ Attestation créée et validée avec succès');
      setShowForm(false);
      setForm((prev) => ({ ...prev, configCode: '', type: 'INSCRIPTION', motif: '', contenu: '' }));
      loadAttestations(selectedInscription);
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de la création');
    }
  };

  const saveConfig = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setConfigSaving(true);
    try {
      const payload = {
        ...configForm,
        code: configForm.code.trim().toUpperCase(),
        fraisCodeRequis: configForm.fraisCodeRequis.trim().toUpperCase()
      };
      if (configEditId) {
        await api.put(`/api/documents-officiels/admin/configurations/${configEditId}`, payload);
        setMessage('✅ Document officiel mis à jour');
      } else {
        await api.post('/api/documents-officiels/admin/configurations', payload);
        setMessage('✅ Document officiel configuré');
      }
      setShowConfigForm(false);
      setConfigEditId(null);
      setConfigForm({
        code: '',
        libelle: '',
        description: '',
        typeSource: 'ATTESTATION',
        attestationType: 'SCOLARITE',
        fraisCodeRequis: '',
        modeleContenu: '',
        actif: true,
        ordreAffichage: 0
      });
      loadDocumentConfigs();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de la sauvegarde du document');
    } finally {
      setConfigSaving(false);
    }
  };

  const editConfig = (config) => {
    setConfigEditId(config.id);
    setConfigForm({
      code: config.code || '',
      libelle: config.libelle || '',
      description: config.description || '',
      typeSource: config.typeSource || 'ATTESTATION',
      attestationType: config.attestationType || 'SCOLARITE',
      fraisCodeRequis: config.fraisCodeRequis || '',
      modeleContenu: config.modeleContenu || '',
      actif: config.actif !== false,
      ordreAffichage: config.ordreAffichage || 0
    });
    setShowConfigForm(true);
  };

  const toggleConfigStatus = async (config) => {
    try {
      await api.patch(`/api/documents-officiels/admin/configurations/${config.id}/statut`, {
        actif: !config.actif
      });
      setMessage(`✅ Document ${config.actif ? 'désactivé' : 'activé'}`);
      loadDocumentConfigs();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors du changement de statut');
    }
  };

  // ─── Validation (si l'attestation est en attente) ─────────────
  const validerAttestation = async (id) => {
    try {
      await api.patch(`/api/attestations/${id}/valider`, {
        valideurId: user.id,
        valideurNom: user.nomComplet || user.email
      });
      setMessage('✅ Attestation validée');
      loadAttestations(selectedInscription);
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de la validation');
    }
  };

  const rejeterAttestation = (id) => setRejetModal({ open: true, id, motif: '' });

  const confirmerRejet = async () => {
    if (!rejetModal.motif.trim()) { setError('Veuillez saisir un motif.'); return; }
    const id = rejetModal.id;
    setRejetModal({ open: false, id: null, motif: '' });
    try {
      await api.patch(`/api/attestations/${id}/rejeter`, { motif: rejetModal.motif });
      setMessage('❌ Attestation rejetée');
      loadAttestations(selectedInscription);
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors du rejet');
    }
  };

  const telechargerPdf = async (id) => {
    try {
      const response = await api.get(`/api/attestations/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attestation_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Erreur lors du téléchargement');
    }
  };

  const envoyerEmail = (id) => setEmailModal({ open: true, id, email: '' });

  const confirmerEnvoi = async () => {
    if (!emailModal.email.trim()) { setError('Veuillez saisir une adresse email.'); return; }
    const id = emailModal.id;
    setEmailModal({ open: false, id: null, email: '' });
    try {
      await api.post(`/api/attestations/${id}/envoyer-email`, { email: emailModal.email });
      setMessage('✅ Attestation envoyée par email');
    } catch (err) {
      setError("Erreur lors de l'envoi");
    }
  };

  // ─── Affichage du statut ──────────────────────────────────────
  const getStatutBadge = (statut) => {
    const map = {
      'EN_ATTENTE': 'badge-warning',
      'VALIDE': 'badge-success',
      'REJETE': 'badge-danger',
      'EMISE': 'badge-success'
    };
    return map[statut] || 'badge-neutral';
  };

  const getStatutLabel = (statut) => {
    const map = {
      'EN_ATTENTE': '⏳ En attente',
      'VALIDE': '✅ Validée',
      'REJETE': '❌ Rejetée',
      'EMISE': '📄 Émise'
    };
    return map[statut] || statut;
  };

  const getTypeLabel = (type) => {
    const found = TYPES_ATTESTATION.find(t => t.value === type);
    return found ? found.label : type;
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📜 Gestion des attestations</h1>
          <p className="page-sub">Créez, validez et gérez les attestations ainsi que les documents officiels payants</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn-outline" onClick={() => setShowConfigForm(!showConfigForm)}>
            {showConfigForm ? 'Fermer le catalogue' : '🗂️ Gérer les documents'}
          </button>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : '➕ Nouvelle attestation'}
          </button>
        </div>
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 className="card-title">🗂️ Catalogue des documents officiels</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '6px 0 0' }}>
              Lie chaque document à un type d'attestation ou au relevé, et au frais TachPay à payer avant délivrance.
            </p>
          </div>
          <button className="btn-outline" onClick={() => setShowConfigForm(!showConfigForm)}>
            {showConfigForm ? 'Masquer le formulaire' : '➕ Ajouter un document'}
          </button>
        </div>

        {showConfigForm && (
          <form onSubmit={saveConfig} className="form-grid" style={{ marginTop: 18 }}>
            <div className="form-group">
              <label>Code interne *</label>
              <input
                value={configForm.code}
                onChange={(e) => setConfigForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="Ex: ATTESTATION_STAGE"
                required
              />
            </div>
            <div className="form-group">
              <label>Libellé étudiant *</label>
              <input
                value={configForm.libelle}
                onChange={(e) => setConfigForm((prev) => ({ ...prev, libelle: e.target.value }))}
                placeholder="Ex: Attestation de stage"
                required
              />
            </div>
            <div className="form-group">
              <label>Source *</label>
              <select
                value={configForm.typeSource}
                onChange={(e) => setConfigForm((prev) => ({ ...prev, typeSource: e.target.value }))}
              >
                <option value="ATTESTATION">Attestation</option>
                <option value="RELEVE">Relevé</option>
              </select>
            </div>
            <div className="form-group">
              <label>Type d'attestation</label>
              <select
                value={configForm.attestationType}
                onChange={(e) => setConfigForm((prev) => ({ ...prev, attestationType: e.target.value }))}
                disabled={configForm.typeSource !== 'ATTESTATION'}
              >
                {TYPES_ATTESTATION.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Code frais requis</label>
              <input
                list="tachpay-frais-codes"
                value={configForm.fraisCodeRequis}
                onChange={(e) => setConfigForm((prev) => ({ ...prev, fraisCodeRequis: e.target.value.toUpperCase() }))}
                placeholder="Ex: ATTESTATION_FREQUENTATION"
              />
              <datalist id="tachpay-frais-codes">
                {fraisOptions.map((frais) => (
                  <option key={frais.id || frais.code} value={frais.code}>
                    {frais.libelle}
                  </option>
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label>Ordre d'affichage</label>
              <input
                type="number"
                min="0"
                value={configForm.ordreAffichage}
                onChange={(e) => setConfigForm((prev) => ({ ...prev, ordreAffichage: e.target.value }))}
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Description</label>
              <textarea
                rows="3"
                value={configForm.description}
                onChange={(e) => setConfigForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Texte affiché à l'étudiant dans le portail."
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Modèle de contenu</label>
              <textarea
                rows="4"
                value={configForm.modeleContenu}
                onChange={(e) => setConfigForm((prev) => ({ ...prev, modeleContenu: e.target.value }))}
                placeholder="Texte personnalisé utilisé lors de la génération du document."
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={configForm.actif}
                  onChange={(e) => setConfigForm((prev) => ({ ...prev, actif: e.target.checked }))}
                />
                Document actif
              </label>
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }} disabled={configSaving}>
              {configSaving ? '⏳ Sauvegarde...' : configEditId ? '💾 Mettre à jour le document' : '💾 Enregistrer le document'}
            </button>
          </form>
        )}

        <div style={{ overflowX: 'auto', marginTop: 18 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Libellé</th>
                <th>Source</th>
                <th>Type</th>
                <th>Frais</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documentConfigs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    Aucun document configuré pour cette université.
                  </td>
                </tr>
              ) : documentConfigs.map((config) => (
                <tr key={config.id}>
                  <td style={{ fontWeight: 600 }}>{config.code}</td>
                  <td>
                    <div>{config.libelle}</div>
                    {config.description && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{config.description}</div>
                    )}
                  </td>
                  <td>{config.typeSource}</td>
                  <td>{config.attestationType || 'RELEVE'}</td>
                  <td>{config.fraisCodeRequis || 'Aucun'}</td>
                  <td>
                    <span className={`badge ${config.actif ? 'badge-success' : 'badge-neutral'}`}>
                      {config.actif ? '🟢 Actif' : '⚪ Inactif'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => editConfig(config)}>
                        ✏️ Modifier
                      </button>
                      <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => toggleConfigStatus(config)}>
                        {config.actif ? '⏸️ Désactiver' : '▶️ Activer'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sélection de l'étudiant */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-group">
          <label>Sélectionner un étudiant</label>
          <select value={selectedInscription} onChange={handleSelectInscription}>
            <option value="">-- Choisir un étudiant --</option>
            {inscriptions.map(ins => (
              <option key={ins.id} value={ins.id}>
                {ins.matricule} - {ins.prenom} {ins.nom} ({ins.filiere?.nom})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Formulaire de création (admin) */}
      {showForm && selectedInscription && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 className="card-title">Créer une attestation</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
            L'attestation sera créée directement avec le statut "Validée" et sera prête à être émise.
          </p>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Document configuré (optionnel)</label>
              <select
                value={form.configCode}
                onChange={(e) => applyConfigToForm(e.target.value)}
              >
                <option value="">-- Attestation libre / sans catalogue --</option>
                {documentsAttestation.map((doc) => (
                  <option key={doc.id} value={doc.code}>
                    {doc.libelle} {doc.fraisCodeRequis ? `• frais ${doc.fraisCodeRequis}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Type d'attestation *</label>
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                required
              >
                {TYPES_ATTESTATION.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Motif (optionnel)</label>
              <input
                value={form.motif}
                onChange={e => setForm({ ...form, motif: e.target.value })}
                placeholder="Ex: Pour bourse, pour stage, etc."
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Contenu personnalisé (optionnel)</label>
              <textarea
                value={form.contenu}
                onChange={e => setForm({ ...form, contenu: e.target.value })}
                rows="4"
                placeholder="Laissez vide pour utiliser le contenu généré automatiquement..."
              />
            </div>
            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>
              📄 Générer l'attestation
            </button>
          </form>
        </div>
      )}

      {/* Liste des attestations */}
      <div className="card">
        <h2 className="card-title">
          📋 Attestations 
          {selectedInscription && (
            <span style={{ fontSize: 12, marginLeft: 10, color: 'var(--text-muted)' }}>
              ({inscriptions.find(i => i.id === parseInt(selectedInscription))?.prenom}{' '}
              {inscriptions.find(i => i.id === parseInt(selectedInscription))?.nom})
            </span>
          )}
        </h2>

        {!selectedInscription ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
            Sélectionnez un étudiant pour voir ses attestations.
          </p>
        ) : loading ? (
          <div className="loading">Chargement...</div>
        ) : attestations.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 30 }}>
            Aucune attestation pour cet étudiant.
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>N° Attestation</th>
                <th>Type</th>
                <th>Date demande</th>
                <th>Date émission</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attestations.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600, color: '#185FA5' }}>{a.numeroAttestation}</td>
                  <td>{a.libelleDocument || getTypeLabel(a.type)}</td>
                  <td>{new Date(a.dateDemande).toLocaleDateString('fr-FR')}</td>
                  <td>{a.dateEmission ? new Date(a.dateEmission).toLocaleDateString('fr-FR') : '-'}</td>
                  <td>
                    <span className={`badge ${getStatutBadge(a.statut)}`}>
                      {getStatutLabel(a.statut)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {/* Actions admin si en attente */}
                      {a.statut === 'EN_ATTENTE' && (
                        <>
                          <button
                            className="btn-success"
                            style={{ fontSize: 11, padding: '4px 10px' }}
                            onClick={() => validerAttestation(a.id)}
                          >
                            ✅ Valider
                          </button>
                          <button
                            className="btn-danger"
                            style={{ fontSize: 11, padding: '4px 10px' }}
                            onClick={() => rejeterAttestation(a.id)}
                          >
                            ❌ Rejeter
                          </button>
                        </>
                      )}

                      {/* Téléchargement PDF si validée ou émise */}
                      {(a.statut === 'VALIDE' || a.statut === 'EMISE') && (
                        <button
                          className="btn-outline"
                          style={{ fontSize: 11, padding: '4px 10px' }}
                          onClick={() => telechargerPdf(a.id)}
                        >
                          📥 PDF
                        </button>
                      )}

                      {/* Envoi email si émise */}
                      {a.statut === 'EMISE' && (
                        <button
                          className="btn-outline"
                          style={{ fontSize: 11, padding: '4px 10px' }}
                          onClick={() => envoyerEmail(a.id)}
                        >
                          📧 Email
                        </button>
                      )}

                      {/* Motif de rejet */}
                      {a.statut === 'REJETE' && a.motif && (
                        <span style={{ fontSize: 11, color: '#cc0000' }}>
                          Motif: {a.motif}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {rejetModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 400, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>❌ Motif du rejet</h3>
            <textarea
              rows={4}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
              placeholder="Expliquez la raison du rejet..."
              value={rejetModal.motif}
              onChange={e => setRejetModal(m => ({ ...m, motif: e.target.value }))}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setRejetModal({ open: false, id: null, motif: '' })}>Annuler</button>
              <button className="btn-danger" onClick={confirmerRejet}>Confirmer le rejet</button>
            </div>
          </div>
        </div>
      )}

      {emailModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 28, width: 400, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-primary)' }}>📧 Envoyer par email</h3>
            <input
              type="email"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' }}
              placeholder="adresse@email.com"
              value={emailModal.email}
              onChange={e => setEmailModal(m => ({ ...m, email: e.target.value }))}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setEmailModal({ open: false, id: null, email: '' })}>Annuler</button>
              <button className="btn-primary" onClick={confirmerEnvoi}>Envoyer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}