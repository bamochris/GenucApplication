// src/pages/etudiant/stages/Stages.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../EtudiantDashboard.css';

export default function Stages() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [stage, setStage] = useState(null);
  const [offres, setOffres] = useState([]);
  const [showOffres, setShowOffres] = useState(false);
  const [showFormulaire, setShowFormulaire] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    entreprise: '',
    adresse: '',
    telephone: '',
    responsable: '',
    emailResponsable: '',
    dateDebut: '',
    dateFin: '',
    description: '',
    convention: null,
    rapport: null
  });

  const inscriptionId = user?.inscriptionId;

  useEffect(() => {
    if (!inscriptionId) {
      setError("Aucune inscription trouvée");
      setLoading(false);
      return;
    }
    loadStage();
    loadOffres();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId]);

  const loadStage = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/etudiant/portal/${inscriptionId}/stage`);
      setStage(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setStage(null);
      } else {
        setError(err.response?.data?.erreur || "Erreur de chargement du stage");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadOffres = async () => {
    try {
      const response = await api.get(`/api/etudiant/portal/stages/offres`);
      setOffres(response.data || []);
    } catch (err) {
      console.error('Erreur chargement offres:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setForm({ ...form, [name]: files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setUploading(true);

    if (!form.entreprise || !form.dateDebut || !form.dateFin) {
      setMessage('⚠️ Veuillez remplir tous les champs obligatoires');
      setUploading(false);
      return;
    }

    const formData = new FormData();
    Object.keys(form).forEach(key => {
      if (form[key] !== null && key !== 'convention' && key !== 'rapport') {
        formData.append(key, form[key]);
      }
    });
    if (form.convention) formData.append('convention', form.convention);
    if (form.rapport) formData.append('rapport', form.rapport);
    formData.append('inscriptionId', inscriptionId);

    try {
      await api.post(`/api/etudiant/portal/${inscriptionId}/stage`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('✅ Stage enregistré avec succès ! En attente de validation.');
      setShowFormulaire(false);
      setForm({
        entreprise: '',
        adresse: '',
        telephone: '',
        responsable: '',
        emailResponsable: '',
        dateDebut: '',
        dateFin: '',
        description: '',
        convention: null,
        rapport: null
      });
      loadStage();
    } catch (err) {
      setMessage('❌ Erreur lors de l\'enregistrement : ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleUploadRapport = async (e) => {
    e.preventDefault();
    const fileInput = e.target.rapport;
    const file = fileInput.files[0];

    if (!file) {
      setMessage('⚠️ Veuillez sélectionner un fichier');
      return;
    }

    setUploading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('rapport', file);
    formData.append('stageId', stage.id);

    try {
      await api.post(`/api/etudiant/portal/${inscriptionId}/stage/rapport`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('✅ Rapport de stage uploadé avec succès !');
      loadStage();
    } catch (err) {
      setMessage('❌ Erreur lors de l\'upload : ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
      fileInput.value = '';
    }
  };

  const handlePostuler = async (offreId) => {
    setMessage('');
    try {
      await api.post(`/api/etudiant/portal/stages/postuler/${offreId}`, {
        inscriptionId: parseInt(inscriptionId)
      });
      setMessage('✅ Candidature envoyée avec succès !');
      loadOffres();
    } catch (err) {
      setMessage('❌ Erreur lors de la candidature');
    }
  };

  const handleDownload = (url, nom) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getStatutBadge = (statut) => {
    const map = {
      'EN_ATTENTE': 'badge-warning',
      'VALIDE': 'badge-success',
      'REJETE': 'badge-danger',
      'EN_COURS': 'badge-warning',
      'TERMINE': 'badge-neutral',
      'SUSPENDU': 'badge-danger'
    };
    return map[statut] || 'badge-neutral';
  };

  const getStatutLabel = (statut) => {
    const map = {
      'EN_ATTENTE': '⏳ En attente de validation',
      'VALIDE': '✅ Validé',
      'REJETE': '❌ Rejeté',
      'EN_COURS': '📝 En cours',
      'TERMINE': '✅ Terminé',
      'SUSPENDU': '⛔ Suspendu'
    };
    return map[statut] || statut;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de votre stage...</p>
      </div>
    );
  }

  return (
    <div className="etudiant-dashboard">
      <div className="section-header">
        <h2 className="section-title">🏢 Stages</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" onClick={() => setShowOffres(!showOffres)}>
            📋 Voir les offres
          </button>
          {!stage && (
            <button className="btn-primary" onClick={() => setShowFormulaire(!showFormulaire)}>
              {showFormulaire ? 'Annuler' : '📝 Déclarer un stage'}
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>
          {message}
        </div>
      )}

      {error && <div className="alert-erreur">{error}</div>}

      {/* Offres de stage */}
      {showOffres && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">📋 Offres de stage disponibles</h3>
          {offres.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
              Aucune offre de stage disponible pour le moment.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {offres.map((offre) => (
                <div key={offre.id} style={{
                  padding: '16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{offre.titre}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {offre.entreprise} • {offre.localisation || 'Localisation à définir'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      {offre.dureeSemaines} semaines • {offre.remuneration ? `${offre.remuneration} USD` : 'Non rémunéré'}
                    </div>
                    {offre.description && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                        {offre.description.substring(0, 150)}...
                      </div>
                    )}
                  </div>
                  <button
                    className="btn-primary"
                    style={{ fontSize: 12, padding: '6px 16px' }}
                    onClick={() => handlePostuler(offre.id)}
                    disabled={offre.postule}
                  >
                    {offre.postule ? '✅ Postulé' : '📝 Postuler'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Formulaire de déclaration de stage */}
      {showFormulaire && !stage && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">📝 Déclarer un stage</h3>
          <form onSubmit={handleSubmit} className="form-grid" style={{ marginTop: 16 }}>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Entreprise / Organisation *</label>
              <input
                name="entreprise"
                value={form.entreprise}
                onChange={handleChange}
                placeholder="Nom de l'entreprise..."
                required
                disabled={uploading}
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Adresse</label>
              <input
                name="adresse"
                value={form.adresse}
                onChange={handleChange}
                placeholder="Adresse complète..."
                disabled={uploading}
              />
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input
                name="telephone"
                value={form.telephone}
                onChange={handleChange}
                placeholder="Téléphone de l'entreprise..."
                disabled={uploading}
              />
            </div>
            <div className="form-group">
              <label>Email responsable</label>
              <input
                name="emailResponsable"
                type="email"
                value={form.emailResponsable}
                onChange={handleChange}
                placeholder="Email du responsable..."
                disabled={uploading}
              />
            </div>
            <div className="form-group">
              <label>Responsable</label>
              <input
                name="responsable"
                value={form.responsable}
                onChange={handleChange}
                placeholder="Nom du responsable..."
                disabled={uploading}
              />
            </div>
            <div className="form-group">
              <label>Date de début *</label>
              <input
                name="dateDebut"
                type="date"
                value={form.dateDebut}
                onChange={handleChange}
                required
                disabled={uploading}
              />
            </div>
            <div className="form-group">
              <label>Date de fin *</label>
              <input
                name="dateFin"
                type="date"
                value={form.dateFin}
                onChange={handleChange}
                required
                disabled={uploading}
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Description des missions</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="3"
                placeholder="Décrivez vos missions..."
                disabled={uploading}
              />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Convention de stage (PDF, DOCX - max 5 Mo)</label>
              <input
                type="file"
                name="convention"
                accept=".pdf,.docx,.doc"
                onChange={handleFileChange}
                disabled={uploading}
              />
              {form.convention && (
                <div style={{ fontSize: 12, color: '#185FA5', marginTop: 4 }}>
                  📎 {form.convention.name} ({Math.round(form.convention.size / 1024)} Ko)
                </div>
              )}
            </div>
            <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 10 }}>
              <button type="button" className="btn-outline" onClick={() => setShowFormulaire(false)} disabled={uploading}>
                Annuler
              </button>
              <button type="submit" className="btn-primary" disabled={uploading}>
                {uploading ? '⏳ Enregistrement...' : '📤 Enregistrer le stage'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stage existant */}
      {stage && (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 className="card-title" style={{ marginBottom: 4 }}>{stage.entreprise}</h3>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {stage.adresse || 'Adresse non renseignée'} • {stage.responsable ? `Responsable: ${stage.responsable}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span className={`badge ${getStatutBadge(stage.statut)}`} style={{ fontSize: 14 }}>
                  {getStatutLabel(stage.statut)}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {stage.dateCreation ? `Créé le ${new Date(stage.dateCreation).toLocaleDateString('fr-FR')}` : ''}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Période</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {stage.dateDebut ? new Date(stage.dateDebut).toLocaleDateString('fr-FR') : '-'}
                  {' → '}
                  {stage.dateFin ? new Date(stage.dateFin).toLocaleDateString('fr-FR') : '-'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tuteur</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stage.tuteur || 'Non attribué'}</div>
              </div>
              {stage.dureeSemaines && (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Durée</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{stage.dureeSemaines} semaines</div>
                </div>
              )}
            </div>

            {stage.description && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Description des missions</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{stage.description}</div>
              </div>
            )}

            {stage.conventionUrl && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Convention de stage</div>
                <button
                  className="btn-outline"
                  style={{ fontSize: 12, padding: '4px 12px' }}
                  onClick={() => handleDownload(stage.conventionUrl, 'Convention_de_stage')}
                >
                  📥 Télécharger
                </button>
              </div>
            )}
          </div>

          {/* Upload du rapport */}
          {stage.statut === 'EN_COURS' || stage.statut === 'TERMINE' ? (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="card-title">📄 Rapport de stage</h3>
              {stage.rapportUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>✅</span>
                  <div>
                    <div style={{ fontWeight: 500 }}>Rapport déposé</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {stage.rapportDate ? `Déposé le ${new Date(stage.rapportDate).toLocaleDateString('fr-FR')}` : ''}
                    </div>
                  </div>
                  <button
                    className="btn-outline"
                    style={{ fontSize: 12, padding: '4px 12px' }}
                    onClick={() => handleDownload(stage.rapportUrl, 'Rapport_de_stage')}
                  >
                    📥 Télécharger
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUploadRapport} style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="file"
                      name="rapport"
                      accept=".pdf,.docx,.doc"
                      required
                      disabled={uploading}
                      style={{ flex: 1, minWidth: 200 }}
                    />
                    <button type="submit" className="btn-primary" disabled={uploading}>
                      {uploading ? '⏳ Upload...' : '📤 Déposer le rapport'}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Formats acceptés : PDF, DOCX, DOC (max 10 Mo)
                  </div>
                </form>
              )}
            </div>
          ) : null}

          {/* Commentaires / évaluation */}
          {stage.avis && (
            <div className="card">
              <h3 className="card-title">⭐ Évaluation du stage</h3>
              <div style={{ padding: '12px 16px', background: 'rgba(24,95,165,0.12)', borderRadius: 8 }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{stage.avis}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {stage.avisDate ? `Évalué le ${new Date(stage.avisDate).toLocaleDateString('fr-FR')}` : ''}
                </div>
              </div>
            </div>
          )}

          {/* Rejet éventuel */}
          {stage.statut === 'REJETE' && stage.motifRejet && (
            <div className="alert-erreur" style={{ marginTop: 16 }}>
              ❌ Motif du rejet : {stage.motifRejet}
            </div>
          )}
        </>
      )}
    </div>
  );
}
