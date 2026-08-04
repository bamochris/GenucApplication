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
import './Inscriptions.css';

// ─── Constantes ───────────────────────────────────────────────
const NIVEAUX = [
  { id: 'L1', libelle: 'Licence 1 (L1)' },
  { id: 'L2', libelle: 'Licence 2 (L2)' },
  { id: 'L3', libelle: 'Licence 3 (L3)' },
  { id: 'MASTER', libelle: 'Master' },
];

// Trois étapes seulement : le parcours en six écrans faisait abandonner des
// candidats avant la fin. Chaque étape porte une question en clair — un candidat
// qui s'inscrit pour la première fois doit comprendre ce qu'on lui demande sans
// avoir à deviner ce que « Finalisation » recouvre.
const ETAPES = [
  {
    num: 1,
    label: 'Vous',
    icon: '👤',
    titre: 'Qui êtes-vous ?',
    aide: "Votre identité et vos coordonnées. C'est à cette adresse e-mail que nous enverrons votre accusé de réception.",
  },
  {
    num: 2,
    label: 'Votre formation',
    icon: '🎓',
    titre: 'Que voulez-vous étudier ?',
    aide: "L'établissement, la filière et le niveau visés, puis votre diplôme du secondaire.",
  },
  {
    num: 3,
    label: 'Documents & envoi',
    icon: '📎',
    titre: 'Vos pièces justificatives',
    aide: 'Téléversez les documents demandés, relisez votre dossier, puis envoyez-le.',
  },
];

