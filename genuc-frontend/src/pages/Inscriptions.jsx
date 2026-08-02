// src/pages/Inscriptions.jsx
// Version professionnelle avec validation avancée, animations et UX améliorée
import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { inscriptionStorage } from '../services/inscriptionStorage';
import { vacationService } from '../services/vacationService';
import FileUploadPreview from '../components/FileUploadPreview';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { useDebounce } from '../hooks/useDebounce';
import useDraggableDialog from '../hooks/useDraggableDialog';
import { DOCUMENTS_CATALOGUE, DOCUMENTS_PAR_DEFAUT, parseDocumentsRequis, libelleDocument, acceptDocument } from '../utils/documentsInscription';
import './Dashboard.css';

// ─── Constantes ───────────────────────────────────────────────
const NIVEAUX = [
  { id: 'L1', libelle: 'Licence 1 (L1)' },
  { id: 'L2', libelle: 'Licence 2 (L2)' },
  { id: 'L3', libelle: 'Licence 3 (L3)' },
  { id: 'MASTER', libelle: 'Master' },
];

const ETAPES = [
  { num: 1, label: 'Identité',      icon: '👤' },
  { num: 2, label: 'Académique',    icon: '🎓' },
  { num: 3, label: 'Parents',       icon: '👨‍👩‍👧' },
  { num: 4, label: 'Documents',     icon: '📎' },
  { num: 5, label: 'Révision',      icon: '🔍' },
  { num: 6, label: 'Finalisation',  icon: '🚀' },
];

// Le code EXETAT est obligatoire pour un Diplôme d'État obtenu en 2022 ou après.
function exetatObligatoire(anneeObtention) {
  const m = String(anneeObtention || '').match(/\d{4}/);
  return m ? parseInt(m[0], 10) >= 2022 : false;
}

// ─── Styles améliorés ──────────────────────────────────────────
const S = {
  input: {
    width: '100%',
    padding: '8px 12px',
    fontSize: '13px',
    borderRadius: '8px',
    border: '1.5px solid var(--border-color)',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    backgroundColor: 'var(--bg-card)',
    color: 'var(--text-primary)',
  },
  inputErr: {
    width: '100%',
    padding: '8px 12px',
    fontSize: '13px',
    borderRadius: '8px',
    border: '1.5px solid #ef4444',
    boxSizing: 'border-box',
    backgroundColor: 'rgba(220,53,69,0.10)',
    color: '#1f2937',
  },
  label: { display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '13px', color: 'var(--text-secondary)' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' },
  full: { gridColumn: 'span 2' },
  section: { marginBottom: '22px' },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#185FA5',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '2px solid var(--border-color)',
    paddingBottom: '8px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  hint: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' },
  badge: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 600,
    background: 'rgba(24,95,165,0.12)',
    color: '#185FA5',
  },
  fileBox: {
    border: '2px dashed #cbd5e1',
    borderRadius: '8px',
    padding: '16px',
    background: 'var(--bg-secondary)',
    cursor: 'pointer',
    textAlign: 'center',
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  fileBoxOk: {
    border: '2px solid #22c55e',
    borderRadius: '8px',
    padding: '16px',
    background: 'rgba(29,158,117,0.12)',
    textAlign: 'center',
    fontSize: '13px',
    color: '#1D9E75',
  },
  revSection: {
    background: 'var(--bg-secondary)',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    border: '1px solid var(--border-color)',
  },
  revHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  revTitle: { fontWeight: 700, color: '#185FA5', fontSize: '15px' },
  revEdit: {
    background: 'none',
    border: '1px solid #185FA5',
    color: '#185FA5',
    borderRadius: '6px',
    padding: '6px 14px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    transition: 'all 0.2s',
  },
  revEditHover: { background: '#185FA5', color: '#fff' },
  revGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  revItem: { fontSize: '14px', padding: '4px 0' },
  revKey: { fontWeight: 600, color: 'var(--text-muted)', display: 'block', fontSize: '12px' },
  revVal: { color: 'var(--text-primary)', fontWeight: 500 },
  errorText: { color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: 500 },
};

// ─── Composants champs améliorés ──────────────────────────────
function F({ label, name, required, type = 'text', value, onChange, error, hint, span2, children, ...rest }) {
  const inputId = `field_${name}`;
  const autoComplete = {
    email: 'email',
    telephone1: 'tel',
    telephone2: 'tel',
    motDePasse: 'new-password',
    confirmMotDePasse: 'new-password',
  }[name] || 'off';

  return (
    <div style={span2 ? S.full : {}}>
      <label htmlFor={inputId} style={S.label}>
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
      </label>
      {children || (
        <input
          id={inputId}
          name={name}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          style={error ? S.inputErr : S.input}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          {...rest}
        />
      )}
      {error && <div style={S.errorText}>{error}</div>}
      {hint && !error && <div style={S.hint}>{hint}</div>}
    </div>
  );
}

