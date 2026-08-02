// src/pages/etudiant/travaux/TravauxDevoirs.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import '../EtudiantDashboard.css';

export default function TravauxDevoirs() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [travaux, setTravaux] = useState([]);
  const [selectedTravail, setSelectedTravail] = useState(null);
  const [showSoumission, setShowSoumission] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterStatut, setFilterStatut] = useState('');
  const [filterCours, setFilterCours] = useState('');
  const [coursList, setCoursList] = useState([]);
  const [formSoumission, setFormSoumission] = useState({
    fichier: null,
    commentaire: ''
  });

  const inscriptionId = user?.inscriptionId;

  useEffect(() => {
    if (!inscriptionId) {
      setError("Aucune inscription trouvée");
      setLoading(false);
      return;
    }
    loadTravaux();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId]);

  const loadTravaux = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/etudiant/portal/${inscriptionId}/travaux`);
      setTravaux(response.data.travaux || []);
      setCoursList(response.data.coursList || []);
    } catch (err) {
      setError(err.response?.data?.erreur || "Erreur de chargement des travaux");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier la taille (max 10 Mo)
      if (file.size > 10 * 1024 * 1024) {
        setMessage('⚠️ Le fichier ne doit pas dépasser 10 Mo');
        return;
      }
      setFormSoumission({ ...formSoumission, fichier: file });
    }
  };

  const handleSoumettre = async (e) => {
    e.preventDefault();
    if (!formSoumission.fichier) {
      setMessage('⚠️ Veuillez sélectionner un fichier');
      return;
    }

    setSubmitting(true);
    setMessage('');

    const formData = new FormData();
    formData.append('fichier', formSoumission.fichier);
    formData.append('commentaire', formSoumission.commentaire);
    formData.append('travailId', selectedTravail.id);
    formData.append('inscriptionId', inscriptionId);

    try {
      await api.post(`/api/travaux/soumettre`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('✅ Travail soumis avec succès !');
      setShowSoumission(false);
      setFormSoumission({ fichier: null, commentaire: '' });
      setSelectedTravail(null);
      loadTravaux();
    } catch (err) {
      setMessage('❌ Erreur lors de la soumission : ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (url, nom) => {
    try {
      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = nom || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      setMessage('❌ Erreur lors du téléchargement');
    }
  };

  const getStatutBadge = (statut) => {
    switch(statut) {
      case 'A_SOUMETTRE': return 'badge-warning';
      case 'SOUMIS': return 'badge-info';
      case 'CORRIGE': return 'badge-success';
      case 'EN_RETARD': return 'badge-danger';
      case 'ANNULE': return 'badge-neutral';
      default: return 'badge-neutral';
    }
  };

  const getStatutLabel = (statut) => {
    switch(statut) {
      case 'A_SOUMETTRE': return '⏳ À soumettre';
      case 'SOUMIS': return '📤 Soumis';
      case 'CORRIGE': return '✅ Corrigé';
      case 'EN_RETARD': return '⛔ En retard';
      case 'ANNULE': return '❌ Annulé';
      default: return statut;
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'DEVOIR': return '📝';
      case 'TP': return '🔬';
      case 'PROJET': return '📊';
      case 'EXERCICE': return '✏️';
      default: return '📌';
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'DEVOIR': return 'Devoir';
      case 'TP': return 'Travaux Pratiques';
      case 'PROJET': return 'Projet';
      case 'EXERCICE': return 'Exercice';
      default: return type;
    }
  };

  const isEcheanceDepassee = (dateEcheance) => {
    return new Date(dateEcheance) < new Date();
  };

  const travauxFiltres = travaux.filter(t => {
    const matchStatut = filterStatut ? t.statut === filterStatut : true;
    const matchCours = filterCours ? t.coursId === parseInt(filterCours) : true;
    return matchStatut && matchCours;
  });

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de vos travaux...</p>
      </div>
    );
  }

  return (
    <div className="etudiant-dashboard">
      <div className="section-header">
        <h2 className="section-title">📥 Travaux et Devoirs</h2>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {travaux.filter(t => t.statut === 'A_SOUMETTRE').length} à soumettre
        </span>
      </div>

      {message && (
        <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>
          {message}
        </div>
      )}

      {error && <div className="alert-erreur">{error}</div>}

      {/* Filtres */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontWeight: 600, fontSize: 12 }}>Statut :</label>
          <select
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
          >
            <option value="">Tous</option>
            <option value="A_SOUMETTRE">À soumettre</option>
            <option value="SOUMIS">Soumis</option>
            <option value="CORRIGE">Corrigé</option>
            <option value="EN_RETARD">En retard</option>
          </select>

          <label style={{ fontWeight: 600, fontSize: 12 }}>Cours :</label>
          <select
            value={filterCours}
            onChange={e => setFilterCours(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
          >
            <option value="">Tous</option>
            {coursList.map(c => (
              <option key={c.id} value={c.id}>{c.code} - {c.titre}</option>
            ))}
          </select>

          <button className="btn-outline" onClick={() => { setFilterStatut(''); setFilterCours(''); }}>
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Liste des travaux */}
      {travauxFiltres.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
            {travaux.length === 0 
              ? 'Aucun travail ou devoir pour le moment.'
              : 'Aucun travail ne correspond à vos critères de recherche.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {travauxFiltres.map(t => {
            const estDepasse = isEcheanceDepassee(t.dateEcheance);
            const peutSoumettre = t.statut === 'A_SOUMETTRE' || (t.statut === 'EN_RETARD');

            return (
              <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                {/* En-tête */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#185FA5' }}>
                      {getTypeIcon(t.type)} {getTypeLabel(t.type)}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                      {t.titre}
                    </div>
                  </div>
                  <span className={`badge ${getStatutBadge(t.statut)}`}>
                    {getStatutLabel(t.statut)}
                  </span>
                </div>

                {/* Détails */}
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
                  <div>📚 {t.cours} {t.professeur && `• 👨‍🏫 ${t.professeur}`}</div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                    <span>📅 Échéance : {new Date(t.dateEcheance).toLocaleDateString('fr-FR')}</span>
                    {t.coefficient && <span>⚖️ Coeff. {t.coefficient}</span>}
                  </div>
                  {estDepasse && t.statut === 'A_SOUMETTRE' && (
                    <div style={{ color: '#cc0000', fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                      ⚠️ Délai dépassé
                    </div>
                  )}
                </div>

                {t.description && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.4, flex: 1 }}>
                    {t.description}
                  </p>
                )}

                {/* Consignes (fichier) */}
                {t.urlConsignes && (
                  <button
                    className="btn-outline"
                    style={{ fontSize: 12, padding: '6px 12px', marginTop: 8 }}
                    onClick={() => handleDownload(t.urlConsignes, `consignes_${t.titre}.pdf`)}
                  >
                    📄 Télécharger les consignes
                  </button>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  {peutSoumettre && (
                    <button
                      className="btn-primary"
                      style={{ flex: 1, fontSize: 12, padding: '8px' }}
                      onClick={() => {
                        setSelectedTravail(t);
                        setShowSoumission(true);
                      }}
                    >
                      📤 Soumettre
                    </button>
                  )}

                  {t.statut === 'CORRIGE' && t.note !== undefined && (
                    <div style={{ 
                      padding: '6px 12px', 
                      background: t.note >= 10 ? '#e8f5e9' : '#fce4ec',
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <span style={{ fontWeight: 700, color: t.note >= 10 ? '#1D9E75' : '#cc0000' }}>
                        Note : {t.note}/20
                      </span>
                    </div>
                  )}

                  {t.statut === 'CORRIGE' && t.urlCorrection && (
                    <button
                      className="btn-outline"
                      style={{ fontSize: 11, padding: '6px 12px' }}
                      onClick={() => handleDownload(t.urlCorrection, `correction_${t.titre}.pdf`)}
                    >
                      📥 Correction
                    </button>
                  )}
                </div>

                {/* Commentaire de correction */}
                {t.statut === 'CORRIGE' && t.commentaireCorrection && (
                  <div style={{ 
                    marginTop: 8, 
                    padding: '8px 12px', 
                    background: 'rgba(24,95,165,0.12)', 
                    borderRadius: 6,
                    fontSize: 12,
                    color: 'var(--text-secondary)'
                  }}>
                    <strong>📝 Commentaire :</strong> {t.commentaireCorrection}
                  </div>
                )}

                {/* Date de soumission */}
                {t.dateSoumission && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                    Soumis le {new Date(t.dateSoumission).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de soumission */}
      {showSoumission && selectedTravail && (
        <div className="modal-overlay" onClick={() => { setShowSoumission(false); setSelectedTravail(null); }} style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: 500, width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="card-title" style={{ margin: 0 }}>📤 Soumettre un travail</h3>
              <button className="btn-outline" style={{ padding: '4px 12px' }} onClick={() => { setShowSoumission(false); setSelectedTravail(null); }}>
                ✕
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <p><strong>Travail :</strong> {selectedTravail.titre}</p>
              <p><strong>Cours :</strong> {selectedTravail.cours}</p>
              <p><strong>Échéance :</strong> {new Date(selectedTravail.dateEcheance).toLocaleDateString('fr-FR')}</p>
              {selectedTravail.description && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{selectedTravail.description}</p>
              )}
            </div>

            <form onSubmit={handleSoumettre}>
              <div className="form-group">
                <label>Fichier * (PDF, DOC, DOCX, ZIP - max 10 Mo)</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.zip,.rar"
                  onChange={handleFileChange}
                  required
                  disabled={submitting}
                />
              </div>
              <div className="form-group">
                <label>Commentaire (optionnel)</label>
                <textarea
                  value={formSoumission.commentaire}
                  onChange={e => setFormSoumission({ ...formSoumission, commentaire: e.target.value })}
                  rows="3"
                  placeholder="Ajoutez un commentaire à votre soumission..."
                  disabled={submitting}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button type="button" className="btn-outline" onClick={() => { setShowSoumission(false); setSelectedTravail(null); }} disabled={submitting}>
                  Annuler
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? '⏳ Soumission...' : '📤 Soumettre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