// Libellés lisibles des champs, pour nommer les manques dans le bandeau d'erreur.
// Un message « corrigez les champs en rouge » n'aide pas quand le champ fautif se
// trouve dans une section repliée ou plus bas dans la page.
const LIBELLES_CHAMPS = {
  nom: 'Nom', prenom: 'Prénom', dateNaissance: 'Date de naissance',
  lieuNaissance: 'Lieu de naissance', email: 'Adresse e-mail',
  telephone1: 'Téléphone principal',
  urgenceNom: "Personne à prévenir en cas d'urgence",
  urgenceTelephone: "Téléphone de la personne à prévenir",
  anneeAcademiqueId: 'Année académique', universiteId: 'Établissement',
  departementId: 'Département', filiereId: 'Filière', niveau: 'Niveau visé',
  vacationId: 'Vacation', codeExetat: 'Code EXETAT',
  certifie: "Certification de l'exactitude des informations",
  accepteReglement: 'Acceptation du règlement intérieur',
};

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
    // Le gris ardoise en dur (#1f2937) rendait la valeur saisie illisible en
    // thème sombre : texte presque noir sur carte sombre, précisément dans le
    // champ que l'on demande à l'utilisateur de corriger.
    color: 'var(--text-primary)',
  },
  label: { display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '13px', color: 'var(--text-secondary)' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' },
  full: { gridColumn: 'span 2' },
  section: { marginBottom: '22px' },
  // Section présentée en carte : les groupes de champs se suivaient sans
  // délimitation, séparés par un simple filet sous le titre. Sur une étape qui
  // en enchaîne trois ou quatre, on ne voyait plus où finissait « Comment vous
  // joindre » ni où commençait « Personne à prévenir ».
  bloc: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    borderRadius: '14px',
    padding: '18px 20px 8px',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--title-brand)',
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
    color: 'var(--title-brand)',
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
    color: 'var(--color-success-text)',
  },
  revSection: {
    background: 'var(--bg-secondary)',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '16px',
    border: '1px solid var(--border-color)',
    // Même liseré latéral que les encarts, en gris : le récapitulatif est un
    // contenu neutre et se distingue ainsi des blocs bleus et ambrés voisins.
    boxShadow: 'inset 4px 0 0 0 var(--text-muted)',
    paddingLeft: '24px',
  },
  revHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
  },
  revTitle: { fontWeight: 700, color: 'var(--title-brand)', fontSize: '15px' },
  revEdit: {
    background: 'none',
    // `currentColor` : la bordure suit --title-brand, sinon elle resterait bleu
    // sombre autour d'un libellé blanc en thème sombre.
    border: '1px solid currentColor',
    color: 'var(--title-brand)',
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
  // En-tête d'étape : la question posée, puis une phrase qui dit à quoi sert l'étape.
  etapeTitre: { margin: '0 0 4px', color: 'var(--text-primary)', fontSize: '19px', fontWeight: 700 },
  etapeAide: { margin: '0 0 20px', color: 'var(--text-muted)', fontSize: '13.5px', lineHeight: 1.6 },
  // Pastille « Facultatif » : lever le doute est le meilleur allègement possible.
  badgeFacultatif: {
    fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.3px',
    background: 'var(--bg-secondary, #eef2f7)', color: 'var(--text-muted)',
    borderRadius: '999px', padding: '2px 9px', textTransform: 'none',
  },
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
          // `backgroundColor` et non `background` : S.input/S.inputErr posent déjà
          // `backgroundColor`, et mélanger la propriété raccourcie avec la propriété
          // détaillée fait diverger React au re-rendu (avertissement en console, et
          // à terme un fond qui ne suit plus l'état d'erreur).
          backgroundColor: disabled ? 'var(--bg-secondary)' : 'var(--bg-card)',
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

/**
 * Encarts d'information, distingués par un code couleur constant.
 *
 * Les blocs s'enchaînaient tous dans le même bleu pâle : conseils, exigences
 * d'admission, suite du parcours et confirmation se fondaient en un seul pavé
 * où l'on ne repérait plus ce qui était une consigne, un avertissement ou une
 * bonne nouvelle. Chaque nature d'information porte désormais sa teinte et un
 * liseré latéral qui marque la séparation.
 *
 *   info      (bleu)  — explication, mode d'emploi
 *   attention (ambre) — ce qui exige une action ou une vigilance
 *   erreur    (rouge) — ce qui bloque tant que ce n'est pas corrigé
 *   succes    (vert)  — état conforme, étape franchie
 *   neutre    (gris)  — récapitulatif, contenu sans jugement
 */
const TONS_ENCART = {
  info:      { accent: 'var(--title-brand)',        fond: 'rgba(24,95,165,0.08)',  texte: 'var(--title-brand)' },
  attention: { accent: '#C07A2B',                   fond: 'rgba(192,122,43,0.12)', texte: 'var(--color-warning-text)' },
  erreur:    { accent: '#ef4444',                   fond: 'rgba(220,53,69,0.10)',  texte: 'var(--color-danger-text)' },
  succes:    { accent: 'var(--color-success-text)', fond: 'rgba(29,158,117,0.10)', texte: 'var(--color-success-text)' },
  neutre:    { accent: 'var(--border-color)',       fond: 'var(--bg-secondary)',   texte: 'var(--text-secondary)' },
};

function Encart({ ton = 'info', icone, titre, children, style }) {
  const t = TONS_ENCART[ton] || TONS_ENCART.info;
  return (
    <div style={{
      background: t.fond,
      border: '1px solid var(--border-color)',
      // Liseré d'accent en ombre interne plutôt qu'en `borderLeft` : `ton` change
      // en cours de vie (encart d'envoi), et faire varier une propriété détaillée
      // alors que la raccourcie `border` est posée fait diverger React au re-rendu.
      boxShadow: `inset 4px 0 0 0 ${t.accent}`,
      borderRadius: 10, padding: '13px 16px 13px 20px', marginBottom: 16,
      ...style,
    }}>
      {titre && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 13, color: t.texte, marginBottom: 6 }}>
          {icone && <span aria-hidden="true">{icone}</span>}
          <span>{titre}</span>
        </div>
      )}
      <div style={{ fontSize: 13, color: t.texte, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

// En-tête d'étape : la question en clair + ce que l'étape attend.
function EnteteEtape({ etape }) {
  return (
    <div>
      <h3 style={S.etapeTitre}>{etape.icon} {etape.titre}</h3>
      <p style={S.etapeAide}>{etape.aide}</p>
    </div>
  );
}

/**
 * Bloc de champs FACULTATIFS, replié par défaut.
 *
 * L'étape « identité » empilait six sections dépliées (dont l'adresse, les deux
 * parents, le tuteur et les informations sanitaires) : un mur de trente champs
 * dont cinq seulement sont obligatoires. Replier l'accessoire ramène l'étape à
 * l'essentiel tout en laissant l'information saisissable en un clic.
 *
 * Le bloc s'ouvre d'office quand il contient déjà une valeur — retour sur un
 * brouillon : rien de ce que le candidat a saisi ne doit rester caché. Aucun
 * champ obligatoire n'y est placé : un champ en erreur ne peut donc jamais se
 * retrouver hors de vue.
 */
function BlocFacultatif({ titre, resume, rempliInitialement, children }) {
  const [ouvert, setOuvert] = useState(!!rempliInitialement);

  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, marginBottom: 14, overflow: 'hidden', background: 'var(--bg-card)' }}>
      <button
        type="button"
        onClick={() => setOuvert(o => !o)}
        aria-expanded={ouvert}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '13px 16px', textAlign: 'left', color: 'var(--text-primary)',
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--text-muted)', transform: ouvert ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▶</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 13.5 }}>{titre}</span>
          <span style={{ ...S.badgeFacultatif, marginLeft: 8 }}>Facultatif</span>
          {!ouvert && resume && (
            <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{resume}</span>
          )}
        </span>
        <span style={{ fontSize: 12, color: 'var(--title-brand)', fontWeight: 600, whiteSpace: 'nowrap' }}>
          {ouvert ? 'Masquer' : 'Renseigner'}
        </span>
      </button>
      {ouvert && <div style={{ padding: '4px 16px 8px', borderTop: '1px solid var(--border-color)' }}>{children}</div>}
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
  // Dossier déjà déposé avec cette adresse e-mail. Le backend refuse le doublon
  // (« Un dossier existe déjà avec cet email »), mais il ne le disait qu'à
  // l'envoi — après avoir rempli les trois étapes et téléversé les pièces. On
  // pose la question dès la saisie de l'adresse.
  const [dossierExistant, setDossierExistant] = useState(null);
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

  // Brouillon restauré : l'adresse est déjà dans le champ, aucun blur ne
  // surviendra. Sans ce contrôle au montage, un candidat qui reprend un
  // brouillon portant une adresse déjà déposée refait tout le parcours pour
  // se faire refuser à l'envoi.
  useEffect(() => {
    if (form.email) verifierEmailDisponible(form.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- contrôle unique au montage
  }, []);

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
    // L'adresse change : le verdict précédent ne vaut plus (il sera réévalué au blur).
    if (name === 'email') setDossierExistant(null);
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
    const { name, value } = e.target;
    setFieldTouched(p => ({ ...p, [name]: true }));
    if (name === 'email') verifierEmailDisponible(value);
  };

  // Interroge le suivi public : 200 = un dossier existe pour cette adresse,
  // 404 = elle est libre. Ne bloque rien en cas de panne réseau — le contrôle
  // d'unicité côté serveur reste l'autorité, celui-ci n'est qu'un raccourci.
  const verifierEmailDisponible = async (valeurEmail) => {
    const adresse = (valeurEmail || '').trim().toLowerCase();
    if (!adresse || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adresse)) {
      setDossierExistant(null);
      return;
    }
    try {
      const r = await api.get(`/api/dossiers/statut/email/${encodeURIComponent(adresse)}`);
      setDossierExistant({ ...r.data, email: adresse });
    } catch {
      setDossierExistant(null);
    }
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
      // Le serveur refusera le doublon : autant l'annoncer ici plutôt qu'après
      // le téléversement des pièces.
      else if (dossierExistant && dossierExistant.email === form.email.trim().toLowerCase()) {
        e.email = `Un dossier a déjà été déposé avec cette adresse (${dossierExistant.numeroDossier}). Utilisez une autre adresse, ou suivez le dossier existant.`;
      }
      if (!form.telephone1.trim())       e.telephone1 = 'Le téléphone est obligatoire.';
      else if (!phoneRegex.test(form.telephone1)) e.telephone1 = 'Numéro de téléphone invalide.';
      // Une seule personne à prévenir est exigée — souvent un parent, mais pas
      // toujours : un candidat orphelin ou venu d'une autre province ne pouvait
      // pas passer l'étape tant que « père ou mère » était imposé. Les parents
      // restent saisissables, en facultatif.
      if (!form.urgenceNom.trim()) {
        e.urgenceNom = 'Indiquez une personne à prévenir en cas d\'urgence.';
      }
      if (!form.urgenceTelephone.trim()) {
        e.urgenceTelephone = 'Le téléphone de cette personne est obligatoire.';
      } else if (!phoneRegex.test(form.urgenceTelephone)) {
        e.urgenceTelephone = 'Numéro de téléphone invalide.';
      }
    }
    if (n === 2) {
      if (!form.anneeAcademiqueId)  e.anneeAcademiqueId = 'Sélectionnez une année académique.';
      if (!form.universiteId)       e.universiteId = 'Sélectionnez une université.';
      if (!form.departementId)      e.departementId = 'Sélectionnez un département.';
      if (!form.filiereId)          e.filiereId = 'Sélectionnez une filière.';
      if (!form.niveau)             e.niveau = 'Sélectionnez un niveau.';
      if (vacations.length >= 2 && !form.vacationId) {
        e.vacationId = 'Cette filière propose deux vacations (Jour/Soir) : choisissez-en une.';
      }
      if (exetatObligatoire(form.anneeObtention) && !form.codeExetat.trim()) {
        e.codeExetat = 'Le code EXETAT est obligatoire pour un diplôme obtenu en 2022 ou après.';
      }
    }
    if (n === 3) {
      docsRequisActifs.filter(d => d.obligatoire).forEach(doc => {
        if (doc.key === 'diplomeEtat') {
          if (!form.diplomeEtat && !form.attestationReussite) {
            e.diplomeEtat = "Fournissez le diplôme d'État, ou l'attestation de réussite si le diplôme n'est pas encore délivré.";
          }
          return;
        }
        if (!form[doc.key]) e[doc.key] = `${libelleDocument(doc.key)} est obligatoire.`;
      });
      if (!form.certifie) e.certifie = "Vous devez certifier l'exactitude des informations.";
      if (!form.accepteReglement) e.accepteReglement = 'Vous devez accepter le règlement intérieur.';
    }
    return e;
  };

  // Nomme les champs manquants au lieu de renvoyer à « les champs en rouge » :
  // le champ fautif peut se trouver dans un bloc facultatif replié ou hors écran.
  const resumerManques = (e) => {
    const noms = Object.keys(e).map(k => LIBELLES_CHAMPS[k] || libelleDocument(k));
    if (noms.length === 1) return `⚠️ Il manque une information : ${noms[0]}.`;
    return `⚠️ ${noms.length} informations à compléter : ${noms.join(', ')}.`;
  };

  const valider = () => {
    const e = getErreursEtape(etape);
    setErreurs(e);
    if (Object.keys(e).length) {
      // Sans cela, un candidat qui clique « Suivant » sans rien remplir voyait le
      // bandeau d'erreur mais AUCUN champ en rouge : les messages sont masqués
      // tant que le champ n'a pas été touché. On les considère touchés dès qu'une
      // validation les signale.
      setFieldTouched(p => ({ ...p, ...Object.fromEntries(Object.keys(e).map(k => [k, true])) }));
      setMsgGlobal(resumerManques(e));
      // Mise au point sur le premier champ fautif (le rendu du rouge intervient
      // au tour suivant : on attend la peinture pour que le sélecteur le trouve).
      requestAnimationFrame(() => {
        const premier = document.querySelector('[aria-invalid="true"]');
        if (premier) premier.focus({ preventScroll: false });
      });
      return false;
    }
    setMsgGlobal('');
    return true;
  };

  // Revalide TOUTES les étapes (utilisé juste avant la soumission finale,
  // au cas où des données saisies plus tôt auraient été modifiées entre-temps
  // sans repasser par la validation de leur étape d'origine).
  const validerTout = () => {
    const etapesAValider = [1, 2, 3];
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
      setFieldTouched(p => ({ ...p, ...Object.fromEntries(Object.keys(toutesErreurs).map(k => [k, true])) }));
      const etapeFautive = ETAPES.find(x => x.num === premiereEtapeEnErreur);
      setMsgGlobal(`${resumerManques(toutesErreurs)} (étape « ${etapeFautive?.label || premiereEtapeEnErreur} »)`);
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
    if (n === etape) return;
    if (n < etape) {
      setEtape(n);
      setMsgGlobal('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    // En avant : valider TOUTES les étapes franchies, pas seulement l'étape
    // courante. Cliquer la pastille 3 depuis l'étape 1 sautait la validation de
    // l'étape 2 ; le manque n'apparaissait qu'à l'envoi.
    for (let i = etape; i < n; i += 1) {
      const e = getErreursEtape(i);
      if (Object.keys(e).length) {
        setErreurs(e);
        setFieldTouched(p => ({ ...p, ...Object.fromEntries(Object.keys(e).map(k => [k, true])) }));
        setMsgGlobal(resumerManques(e));
        setEtape(i);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
    setErreurs({});
    setMsgGlobal('');
    setEtape(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      setMsgGlobal('❌ Champs obligatoires manquants : ' + idsManquants.join(', ') + '. Vérifiez l\'étape « Votre formation ».');
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
        // false = le serveur de messagerie était injoignable. Le dossier est
        // bien enregistré, mais le candidat ne recevra rien : il doit noter son
        // numéro lui-même, sinon il ne pourra ni payer ni suivre son dossier.
        accuseEnvoye: res.data.accuseReceptionEnvoye !== false,
      });
      setMsgSuccess('✅ Dossier soumis avec succès !');
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.details || data?.message || data?.erreur || err.message || 'Erreur lors de la soumission.';
      // Le message brut en clair, et non l'objet : « ❌ Soumission échouée: Object »
      // n'apprend rien tant qu'on ne déplie pas la console.
      console.error('❌ Soumission échouée (HTTP %s) : %s', err.response?.status ?? '?', msg);

      // Les refus les plus fréquents sont des règles d'unicité. Le message du
      // serveur constate le problème sans dire quoi faire : on ajoute l'issue.
      let conseil = '';
      if (/existe déjà avec cet email|étudiant est déjà inscrit avec cet email/i.test(msg)) {
        conseil = " Une seule candidature par adresse e-mail est acceptée : suivez le dossier existant depuis « Suivi du dossier », ou reprenez avec une autre adresse.";
        setEtape(1);
      } else if (/existe déjà avec ce numéro de téléphone/i.test(msg)) {
        conseil = ' Ce numéro est déjà rattaché à un dossier dans cet établissement. Indiquez un autre numéro joignable.';
        setEtape(1);
      } else if (/vacation choisie n'est pas ouverte/i.test(msg)) {
        conseil = " Les inscriptions de cette vacation viennent de fermer. Revenez à l'étape « Votre formation » pour en choisir une autre.";
        setEtape(2);
      }
      setMsgGlobal('❌ ' + msg + conseil);
      // Remonter en haut du formulaire pour que la bannière d'erreur soit visible
      // (au moment de la soumission on est en bas, sur le bouton — sinon l'échec paraît muet).
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setChargement(false);
      setIsSubmitting(false);
    }
  };

  // ─── Fonctions de rendu des étapes ──────────────────────────

  // ÉTAPE 1 : identité et contact.
  // Ordre voulu : d'abord les six champs réellement obligatoires, ensuite tout
  // l'accessoire (adresse, parents, tuteur, santé) rangé dans des blocs repliés.
  const renderEtape1 = () => (
    <div>
      <EnteteEtape etape={ETAPES[0]} />

      <div style={S.bloc}>
        <div className="insc-titre-section" style={S.sectionTitle}><span>Votre identité</span></div>
        <div className="insc-grid2" style={S.grid2}>
          <F label="Nom" name="nom" required value={form.nom} onChange={handleChange} onBlur={handleBlur} error={fieldTouched.nom && erreurs.nom} />
          <F label="Post-nom" name="postnom" value={form.postnom} onChange={handleChange} onBlur={handleBlur} />
          <F label="Prénom" name="prenom" required value={form.prenom} onChange={handleChange} onBlur={handleBlur} error={fieldTouched.prenom && erreurs.prenom} />
          <Sel label="Sexe" name="sexe" value={form.sexe} onChange={handleChange}>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </Sel>
          <F label="Date de naissance" name="dateNaissance" type="date" required value={form.dateNaissance} onChange={handleChange} onBlur={handleBlur} error={fieldTouched.dateNaissance && erreurs.dateNaissance} />
          <F label="Lieu de naissance" name="lieuNaissance" required value={form.lieuNaissance} onChange={handleChange} onBlur={handleBlur} error={fieldTouched.lieuNaissance && erreurs.lieuNaissance} hint="Ville ou territoire (ex. Kinshasa)" />
        </div>
      </div>

      <div style={S.bloc}>
        <div className="insc-titre-section" style={S.sectionTitle}><span>Comment vous joindre</span></div>
        {dossierExistant && (
          <Encart ton="attention" icone="⚠️" titre="Un dossier existe déjà pour cette adresse">
            Dossier <strong>{dossierExistant.numeroDossier}</strong>
            {dossierExistant.statut ? ` — statut : ${dossierExistant.statut}` : ''}.
            {' '}Une seule candidature par adresse e-mail est acceptée.{' '}
            <Link to="/suivi-dossier" style={{ color: 'inherit', fontWeight: 700 }}>Suivre ce dossier</Link>
            {' '}ou saisissez une autre adresse.
          </Encart>
        )}
        <div className="insc-grid2" style={S.grid2}>
          <F label="Adresse e-mail" name="email" type="email" required
             value={form.email} onChange={handleChange} onBlur={handleBlur}
             error={fieldTouched.email && erreurs.email}
             inputMode="email"
             hint="Votre accusé de réception et le lien de paiement y seront envoyés." />
          <F label="Téléphone principal" name="telephone1" type="tel" required
             value={form.telephone1} onChange={handleChange} onBlur={handleBlur}
             error={fieldTouched.telephone1 && erreurs.telephone1}
             inputMode="tel" placeholder="+243 8XX XXX XXX" />
        </div>
      </div>

      <div style={S.bloc}>
        <div className="insc-titre-section" style={S.sectionTitle}><span>Personne à prévenir en cas d'urgence</span></div>
        <p style={{ ...S.hint, marginTop: -12, marginBottom: 14 }}>
          Un parent, un tuteur ou un proche que l'établissement pourra contacter — une seule personne suffit.
        </p>
        <div className="insc-grid2" style={S.grid2}>
          <F label="Nom complet" name="urgenceNom" required
             value={form.urgenceNom} onChange={handleChange} onBlur={handleBlur}
             error={fieldTouched.urgenceNom && erreurs.urgenceNom} />
          <F label="Téléphone" name="urgenceTelephone" type="tel" required
             value={form.urgenceTelephone} onChange={handleChange} onBlur={handleBlur}
             error={fieldTouched.urgenceTelephone && erreurs.urgenceTelephone}
             inputMode="tel" placeholder="+243 8XX XXX XXX" />
        </div>
      </div>

      {/* ─── Ce qui suit est facultatif : replié par défaut ─── */}
      <div className="insc-titre-section" style={{ ...S.sectionTitle, marginTop: 26 }}>
        <span>Compléments</span>
        <span style={S.badgeFacultatif}>Vous pourrez les ajouter plus tard</span>
      </div>

      <BlocFacultatif
        titre="Nationalité, état civil et téléphone secondaire"
        resume="Congolaise · Célibataire par défaut"
        rempliInitialement={!!form.telephone2}
      >
        <div className="insc-grid2" style={S.grid2}>
          <F label="Nationalité" name="nationalite" value={form.nationalite} onChange={handleChange} />
          <Sel label="État civil" name="etatCivil" value={form.etatCivil} onChange={handleChange}>
            <option value="Célibataire">Célibataire</option>
            <option value="Marié(e)">Marié(e)</option>
            <option value="Divorcé(e)">Divorcé(e)</option>
            <option value="Veuf/Veuve">Veuf/Veuve</option>
          </Sel>
          <F label="Téléphone secondaire" name="telephone2" type="tel" inputMode="tel" value={form.telephone2} onChange={handleChange} />
        </div>
      </BlocFacultatif>

      <BlocFacultatif
        titre="Adresse de résidence"
        resume="Province, ville, commune, quartier, avenue"
        rempliInitialement={!!(form.province || form.ville || form.commune || form.quartier || form.avenue || form.numeroResidence)}
      >
        <div className="insc-grid2" style={S.grid2}>
          <F label="Province" name="province" value={form.province} onChange={handleChange} />
          <F label="Ville" name="ville" value={form.ville} onChange={handleChange} />
          <F label="Commune" name="commune" value={form.commune} onChange={handleChange} />
          <F label="Quartier" name="quartier" value={form.quartier} onChange={handleChange} />
          <F label="Avenue" name="avenue" value={form.avenue} onChange={handleChange} />
          <F label="N° de résidence" name="numeroResidence" value={form.numeroResidence} onChange={handleChange} />
        </div>
      </BlocFacultatif>

      <BlocFacultatif
        titre="Parents et tuteur"
        resume="Père, mère, tuteur légal"
        rempliInitialement={!!(form.pereNom || form.mereNom || form.tuteurNom)}
      >
        <div style={S.section}>
          <div className="insc-titre-section" style={S.sectionTitle}><span>Père</span></div>
          <div className="insc-grid2" style={S.grid2}>
            <F label="Nom complet" name="pereNom" value={form.pereNom} onChange={handleChange} />
            <F label="Profession" name="pereProfession" value={form.pereProfession} onChange={handleChange} />
            <F label="Téléphone" name="pereTelephone" type="tel" inputMode="tel" value={form.pereTelephone} onChange={handleChange} />
          </div>
        </div>
        <div style={S.section}>
          <div className="insc-titre-section" style={S.sectionTitle}><span>Mère</span></div>
          <div className="insc-grid2" style={S.grid2}>
            <F label="Nom complet" name="mereNom" value={form.mereNom} onChange={handleChange} />
            <F label="Profession" name="mereProfession" value={form.mereProfession} onChange={handleChange} />
            <F label="Téléphone" name="mereTelephone" type="tel" inputMode="tel" value={form.mereTelephone} onChange={handleChange} />
          </div>
        </div>
        <div style={S.section}>
          <div className="insc-titre-section" style={S.sectionTitle}><span>Tuteur</span></div>
          <div className="insc-grid2" style={S.grid2}>
            <F label="Nom complet" name="tuteurNom" value={form.tuteurNom} onChange={handleChange} />
            <F label="Lien de parenté" name="tuteurLien" value={form.tuteurLien} onChange={handleChange} />
            <F label="Téléphone" name="tuteurTelephone" type="tel" inputMode="tel" value={form.tuteurTelephone} onChange={handleChange} />
            <F label="Adresse" name="tuteurAdresse" value={form.tuteurAdresse} onChange={handleChange} span2 />
          </div>
        </div>
      </BlocFacultatif>

      <BlocFacultatif
        titre="Informations de santé"
        resume="Allergies, handicap — utiles au service médical de l'établissement"
        rempliInitialement={!!(form.allergies || form.handicap)}
      >
        <div className="insc-grid2" style={S.grid2}>
          <F label="Allergies" name="allergies" value={form.allergies} onChange={handleChange} />
          <F label="Handicap" name="handicap" value={form.handicap} onChange={handleChange} />
        </div>
      </BlocFacultatif>
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
      <EnteteEtape etape={ETAPES[1]} />
      {msgInfo && <Encart ton="attention" icone="ℹ️">{msgInfo}</Encart>}
      {filiereSelectionnee?.conditionsAdmission && (
        <Encart ton="info" icone="📌" titre={`Exigences d'admission — ${filiereSelectionnee.nom}`}>
          <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: 1.7 }}>
            {filiereSelectionnee.conditionsAdmission.split('\n').filter(l => l.trim()).map((ligne, i) => (
              <li key={i}>{ligne.trim()}</li>
            ))}
          </ul>
        </Encart>
      )}
      {filiereSelectionnee?.testAdmissionRequis && (
        <Encart ton="attention" icone="📝" titre="Test d'admission requis">
          L'admission à cette filière est soumise à la réussite d'un <strong>test d'admission</strong>. Après le dépôt de votre dossier, vous serez convoqué(e) au test par le secrétariat.
        </Encart>
      )}
      {/* Année académique — toujours à choisir ici */}
      {/* Année, établissement, filière et niveau forment UNE décision : les
          présenter en quatre sections nues laissait quatre grilles flotter sans
          délimitation. Une seule carte les rassemble. */}
      <div style={S.bloc}>
        <div className="insc-titre-section" style={S.sectionTitle}><span>Votre choix de formation</span></div>
        <div className="insc-grid2" style={S.grid2}>
          <Sel label="Année académique" name="anneeAcademiqueId" required disabled={prefilled && !!form.anneeAcademiqueId} value={form.anneeAcademiqueId} onChange={handleChange} error={fieldTouched.anneeAcademiqueId && erreurs.anneeAcademiqueId}>
            <option value="">-- Sélectionner --</option>
            {annees.map(a => <option key={a.id} value={a.id}>{a.libelle} {a.active ? '(Active)' : ''}</option>)}
          </Sel>
          <div />
        </div>

      {academicPreset ? (
        /* Université / département / filière déjà choisis à l'étape précédente :
           résumé en lecture seule (pas besoin de re-remplir). « Modifier » rouvre les menus. */
        <div style={S.section}>
          <div style={{ border: '1.5px solid rgba(24,95,165,0.35)', borderRadius: 12, background: 'rgba(24,95,165,0.06)', padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--title-brand)', fontWeight: 700, fontSize: 13 }}>
                <span>✅</span> Votre choix de formation
              </div>
              <button type="button" onClick={() => setPrefilled(false)}
                style={{ background: 'none', border: '1px solid currentColor', color: 'var(--title-brand)', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
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
        /* Les sélecteurs vivent maintenant DANS la carte : pas d'enveloppe
           S.section supplémentaire, dont la marge de 22 px creusait des trous
           entre des champs qui forment une cascade continue. */
        <>
          <div className="insc-grid2" style={S.grid2}>
            <Sel label="Université" name="universiteId" required value={form.universiteId} onChange={handleChange} error={fieldTouched.universiteId && erreurs.universiteId}>
              <option value="">-- Sélectionner --</option>
              {universites.map(u => <option key={u.id} value={u.id}>{u.nom}</option>)}
            </Sel>
            <Sel label="Département" name="departementId" required disabled={loadingDepts} value={form.departementId} onChange={handleChange} error={fieldTouched.departementId && erreurs.departementId}>
              <option value="">-- {loadingDepts ? 'Chargement...' : 'Sélectionner'} --</option>
              {departements.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
            </Sel>
          </div>
          <div className="insc-grid2" style={S.grid2}>
            <Sel label="Filière" name="filiereId" required disabled={loadingFilieres} value={form.filiereId} onChange={handleChange} error={fieldTouched.filiereId && erreurs.filiereId}>
              <option value="">-- {loadingFilieres ? 'Chargement...' : 'Sélectionner'} --</option>
              {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </Sel>
            <div />
          </div>
        </>
      )}
        <div className="insc-grid2" style={S.grid2}>
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
      </div>{/* fin de la carte « Votre choix de formation » */}
      {/* Vacation demandée UNIQUEMENT si l'établissement propose au moins deux
          vacations (choix Jour/Soir) ; une seule vacation est auto-sélectionnée,
          et sans vacation les frais viennent de l'université. */}
      {vacations.length >= 2 && (
        <div style={{ ...S.bloc, paddingBottom: 20 }}>
          <div className="insc-titre-section" style={S.sectionTitle}><span>🕐 Vacation</span></div>
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
                      background: 'rgba(24,95,165,0.10)', color: 'var(--title-brand)',
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

      {/* Diplôme du secondaire : seuls l'école, l'année et le code EXETAT sont
          demandés d'emblée — l'année conditionne l'obligation du code EXETAT,
          elle ne peut donc pas être rangée hors de vue. Le reste (numéro du
          diplôme, moyenne, option) part en facultatif. */}
      <div style={S.bloc}>
        <div className="insc-titre-section" style={S.sectionTitle}><span>Votre diplôme du secondaire</span></div>
        <div className="insc-grid2" style={S.grid2}>
          <F label="École secondaire" name="ecoleSecondaire" value={form.ecoleSecondaire} onChange={handleChange} />
          <F label="Année d'obtention" name="anneeObtention" type="number" inputMode="numeric" placeholder="2025"
             value={form.anneeObtention} onChange={handleChange} />
          <F label="Code EXETAT" name="codeExetat"
             required={exetatObligatoire(form.anneeObtention)}
             value={form.codeExetat} onChange={handleChange} onBlur={handleBlur}
             error={fieldTouched.codeExetat && erreurs.codeExetat}
             span2
             hint={exetatObligatoire(form.anneeObtention)
               ? 'Obligatoire pour un diplôme obtenu en 2022 ou après (vérifié sur la plateforme officielle).'
               : 'À renseigner si vous en disposez.'} />
        </div>
      </div>

      <BlocFacultatif
        titre="Détails du diplôme"
        resume="Province de l'école, numéro du diplôme, moyenne, option"
        rempliInitialement={!!(form.provinceEcole || form.numeroDiplome || form.pourcentage || form.option)}
      >
        <div className="insc-grid2" style={S.grid2}>
          <F label="Province de l'école" name="provinceEcole" value={form.provinceEcole} onChange={handleChange} />
          <F label="Numéro du diplôme" name="numeroDiplome" value={form.numeroDiplome} onChange={handleChange} />
          <F label="Pourcentage / Moyenne" name="pourcentage" type="number" step="0.01" inputMode="decimal" value={form.pourcentage} onChange={handleChange} />
          <F label="Option / Orientation" name="option" value={form.option} onChange={handleChange} />
        </div>
      </BlocFacultatif>
    </div>
    );
  };

  // ─── Bloc « documents » de l'étape 3 ────────────────────────
  // Liste pilotée par la filière (documentsRequis prédéfinis par l'admin),
  // regroupée par catégorie du catalogue.
  const renderDocuments = () => {
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
        <div className="insc-titre-section" style={S.sectionTitle}><span>Documents à joindre</span></div>

        {/* Bandeau d'information (formats + provenance de la liste) */}
        <Encart ton="info" icone="💡" titre="Comment joindre vos pièces">
          Téléversez les copies scannées ou photos de vos documents. Formats acceptés : <strong>PDF, JPG, PNG</strong> (max 5 Mo).
          {filiereSelectionnee?.documentsRequis && (
            <> Liste définie par <strong>{filiereSelectionnee.nom}</strong> ; les documents marqués <span style={{ color: '#ef4444', fontWeight: 700 }}>*</span> sont obligatoires.</>
          )}
        </Encart>

        {/* Progression des documents obligatoires */}
        {obligatoires.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 6 }}>
              <span>Documents obligatoires fournis</span>
              <strong style={{ color: pct === 100 ? 'var(--color-success-text)' : 'var(--title-brand)' }}>{fournisObl} / {obligatoires.length}</strong>
            </div>
            <div style={{ height: 8, borderRadius: 20, background: 'var(--bg-secondary, #eef2f7)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, borderRadius: 20, background: pct === 100 ? 'linear-gradient(90deg,#1D9E75,#0F6E56)' : 'linear-gradient(90deg,#185FA5,#0B1F4A)', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}

        {erreursDocs.length > 0 && (
          <Encart ton="erreur" icone="⚠️" titre="Documents obligatoires manquants">
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {erreursDocs.map(d => <li key={d.key}>{erreurs[d.key]}</li>)}
            </ul>
          </Encart>
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
                <div className="insc-grid2" style={S.grid2}>
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

  // Relecture condensée : le dossier tenait sur un écran entier de « révision »
  // que personne ne lisait après avoir déjà rempli deux étapes. On en garde
  // l'essentiel — ce qui identifie le candidat et son inscription — juste
  // au-dessus des engagements, avec un lien de correction par étape.
  const renderRecapitulatif = () => {
    const trouver = (liste, id) => liste.find(x => String(x.id) === String(id))?.nom;
    const vacationChoisie = vacations.find(v => String(v.id) === String(form.vacationId));
    const lignes = [
      {
        titre: 'Vous', etape: 1, items: [
          ['Nom complet', [form.nom, form.postnom, form.prenom].filter(Boolean).join(' ')],
          ['Né(e) le', form.dateNaissance ? `${form.dateNaissance}${form.lieuNaissance ? ` à ${form.lieuNaissance}` : ''}` : null],
          ['E-mail', form.email],
          ['Téléphone', form.telephone1],
          ['En cas d\'urgence', form.urgenceNom ? `${form.urgenceNom}${form.urgenceTelephone ? ` — ${form.urgenceTelephone}` : ''}` : null],
        ],
      },
      {
        titre: 'Votre formation', etape: 2, items: [
          ['Établissement', trouver(universites, form.universiteId)],
          ['Département', trouver(departements, form.departementId)],
          ['Filière', trouver(filieres, form.filiereId)],
          ['Niveau', NIVEAUX.find(n => n.id === form.niveau)?.libelle || form.niveau],
          ['Vacation', vacationChoisie ? `${vacationChoisie.type === 'JOUR' ? '☀️ Jour' : '🌙 Soir'} — ${vacationChoisie.nom}` : null],
          ['Code EXETAT', form.codeExetat],
        ],
      },
    ];

    return (
      <div style={S.revSection}>
        <div style={S.revHeader}>
          <div style={S.revTitle}>🔍 Vérifiez avant d'envoyer</div>
        </div>
        <p style={{ ...S.hint, marginTop: -8, marginBottom: 16 }}>
          Une fois envoyé, votre dossier ne peut plus être modifié.
        </p>
        {lignes.map(bloc => (
          <div key={bloc.titre} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{bloc.titre}</div>
              <button type="button" style={S.revEdit} onClick={() => allerEtape(bloc.etape)}>Modifier</button>
            </div>
            <div className="insc-grid2" style={S.revGrid}>
              {bloc.items.filter(([, v]) => v).map(([cle, valeur]) => (
                <div key={cle} style={S.revItem}>
                  <span style={S.revKey}>{cle}</span>
                  <span style={S.revVal}>{valeur}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ÉTAPE 3 : documents, relecture et envoi.
  // Le paiement se fait APRÈS, via le lien TachPay de l'accusé de réception.
  const renderEtape3 = () => {
    const obligatoires = docsRequisActifs.filter(d => d.obligatoire);
    const docsManquants = obligatoires.filter(d => (
      d.key === 'diplomeEtat' ? !form.diplomeEtat && !form.attestationReussite : !form[d.key]
    ));
    const pret = docsManquants.length === 0 && form.certifie && form.accepteReglement;

    return (
      <div>
        <EnteteEtape etape={ETAPES[2]} />

        {renderDocuments()}

        {renderRecapitulatif()}

        <Encart ton="info" icone="📌" titre="Ce qui se passe ensuite">
          <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.8 }}>
            <li>Vous recevez immédiatement votre <strong>numéro de dossier</strong>.</li>
            <li>Vous réglez les <strong>frais d'inscription</strong> via TachPay (mobile money ou carte).</li>
            <li>Le secrétariat traite votre dossier <strong>une fois le paiement reçu</strong>.</li>
            <li>Après validation, un e-mail part vers <strong>{form.email || 'votre adresse'}</strong> pour créer votre mot de passe et accéder à votre portail étudiant.</li>
          </ol>
        </Encart>

        {/* Engagements — obligatoires, donc hors de tout bloc repliable. */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', marginBottom: '12px' }}>
            <input type="checkbox" name="certifie" checked={form.certifie} onChange={handleChange} style={{ marginTop: '3px', width: '18px', height: '18px', accentColor: '#185FA5', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              Je certifie que toutes les informations fournies sont exactes et complètes.
            </span>
          </label>
          {erreurs.certifie && <div style={S.errorText}>{erreurs.certifie}</div>}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
            <input type="checkbox" name="accepteReglement" checked={form.accepteReglement} onChange={handleChange} style={{ marginTop: '3px', width: '18px', height: '18px', accentColor: '#185FA5', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              J'accepte le règlement intérieur de l'établissement.
            </span>
          </label>
          {erreurs.accepteReglement && <div style={S.errorText}>{erreurs.accepteReglement}</div>}
        </div>

        {/* Le bouton reste TOUJOURS cliquable : le désactiver laissait le candidat
            devant un bouton gris sans lui dire ce qui bloque. La validation, elle,
            nomme le manque et ramène à l'étape fautive. */}
        <Encart
          ton={pret ? 'succes' : 'attention'}
          icone={pret ? '✓' : '⏳'}
          titre={pret ? 'Votre dossier est complet' : 'Encore quelques éléments'}
          style={{ marginBottom: 0, padding: '18px 20px' }}
        >
          <p style={{ margin: '0 0 16px 0', lineHeight: 1.6 }}>
            {pret
              ? "Envoyez votre candidature : le paiement des frais se fera juste après, à l'écran suivant."
              : docsManquants.length > 0
                ? `Documents obligatoires à joindre : ${docsManquants.map(d => libelleDocument(d.key)).join(', ')}.`
                : 'Cochez les deux engagements ci-dessus pour pouvoir envoyer votre dossier.'}
          </p>
          <button
            className="btn-primary"
            onClick={() => { if (validerTout()) setShowConfirmSubmit(true); }}
            disabled={chargement || isSubmitting}
            style={{
              opacity: isSubmitting ? 0.6 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              padding: '14px 32px',
              fontSize: '16px',
            }}
          >
            {chargement ? '⏳ Envoi en cours...' : '🚀 Envoyer mon dossier'}
          </button>
        </Encart>
      </div>
    );
  };

  // ─── Page succès ─────────────────────────────────────────────
  if (dossier) {
    return (
      <div className="page">
        <div className="card" style={{ textAlign: 'center', padding: '40px', maxWidth: '560px', margin: '40px auto', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📨</div>
          <h2 style={{ color: 'var(--title-brand)', marginBottom: '8px' }}>Dossier bien reçu !</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            Votre inscription a été <strong>reçue</strong> mais n'est <strong>pas encore traitée</strong>.
          </p>
          {!dossier.accuseEnvoye && (
            <div style={{ textAlign: 'left' }}>
              <Encart ton="attention" icone="⚠️" titre="L'e-mail de confirmation n'a pas pu être envoyé">
                Votre dossier est bien enregistré, mais l'accusé de réception n'est pas parti vers
                {' '}<strong>{dossier.email}</strong>. <strong>Notez votre numéro de dossier ci-dessous</strong> :
                il vous sera demandé pour payer et pour suivre votre inscription. Vous pouvez aussi
                le retrouver depuis la page « Suivi du dossier » avec votre adresse e-mail.
              </Encart>
            </div>
          )}
          <div style={{ background: 'rgba(24,95,165,0.12)', borderRadius: '12px', padding: '24px', marginBottom: '20px', textAlign: 'left' }}>
            <div style={{ marginBottom: '8px' }}><strong>👤 Étudiant :</strong> {dossier.prenom} {dossier.nom}</div>
            <div style={{ marginBottom: '8px' }}><strong>🎓 Filière :</strong> {dossier.filiere || '—'}</div>
            <div style={{ marginBottom: '8px' }}><strong>🏛️ Institution :</strong> {dossier.universite}</div>
            <div style={{ padding: '12px 0', borderTop: '1px solid #bfdbfe', marginTop: '8px' }}>
              <strong>📋 N° de dossier : </strong>
              <span style={{ color: 'var(--title-brand)', fontWeight: 700, fontSize: '18px' }}>{dossier.numeroDossier}</span>
            </div>
          </div>
          <div style={{ background: 'rgba(192,122,43,0.12)', border: '1px solid #fcd34d', borderRadius: '12px', padding: '16px 20px', marginBottom: '18px', textAlign: 'left' }}>
            <div style={{ fontWeight: 700, color: 'var(--color-warning-text)', marginBottom: '6px', fontSize: '14px' }}>
              💳 Frais d'inscription{dossier.fraisInscription != null ? ` : ${dossier.fraisInscription} ${dossier.deviseFrais}` : ''}
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-warning-text)', margin: 0 }}>
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
            <p style={{ fontSize: '12px', color: 'var(--color-warning-text)', margin: '-6px 0 16px' }}>
              Ce lien de paiement expire le <strong>{new Date(dossier.paymentExpiresAt).toLocaleString('fr-FR')}</strong>.
            </p>
          )}
          <div style={{ background: 'rgba(29,158,117,0.12)', border: '1px solid #86efac', borderRadius: '12px', padding: '14px 18px', margin: '4px 0 18px', textAlign: 'left' }}>
            <div style={{ fontWeight: 700, color: 'var(--color-success-text)', marginBottom: '6px', fontSize: '13px' }}>✉️ Ensuite</div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: 'var(--color-success-text)', lineHeight: 1.7 }}>
              <li>Après paiement, le secrétariat traite votre dossier</li>
              <li>Une fois <strong>validé</strong>, un email est envoyé à <strong>{dossier.email}</strong> pour créer votre mot de passe et accéder à votre portail</li>
              <li>Suivez l'état à tout moment via la page <Link to="/suivi-dossier" style={{ color: 'var(--color-success-text)', fontWeight: 600 }}>Suivi du dossier</Link></li>
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
        className="dialog-resizable inscription-panel"
        // minWidth: 460 en dur empêchait le panneau de descendre sous 460 px :
        // sur un téléphone de 360 px (TECNO, Infinix, itel… très répandus en
        // RDC) le formulaire débordait de l'écran et imposait un défilement
        // horizontal. `min(460px, 100%)` garde le confort sur grand écran tout
        // en laissant le panneau suivre la largeur réelle du téléphone.
        style={{ width: '100%', maxWidth: 920, minWidth: 'min(460px, 100%)', minHeight: 400, background: 'var(--bg-secondary)', borderRadius: '12px', boxShadow: '0 8px 40px rgba(0,0,0,0.10)', ...panelStyle }}
      >
      <div
        className="dialog-draggable-handle inscription-entete"
        {...dragHandleProps}
        style={{ background: 'linear-gradient(135deg, #185FA5, #1e40af)', color: '#fff', padding: '18px 24px', borderRadius: '12px 12px 0 0', marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '21px', fontWeight: 700 }}>📝 Portail des Inscriptions</h1>
          <p style={{ margin: '4px 0 0', opacity: 0.85, fontSize: '13px' }}>
            {ETAPES.length} étapes · environ 10 minutes · aucun compte requis
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
      <div className="inscription-etapes" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
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
              <span style={{ fontSize: '12px', color: etape === e.num ? 'var(--title-brand)' : 'var(--text-muted)', fontWeight: etape === e.num ? 600 : 400, whiteSpace: 'nowrap' }}>
                {e.label}
              </span>
              {e.num < ETAPES.length && (
                <div style={{ width: '20px', height: '2px', background: etape > e.num ? '#22c55e' : 'var(--border-color)', marginLeft: '4px' }} />
              )}
            </div>
          ))}
        </div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--title-brand)', whiteSpace: 'nowrap' }}>
          Étape {etape} / {ETAPES.length}
        </div>
      </div>

      {msgGlobal && (
        <div onClick={() => setMsgGlobal('')} style={{ cursor: 'pointer', margin: '0 24px' }}>
          <Encart ton="erreur" style={{ marginTop: 16, marginBottom: 0 }}>
            {msgGlobal} &nbsp;<span style={{ opacity: 0.5 }}>×</span>
          </Encart>
        </div>
      )}
      {msgSuccess && (
        <div onClick={() => setMsgSuccess('')} style={{ cursor: 'pointer', margin: '0 24px' }}>
          <Encart ton="succes" style={{ marginTop: 16, marginBottom: 0 }}>
            {msgSuccess}
          </Encart>
        </div>
      )}

      <div className="card inscription-corps" style={{ borderRadius: '0 0 12px 12px', padding: '20px 24px', minHeight: '400px' }}>
        {etape === 1 && renderEtape1()}
        {etape === 2 && renderEtape2()}
        {etape === 3 && renderEtape3()}

        {etape < ETAPES.length && (
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
              {etape === ETAPES.length - 1 ? 'Passer aux documents →' : 'Suivant →'}
            </button>
          </div>
        )}
        {/* Dernière étape : le bouton d'envoi vit dans l'étape elle-même, sous les
            engagements. Ne reste ici que la sortie de secours. */}
        {etape === ETAPES.length && (
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '18px', flexWrap: 'wrap', gap: 10 }}>
            <button className="btn-outline" onClick={precedent} style={{ padding: '9px 22px', fontSize: '14px' }}>
              ← Précédent
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
