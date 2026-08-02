// src/pages/AdminDossiers.jsx
import { useEffect, useState, useCallback } from 'react';
import { FaCheckCircle, FaClock, FaEye, FaFilter, FaFolderOpen, FaMoneyBillWave, FaSyncAlt, FaUserGraduate } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useApi } from '../hooks/useApi';
import { ouvrirFichierPrive } from '../utils/fichierPrive';
import './Dashboard.css';
import './AdminDossiers.css';

// Documents attendus (clé du champ DossierInscription → libellé lisible)
const DOCUMENTS = [
  ['urlPhoto', "Pièce d'identité (électeur/passeport)"],
  ['urlDiplomeEtat', "Diplôme d'État"],
  ['urlAttestationReussite', 'Attestation de réussite'],
  ['urlReleveNotes', 'Relevé des notes / bulletin'],
  ['urlActeNaissance', 'Acte de naissance'],
  ['urlAttestationNationalite', 'Attestation de nationalité'],
  ['urlCarteIdentite', "Carte d'identité nationale (optionnel)"],
  ['urlPhotoPasseport', 'Photo passeport'],
  ['urlLettreRecommandation', 'Lettre de recommandation'],
  ['urlAttestationPhysique', "Attestation d'aptitude physique"],
  ['urlAttestationConduite', 'Attestation de bonne conduite'],
];

// Motifs de rejet prédéfinis (clic = pré-remplissage), pour accélérer le traitement en volume.
const MOTIFS_REJET = [
  'Dossier incomplet — documents manquants',
  "Diplôme d'État non conforme ou illisible",
  "Conditions d'admission non remplies (moyenne insuffisante)",
  'Filière/niveau complet ou indisponible cette année',
  "Pièce d'identité invalide ou expirée",
  "Frais d'inscription non payés",
  'Doublon — dossier déjà soumis',
  'Informations incohérentes ou fausses déclarations',
];

const fmtDate = (v) => (v ? new Date(v).toLocaleDateString('fr-FR') : '—');
const val = (v) => (v !== null && v !== undefined && v !== '' ? String(v) : '—');

function Info({ label, value }) {
  return (
    <div className="admissions-info-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="admissions-detail-section">
      <div className="admissions-detail-section-title">{title}</div>
      <div className="admissions-detail-grid">
        {children}
      </div>
    </div>
  );
}

function getInitiales(dossier) {
  return `${dossier?.prenom?.[0] || ''}${dossier?.nom?.[0] || ''}`.toUpperCase() || 'ET';
}

function DossierMetric({ icon: Icon, label, value, detail, tone = 'blue' }) {
  return (
    <div className={`admissions-metric admissions-metric--${tone}`}>
      <div className="admissions-metric-icon"><Icon /></div>
      <div>
        <div className="admissions-metric-value">{value}</div>
        <div className="admissions-metric-label">{label}</div>
        {detail && <div className="admissions-metric-detail">{detail}</div>}
      </div>
    </div>
  );
}

