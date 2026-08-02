// src/pages/etudiant/tfc/TfcMemoire.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../EtudiantDashboard.css';

export default function TfcMemoire() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [tfc, setTfc] = useState(null);
  const [chapitres, setChapitres] = useState([]);
  const [commentaires, setCommentaires] = useState([]);
  const [showDepotForm, setShowDepotForm] = useState(false);
  const [depotForm, setDepotForm] = useState({
    chapitreId: '',
    titre: '',
    description: '',
    fichier: null
  });
  const [uploading, setUploading] = useState(false);

  const inscriptionId = user?.inscriptionId;

  useEffect(() => {
    if (!inscriptionId) {
      setError("Aucune inscription trouvée");
      setLoading(false);
      return;
    }
    loadTfc();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId]);

  const loadTfc = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/etudiant/portal/${inscriptionId}/tfc`);
      const data = response.data;
      setTfc(data.tfc);
      setChapitres(data.chapitres || []);
      setCommentaires(data.commentaires || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setTfc(null);
        setChapitres([]);
        setCommentaires([]);
      } else {
        setError(err.response?.data?.erreur || "Erreur de chargement du TFC/Mémoire");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDepotChapitre = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!depotForm.fichier) {
      setMessage('⚠️ Veuillez sélectionner un fichier');
      return;
    }
    if (!depotForm.chapitreId) {
      setMessage('⚠️ Veuillez sélectionner un chapitre');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('chapitreId', depotForm.chapitreId);
    formData.append('titre', depotForm.titre);
    formData.append('description', depotForm.description);
    formData.append('fichier', depotForm.fichier);

    try {
      await api.post(`/api/etudiant/portal/${inscriptionId}/tfc/depot`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('✅ Chapitre déposé avec succès !');
      setShowDepotForm(false);
      setDepotForm({ chapitreId: '', titre: '', description: '', fichier: null });
      loadTfc();
    } catch (err) {
      setMessage('❌ Erreur lors du dépôt : ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    setDepotForm({ ...depotForm, fichier: e.target.files[0] });
  };

  const handleDownload = (url, nom) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getStatutBadge = (statut) => {
    const map = {
      'EN_ATTENTE': 'badge-warning',
      'EN_COURS': 'badge-warning',
      'SOUTENU': 'badge-info',
      'VALIDE': 'badge-success',
      'REJETE': 'badge-danger'
    };
    return map[statut] || 'badge-neutral';
  };

  const getStatutLabel = (statut) => {
    const map = {
      'EN_ATTENTE': '⏳ En attente de validation',
      'EN_COURS': '📝 En cours de rédaction',
      'SOUTENU': '🎤 Soutenu',
      'VALIDE': '✅ Validé',
      'REJETE': '❌ Rejeté'
    };
    return map[statut] || statut;
  };

  const getChapitreStatutBadge = (statut) => {
    const map = {
      'A_DEPOSER': 'badge-neutral',
      'DEPOSE': 'badge-warning',
      'VALIDE': 'badge-success',
      'REVISION': 'badge-danger'
    };
    return map[statut] || 'badge-neutral';
  };

  const getChapitreStatutLabel = (statut) => {
    const map = {
      'A_DEPOSER': '📤 À déposer',
      'DEPOSE': '⏳ En attente de correction',
      'VALIDE': '✅ Validé',
      'REVISION': '🔄 Révision demandée'
    };
    return map[statut] || statut;
  };

  const getProgressionColor = (progression) => {
    if (progression >= 80) return '#1D9E75';
    if (progression >= 50) return '#185FA5';
    if (progression >= 30) return '#854F0B';
    return '#cc0000';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de votre TFC/Mémoire...</p>
      </div>
    );
  }

  return (
    <div className="etudiant-dashboard">
      <div className="section-header">
        <h2 className="section-title">🎓 TFC / Mémoire</h2>
        {tfc && tfc.statut === 'EN_COURS' && (
          <button className="btn-primary" onClick={() => setShowDepotForm(!showDepotForm)}>
            {showDepotForm ? 'Annuler' : '📤 Déposer un chapitre'}
          </button>
        )}
      </div>

      {message && (
        <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>
          {message}
        </div>
      )}

      {error && <div className="alert-erreur">{error}</div>}

      {!tfc ? (
        // Aucun TFC attribué
        <div className="card">
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📝</div>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Aucun TFC / Mémoire attribué</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Vous n'avez pas encore de TFC ou Mémoire attribué.
              <br />
              Veuillez contacter votre département pour plus d'informations.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Résumé du TFC */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 className="card-title" style={{ marginBottom: 4 }}>{tfc.sujet}</h3>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {tfc.type} • {tfc.anneeAcademique}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span className={`badge ${getStatutBadge(tfc.statut)}`} style={{ fontSize: 14 }}>
                  {getStatutLabel(tfc.statut)}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {tfc.dateCreation ? `Créé le ${new Date(tfc.dateCreation).toLocaleDateString('fr-FR')}` : ''}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Encadreur</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tfc.encadreur || 'Non attribué'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Département</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tfc.departement || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Date limite</div>
                <div style={{ fontWeight: 600, color: tfc.dateLimite && new Date(tfc.dateLimite) < new Date() ? '#cc0000' : '#0B1F4A' }}>
                  {tfc.dateLimite ? new Date(tfc.dateLimite).toLocaleDateString('fr-FR') : 'Non définie'}
                  {tfc.dateLimite && new Date(tfc.dateLimite) < new Date() && ' ⚠️ Délai dépassé'}
                </div>
              </div>
            </div>

            {/* Barre de progression */}
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Progression</span>
                <span style={{ fontWeight: 600, color: getProgressionColor(tfc.progression || 0) }}>
                  {tfc.progression || 0}%
                </span>
              </div>
              <div style={{ background: 'var(--bg-secondary)', height: 10, borderRadius: 5, overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${tfc.progression || 0}%`,
                    background: getProgressionColor(tfc.progression || 0),
                    height: '100%',
                    transition: 'width 0.5s ease'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Chapitres */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 className="card-title">📑 Chapitres ({chapitres.length})</h3>
            {chapitres.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                Aucun chapitre déposé pour le moment.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {chapitres.map((chapitre, idx) => (
                  <div key={chapitre.id} style={{
                    padding: '14px 16px',
                    background: chapitre.statut === 'VALIDE' ? '#f0fdf4' :
                               chapitre.statut === 'REVISION' ? '#fef2f2' :
                               chapitre.statut === 'DEPOSE' ? '#f0f4ff' : '#f8fafc',
                    borderRadius: 8,
                    border: `1px solid ${chapitre.statut === 'VALIDE' ? '#bbf7d0' :
                                   chapitre.statut === 'REVISION' ? '#fecaca' :
                                   chapitre.statut === 'DEPOSE' ? '#bfdbfe' : '#e5e7eb'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 10
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {idx + 1}. {chapitre.titre}
                      </div>
                      {chapitre.description && (
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                          {chapitre.description}
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        {chapitre.dateDepot ? `Déposé le ${new Date(chapitre.dateDepot).toLocaleDateString('fr-FR')}` : 'Non déposé'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span className={`badge ${getChapitreStatutBadge(chapitre.statut)}`}>
                        {getChapitreStatutLabel(chapitre.statut)}
                      </span>
                      {chapitre.url && (
                        <button
                          className="btn-outline"
                          style={{ fontSize: 11, padding: '4px 10px' }}
                          onClick={() => handleDownload(chapitre.url, chapitre.titre)}
                        >
                          📥 Voir
                        </button>
                      )}
                      {chapitre.retour && (
                        <span style={{ fontSize: 11, color: '#cc0000' }}>
                          💬 Retour: {chapitre.retour}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Commentaires de l'encadreur */}
          {commentaires.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 className="card-title">💬 Commentaires de l'encadreur</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {commentaires.map((com, idx) => (
                  <div key={idx} style={{
                    padding: '12px 16px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 8,
                    borderLeft: `3px solid ${com.type === 'POSITIF' ? '#1D9E75' : com.type === 'NEGATIF' ? '#cc0000' : '#ff9800'}`
                  }}>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{com.auteur || 'Encadreur'}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{com.message}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      {new Date(com.date).toLocaleString('fr-FR')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulaire de dépôt */}
          {showDepotForm && (
            <div className="card">
              <h3 className="card-title">📤 Déposer un chapitre</h3>
              <form onSubmit={handleDepotChapitre} className="form-grid" style={{ marginTop: 16 }}>
                <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                  <label>Chapitre concerné *</label>
                  <select
                    value={depotForm.chapitreId}
                    onChange={e => setDepotForm({ ...depotForm, chapitreId: e.target.value })}
                    required
                    disabled={uploading}
                  >
                    <option value="">-- Sélectionner --</option>
                    {chapitres
                      .filter(c => c.statut === 'A_DEPOSER' || c.statut === 'REVISION')
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.titre} {c.statut === 'REVISION' ? '(Révision demandée)' : ''}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                  <label>Titre du dépôt</label>
                  <input
                    type="text"
                    value={depotForm.titre}
                    onChange={e => setDepotForm({ ...depotForm, titre: e.target.value })}
                    placeholder="Ex: Version finale du chapitre 1"
                    disabled={uploading}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                  <label>Description (optionnelle)</label>
                  <textarea
                    value={depotForm.description}
                    onChange={e => setDepotForm({ ...depotForm, description: e.target.value })}
                    rows="2"
                    placeholder="Informations complémentaires..."
                    disabled={uploading}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                  <label>Fichier * (PDF, DOCX - max 10 Mo)</label>
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc"
                    onChange={handleFileChange}
                    required
                    disabled={uploading}
                  />
                  {depotForm.fichier && (
                    <div style={{ fontSize: 12, color: '#185FA5', marginTop: 4 }}>
                      📎 {depotForm.fichier.name} ({Math.round(depotForm.fichier.size / 1024)} Ko)
                    </div>
                  )}
                </div>
                <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 10 }}>
                  <button type="button" className="btn-outline" onClick={() => setShowDepotForm(false)} disabled={uploading}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary" disabled={uploading}>
                    {uploading ? '⏳ Upload en cours...' : '📤 Déposer le chapitre'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Actions */}
          {tfc.statut === 'SOUTENU' && (
            <div className="card" style={{ background: 'rgba(24,95,165,0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 32 }}>🎤</span>
                <div>
                  <h4 style={{ margin: 0, color: '#185FA5' }}>Soutenance effectuée</h4>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                    Votre soutenance a eu lieu le {tfc.dateSoutenance ? new Date(tfc.dateSoutenance).toLocaleDateString('fr-FR') : 'récemment'}.
                    Les résultats seront communiqués prochainement.
                  </p>
                </div>
              </div>
            </div>
          )}

          {tfc.statut === 'VALIDE' && (
            <div className="card" style={{ background: 'rgba(29,158,117,0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 32 }}>🎉</span>
                <div>
                  <h4 style={{ margin: 0, color: '#1D9E75' }}>Félicitations !</h4>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
                    Votre TFC/Mémoire a été validé avec succès.
                    Vous pouvez télécharger votre attestation de validation dans la section Documents.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
