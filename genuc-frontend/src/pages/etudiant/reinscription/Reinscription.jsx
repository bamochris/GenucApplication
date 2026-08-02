// src/pages/etudiant/reinscription/Reinscription.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import { vacationService } from '../../../services/vacationService';
import '../EtudiantDashboard.css';

export default function Reinscription() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dossier, setDossier] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [etape, setEtape] = useState(1);
  const [form, setForm] = useState({
    anneeAcademiqueId: '',
    promotionId: '',
    vacationId: '',
    declareBourse: false,
    commentaire: ''
  });
  const [annees, setAnnees] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [fraisSituation, setFraisSituation] = useState(null);
  const [vacations, setVacations] = useState([]);
  const [loadingVacations, setLoadingVacations] = useState(false);
  const [vacationMessage, setVacationMessage] = useState('');

  const inscriptionId = user?.inscriptionId;

  useEffect(() => {
    if (inscriptionId) {
      loadData();
    } else {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [inscriptionId]);

  // Vacations (Jour / Soir) ouvertes aux inscriptions pour l'université de l'étudiant
  useEffect(() => {
    const universiteId = user?.universiteId;
    if (!universiteId) return;
    setLoadingVacations(true);
    vacationService.listerInscriptionsOuvertes(universiteId)
      .then(res => setVacations(Array.isArray(res.data) ? res.data : []))
      .catch(() => setVacations([]))
      .finally(() => setLoadingVacations(false));
  }, [user?.universiteId]);

  const loadData = async () => {
    try {
      const [dossierRes, docsRes, fraisRes, anneesRes, promosRes] = await Promise.all([
        api.get(`/api/etudiant/portal/reinscription/dossier/${inscriptionId}`).catch(() => ({ data: null })),
        api.get(`/api/documents/etudiant/${inscriptionId}`).catch(() => ({ data: [] })),
        api.get(`/api/paiements/etudiant/situation/${inscriptionId}`).catch(() => ({ data: null })),
        api.get('/api/annees-academiques').catch(() => ({ data: [] })),
        api.get(`/api/etudiant/portal/reinscription/promotions/${inscriptionId}`).catch(() => ({ data: [] }))
      ]);

      setDossier(dossierRes.data);
      setDocuments(docsRes.data);
      setFraisSituation(fraisRes.data);
      setAnnees(anneesRes.data);
      setPromotions(promosRes.data);

      // Présélectionner l'année active
      const activeAnnee = anneesRes.data.find(a => a.active);
      if (activeAnnee) {
        setForm(f => ({ ...f, anneeAcademiqueId: activeAnnee.id }));
      }

    } catch (err) {
      console.error('Erreur chargement données:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setVacationMessage('');
    setSubmitting(true);

    try {
      const { vacationId, ...reinscriptionForm } = form;
      await api.post('/api/etudiant/portal/reinscription', {
        inscriptionId: parseInt(inscriptionId),
        ...reinscriptionForm,
        anneeAcademiqueId: parseInt(form.anneeAcademiqueId),
        promotionId: parseInt(form.promotionId)
      });
      setMessage('✅ Demande de réinscription soumise avec succès !');

      // Inscription à la vacation choisie (Jour / Soir), si sélectionnée
      if (vacationId) {
        try {
          await vacationService.inscrireEtudiant(
            parseInt(vacationId, 10),
            parseInt(inscriptionId, 10),
            parseInt(form.promotionId, 10),
            parseInt(form.anneeAcademiqueId, 10)
          );
          setVacationMessage('✅ Demande d\'inscription à la vacation envoyée.');
        } catch (vacErr) {
          setVacationMessage("⚠️ La réinscription a été soumise, mais l'inscription à la vacation a échoué : "
            + (vacErr.response?.data?.message || 'veuillez réessayer depuis votre suivi.'));
        }
      }

      setEtape(4);
      loadData();
    } catch (err) {
      setMessage('❌ Erreur lors de la soumission : ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Vérifier si tous les documents requis sont présents
  const documentsRequis = ['PHOTO_IDENTITE', 'DIPLOME_ETAT', 'ACTE_NAISSANCE'];
  const documentsManquants = documentsRequis.filter(type => 
    !documents.some(d => d.type === type && d.valide)
  );

  // Vérifier si l'étudiant a des dettes
  const aDesDettes = fraisSituation?.soldeRestant > 0;

  const getStatutBadge = (statut) => {
    const map = {
      'EN_ATTENTE': 'badge-warning',
      'VALIDE': 'badge-success',
      'REJETE': 'badge-danger',
      'EN_COURS': 'badge-warning'
    };
    return map[statut] || 'badge-neutral';
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loader"></div>
        <p>Chargement de votre dossier...</p>
      </div>
    );
  }

  return (
    <div className="etudiant-dashboard">
      <div className="section-header">
        <h2 className="section-title">📝 Réinscription académique</h2>
      </div>

      {message && (
        <div className={message.includes('✅') ? 'alert-success' : 'alert-erreur'}>
          {message}
        </div>
      )}

      {vacationMessage && (
        <div className={vacationMessage.startsWith('✅') ? 'alert-success' : 'alert-erreur'}>
          {vacationMessage}
        </div>
      )}

      {/* Étape 1 : Vérification du dossier */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 className="card-title">📋 Étape 1 : Vérification du dossier</h3>
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat-card">
            <div className="stat-icon">📎</div>
            <div className="stat-content">
              <div className="stat-value">{documents.filter(d => d.valide).length}/{documentsRequis.length}</div>
              <div className="stat-label">Documents validés</div>
            </div>
          </div>
          <div className="stat-card" style={{ borderLeftColor: aDesDettes ? '#cc0000' : '#1D9E75' }}>
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-value" style={{ color: aDesDettes ? 'var(--color-danger-text)' : 'var(--color-success-text)' }}>
                {aDesDettes ? `${fraisSituation?.soldeRestant} USD` : '✅ À jour'}
              </div>
              <div className="stat-label">Situation financière</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎓</div>
            <div className="stat-content">
              <div className="stat-value">{dossier?.promotion || '-'}</div>
              <div className="stat-label">Promotion actuelle</div>
            </div>
          </div>
        </div>

        {documentsManquants.length > 0 && (
          <div className="alert-erreur" style={{ marginTop: 12 }}>
            ⚠️ Documents manquants : {documentsManquants.join(', ')}
            <br />
            <Link to="/etudiant/profil/documents" className="btn-outline" style={{ marginTop: 8, display: 'inline-block', textDecoration: 'none' }}>
              Uploader les documents →
            </Link>
          </div>
        )}

        {aDesDettes && (
          <div className="alert-erreur" style={{ marginTop: 12 }}>
            ⚠️ Vous avez un solde impayé de {fraisSituation?.soldeRestant} USD.
            Veuillez régulariser votre situation avant de vous réinscrire.
            <br />
            <Link to="/etudiant/frais" className="btn-outline" style={{ marginTop: 8, display: 'inline-block', textDecoration: 'none' }}>
              Voir ma situation financière →
            </Link>
          </div>
        )}

        <button 
          className="btn-primary" 
          onClick={() => setEtape(2)}
          disabled={documentsManquants.length > 0 || aDesDettes}
          style={{ marginTop: 16 }}
        >
          {documentsManquants.length > 0 || aDesDettes ? '❌ Dossier incomplet' : '✅ Continuer →'}
        </button>
      </div>

      {/* Étape 2 : Choix de la promotion */}
      {etape >= 2 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">🎓 Étape 2 : Choix de la promotion</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Année académique *</label>
                <select
                  name="anneeAcademiqueId"
                  value={form.anneeAcademiqueId}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                >
                  <option value="">-- Sélectionner --</option>
                  {annees.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.libelle} {a.active ? '(Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Promotion *</label>
                <select
                  name="promotionId"
                  value={form.promotionId}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                >
                  <option value="">-- Sélectionner --</option>
                  {promotions.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.libelle} - {p.filiere?.nom || ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                <label>Vacation (Jour / Soir) {vacations.length > 0 ? '*' : ''}</label>
                {loadingVacations ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Chargement des vacations disponibles...</p>
                ) : vacations.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Aucune vacation avec inscriptions ouvertes pour votre université actuellement.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                    {vacations.map(v => (
                      <label
                        key={v.id}
                        style={{
                          display: 'flex', flexDirection: 'column', gap: 4, cursor: 'pointer',
                          border: form.vacationId === String(v.id) ? '2px solid #185FA5' : '1.5px solid var(--border-color)',
                          borderRadius: 10, padding: '12px 14px',
                          background: form.vacationId === String(v.id) ? '#eff6ff' : '#fff'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="radio"
                            name="vacationId"
                            value={v.id}
                            checked={form.vacationId === String(v.id)}
                            onChange={handleChange}
                            disabled={submitting}
                          />
                          <strong style={{ fontSize: 13 }}>{v.type === 'JOUR' ? '☀️ Jour' : '🌙 Soir'} — {v.nom}</strong>
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {v.dateDebut ? new Date(v.dateDebut).toLocaleDateString('fr-FR') : ''} → {v.dateFin ? new Date(v.dateFin).toLocaleDateString('fr-FR') : ''}
                        </span>
                        {v.fraisInscription != null && (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Frais : {v.fraisInscription} {v.deviseFrais}</span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                <label>Commentaire (optionnel)</label>
                <textarea
                  name="commentaire"
                  value={form.commentaire}
                  onChange={handleChange}
                  rows="2"
                  placeholder="Informations supplémentaires..."
                  disabled={submitting}
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="declareBourse"
                    checked={form.declareBourse}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                  Je souhaite déclarer une demande de bourse pour cette année
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="button" className="btn-outline" onClick={() => setEtape(1)}>
                ← Retour
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? '⏳ Soumission...' : '📤 Soumettre la demande'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Étape 3 : Suivi de la demande (après soumission) */}
      {etape === 4 && dossier?.demandeReinscription && (
        <div className="card">
          <h3 className="card-title">📊 Suivi de votre demande</h3>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-value">{dossier.demandeReinscription.numero || 'N/A'}</div>
              <div className="stat-label">N° de demande</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                <span className={`badge ${getStatutBadge(dossier.demandeReinscription.statut)}`}>
                  {dossier.demandeReinscription.statut}
                </span>
              </div>
              <div className="stat-label">Statut</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {new Date(dossier.demandeReinscription.dateSoumission).toLocaleDateString('fr-FR')}
              </div>
              <div className="stat-label">Date de soumission</div>
            </div>
          </div>

          {dossier.demandeReinscription.statut === 'EN_ATTENTE' && (
            <div className="alert-warning" style={{ padding: '12px 16px', background: 'rgba(192,122,43,0.15)', borderRadius: 8, color: '#856404' }}>
              ⏳ Votre demande est en cours de traitement. Vous serez notifié dès qu'elle sera validée.
            </div>
          )}

          {dossier.demandeReinscription.statut === 'VALIDE' && (
            <div className="alert-success">
              ✅ Votre réinscription a été validée ! Bienvenue pour la nouvelle année académique.
            </div>
          )}

          {dossier.demandeReinscription.statut === 'REJETE' && (
            <div className="alert-erreur">
              ❌ Votre demande a été rejetée. Motif : {dossier.demandeReinscription.motifRejet || 'Non spécifié'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
