// src/pages/etudiant/DossierSocialEtudiant.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import '../Dashboard.css';

export default function DossierSocialEtudiant() {
  const { user } = useAuth();
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [bourseEstimee, setBourseEstimee] = useState(null);
  const [calculEnCours, setCalculEnCours] = useState(false);

  const etudiantId = user?.inscriptionId ? user.inscriptionId : null;

  const [form, setForm] = useState({
    situationFamiliale: '',
    nombreEnfants: '',
    nombrePersonnesCharge: '',
    professionParent: '',
    revenuMensuelFoyer: '',
    sourceRevenu: '',
    logementPropre: false,
    typeLogement: '',
    handicap: false,
    typeHandicap: '',
    problemesSante: '',
    demandeBourse: false,
    typeBourseDemandee: 'SOCIALE',
    montantDemande: '',
    urlCertificatScolarite: '',
    urlBulletinNotes: '',
    urlAttestationRevenus: '',
    urlCertificatHandicap: '',
    urlLettreMotivation: ''
  });

  useEffect(() => {
    if (etudiantId) loadDossier();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [etudiantId]);

  const loadDossier = async () => {
    try {
      const res = await api.get(`/api/social/dossiers/etudiant/${etudiantId}`);
      setDossier(res.data);
      setShowForm(false);
      // Si dossier existe, pré-remplir le formulaire pour modification
      if (res.data) {
        setForm({
          situationFamiliale: res.data.situationFamiliale || '',
          nombreEnfants: res.data.nombreEnfants || '',
          nombrePersonnesCharge: res.data.nombrePersonnesCharge || '',
          professionParent: res.data.professionParent || '',
          revenuMensuelFoyer: res.data.revenuMensuelFoyer || '',
          sourceRevenu: res.data.sourceRevenu || '',
          logementPropre: res.data.logementPropre || false,
          typeLogement: res.data.typeLogement || '',
          handicap: res.data.handicap || false,
          typeHandicap: res.data.typeHandicap || '',
          problemesSante: res.data.problemesSante || '',
          demandeBourse: res.data.demandeBourse || false,
          typeBourseDemandee: res.data.typeBourseDemandee || 'SOCIALE',
          montantDemande: res.data.montantDemande || '',
          urlCertificatScolarite: res.data.urlCertificatScolarite || '',
          urlBulletinNotes: res.data.urlBulletinNotes || '',
          urlAttestationRevenus: res.data.urlAttestationRevenus || '',
          urlCertificatHandicap: res.data.urlCertificatHandicap || '',
          urlLettreMotivation: res.data.urlLettreMotivation || ''
        });
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setDossier(null);
        setShowForm(true);
      } else {
        setError('Erreur chargement du dossier social');
      }
    } finally {
      setLoading(false);
    }
  };

  // Calcul automatique de la bourse en fonction des critères
  const calculerBourse = async () => {
    if (!form.revenuMensuelFoyer) {
      setError('Veuillez renseigner le revenu mensuel du foyer');
      return;
    }
    setCalculEnCours(true);
    setError('');
    try {
      const response = await api.post('/api/social/calcul-bourse', {
        revenuMensuelFoyer: parseFloat(form.revenuMensuelFoyer),
        nombrePersonnesCharge: parseInt(form.nombrePersonnesCharge) || 0,
        nombreEnfants: parseInt(form.nombreEnfants) || 0,
        demandeBourse: form.demandeBourse,
        typeBourseDemandee: form.typeBourseDemandee,
        handicap: form.handicap
      });
      setBourseEstimee(response.data);
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors du calcul');
    } finally {
      setCalculEnCours(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const payload = {
      ...form,
      etudiant: { id: parseInt(etudiantId) },
      inscription: { id: parseInt(etudiantId) },
      nombreEnfants: parseInt(form.nombreEnfants) || 0,
      nombrePersonnesCharge: parseInt(form.nombrePersonnesCharge) || 0,
      revenuMensuelFoyer: parseFloat(form.revenuMensuelFoyer) || 0,
      montantDemande: parseFloat(form.montantDemande) || 0
    };

    try {
      if (dossier) {
        await api.put(`/api/social/dossiers/${dossier.id}`, payload);
        setMessage('✅ Dossier social mis à jour avec succès');
      } else {
        await api.post('/api/social/dossiers', payload);
        setMessage('✅ Dossier social soumis avec succès');
      }
      setShowForm(false);
      loadDossier();
    } catch (err) {
      setError(err.response?.data?.erreur || 'Erreur lors de la soumission');
    }
  };

  const getStatutBadge = (statut) => {
    const map = {
      'EN_ATTENTE': 'badge-warning',
      'EN_ETUDE': 'badge-warning',
      'VALIDE': 'badge-success',
      'REJETE': 'badge-danger'
    };
    return map[statut] || 'badge-neutral';
  };

  const getStatutLabel = (statut) => {
    const map = {
      'EN_ATTENTE': '⏳ En attente',
      'EN_ETUDE': '📋 En étude',
      'VALIDE': '✅ Validé',
      'REJETE': '❌ Rejeté'
    };
    return map[statut] || statut;
  };

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🏥 Mon dossier social</h1>
          <p className="page-sub">Demandez une bourse ou une aide sociale</p>
        </div>
        {dossier && (
          <button className="btn-outline" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : '✏️ Modifier'}
          </button>
        )}
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}

      {dossier && !showForm && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <span className="badge badge-neutral">N° {dossier.numeroDossier}</span>
              <span className={`badge ${getStatutBadge(dossier.statut)}`} style={{ marginLeft: 8 }}>
                {getStatutLabel(dossier.statut)}
              </span>
            </div>
            {dossier.commentaireAdmin && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>📝 {dossier.commentaireAdmin}</span>
            )}
          </div>

          <div className="detail-grid">
            <div>
              <div className="detail-lbl">Situation familiale</div>
              <div>{dossier.situationFamiliale || '-'}</div>
            </div>
            <div>
              <div className="detail-lbl">Nombre d'enfants</div>
              <div>{dossier.nombreEnfants || 0}</div>
            </div>
            <div>
              <div className="detail-lbl">Personnes à charge</div>
              <div>{dossier.nombrePersonnesCharge || 0}</div>
            </div>
            <div>
              <div className="detail-lbl">Profession parent</div>
              <div>{dossier.professionParent || '-'}</div>
            </div>
            <div>
              <div className="detail-lbl">Revenu mensuel foyer</div>
              <div>{dossier.revenuMensuelFoyer ? dossier.revenuMensuelFoyer + ' USD' : '-'}</div>
            </div>
            <div>
              <div className="detail-lbl">Demande de bourse</div>
              <div>{dossier.demandeBourse ? '✅ Oui' : '❌ Non'}</div>
            </div>
            {dossier.demandeBourse && (
              <>
                <div>
                  <div className="detail-lbl">Type de bourse</div>
                  <div>{dossier.typeBourseDemandee || '-'}</div>
                </div>
                <div>
                  <div className="detail-lbl">Montant demandé</div>
                  <div>{dossier.montantDemande ? dossier.montantDemande + ' USD' : '-'}</div>
                </div>
              </>
            )}
          </div>

          {/* Bourse attribuée si validé */}
          {dossier.statut === 'VALIDE' && dossier.bourse && (
            <div style={{ marginTop: 16, padding: 12, background: 'rgba(29,158,117,0.12)', borderRadius: 8 }}>
              <div style={{ fontWeight: 600, color: '#1D9E75' }}>💰 Bourse attribuée</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Type :</span> {dossier.bourse.type}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Montant total :</span> {dossier.bourse.montantTotal} USD</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Par mois :</span> {dossier.bourse.montantParMois} USD</div>
                <div><span style={{ color: 'var(--text-muted)' }}>Durée :</span> {dossier.bourse.dureeMois} mois</div>
              </div>
            </div>
          )}
        </div>
      )}

      {(showForm || !dossier) && (
        <div className="card">
          <h2 className="card-title">{dossier ? 'Modifier' : 'Créer'} mon dossier social</h2>
          
          {/* Bouton de calcul de bourse */}
          <div style={{ marginBottom: 16, padding: 12, background: 'rgba(24,95,165,0.12)', borderRadius: 8 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600 }}>💡 Estimation de bourse :</span>
              <button className="btn-outline" onClick={calculerBourse} disabled={calculEnCours} style={{ fontSize: 12 }}>
                {calculEnCours ? '⏳ Calcul...' : '🔢 Calculer'}
              </button>
              {bourseEstimee && (
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1D9E75' }}>
                  {bourseEstimee.montantEstime} USD / mois
                  {bourseEstimee.type && ` (${bourseEstimee.type})`}
                </span>
              )}
            </div>
            {bourseEstimee && (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                {bourseEstimee.details}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Situation familiale</label>
              <select value={form.situationFamiliale} onChange={e => setForm({...form, situationFamiliale: e.target.value})}>
                <option value="">-- Choisir --</option>
                <option value="CELIBATAIRE">Célibataire</option>
                <option value="MARIE">Marié(e)</option>
                <option value="DIVORCE">Divorcé(e)</option>
                <option value="VEUF">Veuf/Veuve</option>
              </select>
            </div>
            <div className="form-group">
              <label>Nombre d'enfants</label>
              <input type="number" min="0" value={form.nombreEnfants} onChange={e => setForm({...form, nombreEnfants: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Personnes à charge</label>
              <input type="number" min="0" value={form.nombrePersonnesCharge} onChange={e => setForm({...form, nombrePersonnesCharge: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Profession du parent/tuteur</label>
              <input value={form.professionParent} onChange={e => setForm({...form, professionParent: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Revenu mensuel du foyer (USD) *</label>
              <input type="number" step="0.01" value={form.revenuMensuelFoyer} onChange={e => setForm({...form, revenuMensuelFoyer: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Source de revenu</label>
              <input value={form.sourceRevenu} onChange={e => setForm({...form, sourceRevenu: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Type de logement</label>
              <select value={form.typeLogement} onChange={e => setForm({...form, typeLogement: e.target.value})}>
                <option value="">-- Choisir --</option>
                <option value="LOCATAIRE">Locataire</option>
                <option value="PROPRIETAIRE">Propriétaire</option>
                <option value="HEBERGE">Hébergé</option>
              </select>
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ marginBottom: 0 }}>Handicap</label>
              <input type="checkbox" checked={form.handicap} onChange={e => setForm({...form, handicap: e.target.checked})} />
            </div>
            {form.handicap && (
              <div className="form-group">
                <label>Type de handicap</label>
                <input value={form.typeHandicap} onChange={e => setForm({...form, typeHandicap: e.target.value})} />
              </div>
            )}
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Problèmes de santé</label>
              <textarea value={form.problemesSante} onChange={e => setForm({...form, problemesSante: e.target.value})} rows="2" />
            </div>

            <h3 style={{ gridColumn: '1 / span 2', color: 'var(--text-primary)', marginTop: 16 }}>Demande de bourse</h3>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ marginBottom: 0 }}>Demander une bourse</label>
              <input type="checkbox" checked={form.demandeBourse} onChange={e => setForm({...form, demandeBourse: e.target.checked})} />
            </div>
            {form.demandeBourse && (
              <>
                <div className="form-group">
                  <label>Type de bourse</label>
                  <select value={form.typeBourseDemandee} onChange={e => setForm({...form, typeBourseDemandee: e.target.value})}>
                    <option value="EXCELLENCE">Excellence</option>
                    <option value="SOCIALE">Sociale</option>
                    <option value="SPORTIVE">Sportive</option>
                    <option value="CULTURELLE">Culturelle</option>
                    <option value="MERITE">Mérite</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Montant demandé (USD)</label>
                  <input type="number" step="0.01" value={form.montantDemande} onChange={e => setForm({...form, montantDemande: e.target.value})} />
                </div>
              </>
            )}

            <h3 style={{ gridColumn: '1 / span 2', color: 'var(--text-primary)', marginTop: 16 }}>Documents</h3>
            <div className="form-group">
              <label>URL Certificat de scolarité</label>
              <input value={form.urlCertificatScolarite} onChange={e => setForm({...form, urlCertificatScolarite: e.target.value})} />
            </div>
            <div className="form-group">
              <label>URL Bulletin de notes</label>
              <input value={form.urlBulletinNotes} onChange={e => setForm({...form, urlBulletinNotes: e.target.value})} />
            </div>
            <div className="form-group">
              <label>URL Attestation de revenus</label>
              <input value={form.urlAttestationRevenus} onChange={e => setForm({...form, urlAttestationRevenus: e.target.value})} />
            </div>
            <div className="form-group">
              <label>URL Certificat handicap</label>
              <input value={form.urlCertificatHandicap} onChange={e => setForm({...form, urlCertificatHandicap: e.target.value})} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>URL Lettre de motivation</label>
              <input value={form.urlLettreMotivation} onChange={e => setForm({...form, urlLettreMotivation: e.target.value})} />
            </div>

            <button type="submit" className="btn-primary" style={{ gridColumn: '1 / span 2' }}>
              {dossier ? 'Mettre à jour' : 'Soumettre'} le dossier
            </button>
          </form>
        </div>
      )}
    </div>
  );
}