export default function AdminDossiers() {
  const { user } = useAuth();
  const [universiteId, setUniversiteId] = useState('');
  const [statutFiltre, setStatutFiltre] = useState('');
  const [filtrePaiement, setFiltrePaiement] = useState('');
  const [validating, setValidating] = useState(false);
  const [msgSujet, setMsgSujet] = useState('');
  const [msgCandidat, setMsgCandidat] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [commentaire, setCommentaire] = useState('');
  const [motifRejet, setMotifRejet] = useState('');
  const [docsRequis, setDocsRequis] = useState([]);
  const [messageDemande, setMessageDemande] = useState('');
  const [analyses, setAnalyses] = useState(null);
  const [analysing, setAnalysing] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [departementsEdit, setDepartementsEdit] = useState([]);
  const [filieresEdit, setFilieresEdit] = useState([]);
  const [promotionsEdit, setPromotionsEdit] = useState([]);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const adminUniId = user?.universiteId;

  // ✅ 1. Chargement des universités (immédiat)
  const {
    data: universites,
    loading: loadingUniv,
    error: univError
  } = useApi(() => api.get('/api/universites/public'), { immediate: true });

  // ✅ 2. Pré-sélection de l'université pour l'admin université
  useEffect(() => {
    if (!isSuperAdmin && adminUniId) {
      setUniversiteId(adminUniId.toString());
    }
  }, [isSuperAdmin, adminUniId]);

  // ✅ 3. Fonction de chargement des dossiers (dépend des filtres)
  const fetchDossiers = useCallback(() => {
    if (!universiteId) return Promise.resolve({ data: [] });
    const url = `/api/public/admin/dossiers?universiteId=${universiteId}${statutFiltre ? `&statut=${statutFiltre}` : ''}`;
    return api.get(url);
  }, [universiteId, statutFiltre]);

  // ✅ 4. Hook useApi pour les dossiers (exécution manuelle)
  const {
    data: dossiers,
    loading: loadingDossiers,
    error: dossiersError,
    execute: chargerDossiers
  } = useApi(fetchDossiers, { immediate: false });

  // ✅ 5. Déclencher le chargement quand l'université ou le filtre change
  useEffect(() => {
    if (universiteId) {
      chargerDossiers();
    }
  }, [universiteId, statutFiltre, chargerDossiers]);

  // ✅ 6. Gestion des erreurs (fusion des erreurs possibles)
  useEffect(() => {
    if (univError) setError(univError);
    else if (dossiersError) setError(dossiersError);
    else setError(null);
  }, [univError, dossiersError]);

  // ✅ 7. Valider un dossier
  const validerDossier = async (dossierId) => {
    if (validating) return;              // évite le double-clic (2 requêtes concurrentes)
    setValidating(true);
    try {
      const response = await api.patch(`/api/public/admin/dossiers/${dossierId}/valider`, {
        adminId: user.id,
        commentaire: commentaire
      });
      
      setMessage(`✅ Dossier validé avec succès ! Matricule: ${response.data.matricule}`);
      setCredentials({
        email: response.data.email,
        motDePasse: response.data.motDePasse,
        matricule: response.data.matricule
      });
      setSelectedDossier(null);
      setCommentaire('');
      chargerDossiers();
      
    } catch (err) {
      setError(err.response?.data?.erreur || err.message || "Erreur lors de la validation");
    } finally {
      setValidating(false);
    }
  };

  // ✅ 8. Rejeter un dossier
  const rejeterDossier = async (dossierId) => {
    try {
      await api.patch(`/api/public/admin/dossiers/${dossierId}/rejeter`, {
        motif: motifRejet
      });
      
      setMessage("❌ Dossier rejeté");
      setSelectedDossier(null);
      setMotifRejet('');
      chargerDossiers(); // Recharge la liste
    } catch (err) {
      setError(err.response?.data?.erreur || "Erreur lors du rejet");
    }
  };

  // ✅ Demander des documents complémentaires (crée l'accès restreint de l'étudiant)
  const demanderDocuments = async (dossierId) => {
    if (docsRequis.length === 0) { setError('Sélectionnez au moins un document à demander.'); return; }
    try {
      await api.patch(`/api/public/admin/dossiers/${dossierId}/demander-documents`, {
        documents: docsRequis,
        message: messageDemande,
      });
      setMessage("📄 Demande envoyée à l'étudiant — un accès lui a été créé pour ajouter les documents.");
      setSelectedDossier(null);
      setMessageDemande('');
      chargerDossiers();
    } catch (err) {
      setError(err.response?.data?.erreur || err.message || 'Erreur lors de la demande de documents');
    }
  };

  // ✅ Analyse machine LOCALE des pièces (déterministe + OCR local, aucune IA)
  const analyserPieces = async (dossierId) => {
    setAnalysing(true); setAnalyses(null);
    try {
      const res = await api.get(`/api/public/admin/dossiers/${dossierId}/analyse`);
      setAnalyses(res.data);
    } catch (err) {
      setError(err.response?.data?.erreur || err.message || "Erreur lors de l'analyse");
    } finally {
      setAnalysing(false);
    }
  };

  // ✅ Marquer les frais d'inscription comme payés (secrétariat / caisse)
  const marquerPaye = async (dossierId) => {
    try {
      await api.patch(`/api/public/admin/dossiers/${dossierId}/marquer-paye`, { reference: 'MANUEL' });
      setMessage("💰 Frais d'inscription marqués comme payés.");
      setSelectedDossier(null);
      chargerDossiers();
    } catch (err) {
      setError(err.response?.data?.erreur || err.message || 'Erreur lors du marquage du paiement');
    }
  };

  // 📄 Voir une pièce du dossier (acte de naissance, diplôme, carte d'identité…).
  // Ces fichiers ne sont plus servis publiquement sous /uploads/ : même raison que
  // pour la lettre ci-dessous, un <a href> partirait sans le jeton.
  const voirPiece = async (chemin, libelle) => {
    const erreur = await ouvrirFichierPrive(chemin, libelle ? `« ${libelle} »` : 'le document');
    if (erreur) setError(erreur);
  };

  // 📄 Voir la lettre d'admission : fetch authentifié (JWT) → nouvel onglet.
  // Un simple <a href> ouvrirait l'URL SANS le jeton → 403 anonyme.
  const voirLettre = async (dossierId) => {
    const win = window.open('', '_blank', 'noopener,noreferrer');
    if (win) win.document.write('<p style="font-family:sans-serif;padding:24px">Chargement de la lettre…</p>');
    try {
      const res = await api.get(`/api/public/admin/dossiers/${dossierId}/lettre-acceptation`, { responseType: 'text' });
      if (win) { win.document.open(); win.document.write(res.data); win.document.close(); }
      else { setError("Autorisez les fenêtres pop-up pour afficher la lettre."); }
    } catch (err) {
      if (win) win.close();
      setError(err.response?.data?.message || err.response?.data?.erreur || err.message || "Impossible d'ouvrir la lettre d'admission.");
    }
  };

  // Pourcentage du diplôme en nombre (gère "65", "65%", "65,5")
  const pct = (v) => parseFloat(String(v ?? '').replace(',', '.').replace(/[^0-9.]/g, ''));

  // Année d'obtention (4 chiffres) → nombre ; EXETAT requis si année ≥ 2022.
  const anneeNum = (v) => { const m = String(v ?? '').match(/\d{4}/); return m ? parseInt(m[0], 10) : null; };
  const exetatRequis = (d) => { const a = anneeNum(d.anneeObtention); return a != null && a >= 2022; };

  // 📝 Convoquer au test d'admission (candidat < 60%)
  const convoquerTest = async (dossierId) => {
    try {
      await api.patch(`/api/public/admin/dossiers/${dossierId}/convoquer-test`, { message: msgCandidat || null });
      setMessage("📝 Candidat convoqué au test d'admission (email envoyé).");
      setMsgCandidat(''); setSelectedDossier(null);
      chargerDossiers();
    } catch (err) {
      setError(err.response?.data?.erreur || err.message || 'Erreur lors de la convocation au test.');
    }
  };

  // ✅ Marquer le test d'admission réussi → dossier validable
  const marquerTestReussi = async (dossierId) => {
    try {
      await api.patch(`/api/public/admin/dossiers/${dossierId}/test-reussi`);
      setMessage("✅ Test d'admission réussi enregistré. Le dossier peut être validé.");
      setSelectedDossier(null);
      chargerDossiers();
    } catch (err) {
      setError(err.response?.data?.erreur || err.message || 'Erreur.');
    }
  };

  // 🎓 Vérifier le code EXETAT (diplôme ≥ 2022) sur la plateforme officielle
  const verifierExetat = async (dossierId) => {
    try {
      await api.patch(`/api/public/admin/dossiers/${dossierId}/verifier-exetat`);
      setMessage('✅ Code EXETAT vérifié. Le dossier peut être validé.');
      setSelectedDossier(null);
      chargerDossiers();
    } catch (err) {
      setError(err.response?.data?.erreur || err.message || 'Erreur lors de la vérification EXETAT.');
    }
  };

  // ✉️ Envoyer un message d'information au candidat (email)
  const envoyerMessageCandidat = async (dossierId) => {
    if (!msgCandidat.trim()) { setError('Le message est vide.'); return; }
    try {
      await api.post(`/api/public/admin/dossiers/${dossierId}/message`, {
        sujet: msgSujet || 'Information — inscription',
        message: msgCandidat,
      });
      setMessage('✉️ Message envoyé au candidat par email.');
      setMsgSujet(''); setMsgCandidat('');
    } catch (err) {
      setError(err.response?.data?.erreur || err.message || "Erreur lors de l'envoi du message.");
    }
  };

  // 📧 Renvoyer l'email d'activation (nouveau lien 48h) + la lettre d'admission
  const renvoyerActivation = async (dossierId) => {
    try {
      const res = await api.post(
        `/api/public/admin/dossiers/${dossierId}/renvoyer-activation`,
        {},
        { timeout: 45000 }
      );
      setMessage('📧 ' + (res.data?.message || 'Email renvoyé.'));
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        setError("Le renvoi de l'activation prend trop de temps. Attendez quelques secondes puis vérifiez si l'email a déjà été envoyé.");
        return;
      }
      setError(err.response?.data?.erreur || err.message || "Erreur lors du renvoi de l'activation.");
    }
  };

  // ✅ 9. Fonctions utilitaires (inchangées)
  const getStatutBadge = (statut) => {
    switch(statut) {
      case 'EN_ATTENTE': return 'badge-warning';
      case 'DOCUMENTS_MANQUANTS': return 'badge-warning';
      case 'TEST_ADMISSION': return 'badge-warning';
      case 'VALIDE': return 'badge-success';
      case 'REJETE': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

  const getStatutLabel = (statut) => {
    switch(statut) {
      case 'EN_ATTENTE': return '⏳ En attente';
      case 'DOCUMENTS_MANQUANTS': return '📄 Documents manquants';
      case 'TEST_ADMISSION': return "📝 Test d'admission";
      case 'VALIDE': return '✅ Validé';
      case 'REJETE': return '❌ Rejeté';
      default: return statut;
    }
  };

  const copyCredentials = () => {
    if (!credentials) return;
    const text = `Matricule: ${credentials.matricule}\nEmail: ${credentials.email}\nMot de passe: ${credentials.motDePasse}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const updateEditField = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const ouvrirDossier = (dossier) => {
    setSelectedDossier(dossier);
    setCommentaire('');
    setMotifRejet('');
    setMessageDemande('');
    setAnalyses(null);
    setDocsRequis(DOCUMENTS.filter(([k]) => !dossier[k]).map(([k]) => k));
    setIsEditing(false);
    setEditForm({
      nom: dossier.nom || '',
      prenom: dossier.prenom || '',
      email: dossier.email || '',
      telephone: dossier.telephone || '',
      telephone2: dossier.telephone2 || '',
      sexe: dossier.sexe || '',
      dateNaissance: dossier.dateNaissance ? String(dossier.dateNaissance).slice(0, 10) : '',
      lieuNaissance: dossier.lieuNaissance || '',
      nationalite: dossier.nationalite || '',
      etatCivil: dossier.etatCivil || '',
      adresse: dossier.adresse || '',
      province: dossier.province || '',
      ville: dossier.ville || '',
      commune: dossier.commune || '',
      quartier: dossier.quartier || '',
      avenue: dossier.avenue || '',
      numeroResidence: dossier.numeroResidence || '',
      universiteId: dossier.universiteId ? String(dossier.universiteId) : '',
      departementId: dossier.departementId ? String(dossier.departementId) : '',
      filiereId: dossier.filiereId ? String(dossier.filiereId) : '',
      promotionId: '',
      niveauVise: dossier.niveauVise || '',
      typeInscription: dossier.typeInscription || '',
      ecoleSecondaire: dossier.ecoleSecondaire || '',
      provinceEcole: dossier.provinceEcole || '',
      anneeObtention: dossier.anneeObtention || '',
      numeroDiplome: dossier.numeroDiplome || '',
      pourcentage: dossier.pourcentage || '',
      option: dossier.option || '',
      pereNom: dossier.pereNom || '',
      pereProfession: dossier.pereProfession || '',
      pereTelephone: dossier.pereTelephone || '',
      mereNom: dossier.mereNom || '',
      mereProfession: dossier.mereProfession || '',
      mereTelephone: dossier.mereTelephone || '',
      tuteurNom: dossier.tuteurNom || '',
      tuteurLien: dossier.tuteurLien || '',
      tuteurTelephone: dossier.tuteurTelephone || '',
      tuteurAdresse: dossier.tuteurAdresse || '',
      urgenceNom: dossier.urgenceNom || '',
      urgenceTelephone: dossier.urgenceTelephone || '',
      allergies: dossier.allergies || '',
      handicap: dossier.handicap || '',
      commentaire: dossier.commentaire || '',
    });
  };

  const sauvegarderDossier = async () => {
    if (!selectedDossier || !editForm) return;
    setSavingEdit(true);
    setError(null);

    try {
      const payload = {
        ...editForm,
        universiteId: editForm.universiteId || null,
        departementId: editForm.departementId || null,
        filiereId: editForm.filiereId || null,
        promotionId: editForm.promotionId || null,
      };

      const res = await api.put(`/api/public/admin/dossiers/${selectedDossier.id}`, payload);
      setMessage(res.data?.message || '✅ Dossier corrigé avec succès.');
      setSelectedDossier(res.data?.dossier || selectedDossier);
      setIsEditing(false);
      chargerDossiers();
    } catch (err) {
      setError(err.response?.data?.erreur || err.message || 'Erreur lors de la mise à jour du dossier.');
    } finally {
      setSavingEdit(false);
    }
  };

  useEffect(() => {
    if (!isEditing || !editForm?.universiteId) {
      setDepartementsEdit([]);
      return;
    }

    let actif = true;
    api.get(`/api/universites/public/${editForm.universiteId}/departements`)
      .then(res => {
        if (actif) setDepartementsEdit(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (actif) setDepartementsEdit([]);
      });
    return () => { actif = false; };
  }, [isEditing, editForm?.universiteId]);

  useEffect(() => {
    if (!isEditing || !editForm?.departementId) {
      setFilieresEdit([]);
      return;
    }

    let actif = true;
    api.get(`/api/departements/public/${editForm.departementId}/filieres`)
      .then(res => {
        if (actif) setFilieresEdit(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (actif) setFilieresEdit([]);
      });
    return () => { actif = false; };
  }, [isEditing, editForm?.departementId]);

  useEffect(() => {
    if (!isEditing || !editForm?.filiereId) {
      setPromotionsEdit([]);
      return;
    }

    let actif = true;
    api.get(`/api/promotions/filiere/${editForm.filiereId}`)
      .then(res => {
        if (actif) setPromotionsEdit(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (actif) setPromotionsEdit([]);
      });
    return () => { actif = false; };
  }, [isEditing, editForm?.filiereId]);

  // ✅ 10. Vérification des droits
  if (!isSuperAdmin && !adminUniId) {
    return (
      <div className="page">
        <div className="alert-erreur">
          Vous n'êtes pas autorisé à accéder à cette page. Seuls les administrateurs d'université peuvent gérer les dossiers.
        </div>
      </div>
    );
  }

  const dossiersList = Array.isArray(dossiers) ? dossiers : [];
  const dossiersFiltres = dossiersList.filter(d => !filtrePaiement || (filtrePaiement === 'PAYE' ? d.fraisInscriptionPayes : !d.fraisInscriptionPayes));
  const selectedUniversite = universites?.find(u => u.id === parseInt(universiteId));
  const totalDossiers = dossiersList.length;
  const totalEnAttente = dossiersList.filter(d => d.statut === 'EN_ATTENTE').length;
  const totalValides = dossiersList.filter(d => d.statut === 'VALIDE').length;
  const totalRejetes = dossiersList.filter(d => d.statut === 'REJETE').length;
  const totalPayes = dossiersList.filter(d => d.fraisInscriptionPayes).length;
  const tauxTraitement = totalDossiers ? Math.round(((totalValides + totalRejetes) / totalDossiers) * 100) : 0;

  return (
    <div className="page admin-dossiers-page">
      <div className="admissions-hero">
        <div className="admissions-hero-main">
          <div className="admissions-hero-mark"><FaFolderOpen /></div>
          <div>
            <div className="admissions-eyebrow">Admissions universitaires</div>
            <h1 className="admissions-title">Gestion des dossiers d'inscription</h1>
            <p className="admissions-subtitle">
              Tableau de traitement des candidatures, paiements, pièces justificatives et décisions d'admission.
            </p>
          </div>
        </div>
        <button className="admissions-refresh" onClick={chargerDossiers} disabled={!universiteId || loadingDossiers}>
          <FaSyncAlt />
          {loadingDossiers ? 'Actualisation...' : 'Rafraîchir'}
        </button>
      </div>

      <div className="admissions-metrics-grid">
        <DossierMetric icon={FaFolderOpen} label="Dossiers chargés" value={totalDossiers} detail={selectedUniversite?.nom || 'Sélection université'} tone="blue" />
        <DossierMetric icon={FaClock} label="En attente" value={totalEnAttente} detail="À examiner" tone="amber" />
        <DossierMetric icon={FaCheckCircle} label="Validés" value={totalValides} detail={`${tauxTraitement}% traités`} tone="green" />
        <DossierMetric icon={FaMoneyBillWave} label="Frais payés" value={totalPayes} detail={`${totalRejetes} rejeté${totalRejetes > 1 ? 's' : ''}`} tone="ink" />
      </div>

      {message && <div className="alert-success" onClick={() => setMessage('')}>{message}</div>}
      {error && <div className="alert-erreur">{error}</div>}

      {credentials && (
        <div className="admissions-credentials">
          <button
            onClick={() => setCredentials(null)}
            className="admissions-credentials-close"
          >✕</button>
          <h3>
            <FaUserGraduate /> Compte étudiant créé
          </h3>
          <p>Transmettez ces identifiants à l'étudiant. Ils ne seront plus affichés après fermeture.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontFamily: 'monospace', fontSize: 14 }}>
            <span style={{ color: 'var(--text-secondary)', fontFamily: 'inherit' }}>Matricule :</span>
            <strong style={{ color: '#1D9E75' }}>{credentials.matricule}</strong>
            <span style={{ color: 'var(--text-secondary)', fontFamily: 'inherit' }}>Email :</span>
            <strong style={{ color: '#1D9E75' }}>{credentials.email}</strong>
            <span style={{ color: 'var(--text-secondary)', fontFamily: 'inherit' }}>Mot de passe :</span>
            <strong style={{ color: '#1D9E75', letterSpacing: 2 }}>{credentials.motDePasse}</strong>
          </div>
          <button
            onClick={copyCredentials}
            className={copied ? 'admissions-copy admissions-copy--done' : 'admissions-copy'}
          >
            {copied ? '✅ Copié !' : '📋 Copier les identifiants'}
          </button>
        </div>
      )}

      {/* Filtres */}
      <div className="admissions-toolbar">
        <div className="admissions-toolbar-title">
          <FaFilter />
          <div>
            <strong>Filtres de traitement</strong>
            <span>{dossiersFiltres.length} dossier{dossiersFiltres.length > 1 ? 's' : ''} visible{dossiersFiltres.length > 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="admissions-filters">
          {isSuperAdmin && (
            <div className="form-group admissions-filter-field">
              <label>Université</label>
              <select 
                value={universiteId} 
                onChange={e => setUniversiteId(e.target.value)}
                required
                disabled={loadingUniv}
              >
                <option value="">-- Sélectionner une université --</option>
                {(universites || []).map(u => (
                  <option key={u.id} value={u.id}>{u.nom}</option>
                ))}
              </select>
            </div>
          )}
          
          <div className="form-group admissions-filter-field">
            <label>Statut</label>
            <select 
              value={statutFiltre} 
              onChange={e => setStatutFiltre(e.target.value)}
            >
              <option value="">Tous</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="DOCUMENTS_MANQUANTS">Documents manquants</option>
              <option value="TEST_ADMISSION">Test d'admission</option>
              <option value="VALIDE">Validé</option>
              <option value="REJETE">Rejeté</option>
            </select>
          </div>

          <div className="form-group admissions-filter-field admissions-filter-field--small">
            <label>Paiement</label>
            <select value={filtrePaiement} onChange={e => setFiltrePaiement(e.target.value)}>
              <option value="">Tous</option>
              <option value="PAYE">💰 Payé</option>
              <option value="NON_PAYE">⏳ Non payé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des dossiers */}
      <div className="admissions-list-panel">
        <div className="admissions-list-head">
          <div>
            <h2>Dossiers {statutFiltre ? `(${getStatutLabel(statutFiltre)})` : ''}</h2>
            <p>{selectedUniversite?.nom || 'Choisissez une université pour afficher les candidatures'}</p>
          </div>
          <span className="admissions-count">{dossiersFiltres.length} résultat{dossiersFiltres.length > 1 ? 's' : ''}</span>
        </div>
        
        {loadingDossiers ? (
          <div className="admissions-loading"><span /> Chargement des dossiers...</div>
        ) : !dossiersList || dossiersList.length === 0 || dossiersFiltres.length === 0 ? (
          <div className="admissions-empty">
            <FaFolderOpen />
            <strong>Aucun dossier trouvé</strong>
            <span>Ajustez l'université, le statut ou le filtre de paiement.</span>
          </div>
        ) : (
          <div className="admissions-table-wrap">
            <table className="admissions-table">
              <thead>
                <tr>
                  <th>Dossier</th>
                  <th>Candidat</th>
                  <th>Contact</th>
                  <th>Niveau</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dossiersFiltres.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div className="admissions-reference">{d.numeroDossier}</div>
                      <div className="admissions-reference-sub">ID {d.id}</div>
                    </td>
                    <td>
                      <div className="admissions-student">
                        <div className="admissions-avatar">{getInitiales(d)}</div>
                        <div>
                          <strong>{d.prenom} {d.nom}</strong>
                          <span>{d.typeInscription || 'Nouvelle inscription'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="admissions-contact">{d.email}</div>
                      <div className="admissions-contact-muted">{d.telephone || 'Téléphone non renseigné'}</div>
                    </td>
                    <td><span className="admissions-level">{d.niveauVise || '—'}</span></td>
                    <td>{new Date(d.creeLe).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <div className="admissions-status-stack">
                        <span className={`badge ${getStatutBadge(d.statut)}`}>
                          {getStatutLabel(d.statut)}
                        </span>
                        <span className={d.fraisInscriptionPayes ? 'admissions-pay admissions-pay--ok' : 'admissions-pay admissions-pay--wait'}>
                          {d.fraisInscriptionPayes ? 'Payé' : 'Non payé'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="admissions-actions">
                        <button
                          className="admissions-open"
                          onClick={() => ouvrirDossier(d)}
                        >
                          <FaEye /> Ouvrir
                        </button>
                        {d.statut === 'VALIDE' && (
                          <button className="admissions-letter" onClick={() => voirLettre(d.id)}>
                            Lettre
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Détail complet du dossier */}
      {selectedDossier && (() => {
        const d = selectedDossier;
        const uniNom = universites?.find(u => u.id === d.universiteId)?.nom || `Université #${d.universiteId}`;
        const docsFournis = DOCUMENTS.filter(([k]) => d[k]).length;
        return (
        <div className="modal-overlay admissions-modal-overlay" onClick={() => setSelectedDossier(null)}>
          <div className="admissions-modal" onClick={e => e.stopPropagation()}>
            <div className="admissions-detail-head">
              <div>
                <div className="admissions-detail-kicker">Dossier candidat</div>
                <h3>Dossier {d.numeroDossier}</h3>
                <div className="admissions-detail-badges">
                  <span className={`badge ${getStatutBadge(d.statut)}`}>{getStatutLabel(d.statut)}</span>
                  <span className={d.fraisInscriptionPayes ? 'admissions-pay admissions-pay--ok' : 'admissions-pay admissions-pay--wait'}>
                    {d.fraisInscriptionPayes ? 'Frais payés' : 'Frais non payés'}
                  </span>
                </div>
                {d.agentAdmissionNom && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)' }}>👤 Agent : {d.agentAdmissionNom}</span>
                )}
              </div>
              <div className="admissions-detail-actions">
                <button className="btn-outline" onClick={() => setIsEditing(v => !v)}>
                  {isEditing ? 'Annuler la modification' : '✏️ Modifier'}
                </button>
                <button className="btn-outline" onClick={() => setSelectedDossier(null)}>✕</button>
              </div>
            </div>

            {isEditing && editForm && (
              <div style={{ marginBottom: 20, padding: 16, border: '1px solid var(--border-color)', borderRadius: 12, background: 'var(--bg-secondary)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#185FA5', marginBottom: 12 }}>
                  Correction du formulaire d'inscription
                </div>

                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
                  <div className="form-group"><label>Nom</label><input value={editForm.nom} onChange={e => updateEditField('nom', e.target.value)} /></div>
                  <div className="form-group"><label>Prénom</label><input value={editForm.prenom} onChange={e => updateEditField('prenom', e.target.value)} /></div>
                  <div className="form-group"><label>Email</label><input type="email" value={editForm.email} onChange={e => updateEditField('email', e.target.value)} /></div>
                  <div className="form-group"><label>Téléphone</label><input value={editForm.telephone} onChange={e => updateEditField('telephone', e.target.value)} /></div>
                  <div className="form-group"><label>Téléphone 2</label><input value={editForm.telephone2} onChange={e => updateEditField('telephone2', e.target.value)} /></div>
                  <div className="form-group"><label>Sexe</label><select value={editForm.sexe} onChange={e => updateEditField('sexe', e.target.value)}><option value="">--</option><option value="M">Masculin</option><option value="F">Féminin</option></select></div>
                  <div className="form-group"><label>Date de naissance</label><input type="date" value={editForm.dateNaissance} onChange={e => updateEditField('dateNaissance', e.target.value)} /></div>
                  <div className="form-group"><label>Lieu de naissance</label><input value={editForm.lieuNaissance} onChange={e => updateEditField('lieuNaissance', e.target.value)} /></div>
                  <div className="form-group"><label>Nationalité</label><input value={editForm.nationalite} onChange={e => updateEditField('nationalite', e.target.value)} /></div>
                  <div className="form-group"><label>État civil</label><input value={editForm.etatCivil} onChange={e => updateEditField('etatCivil', e.target.value)} /></div>
                  <div className="form-group"><label>Province</label><input value={editForm.province} onChange={e => updateEditField('province', e.target.value)} /></div>
                  <div className="form-group"><label>Ville</label><input value={editForm.ville} onChange={e => updateEditField('ville', e.target.value)} /></div>
                  <div className="form-group"><label>Commune</label><input value={editForm.commune} onChange={e => updateEditField('commune', e.target.value)} /></div>
                  <div className="form-group"><label>Quartier</label><input value={editForm.quartier} onChange={e => updateEditField('quartier', e.target.value)} /></div>
                  <div className="form-group"><label>Avenue</label><input value={editForm.avenue} onChange={e => updateEditField('avenue', e.target.value)} /></div>
                  <div className="form-group"><label>N° résidence</label><input value={editForm.numeroResidence} onChange={e => updateEditField('numeroResidence', e.target.value)} /></div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Adresse</label><input value={editForm.adresse} onChange={e => updateEditField('adresse', e.target.value)} /></div>
                </div>

                <div style={{ fontSize: 13, fontWeight: 700, color: '#185FA5', margin: '16px 0 10px' }}>Affectation académique</div>
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
                  <div className="form-group">
                    <label>Université</label>
                    <select value={editForm.universiteId} onChange={e => setEditForm(prev => ({ ...prev, universiteId: e.target.value, departementId: '', filiereId: '', promotionId: '' }))}>
                      <option value="">-- Sélectionner --</option>
                      {(universites || []).map(u => <option key={u.id} value={u.id}>{u.nom}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Département</label>
                    <select value={editForm.departementId} onChange={e => setEditForm(prev => ({ ...prev, departementId: e.target.value, filiereId: '', promotionId: '' }))}>
                      <option value="">-- Sélectionner --</option>
                      {departementsEdit.map(dep => <option key={dep.id} value={dep.id}>{dep.nom}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Filière</label>
                    <select value={editForm.filiereId} onChange={e => setEditForm(prev => ({ ...prev, filiereId: e.target.value, promotionId: '' }))}>
                      <option value="">-- Sélectionner --</option>
                      {filieresEdit.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Promotion</label>
                    <select value={editForm.promotionId} onChange={e => updateEditField('promotionId', e.target.value)}>
                      <option value="">Automatique selon le niveau</option>
                      {promotionsEdit.map(p => <option key={p.id} value={p.id}>{p.libelle}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label>Niveau visé</label><input value={editForm.niveauVise} onChange={e => updateEditField('niveauVise', e.target.value)} /></div>
                  <div className="form-group"><label>Type d'inscription</label><input value={editForm.typeInscription} onChange={e => updateEditField('typeInscription', e.target.value)} /></div>
                  <div className="form-group"><label>École secondaire</label><input value={editForm.ecoleSecondaire} onChange={e => updateEditField('ecoleSecondaire', e.target.value)} /></div>
                  <div className="form-group"><label>Province école</label><input value={editForm.provinceEcole} onChange={e => updateEditField('provinceEcole', e.target.value)} /></div>
                  <div className="form-group"><label>Année d'obtention</label><input value={editForm.anneeObtention} onChange={e => updateEditField('anneeObtention', e.target.value)} /></div>
                  <div className="form-group"><label>N° diplôme</label><input value={editForm.numeroDiplome} onChange={e => updateEditField('numeroDiplome', e.target.value)} /></div>
                  <div className="form-group"><label>Pourcentage</label><input value={editForm.pourcentage} onChange={e => updateEditField('pourcentage', e.target.value)} /></div>
                  <div className="form-group"><label>Option</label><input value={editForm.option} onChange={e => updateEditField('option', e.target.value)} /></div>
                </div>

                <div style={{ fontSize: 13, fontWeight: 700, color: '#185FA5', margin: '16px 0 10px' }}>Parents, tuteur et urgence</div>
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
                  <div className="form-group"><label>Père</label><input value={editForm.pereNom} onChange={e => updateEditField('pereNom', e.target.value)} /></div>
                  <div className="form-group"><label>Profession père</label><input value={editForm.pereProfession} onChange={e => updateEditField('pereProfession', e.target.value)} /></div>
                  <div className="form-group"><label>Tél. père</label><input value={editForm.pereTelephone} onChange={e => updateEditField('pereTelephone', e.target.value)} /></div>
                  <div className="form-group"><label>Mère</label><input value={editForm.mereNom} onChange={e => updateEditField('mereNom', e.target.value)} /></div>
                  <div className="form-group"><label>Profession mère</label><input value={editForm.mereProfession} onChange={e => updateEditField('mereProfession', e.target.value)} /></div>
                  <div className="form-group"><label>Tél. mère</label><input value={editForm.mereTelephone} onChange={e => updateEditField('mereTelephone', e.target.value)} /></div>
                  <div className="form-group"><label>Tuteur</label><input value={editForm.tuteurNom} onChange={e => updateEditField('tuteurNom', e.target.value)} /></div>
                  <div className="form-group"><label>Lien tuteur</label><input value={editForm.tuteurLien} onChange={e => updateEditField('tuteurLien', e.target.value)} /></div>
                  <div className="form-group"><label>Tél. tuteur</label><input value={editForm.tuteurTelephone} onChange={e => updateEditField('tuteurTelephone', e.target.value)} /></div>
                  <div className="form-group"><label>Adresse tuteur</label><input value={editForm.tuteurAdresse} onChange={e => updateEditField('tuteurAdresse', e.target.value)} /></div>
                  <div className="form-group"><label>Contact urgence</label><input value={editForm.urgenceNom} onChange={e => updateEditField('urgenceNom', e.target.value)} /></div>
                  <div className="form-group"><label>Tél. urgence</label><input value={editForm.urgenceTelephone} onChange={e => updateEditField('urgenceTelephone', e.target.value)} /></div>
                  <div className="form-group"><label>Allergies</label><input value={editForm.allergies} onChange={e => updateEditField('allergies', e.target.value)} /></div>
                  <div className="form-group"><label>Handicap</label><input value={editForm.handicap} onChange={e => updateEditField('handicap', e.target.value)} /></div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Commentaire interne</label><textarea rows="2" value={editForm.commentaire} onChange={e => updateEditField('commentaire', e.target.value)} /></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                  <button className="btn-outline" onClick={() => setIsEditing(false)}>Annuler</button>
                  <button className="btn-primary" onClick={sauvegarderDossier} disabled={savingEdit}>
                    {savingEdit ? '⏳ Enregistrement...' : '💾 Enregistrer les corrections'}
                  </button>
                </div>
              </div>
            )}

            <Section title="👤 Identité">
              <Info label="Nom" value={val(d.nom)} />
              <Info label="Prénom" value={val(d.prenom)} />
              <Info label="Sexe" value={d.sexe === 'F' ? 'Féminin' : d.sexe === 'M' ? 'Masculin' : '—'} />
              <Info label="Date de naissance" value={fmtDate(d.dateNaissance)} />
              <Info label="Lieu de naissance" value={val(d.lieuNaissance)} />
              <Info label="Nationalité" value={val(d.nationalite)} />
              <Info label="État civil" value={val(d.etatCivil)} />
            </Section>

            <Section title="📞 Coordonnées & adresse">
              <Info label="Email" value={val(d.email)} />
              <Info label="Téléphone" value={val(d.telephone)} />
              <Info label="Téléphone 2" value={val(d.telephone2)} />
              <Info label="Adresse" value={val(d.adresse)} />
              <Info label="Ville" value={val(d.ville)} />
              <Info label="Commune" value={val(d.commune)} />
            </Section>

            <Section title="🎓 Parcours académique">
              <Info label="Université" value={uniNom} />
              <Info label="Niveau visé" value={val(d.niveauVise)} />
              <Info label="Type d'inscription" value={val(d.typeInscription)} />
              <Info label="École secondaire" value={val(d.ecoleSecondaire)} />
              <Info label="Province école" value={val(d.provinceEcole)} />
              <Info label="Année d'obtention" value={val(d.anneeObtention)} />
              <Info label="N° diplôme" value={val(d.numeroDiplome)} />
              <Info label="Pourcentage" value={val(d.pourcentage)} />
              <Info label="Option" value={val(d.option)} />
            </Section>

            <Section title="👨‍👩‍👧 Parents, tuteur & urgence">
              <Info label="Père" value={val(d.pereNom)} />
              <Info label="Tél. père" value={val(d.pereTelephone)} />
              <Info label="Mère" value={val(d.mereNom)} />
              <Info label="Tél. mère" value={val(d.mereTelephone)} />
              <Info label="Tuteur" value={val(d.tuteurNom)} />
              <Info label="Tél. tuteur" value={val(d.tuteurTelephone)} />
              <Info label="Contact urgence" value={val(d.urgenceNom)} />
              <Info label="Tél. urgence" value={val(d.urgenceTelephone)} />
            </Section>

            <Section title="💳 Frais d'inscription">
              <Info label="Statut" value={d.fraisInscriptionPayes ? '💰 Payé' : '⏳ Non payé'} />
              <Info label="Référence" value={val(d.referencePaiement)} />
              <Info label="Date de paiement" value={fmtDate(d.datePaiementInscription)} />
            </Section>
            {!d.fraisInscriptionPayes && (
              <div style={{ marginBottom: 18 }}>
                <button className="btn-outline" onClick={() => marquerPaye(d.id)}>💰 Marquer les frais comme payés</button>
              </div>
            )}

            {/* Documents téléversés + analyse machine locale */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#185FA5', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid var(--border-color)', paddingBottom: 6, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span>📎 Documents</span>
                <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: docsFournis ? '#16a34a' : '#dc2626' }}>{docsFournis}/{DOCUMENTS.length} fournis</span>
                  {docsFournis > 0 && (
                    <button className="btn-outline" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => analyserPieces(d.id)} disabled={analysing}>
                      {analysing ? '⏳ Analyse...' : '🔍 Analyser (local)'}
                    </button>
                  )}
                </span>
              </div>

              {analyses && analyses.ocrDisponible === false && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px' }}>
                  ℹ️ OCR local inactif (données de langue absentes) — contrôles techniques et doublons uniquement.
                </p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 8 }}>
                {DOCUMENTS.map(([key, label]) => {
                  const a = analyses?.documents?.[key];
                  const couleur = a ? (a.niveau === 'OK' ? '#16a34a' : a.niveau === 'ATTENTION' ? '#c07a2b' : '#dc2626') : 'var(--border-color)';
                  return (
                    <div key={key} style={{ fontSize: 13, border: `1px solid ${couleur}`, borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{label}</span>
                        {d[key]
                          ? <button
                              type="button"
                              onClick={() => voirPiece(d[key], label)}
                              style={{ fontWeight: 600, color: '#185FA5', background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}
                            >👁 Voir</button>
                          : <span style={{ color: 'var(--text-muted)' }}>Non fourni</span>}
                      </div>
                      {a && (
                        <div style={{ marginTop: 6, fontSize: 11 }}>
                          <span style={{ fontWeight: 700, color: couleur }}>
                            {a.niveau === 'OK' ? '✅' : a.niveau === 'ATTENTION' ? '⚠️' : '❌'} {a.score}/100
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {' · '}{a.typeDetecte}{a.largeur ? ` · ${a.largeur}×${a.hauteur}` : ''}{a.pages ? ` · ${a.pages} p.` : ''}{a.tailleKo ? ` · ${a.tailleKo} Ko` : ''}
                          </span>
                          {a.nomTrouve !== undefined && (
                            <span style={{ marginLeft: 6, color: a.nomTrouve ? '#16a34a' : '#dc2626' }}>{a.nomTrouve ? '· nom ✓' : '· nom ✗'}</span>
                          )}
                          {a.numeroDetecte && <span style={{ color: 'var(--text-muted)' }}> · n° {a.numeroDetecte}</span>}
                          {Array.isArray(a.alertes) && a.alertes.length > 0 && (
                            <ul style={{ margin: '4px 0 0', paddingLeft: 16, color: couleur }}>
                              {a.alertes.map((al, i) => <li key={i}>{al}</li>)}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {docsFournis === 0 && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  ⚠️ Aucun document n'a été téléversé avec ce dossier.
                </p>
              )}
            </div>

            {/* Actions selon le statut */}
            {d.statut === 'EN_ATTENTE' && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                {/* 1. Valider */}
                <div className="form-group">
                  <label>Commentaire (note interne, optionnel)</label>
                  <textarea rows="2" value={commentaire} onChange={e => setCommentaire(e.target.value)} placeholder="Ajouter une note interne..." />
                </div>
                <button className="btn-primary" style={{ width: '100%', background: '#1D9E75', marginBottom: 18, opacity: validating ? 0.6 : 1, cursor: validating ? 'not-allowed' : 'pointer' }} disabled={validating} onClick={() => validerDossier(d.id)}>{validating ? '⏳ Validation...' : "✅ Valider l'admission"}</button>

                {/* 1a. Vérification du Diplôme d'État : code EXETAT (année ≥ 2022) */}
                {exetatRequis(d) && !d.exetatVerifie && (
                  <div style={{ background: 'rgba(24,95,165,0.10)', border: '1px solid #93c5fd', borderRadius: 10, padding: 14, marginBottom: 18 }}>
                    <div style={{ fontWeight: 700, color: '#185FA5', fontSize: 13 }}>🎓 Vérification du Diplôme d'État (EXETAT requis, diplôme {anneeNum(d.anneeObtention)})</div>
                    <p style={{ fontSize: 11, color: '#185FA5', margin: '4px 0 10px' }}>
                      Code EXETAT : <strong>{d.codeExetat || '— non renseigné —'}</strong>. Vérifiez-le sur la plateforme officielle, puis confirmez ci-dessous. La validation est bloquée tant que l'EXETAT n'est pas vérifié.
                    </p>
                    <button className="btn-outline" style={{ width: '100%' }} disabled={!d.codeExetat} onClick={() => verifierExetat(d.id)}>✅ Marquer l'EXETAT vérifié</button>
                  </div>
                )}
                {exetatRequis(d) && d.exetatVerifie && (
                  <div style={{ background: 'rgba(29,158,117,0.10)', border: '1px solid #86efac', borderRadius: 10, padding: '8px 12px', marginBottom: 18, fontSize: 12, color: '#166534' }}>
                    🎓 EXETAT vérifié{d.exetatVerifiePar ? ` par ${d.exetatVerifiePar}` : ''}.
                  </div>
                )}

                {/* 1bis. Test d'admission requis : la filière l'exige OU diplôme < 60% (calculé côté serveur) */}
                {d.testAdmissionRequis && (
                  <div style={{ background: 'rgba(192,122,43,0.12)', border: '1px solid #fcd34d', borderRadius: 10, padding: 14, marginBottom: 18 }}>
                    <div style={{ fontWeight: 700, color: '#92600a', fontSize: 13 }}>
                      📝 Test d'admission requis {pct(d.pourcentage) < 60 ? `(diplôme ${d.pourcentage || '?'}% < 60%)` : '(exigé pour cette filière)'}
                    </div>
                    <p style={{ fontSize: 11, color: '#92600a', margin: '4px 0 10px' }}>La validation est bloquée tant que le test n'est pas réussi. Convoquez le candidat (email), puis marquez le test réussi. Vous pouvez ajouter la date/le lieu dans la zone « Communiquer » ci-dessous — elle sera incluse dans l'email de convocation.</p>
                    <button className="btn-outline" style={{ width: '100%' }} onClick={() => convoquerTest(d.id)}>📤 Convoquer au test d'admission</button>
                  </div>
                )}

                {/* 2. Demander des documents manquants */}
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: 14, marginBottom: 18 }}>
                  <div style={{ fontWeight: 700, color: '#185FA5', fontSize: 13, marginBottom: 4 }}>📄 Demander des documents manquants</div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 10px' }}>Un accès sera créé pour l'étudiant afin qu'il ajoute les pièces demandées.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 6, marginBottom: 10 }}>
                    {DOCUMENTS.map(([key, label]) => (
                      <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={docsRequis.includes(key)}
                          onChange={e => setDocsRequis(prev => e.target.checked ? [...prev, key] : prev.filter(k => k !== key))}
                        />
                        <span>{label}{!d[key] && <span style={{ color: '#dc2626', fontSize: 10 }}> (absent)</span>}</span>
                      </label>
                    ))}
                  </div>
                  <textarea rows="2" value={messageDemande} onChange={e => setMessageDemande(e.target.value)} placeholder="Message à l'étudiant (optionnel)..." style={{ width: '100%', marginBottom: 8 }} />
                  <button className="btn-outline" style={{ width: '100%' }} onClick={() => demanderDocuments(d.id)}>📤 Demander ces documents</button>
                </div>

                {/* 3. Rejeter — motifs en 1 clic */}
                <div style={{ background: 'rgba(220,53,69,0.06)', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontWeight: 700, color: '#dc2626', fontSize: 13, marginBottom: 8 }}>❌ Rejeter le dossier</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {MOTIFS_REJET.map(m => (
                      <button key={m} type="button" onClick={() => setMotifRejet(m)}
                        style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, border: '1px solid #fca5a5', background: motifRejet === m ? '#dc2626' : 'transparent', color: motifRejet === m ? '#fff' : '#dc2626', cursor: 'pointer' }}>
                        {m}
                      </button>
                    ))}
                  </div>
                  <textarea rows="2" value={motifRejet} onChange={e => setMotifRejet(e.target.value)} placeholder="Motif du rejet (cliquez un motif ci-dessus ou saisissez)..." style={{ width: '100%', marginBottom: 8 }} />
                  <button className="btn-danger" style={{ width: '100%' }} onClick={() => rejeterDossier(d.id)}>❌ Rejeter</button>
                </div>
              </div>
            )}
            {d.statut === 'DOCUMENTS_MANQUANTS' && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, fontSize: 13, color: '#c07a2b' }}>
                ⏳ En attente que l'étudiant téléverse les documents demandés.
                {d.documentsDemandes && (
                  <div style={{ marginTop: 6, color: 'var(--text-secondary)' }}>
                    <strong>Documents demandés :</strong> {d.documentsDemandes.split(',').map(k => (DOCUMENTS.find(([kk]) => kk === k) || [k, k])[1]).join(', ')}
                  </div>
                )}
                {d.messageSecretaire && <div style={{ marginTop: 4, color: 'var(--text-muted)' }}><strong>Message :</strong> {d.messageSecretaire}</div>}
              </div>
            )}
            {d.statut === 'VALIDE' && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => voirLettre(d.id)} className="btn-primary" style={{ border: 'none', cursor: 'pointer' }}>🎓 Voir la lettre d'admission</button>
                  <button onClick={() => renvoyerActivation(d.id)} className="btn-outline" style={{ cursor: 'pointer' }}>📧 Renvoyer l'activation + lettre</button>
                </div>
                {d.commentaire && <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 10 }}><strong>Note :</strong> {d.commentaire}</p>}
              </div>
            )}
            {d.statut === 'REJETE' && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, color: '#dc2626', fontSize: 13 }}>
                <strong>Motif du rejet :</strong> {d.motifRejet || '—'}
              </div>
            )}

            {d.statut === 'TEST_ADMISSION' && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                <div style={{ fontWeight: 700, color: '#92600a', marginBottom: 6 }}>📝 En attente du test d'admission</div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>Candidat convoqué au test d'admission{pct(d.pourcentage) < 60 ? ` (diplôme ${d.pourcentage || '?'}% < 60%)` : ''}. Une fois le test réussi, marquez-le pour pouvoir valider l'admission.</p>
                <button className="btn-primary" style={{ background: '#16a34a', border: 'none', cursor: 'pointer' }} onClick={() => marquerTestReussi(d.id)}>✅ Marquer le test réussi</button>
              </div>
            )}

            {/* ✉️ Communication secrétariat → candidat (statuts non finaux) */}
            {['EN_ATTENTE', 'TEST_ADMISSION', 'DOCUMENTS_MANQUANTS'].includes(d.statut) && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, marginTop: 16 }}>
                <div style={{ fontWeight: 700, color: '#185FA5', fontSize: 13, marginBottom: 6 }}>✉️ Communiquer avec le candidat</div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '0 0 8px' }}>Envoyez une info par email à {d.email} (date du test, pièces à fournir, rappels…).</p>
                <input value={msgSujet} onChange={e => setMsgSujet(e.target.value)} placeholder="Sujet (ex: Date du test d'admission)" style={{ width: '100%', marginBottom: 6, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-color)' }} />
                <textarea rows="3" value={msgCandidat} onChange={e => setMsgCandidat(e.target.value)} placeholder="Votre message au candidat..." style={{ width: '100%', marginBottom: 8 }} />
                <button className="btn-outline" style={{ width: '100%' }} onClick={() => envoyerMessageCandidat(d.id)}>📧 Envoyer le message</button>
              </div>
            )}
          </div>
        </div>
        );
      })()}
    </div>
  );
}