function Sel({ label, name, required, disabled, value, onChange, error, children, span2 }) {
  const selectId = `sel_${name}`;
  return (
    <div style={span2 ? S.full : {}}>
      <label htmlFor={selectId} style={S.label}>
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>}
      </label>
      <select
        id={selectId}
        name={name}
        value={value ?? ''}
        onChange={onChange}
        disabled={disabled}
        style={{
          ...(error ? S.inputErr : S.input),
          background: disabled ? 'var(--bg-secondary)' : 'var(--bg-card)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        aria-invalid={!!error}
      >
        {children}
      </select>
      {error && <div style={S.errorText}>{error}</div>}
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────
export default function Inscriptions() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { panelStyle, dragHandleProps } = useDraggableDialog();
  const [showConfirmQuit, setShowConfirmQuit] = useState(false);
  const [etape, setEtape] = useState(1);
  const [erreurs, setErreurs] = useState({});
  const [msgGlobal, setMsgGlobal] = useState('');
  const [msgSuccess, setMsgSuccess] = useState('');
  const [chargement, setChargement] = useState(false);
  const [dossier, setDossier] = useState(null);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingFilieres, setLoadingFilieres] = useState(false);
  const [msgInfo, setMsgInfo] = useState('');
  const [universites, setUniversites] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [annees, setAnnees] = useState([]);
  const [vacations, setVacations] = useState([]);
  const [loadingVacations, setLoadingVacations] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldTouched, setFieldTouched] = useState({});
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const topRef = useRef(null);
  // Premières exécutions des cascades : ne pas réinitialiser les champs restaurés du brouillon.
  const uniFirst = useRef(true);
  const deptFirst = useRef(true);

  // ─── Formulaire initial ──────────────────────────────────────
  const initialForm = {
    nom: '', postnom: '', prenom: '', sexe: 'M',
    dateNaissance: '', lieuNaissance: '', nationalite: 'Congolaise',
    etatCivil: 'Célibataire',
    telephone1: '', telephone2: '', email: '',
    province: '', ville: '', commune: '', quartier: '', avenue: '', numeroResidence: '',
    anneeAcademiqueId: '', universiteId: '', departementId: '', filiereId: '',
    niveau: '', typeInscription: 'NOUVELLE', vacationId: '',
    ecoleSecondaire: '', provinceEcole: '', anneeObtention: '',
    numeroDiplome: '', pourcentage: '', option: '', codeExetat: '',
    pereNom: '', pereProfession: '', pereTelephone: '',
    mereNom: '', mereProfession: '', mereTelephone: '',
    tuteurNom: '', tuteurLien: '', tuteurTelephone: '', tuteurAdresse: '',
    urgenceNom: '', urgenceTelephone: '',
    allergies: '', handicap: '',
    photoIdentite: null,
    photoPasseport: null, diplomeEtat: null, attestationReussite: null, relevePoints: null,
    acteNaissance: null, attestationNationalite: null, carteIdentite: null,
    lettreRecommandation: null, attestationPhysique: null, attestationConduite: null,
    modePaiement: 'MOBILE_MONEY', numeroTransaction: '', bourse: false, montantPaye: 0,
    certifie: false, accepteReglement: false,
  };

  const [form, setForm] = useState(() => {
    // Chargement SYNCHRONE du brouillon à l'initialisation : évite que l'effet de
    // sauvegarde (débouncé) n'écrase le brouillon avec le formulaire vide au montage.
    const brouillon = inscriptionStorage.load();
    return brouillon ? { ...initialForm, ...brouillon } : initialForm;
  });
  const [, setFileNames] = useState({});

  // ─── Sauvegarde automatique (débouncée pour éviter une écriture à chaque frappe) ──
  const debouncedForm = useDebounce(form, 600);
  useEffect(() => {
    if (!dossier) {
      // Les objets File ne sont pas sérialisables proprement en JSON :
      // on les exclut du brouillon localStorage (l'utilisateur devra
      // ré-uploader ses documents après un rechargement de page).
      const { photoIdentite, photoPasseport, diplomeEtat, relevePoints,
        acteNaissance, attestationNationalite, carteIdentite,
        lettreRecommandation, attestationPhysique, attestationConduite,
        ...serializable } = debouncedForm; // eslint-disable-line no-unused-vars
      inscriptionStorage.save(serializable);
    }
  }, [debouncedForm, dossier]);


  // ─── Lecture des paramètres d’URL ────────────────────────────
  useEffect(() => {
    const uniId = searchParams.get('universiteId');
    const deptId = searchParams.get('departementId');
    const filId = searchParams.get('filiereId');
    const anneeId = searchParams.get('anneeAcademiqueId');

    if (uniId || deptId || filId || anneeId) {
      setPrefilled(true);
      if (uniId) setForm(p => ({ ...p, universiteId: uniId }));
      if (deptId) setForm(p => ({ ...p, departementId: deptId }));
      if (filId)  setForm(p => ({ ...p, filiereId: filId }));
      if (anneeId) setForm(p => ({ ...p, anneeAcademiqueId: anneeId }));
    }
  }, [searchParams]);

  // ─── Chargement initial ──────────────────────────────────────
  useEffect(() => {
    api.get('/api/universites/public')
      .then(r => setUniversites(r.data))
      .catch(() => {});
    api.get('/api/annees-academiques/public')
      .then(r => setAnnees(r.data))
      .catch(() => {});
  }, []);

  // ─── Départements selon université ──────────────────────────
  useEffect(() => {
    if (!form.universiteId) { setDepartements([]); return; }
    setLoadingDepts(true);
    setMsgInfo('');
    api.get(`/api/universites/public/${form.universiteId}/departements`)
      .then(r => {
        const d = Array.isArray(r.data) ? r.data : [];
        setDepartements(d);
        if (!d.length) setMsgInfo('Aucun département pour cette université.');
      })
      .catch(() => { setDepartements([]); setMsgInfo('Erreur chargement départements.'); })
      .finally(() => setLoadingDepts(false));
    // Ne pas effacer un choix pré-rempli via l'URL (arrivée depuis la fiche
    // publique d'une filière) : la réinitialisation en cascade écraserait
    // departementId/filiereId juste après leur injection.
    if (!prefilled && !uniFirst.current) {
      setForm(p => ({ ...p, departementId: '', filiereId: '', niveau: '' }));
      setFilieres([]);
    }
    uniFirst.current = false;
  }, [form.universiteId, prefilled]);

  // ─── Filières selon département ──────────────────────────────
  useEffect(() => {
    if (!form.departementId) { setFilieres([]); return; }
    setLoadingFilieres(true);
    setMsgInfo('');
    api.get(`/api/departements/public/${form.departementId}/filieres`)
      .then(r => {
        const f = r.data?.filieres || r.data || [];
        setFilieres(Array.isArray(f) ? f : []);
        if (!f.length) setMsgInfo('Aucune filière pour ce département.');
      })
      .catch(() => { setFilieres([]); setMsgInfo('Erreur chargement filières.'); })
      .finally(() => setLoadingFilieres(false));
    if (!prefilled && !deptFirst.current) {
      setForm(p => ({ ...p, filiereId: '', niveau: '' }));
    }
    deptFirst.current = false;
  }, [form.departementId, prefilled]);

  // ─── Vacations (Jour / Soir) ouvertes selon université ────────
  // On ne demande le choix que s'il y en a au moins deux ; une seule est
  // auto-sélectionnée (aucun choix à faire), zéro laisse les frais à l'université.
  useEffect(() => {
    if (!form.universiteId) { setVacations([]); setForm(p => ({ ...p, vacationId: '' })); return; }
    setLoadingVacations(true);
    vacationService.listerInscriptionsOuvertes(form.universiteId)
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : [];
        setVacations(list);
        setForm(p => ({ ...p, vacationId: list.length === 1 ? String(list[0].id) : '' }));
      })
      .catch(() => { setVacations([]); setForm(p => ({ ...p, vacationId: '' })); })
      .finally(() => setLoadingVacations(false));
  }, [form.universiteId]);

  // ─── Année académique active par défaut ──────────────────────
  useEffect(() => {
    if (annees.length && !form.anneeAcademiqueId) {
      const active = annees.find(a => a.active);
      if (active) setForm(p => ({ ...p, anneeAcademiqueId: active.id.toString() }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement volontaire au montage/changement de cle
  }, [annees]);

  // ─── Handlers ────────────────────────────────────────────────
  const handleChange = e => {
    const { name, value, type, checked, files } = e.target;
    setErreurs(p => ({ ...p, [name]: '' }));
    setFieldTouched(p => ({ ...p, [name]: true }));
    if (type === 'file') {
      const file = files[0];
      setForm(p => ({ ...p, [name]: file }));
      setFileNames(p => ({ ...p, [name]: file ? file.name : '' }));
    } else if (type === 'checkbox') {
      setForm(p => ({ ...p, [name]: checked }));
    } else {
      setForm(p => ({ ...p, [name]: value }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setFieldTouched(p => ({ ...p, [name]: true }));
  };

  // ─── Filière sélectionnée → exigences + documents prédéfinis ─
  const filiereSelectionnee = filieres.find(f => String(f.id) === String(form.filiereId)) || null;
  const docsRequisActifs = parseDocumentsRequis(filiereSelectionnee?.documentsRequis) || DOCUMENTS_PAR_DEFAUT;

  // ─── Validation par étape (fonction pure, réutilisable) ──────
  const getErreursEtape = (n) => {
    const e = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9+\s()-]{8,20}$/;

    if (n === 1) {
      const nom = form.nom.trim();
      const prenom = form.prenom.trim();
      if (!nom)              e.nom = 'Le nom est obligatoire.';
      else if (nom.length < 2)      e.nom = 'Le nom doit faire au moins 2 caractères.';
      if (!prenom)           e.prenom = 'Le prénom est obligatoire.';
      else if (prenom.length < 2)   e.prenom = 'Le prénom doit faire au moins 2 caractères.';
      if (!form.dateNaissance)           e.dateNaissance = 'La date de naissance est obligatoire.';
      if (!form.lieuNaissance.trim())    e.lieuNaissance = 'Le lieu de naissance est obligatoire.';
      if (!form.email.trim())            e.email = 'L\'email est obligatoire.';
      else if (!emailRegex.test(form.email)) e.email = 'Email invalide.';
      if (!form.telephone1.trim())       e.telephone1 = 'Le téléphone est obligatoire.';
      else if (!phoneRegex.test(form.telephone1)) e.telephone1 = 'Numéro de téléphone invalide.';
    }
    if (n === 2) {
      // Ces IDs sont requis côté serveur : on les valide toujours (même en mode "prefilled",
      // où un lien partiel pourrait laisser un champ vide → 400 à la soumission).
      if (!form.anneeAcademiqueId)  e.anneeAcademiqueId = 'Sélectionnez une année académique.';
      if (!form.universiteId)       e.universiteId = 'Sélectionnez une université.';
      if (!form.departementId)      e.departementId = 'Sélectionnez un département.';
      if (!form.filiereId)          e.filiereId = 'Sélectionnez une filière.';
      if (!form.niveau)             e.niveau = 'Sélectionnez un niveau.';
      // Choix de vacation demandé seulement si l'établissement en propose au moins deux.
      if (vacations.length >= 2 && !form.vacationId) {
        e.vacationId = 'Cette filière propose deux vacations (Jour/Soir) : choisissez-en une.';
      }
      // Code EXETAT obligatoire pour un Diplôme d'État obtenu en 2022 ou après.
      if (exetatObligatoire(form.anneeObtention) && !form.codeExetat.trim()) {
        e.codeExetat = 'Le code EXETAT est obligatoire pour un diplôme obtenu en 2022 ou après.';
      }
    }
    if (n === 4) {
      // Documents obligatoires définis par la filière (ou liste par défaut)
      docsRequisActifs.filter(d => d.obligatoire).forEach(doc => {
        // RDC : le diplôme d'État peut être remplacé par l'attestation de réussite
        // tant que le ministère ne l'a pas encore délivré.
        if (doc.key === 'diplomeEtat') {
          if (!form.diplomeEtat && !form.attestationReussite) {
            e.diplomeEtat = "Fournissez le diplôme d'État, ou l'attestation de réussite si le diplôme n'est pas encore délivré.";
          }
          return;
        }
        if (!form[doc.key]) e[doc.key] = `${libelleDocument(doc.key)} est obligatoire.`;
      });
    }
    if (n === 6) {
      if (!form.certifie) e.certifie = "Vous devez certifier l'exactitude des informations.";
      if (!form.accepteReglement) e.accepteReglement = 'Vous devez accepter le règlement intérieur.';
    }
    return e;
  };

  const valider = () => {
    const e = getErreursEtape(etape);
    setErreurs(e);
    if (Object.keys(e).length) {
      setMsgGlobal('⚠️ Veuillez corriger les champs en rouge.');
      // Faire défiler jusqu'au premier champ en erreur
      const firstError = document.querySelector('[aria-invalid="true"]');
      if (firstError) firstError.focus();
      return false;
    }
    setMsgGlobal('');
    return true;
  };

  // Revalide TOUTES les étapes (utilisé juste avant la soumission finale,
  // au cas où des données saisies plus tôt auraient été modifiées entre-temps
  // sans repasser par la validation de leur étape d'origine).
  const validerTout = () => {
    const etapesAValider = [1, 2, 4, 6];
    let toutesErreurs = {};
    let premiereEtapeEnErreur = null;
    etapesAValider.forEach(n => {
      const e = getErreursEtape(n);
      if (Object.keys(e).length && premiereEtapeEnErreur === null) {
        premiereEtapeEnErreur = n;
      }
      toutesErreurs = { ...toutesErreurs, ...e };
    });
    if (Object.keys(toutesErreurs).length) {
      setErreurs(toutesErreurs);
      setMsgGlobal(`⚠️ Certaines informations sont invalides ou incomplètes (étape ${premiereEtapeEnErreur}). Veuillez vérifier votre dossier.`);
      if (premiereEtapeEnErreur !== null) setEtape(premiereEtapeEnErreur);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    return true;
  };

  const suivant = () => {
    if (valider()) {
      setEtape(p => p + 1);
      setMsgGlobal('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const precedent = () => {
    setEtape(p => p - 1);
    setMsgGlobal('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const allerEtape = n => {
    if (n < etape) {
      setEtape(n);
      setMsgGlobal('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (n > etape) {
      // On ne peut avancer que si l'étape est validée
      if (valider()) {
        setEtape(n);
        setMsgGlobal('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const reinitialiserFormulaire = () => {
    inscriptionStorage.clear();
    setForm(initialForm);
    setFileNames({});
    setErreurs({});
    setFieldTouched({});
    setMsgGlobal('');
    setMsgSuccess('');
    setEtape(1);
    setShowConfirmReset(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── Soumission ───────────────────────────────────────────────
  const soumettre = async () => {
    if (!validerTout()) return;
    // Filet de sécurité : ces IDs sont requis côté serveur (un findById(null) provoque un 400).
    const idsManquants = [];
    if (!form.universiteId) idsManquants.push('université');
    if (!form.departementId) idsManquants.push('département');
    if (!form.filiereId) idsManquants.push('filière');
    if (!form.anneeAcademiqueId) idsManquants.push('année académique');
    if (idsManquants.length) {
      setMsgGlobal('❌ Champs obligatoires manquants : ' + idsManquants.join(', ') + '. Vérifiez l\'étape « Parcours académique ».');
      setEtape(2);
      return;
    }
    setIsSubmitting(true);
    setChargement(true);
    setMsgGlobal('');

    try {
      const payload = {
        nom:           form.nom.trim().toUpperCase(),
        postnom:       form.postnom?.trim() || null,
        prenom:        form.prenom.trim(),
        email:         form.email.trim().toLowerCase(),
        telephone1:    form.telephone1.trim(),
        dateNaissance: form.dateNaissance,
        lieuNaissance: form.lieuNaissance.trim(),
        sexe:          form.sexe,
        nationalite:   form.nationalite || 'Congolaise',
        etatCivil:     form.etatCivil,
        telephone2:    form.telephone2 || null,
        province:      form.province || null,
        ville:         form.ville || null,
        commune:       form.commune || null,
        quartier:      form.quartier || null,
        avenue:        form.avenue || null,
        numeroResidence: form.numeroResidence || null,
        adresse:       [form.avenue, form.quartier, form.commune, form.ville].filter(Boolean).join(', '),
        universiteId:      parseInt(form.universiteId, 10),
        departementId:     parseInt(form.departementId, 10),
        filiereId:         parseInt(form.filiereId, 10),
        vacationId:        form.vacationId ? parseInt(form.vacationId, 10) : null,
        niveauVise:        form.niveau,
        anneeAcademiqueId: parseInt(form.anneeAcademiqueId, 10),
        typeInscription:   form.typeInscription,
        ecoleSecondaire:   form.ecoleSecondaire || null,
        provinceEcole:     form.provinceEcole || null,
        anneeObtention:    form.anneeObtention || null,
        numeroDiplome:     form.numeroDiplome || null,
        pourcentage: form.pourcentage ? parseFloat(form.pourcentage) : null,
        option:            form.option || null,
        codeExetat:        form.codeExetat || null,
        pereNom:         form.pereNom || null,
        pereProfession:  form.pereProfession || null,
        pereTelephone:   form.pereTelephone || null,
        mereNom:         form.mereNom || null,
        mereProfession:  form.mereProfession || null,
        mereTelephone:   form.mereTelephone || null,
        tuteurNom:       form.tuteurNom || null,
        tuteurLien:      form.tuteurLien || null,
        tuteurTelephone: form.tuteurTelephone || null,
        tuteurAdresse:   form.tuteurAdresse || null,
        urgenceNom:      form.urgenceNom || null,
        urgenceTelephone: form.urgenceTelephone || null,
        allergies:       form.allergies || null,
        handicap:        form.handicap || null,
        certifie:          form.certifie,
        accepteReglement:  form.accepteReglement,
      };

      // Envoi multipart : partie "data" (JSON du dossier) + une partie par document téléversé.
      const fd = new FormData();
      fd.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
      const fichiers = {
        photoIdentite: form.photoIdentite,
        photoPasseport: form.photoPasseport,
        diplomeEtat: form.diplomeEtat,
        attestationReussite: form.attestationReussite,
        relevePoints: form.relevePoints,
        acteNaissance: form.acteNaissance,
        attestationNationalite: form.attestationNationalite,
        carteIdentite: form.carteIdentite,
        lettreRecommandation: form.lettreRecommandation,
        attestationPhysique: form.attestationPhysique,
        attestationConduite: form.attestationConduite,
      };
      Object.entries(fichiers).forEach(([nom, file]) => { if (file) fd.append(nom, file); });

      const res = await api.post('/api/dossiers', fd, { timeout: 60000 });
      inscriptionStorage.clear();
      setDossier({
        numeroDossier: res.data.numeroDossier || res.data.id,
        nom: form.nom, prenom: form.prenom, email: form.email,
        universite: universites.find(u => String(u.id) === String(form.universiteId))?.nom || '',
        filiere: filieres.find(f => String(f.id) === String(form.filiereId))?.nom || '',
        niveau: NIVEAUX.find(n => n.id === form.niveau)?.libelle || form.niveau,
        fraisInscription: res.data.montantInscription ?? null,
        deviseFrais: res.data.deviseInscription || 'USD',
        paymentLink: res.data.paymentLink || `/paiement-tachpay?dossier=${encodeURIComponent(res.data.numeroDossier || res.data.id)}`,
        paymentExpiresAt: res.data.paymentExpiresAt || null,
      });
      setMsgSuccess('✅ Dossier soumis avec succès !');
    } catch (err) {
      const data = err.response?.data;
      console.error('❌ Soumission échouée:', data || err.message || err);
      const msg = data?.details || data?.message || data?.erreur || err.message || 'Erreur lors de la soumission.';
      setMsgGlobal('❌ ' + msg);
      // Remonter en haut du formulaire pour que la bannière d'erreur soit visible
      // (au moment de la soumission on est en bas, sur le bouton — sinon l'échec paraît muet).
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setChargement(false);
      setIsSubmitting(false);
    }
  };

  // ─── Fonctions de rendu des étapes ──────────────────────────

  // ÉTAPE 1 : Identité (inchangée mais avec validation améliorée)
  const renderEtape1 = () => (
    <div>
      <h3 style={{ marginBottom: '12px', color: 'var(--text-primary)', fontSize: '17px' }}>👤 Informations personnelles</h3>
      <div style={S.section}>
        <div style={S.sectionTitle}><span>État civil</span></div>
        <div style={S.grid2}>
          <F label="Nom" name="nom" required value={form.nom} onChange={handleChange} onBlur={handleBlur} error={fieldTouched.nom && erreurs.nom} />
          <F label="Post-nom" name="postnom" value={form.postnom} onChange={handleChange} onBlur={handleBlur} />
          <F label="Prénom" name="prenom" required value={form.prenom} onChange={handleChange} onBlur={handleBlur} error={fieldTouched.prenom && erreurs.prenom} />
          <Sel label="Sexe" name="sexe" value={form.sexe} onChange={handleChange}>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </Sel>
          <F label="Date de naissance" name="dateNaissance" type="date" required value={form.dateNaissance} onChange={handleChange} onBlur={handleBlur} error={fieldTouched.dateNaissance && erreurs.dateNaissance} />
          <F label="Lieu de naissance" name="lieuNaissance" required value={form.lieuNaissance} onChange={handleChange} onBlur={handleBlur} error={fieldTouched.lieuNaissance && erreurs.lieuNaissance} />
        </div>
      </div>
      <div style={S.section}>
        <div style={S.sectionTitle}><span>Nationalité & État civil</span></div>
        <div style={S.grid2}>
          <F label="Nationalité" name="nationalite" value={form.nationalite} onChange={handleChange} />
          <Sel label="État civil" name="etatCivil" value={form.etatCivil} onChange={handleChange}>
            <option value="Célibataire">Célibataire</option>
            <option value="Marié(e)">Marié(e)</option>
            <option value="Divorcé(e)">Divorcé(e)</option>
            <option value="Veuf/Veuve">Veuf/Veuve</option>
          </Sel>
        </div>
      </div>
      <div style={S.section}>
        <div style={S.sectionTitle}><span>Coordonnées</span></div>
        <div style={S.grid2}>
          <F label="Email" name="email" type="email" required value={form.email} onChange={handleChange} onBlur={handleBlur} error={fieldTouched.email && erreurs.email} />
          <F label="Téléphone principal" name="telephone1" required value={form.telephone1} onChange={handleChange} onBlur={handleBlur} error={fieldTouched.telephone1 && erreurs.telephone1} />
          <F label="Téléphone secondaire" name="telephone2" value={form.telephone2} onChange={handleChange} />
        </div>
      </div>
      <div style={S.section}>
        <div style={S.sectionTitle}><span>Adresse de résidence</span></div>
        <div style={S.grid2}>
          <F label="Province" name="province" value={form.province} onChange={handleChange} />
          <F label="Ville" name="ville" value={form.ville} onChange={handleChange} />
          <F label="Commune" name="commune" value={form.commune} onChange={handleChange} />
          <F label="Quartier" name="quartier" value={form.quartier} onChange={handleChange} />
          <F label="Avenue" name="avenue" value={form.avenue} onChange={handleChange} />
          <F label="N° de résidence" name="numeroResidence" value={form.numeroResidence} onChange={handleChange} />
        </div>
      </div>
    </div>
  );

  // ÉTAPE 2 : Académique
  const renderEtape2 = () => {
    const uniNom = universites.find(u => String(u.id) === String(form.universiteId))?.nom;
    const deptNom = departements.find(d => String(d.id) === String(form.departementId))?.nom;
    const filNom = filiereSelectionnee?.nom;
    // Choix déjà fait à l'étape précédente (université + département + filière transmis par l'URL).
    const academicPreset = prefilled && form.universiteId && form.departementId && form.filiereId;
    return (
    <div>
      <h3 style={{ marginBottom: '12px', color: 'var(--text-primary)', fontSize: '17px' }}>🎓 Informations académiques</h3>
      {msgInfo && <div style={{ background: 'rgba(192,122,43,0.15)', color: '#856404', padding: '12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #ffc107' }}>ℹ️ {msgInfo}</div>}
      {filiereSelectionnee?.conditionsAdmission && (
        <div style={{ background: 'rgba(24,95,165,0.12)', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px 18px', marginBottom: '16px' }}>
          <div style={{ fontWeight: 700, color: '#185FA5', fontSize: '13px', marginBottom: '6px' }}>
            📌 Exigences d'admission — {filiereSelectionnee.nom}
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#185FA5', lineHeight: 1.7 }}>
            {filiereSelectionnee.conditionsAdmission.split('\n').filter(l => l.trim()).map((ligne, i) => (
              <li key={i}>{ligne.trim()}</li>
            ))}
          </ul>
        </div>
      )}
      {filiereSelectionnee?.testAdmissionRequis && (
        <div style={{ background: 'rgba(192,122,43,0.12)', border: '1px solid #fcd34d', borderRadius: '10px', padding: '14px 18px', marginBottom: '16px' }}>
          <div style={{ fontWeight: 700, color: '#92600a', fontSize: '13px', marginBottom: '4px' }}>
            📝 Test d'admission requis
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#92600a', lineHeight: 1.6 }}>
            L'admission à cette filière est soumise à la réussite d'un <strong>test d'admission</strong>. Après le dépôt de votre dossier, vous serez convoqué(e) au test par le secrétariat.
          </p>
        </div>
      )}
      {/* Année académique — toujours à choisir ici */}
      <div style={S.section}>
        <div style={S.grid2}>
          <Sel label="Année académique" name="anneeAcademiqueId" required disabled={prefilled && !!form.anneeAcademiqueId} value={form.anneeAcademiqueId} onChange={handleChange} error={fieldTouched.anneeAcademiqueId && erreurs.anneeAcademiqueId}>
            <option value="">-- Sélectionner --</option>
            {annees.map(a => <option key={a.id} value={a.id}>{a.libelle} {a.active ? '(Active)' : ''}</option>)}
          </Sel>
          <div />
        </div>
      </div>

      {academicPreset ? (
        /* Université / département / filière déjà choisis à l'étape précédente :
           résumé en lecture seule (pas besoin de re-remplir). « Modifier » rouvre les menus. */
        <div style={S.section}>
          <div style={{ border: '1.5px solid rgba(24,95,165,0.35)', borderRadius: 12, background: 'rgba(24,95,165,0.06)', padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#185FA5', fontWeight: 700, fontSize: 13 }}>
                <span>✅</span> Votre choix de formation
              </div>
              <button type="button" onClick={() => setPrefilled(false)}
                style={{ background: 'none', border: '1px solid #185FA5', color: '#185FA5', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                ✏️ Modifier
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { icon: '🏛️', label: 'Université', value: uniNom },
                { icon: '📚', label: 'Département', value: deptNom },
                { icon: '🎓', label: 'Filière', value: filNom },
              ].map(item => (
                <div key={item.label} style={{ background: 'var(--bg-card)', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{item.icon} {item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item.value || '…'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={S.section}>
            <div style={S.grid2}>
              <Sel label="Université" name="universiteId" required value={form.universiteId} onChange={handleChange} error={fieldTouched.universiteId && erreurs.universiteId}>
                <option value="">-- Sélectionner --</option>
                {universites.map(u => <option key={u.id} value={u.id}>{u.nom}</option>)}
              </Sel>
              <Sel label="Département" name="departementId" required disabled={loadingDepts} value={form.departementId} onChange={handleChange} error={fieldTouched.departementId && erreurs.departementId}>
                <option value="">-- {loadingDepts ? 'Chargement...' : 'Sélectionner'} --</option>
                {departements.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
              </Sel>
            </div>
          </div>
          <div style={S.section}>
            <div style={S.grid2}>
              <Sel label="Filière" name="filiereId" required disabled={loadingFilieres} value={form.filiereId} onChange={handleChange} error={fieldTouched.filiereId && erreurs.filiereId}>
                <option value="">-- {loadingFilieres ? 'Chargement...' : 'Sélectionner'} --</option>
                {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </Sel>
              <div />
            </div>
          </div>
        </>
      )}
      <div style={S.section}>
        <div style={S.grid2}>
          <Sel label="Niveau visé" name="niveau" required value={form.niveau} onChange={handleChange} error={fieldTouched.niveau && erreurs.niveau}>
            <option value="">-- Sélectionner --</option>
            {NIVEAUX.map(n => <option key={n.id} value={n.id}>{n.libelle}</option>)}
          </Sel>
          <Sel label="Type d'inscription" name="typeInscription" value={form.typeInscription} onChange={handleChange}>
            <option value="NOUVELLE">Nouvelle inscription</option>
            <option value="REINSCRIPTION">Réinscription</option>
            <option value="TRANSFERT">Transfert</option>
          </Sel>
        </div>
      </div>
      {/* Vacation demandée UNIQUEMENT si l'établissement propose au moins deux
          vacations (choix Jour/Soir) ; une seule vacation est auto-sélectionnée,
          et sans vacation les frais viennent de l'université. */}
      {vacations.length >= 2 && (
        <div style={S.section}>
          <div style={S.sectionTitle}><span>🕐 Vacation</span></div>
          <p style={{ ...S.hint, marginBottom: 14 }}>
            Cette filière propose deux vacations. Choisissez la vôtre — les <strong>frais d'inscription</strong> peuvent en dépendre.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {vacations.map(v => {
              const selected = form.vacationId === String(v.id);
              const jour = v.type === 'JOUR';
              const accent = jour ? '#C07A2B' : '#4F46E5';
              return (
                <label
                  key={v.id}
                  style={{
                    position: 'relative', display: 'block', cursor: 'pointer',
                    border: `2px solid ${selected ? '#185FA5' : 'var(--border-color)'}`,
                    borderRadius: 14, padding: '16px 16px 14px',
                    background: selected ? 'rgba(24,95,165,0.10)' : 'var(--bg-card)',
                    boxShadow: selected ? '0 6px 18px -8px rgba(24,95,165,0.55)' : '0 1px 3px rgba(0,0,0,0.05)',
                    transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
                  }}
                >
                  <input type="radio" name="vacationId" value={v.id} checked={selected} onChange={handleChange}
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                  {/* Pastille de sélection */}
                  <span style={{
                    position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: '50%',
                    border: `2px solid ${selected ? '#185FA5' : 'var(--border-color)'}`,
                    background: selected ? '#185FA5' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 12, fontWeight: 700,
                  }}>{selected ? '✓' : ''}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, background: `${accent}22`,
                    }}>{jour ? '☀️' : '🌙'}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>{jour ? 'Vacation Jour' : 'Vacation Soir'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.nom}</div>
                    </div>
                  </div>
                  {v.fraisInscription != null && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 2,
                      background: 'rgba(24,95,165,0.10)', color: '#185FA5',
                      borderRadius: 20, padding: '5px 12px', fontSize: 12.5, fontWeight: 700,
                    }}>
                      💳 {v.fraisInscription} {v.deviseFrais || 'USD'}
                      <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>· frais d'inscription</span>
                    </div>
                  )}
                </label>
              );
            })}
          </div>
          {erreurs.vacationId && <div style={S.errorText}>{erreurs.vacationId}</div>}
        </div>
      )}
      {loadingVacations && <p style={S.hint}>Chargement des vacations disponibles...</p>}

      <div style={S.section}>
        <div style={S.sectionTitle}><span>Formation antérieure</span></div>
        <div style={S.grid2}>
          <F label="École secondaire" name="ecoleSecondaire" value={form.ecoleSecondaire} onChange={handleChange} />
          <F label="Province école" name="provinceEcole" value={form.provinceEcole} onChange={handleChange} />
          <F label="Année d'obtention du diplôme" name="anneeObtention" type="number" value={form.anneeObtention} onChange={handleChange} />
          <F label="Numéro du diplôme" name="numeroDiplome" value={form.numeroDiplome} onChange={handleChange} />
          <F label="Pourcentage/Moyenne" name="pourcentage" type="number" step="0.01" value={form.pourcentage} onChange={handleChange} />
          <F label="Option/Orientation" name="option" value={form.option} onChange={handleChange} />
          <F label="Code EXETAT" name="codeExetat"
             required={exetatObligatoire(form.anneeObtention)}
             value={form.codeExetat} onChange={handleChange} onBlur={handleBlur}
             error={fieldTouched.codeExetat && erreurs.codeExetat}
             hint={exetatObligatoire(form.anneeObtention)
               ? 'Obligatoire pour un diplôme obtenu en 2022 ou après (vérifié sur la plateforme officielle).'
               : 'À renseigner si disponible.'} />
        </div>
      </div>
    </div>
    );
  };

  // ÉTAPE 3 : Parents (inchangée)
  const renderEtape3 = () => (
    <div>
      <h3 style={{ marginBottom: '12px', color: 'var(--text-primary)', fontSize: '17px' }}>👨‍👩‍👧 Contacts d'urgence</h3>
      <div style={S.section}>
        <div style={S.sectionTitle}><span>Père</span></div>
        <div style={S.grid2}>
          <F label="Nom complet" name="pereNom" value={form.pereNom} onChange={handleChange} />
          <F label="Profession" name="pereProfession" value={form.pereProfession} onChange={handleChange} />
          <F label="Téléphone" name="pereTelephone" value={form.pereTelephone} onChange={handleChange} />
        </div>
      </div>
      <div style={S.section}>
        <div style={S.sectionTitle}><span>Mère</span></div>
        <div style={S.grid2}>
          <F label="Nom complet" name="mereNom" value={form.mereNom} onChange={handleChange} />
          <F label="Profession" name="mereProfession" value={form.mereProfession} onChange={handleChange} />
          <F label="Téléphone" name="mereTelephone" value={form.mereTelephone} onChange={handleChange} />
        </div>
      </div>
      <div style={S.section}>
        <div style={S.sectionTitle}><span>Tuteur (optionnel)</span></div>
        <div style={S.grid2}>
          <F label="Nom complet" name="tuteurNom" value={form.tuteurNom} onChange={handleChange} />
          <F label="Lien de parenté" name="tuteurLien" value={form.tuteurLien} onChange={handleChange} />
          <F label="Téléphone" name="tuteurTelephone" value={form.tuteurTelephone} onChange={handleChange} />
          <F label="Adresse" name="tuteurAdresse" value={form.tuteurAdresse} onChange={handleChange} span2 />
        </div>
      </div>
      <div style={S.section}>
        <div style={S.sectionTitle}><span>Personne à contacter en cas d'urgence</span></div>
        <div style={S.grid2}>
          <F label="Nom complet" name="urgenceNom" value={form.urgenceNom} onChange={handleChange} />
          <F label="Téléphone" name="urgenceTelephone" value={form.urgenceTelephone} onChange={handleChange} />
        </div>
      </div>
      <div style={S.section}>
        <div style={S.sectionTitle}><span>Informations sanitaires</span></div>
        <div style={S.grid2}>
          <F label="Allergies" name="allergies" value={form.allergies} onChange={handleChange} />
          <F label="Handicap" name="handicap" value={form.handicap} onChange={handleChange} />
        </div>
      </div>
    </div>
  );

  // ÉTAPE 4 : Documents — liste pilotée par la filière (documentsRequis
  // prédéfinis par l'admin), regroupée par catégorie du catalogue.
  const renderEtape4 = () => {
    const erreursDocs = docsRequisActifs.filter(d => erreurs[d.key]);
    const groupes = [...new Set(
      docsRequisActifs
        .map(d => DOCUMENTS_CATALOGUE.find(c => c.key === d.key)?.groupe)
        .filter(Boolean)
    )];
    const obligatoires = docsRequisActifs.filter(d => d.obligatoire);
    const fournisObl = obligatoires.filter(d => form[d.key]).length;
    const pct = obligatoires.length ? Math.round((fournisObl / obligatoires.length) * 100) : 100;
    const GROUP_ICON = {
      'Photo & Identité': '📷',
      'Documents scolaires': '🎓',
      'Documents administratifs': '🗂️',
    };
    return (
      <div>
        <h3 style={{ marginBottom: '12px', color: 'var(--text-primary)', fontSize: '17px' }}>📎 Documents requis</h3>

        {/* Bandeau d'information (formats + provenance de la liste) */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(24,95,165,0.07)', border: '1px solid rgba(24,95,165,0.20)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>💡</span>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            Téléversez les copies scannées ou photos de vos documents. Formats acceptés : <strong>PDF, JPG, PNG</strong> (max 5 Mo).
            {filiereSelectionnee?.documentsRequis && (
              <> Liste définie par <strong>{filiereSelectionnee.nom}</strong> ; les documents marqués <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span> sont obligatoires.</>
            )}
          </div>
        </div>

        {/* Progression des documents obligatoires */}
        {obligatoires.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>Documents obligatoires fournis</span>
              <strong style={{ color: pct === 100 ? '#1D9E75' : '#185FA5' }}>{fournisObl} / {obligatoires.length}</strong>
            </div>
            <div style={{ height: 8, borderRadius: 20, background: 'var(--bg-secondary, #eef2f7)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, borderRadius: 20, background: pct === 100 ? 'linear-gradient(90deg,#1D9E75,#0F6E56)' : 'linear-gradient(90deg,#185FA5,#0B1F4A)', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}

        {erreursDocs.length > 0 && (
          <div style={{ background: 'rgba(220,53,69,0.10)', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
            ⚠️ Documents obligatoires manquants :
            <ul style={{ margin: '6px 0 0', paddingLeft: '20px' }}>
              {erreursDocs.map(d => <li key={d.key}>{erreurs[d.key]}</li>)}
            </ul>
          </div>
        )}

        {/* Groupes de documents — cartes avec en-tête à icône et compteur */}
        {groupes.map(groupe => {
          const docs = docsRequisActifs.filter(d => DOCUMENTS_CATALOGUE.find(c => c.key === d.key)?.groupe === groupe);
          const fournis = docs.filter(d => form[d.key]).length;
          return (
            <div key={groupe} style={{ border: '1px solid var(--border-color)', borderRadius: 14, overflow: 'hidden', marginBottom: 16, background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(24,95,165,0.06)', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(24,95,165,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0 }}>
                  {GROUP_ICON[groupe] || '📄'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{groupe}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{fournis} / {docs.length} document(s) fourni(s)</div>
                </div>
              </div>
              <div style={{ padding: 16 }}>
                <div style={S.grid2}>
                  {docs.map(d => (
                    <FileUploadPreview
                      key={d.key}
                      label={`${libelleDocument(d.key)}${d.obligatoire ? ' *' : ''}`}
                      name={d.key}
                      accept={acceptDocument(d.key)}
                      initialFile={form[d.key]}
                      onFileChange={(file) => setForm(p => ({ ...p, [d.key]: file }))}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ÉTAPE 5 : Révision
  const renderEtape5 = () => (
    <div>
      <h3 style={{ marginBottom: '12px', color: 'var(--text-primary)', fontSize: '17px' }}>🔍 Révision de votre dossier</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
        Vérifiez toutes les informations avant de soumettre. Une fois soumis, votre dossier ne peut être modifié.
      </p>

      <div style={S.revSection}>
        <div style={S.revHeader}>
          <div style={S.revTitle}>👤 Identité</div>
          <button style={S.revEdit} onClick={() => allerEtape(1)}>Modifier</button>
        </div>
        <div style={S.revGrid}>
          <div style={S.revItem}><span style={S.revKey}>Nom</span> <span style={S.revVal}>{form.nom}</span></div>
          <div style={S.revItem}><span style={S.revKey}>Prénom</span> <span style={S.revVal}>{form.prenom}</span></div>
          <div style={S.revItem}><span style={S.revKey}>Date naissance</span> <span style={S.revVal}>{form.dateNaissance}</span></div>
          <div style={S.revItem}><span style={S.revKey}>Email</span> <span style={S.revVal}>{form.email}</span></div>
          <div style={S.revItem}><span style={S.revKey}>Téléphone</span> <span style={S.revVal}>{form.telephone1}</span></div>
        </div>
      </div>

      <div style={S.revSection}>
        <div style={S.revHeader}>
          <div style={S.revTitle}>🎓 Académique</div>
          <button style={S.revEdit} onClick={() => allerEtape(2)}>Modifier</button>
        </div>
        <div style={S.revGrid}>
          <div style={S.revItem}><span style={S.revKey}>Université</span> <span style={S.revVal}>{universites.find(u => u.id === form.universiteId)?.nom || 'N/A'}</span></div>
          <div style={S.revItem}><span style={S.revKey}>Département</span> <span style={S.revVal}>{departements.find(d => d.id === form.departementId)?.nom || 'N/A'}</span></div>
          <div style={S.revItem}><span style={S.revKey}>Filière</span> <span style={S.revVal}>{filieres.find(f => f.id === form.filiereId)?.nom || 'N/A'}</span></div>
          <div style={S.revItem}><span style={S.revKey}>Niveau</span> <span style={S.revVal}>{NIVEAUX.find(n => n.id === form.niveau)?.libelle || form.niveau}</span></div>
          {form.codeExetat && (
            <div style={S.revItem}><span style={S.revKey}>Code EXETAT</span> <span style={S.revVal}>{form.codeExetat}</span></div>
          )}
          {vacations.length >= 2 && form.vacationId && (
            <div style={S.revItem}>
              <span style={S.revKey}>Vacation</span>
              <span style={S.revVal}>
                {(() => {
                  const v = vacations.find(vv => String(vv.id) === form.vacationId);
                  return v ? (v.type === 'JOUR' ? '☀️ Jour' : '🌙 Soir') + ` — ${v.nom}` : 'N/A';
                })()}
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={S.revSection}>
        <div style={S.revHeader}>
          <div style={S.revTitle}>👨‍👩‍👧 Parents / Tuteur</div>
          <button style={S.revEdit} onClick={() => allerEtape(3)}>Modifier</button>
        </div>
        <div style={S.revGrid}>
          <div style={S.revItem}><span style={S.revKey}>Père</span> <span style={S.revVal}>{form.pereNom || 'Non renseigné'}</span></div>
          <div style={S.revItem}><span style={S.revKey}>Mère</span> <span style={S.revVal}>{form.mereNom || 'Non renseigné'}</span></div>
          <div style={S.revItem}><span style={S.revKey}>Tuteur</span> <span style={S.revVal}>{form.tuteurNom || 'Non renseigné'}</span></div>
          <div style={S.revItem}><span style={S.revKey}>Contact d'urgence</span> <span style={S.revVal}>{form.urgenceNom || 'Non renseigné'}{form.urgenceTelephone ? ` (${form.urgenceTelephone})` : ''}</span></div>
        </div>
      </div>

      <div style={S.revSection}>
        <div style={S.revHeader}>
          <div style={S.revTitle}>📎 Documents</div>
          <button style={S.revEdit} onClick={() => allerEtape(4)}>Modifier</button>
        </div>
        <div style={S.revGrid}>
          {docsRequisActifs.map(doc => (
            <div key={doc.key} style={S.revItem}>
              <span style={S.revKey}>{libelleDocument(doc.key)}{doc.obligatoire ? ' *' : ''}</span>
              <span style={{ ...S.revVal, color: form[doc.key] ? '#16a34a' : (doc.obligatoire ? '#dc2626' : 'var(--text-muted)') }}>
                {form[doc.key] ? `✓ ${form[doc.key].name || 'Fichier joint'}` : (doc.obligatoire ? '✗ Manquant' : '— Non fourni (facultatif)')}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'rgba(24,95,165,0.12)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', border: '1px solid #bfdbfe', fontSize: '13px', color: '#185FA5' }}>
        ℹ️ Après validation de votre dossier, un email sera envoyé à <strong>{form.email}</strong> pour vous inviter à créer votre mot de passe d'accès au portail étudiant.
      </div>


      <div style={{ marginTop: '24px' }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', marginBottom: '12px' }}>
          <input type="checkbox" name="certifie" checked={form.certifie} onChange={handleChange} style={{ marginTop: '4px', width: '18px', height: '18px', accentColor: '#185FA5' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Je certifie que toutes les informations fournies sont exactes et complètes.
          </span>
        </label>
        {erreurs.certifie && <div style={S.errorText}>{erreurs.certifie}</div>}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
          <input type="checkbox" name="accepteReglement" checked={form.accepteReglement} onChange={handleChange} style={{ marginTop: '4px', width: '18px', height: '18px', accentColor: '#185FA5' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            J'accepte le règlement intérieur de l'établissement.
          </span>
        </label>
        {erreurs.accepteReglement && <div style={S.errorText}>{erreurs.accepteReglement}</div>}
      </div>
    </div>
  );

  // ÉTAPE 6 : Finalisation (le paiement se fait APRÈS, via le lien TachPay de l'accusé de réception)
  const renderEtape6 = () => (
    <div>
      <h3 style={{ marginBottom: '12px', color: 'var(--text-primary)', fontSize: '17px' }}>🚀 Finalisation</h3>
      <div style={S.section}>
        <div style={{ background: 'rgba(24,95,165,0.12)', borderRadius: '12px', padding: '18px', marginBottom: '24px', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: '13px', color: '#185FA5', marginBottom: '8px', fontWeight: 600 }}>📌 Ce qui se passe après soumission</div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#185FA5', listStyle: 'disc', lineHeight: 1.7 }}>
            <li>Vous recevrez un <strong>accusé de réception</strong> avec votre numéro de dossier</li>
            <li>Un <strong>lien de paiement TachPay</strong> vous permettra de régler les frais d'inscription</li>
            <li>Votre dossier sera <strong>traité une fois le paiement effectué</strong></li>
            <li>Après validation, un email vous sera envoyé pour créer votre mot de passe et accéder à votre portail étudiant</li>
          </ul>
        </div>
      </div>
      <div style={{ marginTop: '8px', background: 'rgba(29,158,117,0.12)', borderRadius: '12px', padding: '20px', border: '2px solid #22c55e' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: '#1D9E75', marginBottom: '8px' }}>✓ Prêt à soumettre</div>
        <p style={{ fontSize: '13px', color: '#1D9E75', margin: '0 0 16px 0' }}>
          Votre dossier est complet. Cliquez ci-dessous pour soumettre votre candidature ; le paiement des frais se fera juste après.
        </p>
        <button
          className="btn-primary"
          onClick={() => { if (validerTout()) setShowConfirmSubmit(true); }}
          disabled={chargement || !form.certifie || !form.accepteReglement || isSubmitting}
          style={{
            opacity: (!form.certifie || !form.accepteReglement || isSubmitting) ? 0.6 : 1,
            cursor: (!form.certifie || !form.accepteReglement || isSubmitting) ? 'not-allowed' : 'pointer',
            padding: '14px 32px',
            fontSize: '16px',
          }}
        >
          {chargement ? '⏳ Soumission...' : '🚀 Soumettre le dossier'}
        </button>
      </div>
    </div>
  );

  // ─── Page succès ─────────────────────────────────────────────
  if (dossier) {
    return (
      <div className="page">
        <div className="card" style={{ textAlign: 'center', padding: '40px', maxWidth: '560px', margin: '40px auto', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📨</div>
          <h2 style={{ color: '#185FA5', marginBottom: '8px' }}>Dossier bien reçu !</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            Votre inscription a été <strong>reçue</strong> mais n'est <strong>pas encore traitée</strong>.
          </p>
          <div style={{ background: 'rgba(24,95,165,0.12)', borderRadius: '12px', padding: '24px', marginBottom: '20px', textAlign: 'left' }}>
            <div style={{ marginBottom: '8px' }}><strong>👤 Étudiant :</strong> {dossier.prenom} {dossier.nom}</div>
            <div style={{ marginBottom: '8px' }}><strong>🎓 Filière :</strong> {dossier.filiere || '—'}</div>
            <div style={{ marginBottom: '8px' }}><strong>🏛️ Institution :</strong> {dossier.universite}</div>
            <div style={{ padding: '12px 0', borderTop: '1px solid #bfdbfe', marginTop: '8px' }}>
              <strong>📋 N° de dossier : </strong>
              <span style={{ color: '#185FA5', fontWeight: 700, fontSize: '18px' }}>{dossier.numeroDossier}</span>
            </div>
          </div>
          <div style={{ background: 'rgba(192,122,43,0.12)', border: '1px solid #fcd34d', borderRadius: '12px', padding: '16px 20px', marginBottom: '18px', textAlign: 'left' }}>
            <div style={{ fontWeight: 700, color: '#92600a', marginBottom: '6px', fontSize: '14px' }}>
              💳 Frais d'inscription{dossier.fraisInscription != null ? ` : ${dossier.fraisInscription} ${dossier.deviseFrais}` : ''}
            </div>
            <p style={{ fontSize: '13px', color: '#92600a', margin: 0 }}>
              Votre dossier ne sera <strong>traité qu'après le paiement</strong> des frais d'inscription{dossier.fraisInscription != null ? ` de ${dossier.fraisInscription} ${dossier.deviseFrais}` : ''} exigés par le programme. Réglez-les via TachPay ci-dessous.
            </p>
          </div>
          <Link
            to={dossier.paymentLink || `/paiement-inscription?dossier=${encodeURIComponent(dossier.numeroDossier)}`}
            className="btn-primary"
            style={{ padding: '14px 32px', display: 'inline-block', textDecoration: 'none', fontSize: '15px', marginBottom: '16px' }}
          >
            💳 Payer les frais d'inscription
          </Link>
          {dossier.paymentExpiresAt && (
            <p style={{ fontSize: '12px', color: '#92600a', margin: '-6px 0 16px' }}>
              Ce lien de paiement expire le <strong>{new Date(dossier.paymentExpiresAt).toLocaleString('fr-FR')}</strong>.
            </p>
          )}
          <div style={{ background: 'rgba(29,158,117,0.12)', border: '1px solid #86efac', borderRadius: '12px', padding: '14px 18px', margin: '4px 0 18px', textAlign: 'left' }}>
            <div style={{ fontWeight: 700, color: '#1D9E75', marginBottom: '6px', fontSize: '13px' }}>✉️ Ensuite</div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: '#1D9E75', lineHeight: 1.7 }}>
              <li>Après paiement, le secrétariat traite votre dossier</li>
              <li>Une fois <strong>validé</strong>, un email est envoyé à <strong>{dossier.email}</strong> pour créer votre mot de passe et accéder à votre portail</li>
              <li>Suivez l'état à tout moment via la page <Link to="/suivi-dossier" style={{ color: '#1D9E75', fontWeight: 600 }}>Suivi du dossier</Link></li>
            </ul>
          </div>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '18px' }}>
            Conservez votre numéro de dossier <strong>{dossier.numeroDossier}</strong> — il vous sera demandé pour le paiement et le suivi.
          </p>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 13 }}>Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  // ─── Rendu principal ─────────────────────────────────────────
  return (
    <div className="page" ref={topRef} style={{ display: 'flex', justifyContent: 'center' }}>
      {/* Fenêtre du formulaire : déplaçable par son en-tête (presser sans
          relâcher puis bouger) et redimensionnable par le coin bas-droit. */}
      <div
        className="dialog-resizable"
        style={{ width: '100%', maxWidth: 920, minWidth: 460, minHeight: 400, background: 'var(--bg-secondary)', borderRadius: '12px', boxShadow: '0 8px 40px rgba(0,0,0,0.10)', ...panelStyle }}
      >
      <div
        className="dialog-draggable-handle"
        {...dragHandleProps}
        style={{ background: 'linear-gradient(135deg, #185FA5, #1e40af)', color: '#fff', padding: '18px 24px', borderRadius: '12px 12px 0 0', marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '21px', fontWeight: 700 }}>📝 Portail des Inscriptions</h1>
          <p style={{ margin: '4px 0 0', opacity: 0.85, fontSize: '13px' }}>
            Soumettez votre candidature en ligne — Aucun compte requis
          </p>
          {inscriptionStorage.hasDraft() && (
            <div style={{ marginTop: '8px', fontSize: '12px', background: 'rgba(255,255,255,0.2)', padding: '4px 14px', borderRadius: '20px', display: 'inline-block' }}>
              💾 Brouillon sauvegardé automatiquement
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(-1)}
            title="Revenir à la page précédente (le brouillon est conservé)"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            ← Retour
          </button>
          {inscriptionStorage.hasDraft() && (
            <button
              onClick={() => setShowConfirmReset(true)}
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              🗑️ Recommencer
            </button>
          )}
          <button
            onClick={() => setShowConfirmQuit(true)}
            title="Quitter le formulaire"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            ✖ Annuler
          </button>
        </div>
      </div>

      {/* Indicateur de progression amélioré */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', flex: 1 }}>
          {ETAPES.map(e => (
            <div key={e.num} style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: etape >= e.num ? 'pointer' : 'default',
                  background: etape === e.num ? '#185FA5' : etape > e.num ? '#22c55e' : 'var(--border-color)',
                  color: etape >= e.num ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.3s ease',
                  boxShadow: etape === e.num ? '0 0 0 3px rgba(24,95,165,0.3)' : 'none',
                }}
                onClick={() => allerEtape(e.num)}
                title={etape >= e.num ? `Aller à : ${e.label}` : ''}
              >
                {etape > e.num ? '✓' : e.num}
              </div>
              <span style={{ fontSize: '12px', color: etape === e.num ? '#185FA5' : 'var(--text-muted)', fontWeight: etape === e.num ? 600 : 400, whiteSpace: 'nowrap' }}>
                {e.label}
              </span>
              {e.num < ETAPES.length && (
                <div style={{ width: '20px', height: '2px', background: etape > e.num ? '#22c55e' : 'var(--border-color)', marginLeft: '4px' }} />
              )}
            </div>
          ))}
        </div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#185FA5', whiteSpace: 'nowrap' }}>
          Étape {etape} / {ETAPES.length}
        </div>
      </div>

      {msgGlobal && (
        <div style={{ background: 'rgba(220,53,69,0.10)', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px 20px', fontSize: '14px', cursor: 'pointer', borderRadius: '8px', marginBottom: '16px' }}
          onClick={() => setMsgGlobal('')}>
          {msgGlobal} &nbsp;<span style={{ opacity: 0.5 }}>×</span>
        </div>
      )}
      {msgSuccess && (
        <div style={{ background: 'rgba(29,158,117,0.12)', border: '1px solid #86efac', color: '#1D9E75', padding: '12px 20px', fontSize: '14px', borderRadius: '8px', marginBottom: '16px' }}
          onClick={() => setMsgSuccess('')}>
          {msgSuccess}
        </div>
      )}

      <div className="card" style={{ borderRadius: '0 0 12px 12px', padding: '20px 24px', minHeight: '400px' }}>
        {etape === 1 && renderEtape1()}
        {etape === 2 && renderEtape2()}
        {etape === 3 && renderEtape3()}
        {etape === 4 && renderEtape4()}
        {etape === 5 && renderEtape5()}
        {etape === 6 && renderEtape6()}

        {etape < 6 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '18px', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              {etape > 1 && (
                <button className="btn-outline" onClick={precedent} style={{ padding: '9px 22px', fontSize: '14px' }}>
                  ← Précédent
                </button>
              )}
              <button className="btn-outline" onClick={() => setShowConfirmQuit(true)} style={{ padding: '9px 22px', fontSize: '14px' }}>
                Annuler
              </button>
            </div>
            <button className="btn-primary" onClick={suivant} style={{ padding: '9px 28px', fontSize: '14px' }}>
              {etape === 5 ? 'Aller à la finalisation →' : 'Suivant →'}
            </button>
          </div>
        )}
        {etape === 6 && (
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <button className="btn-outline" onClick={precedent} style={{ padding: '9px 22px', fontSize: '14px' }}>
              ← Retour à la révision
            </button>
            <button className="btn-outline" onClick={() => setShowConfirmQuit(true)} style={{ padding: '9px 22px', fontSize: '14px' }}>
              Annuler
            </button>
          </div>
        )}
      </div>
      </div>

      {showConfirmSubmit && (
        <ConfirmationModal
          title="Confirmer la soumission"
          message="Une fois soumis, votre dossier ne pourra plus être modifié. Voulez-vous vraiment soumettre votre candidature ?"
          confirmText="Oui, soumettre"
          cancelText="Annuler"
          onCancel={() => setShowConfirmSubmit(false)}
          onConfirm={() => { setShowConfirmSubmit(false); soumettre(); }}
        />
      )}

      {showConfirmReset && (
        <ConfirmationModal
          title="Recommencer le formulaire"
          message="Toutes les informations saisies (y compris les documents) seront définitivement effacées. Voulez-vous vraiment recommencer ?"
          confirmText="Oui, recommencer"
          cancelText="Annuler"
          onCancel={() => setShowConfirmReset(false)}
          onConfirm={reinitialiserFormulaire}
        />
      )}

      {showConfirmQuit && (
        <ConfirmationModal
          title="Quitter le formulaire"
          message="Votre brouillon reste sauvegardé sur cet appareil : vous pourrez reprendre votre inscription plus tard. Voulez-vous quitter maintenant ?"
          confirmText="Oui, quitter"
          cancelText="Continuer la saisie"
          onCancel={() => setShowConfirmQuit(false)}
          onConfirm={() => { setShowConfirmQuit(false); navigate('/'); }}
        />
      )}
    </div>
  );
}
