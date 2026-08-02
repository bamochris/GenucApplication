// src/components/TachPayCheckout.jsx
import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { resolveFileUrl } from '../utils/fileUrl';
import { canauxCommuns } from '../utils/canauxPaiement';
import { logoBanque } from '../constants/banquesRdc';
import PaiementStatutPoller from './PaiementStatutPoller';
import { safeRedirect } from '../utils/urlValidator';
import './TachPayCheckout.css';
import { API_BASE_URL } from '../config/apiBaseUrl';

// Base URL du backend
const API_BASE = API_BASE_URL;

// ─── Données statiques ─────────────────────────────────────────────
const PAYS = [
  { code: 'CD', nom: 'République Démocratique du Congo', indicatif: '+243' },
  { code: 'CG', nom: 'République du Congo',              indicatif: '+242' },
  { code: 'RW', nom: 'Rwanda',                           indicatif: '+250' },
  { code: 'BI', nom: 'Burundi',                          indicatif: '+257' },
  { code: 'UG', nom: 'Ouganda',                          indicatif: '+256' },
  { code: 'TZ', nom: 'Tanzanie',                         indicatif: '+255' },
  { code: 'AO', nom: 'Angola',                           indicatif: '+244' },
  { code: 'CM', nom: 'Cameroun',                         indicatif: '+237' },
  { code: 'FR', nom: 'France',                           indicatif: '+33'  },
  { code: 'BE', nom: 'Belgique',                         indicatif: '+32'  },
];

const PROVINCES_RDC = [
  'Kinshasa','Kongo-Central','Kwango','Kwilu','Mai-Ndombe',
  'Kasaï','Kasaï-Central','Kasaï-Oriental','Lomami','Sankuru',
  'Maniema','Sud-Kivu','Nord-Kivu','Ituri','Haut-Uélé',
  'Tshopo','Bas-Uélé','Nord-Ubangi','Mongala','Sud-Ubangi',
  'Équateur','Tshuapa','Tanganyika','Haut-Lomami','Lualaba','Haut-Katanga',
];

const TYPES_PAIEMENT = [
  { id: 'INSCRIPTION',              label: "Frais d'inscription",                 icone: '🎓' },
  { id: 'REINSCRIPTION',            label: 'Frais de reinscription',               icone: '🔁' },
  { id: 'FRAIS_ACADEMIQUE',         label: 'Frais académiques',                    icone: '📚' },
  { id: 'FRAIS_LABORATOIRE',        label: 'Frais de laboratoire',                 icone: '🔬' },
  { id: 'ENROLEMENT_S1',            label: 'Enrôlement 1er semestre',              icone: '📝' },
  { id: 'ENROLEMENT_S2',            label: 'Enrôlement 2e semestre',               icone: '🗂️' },
  { id: 'ENROLEMENT_RATTRAPAGE',    label: 'Enrôlement de rattrapage',             icone: '♻️' },
  { id: 'ABONNEMENT_BIBLIOTHEQUE',  label: 'Abonnement bibliothèque',              icone: '📖' },
  { id: 'STAGE_OBSERVATION',        label: "Stage d'observation",                 icone: '🧪' },
  { id: 'PRATIQUE_PROFESSIONNELLE', label: 'Pratique professionnelle',             icone: '💼' },
  { id: 'ATTESTATION_FREQUENTATION',label: 'Attestation de fréquentation',         icone: '📄' },
  { id: 'RELEVE_SEMESTRIEL',        label: 'Relevé de cotes semestriel',           icone: '📑' },
  { id: 'RELEVE_ANNUEL',            label: 'Relevé de cotes annuel',               icone: '📘' },
  { id: 'RELEVE_FINAL',             label: 'Relevé final de toutes les années',    icone: '🏅' },
  { id: 'AUTRE',                    label: 'Autres frais',                         icone: '💼' },
];

const LOGOS_CONNUS = {
  UNIKIN: '/assets/UNIKIN.png', UPN: '/assets/UPN.png', 'HEC-KIN': '/assets/HEC-KIN.png',
  ISIPA: '/assets/ISIPA.png', ISP: '/assets/ISP.jpg', REV_KIM: '/assets/REV_KIM.jpg',
  UCC: '/assets/UCC.jpg', UNILU: '/assets/UNILU.jpg', UNIGOM: '/assets/UNIGOM.jpg',
  UNIKIS: '/assets/UNIKIS.png', UNISIC: '/assets/UNISIC.png', UPC: '/assets/UPC.png',
};

const OPERATEURS = [
  { id: 'VODACOM',   label: 'Vodacom M-Pesa', couleur: '#e60012', bgLight: '#fff0f0', prefixes: '081/082/083/084' },
  { id: 'ORANGE',    label: 'Orange Money',   couleur: '#f77f00', bgLight: '#fff5e6', prefixes: '085/086/087/088' },
  { id: 'AIRTEL',    label: 'Airtel Money',   couleur: '#cc0000', bgLight: '#fff0f0', prefixes: '099/097/098'     },
  { id: 'AFRIMONEY', label: 'AfriMoney',      couleur: '#00a651', bgLight: '#effaf1', prefixes: '080/090'         },
];

// Libellés lisibles pour signaler précisément les champs en erreur.
const LABELS_ERREURS = {
  matricule: 'Matricule',
  nom: 'Nom',
  prenom: 'Prénom',
  email: 'Email',
  pays: 'Pays',
  universite: 'Université',
  typePaiement: 'Type de paiement',
  montant: 'Montant',
  modePaiement: 'Mode de paiement',
  inscriptionId: 'Identification de l\'étudiant',
  numeroDossier: 'Numéro de dossier',
  selectedFrais: 'Frais à payer (sélection)',
  operateur: 'Opérateur mobile',
  telPaiement: 'Numéro de téléphone',
};

// ─── Utilitaires ─────────────────────────────────────────────────
const genRef = () => {
  const rand = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID().split('-')[0].toUpperCase()
    : Math.random().toString(36).substring(2, 10).toUpperCase();
  return `TF-${Date.now().toString(36).toUpperCase()}-${rand}`;
};

const fmt = (m, d) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .format(parseFloat(m || 0)) + ' ' + d;

const today = () =>
  new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

const escHtml = (v) =>
  String(v ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

const OPERATOR_LOGOS = {
  VODACOM:   '/assets/M-pesa.jpg',
  ORANGE:    '/assets/orangeMoney.png',
  AIRTEL:    '/assets/Airtel-Money.png',
  AFRIMONEY: '/assets/Afrimoney.png',
};

function OperatorLogo({ id }) {
  const src = OPERATOR_LOGOS[id];
  if (!src) {
    return (
      <div style={{
        width: 60, height: 60,
        borderRadius: 10,
        flexShrink: 0,
        background: '#00a651',
        color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 900, fontSize: 11, textAlign: 'center', lineHeight: 1.1,
      }}>
        {id}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={id}
      style={{
        width: 60, height: 60,
        objectFit: 'contain',
        borderRadius: 10,
        flexShrink: 0,
        background: 'var(--bg-secondary)',
        border: '1px solid #e2e8f0',
        padding: 3,
      }}
    />
  );
}

function CardLogo({ type }) {
  const s = { borderRadius: 6, boxShadow: '0 2px 6px rgba(0,0,0,0.18)', display: 'block' };

  if (type === 'visa') return (
    <svg width="62" height="40" viewBox="0 0 62 40" style={s}>
      <rect width="62" height="40" rx="6" fill="#1a1f71"/>
      <text x="31" y="27" textAnchor="middle" fill="white" fontSize="18" fontWeight="900" fontStyle="italic" fontFamily="Arial,sans-serif" letterSpacing="1">VISA</text>
    </svg>
  );

  if (type === 'mastercard') return (
    <img
      src="/assets/mastercard-logo.jpg"
      alt="Mastercard"
      style={{ ...s, width: 62, height: 40, objectFit: 'contain', background: '#252525', padding: 2 }}
    />
  );

  if (type === 'maestro') return (
    <svg width="62" height="40" viewBox="0 0 62 40" style={s}>
      <rect width="62" height="40" rx="6" fill="#1a1f6c"/>
      <circle cx="23" cy="20" r="13" fill="#0099df" opacity="0.9"/>
      <circle cx="39" cy="20" r="13" fill="#cc0000" opacity="0.9"/>
      <text x="31" y="23" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="700" fontFamily="Arial,sans-serif">Maestro</text>
    </svg>
  );

  if (type === 'verve') return (
    <svg width="62" height="40" viewBox="0 0 62 40" style={s}>
      <rect width="62" height="40" rx="6" fill="#004B87"/>
      <rect x="0" y="28" width="62" height="12" rx="0" fill="#E8000D"/>
      <rect x="0" y="28" width="62" height="1.5" fill="#F5A800"/>
      <text x="31" y="22" textAnchor="middle" fill="white" fontSize="13" fontWeight="900" fontFamily="Arial,sans-serif" letterSpacing="1">Verve</text>
    </svg>
  );

  return null;
}

// Onglets de paiement du checkout, reliés aux modes gérés par le backend.
// « Bon caissier » couvre le règlement en espèces : à la caisse de l'université
// (ESPECES) ou au guichet d'une banque partenaire (DEPOT_BANCAIRE). L'onglet
// reste donc proposé dès que l'un des deux est ouvert par l'admin.
const ONGLETS_PAIEMENT = [
  { id: 'MOBILE_MONEY', label: 'Mobile Money',   icone: '📱', modes: ['MOBILE_MONEY'] },
  { id: 'CARTE_VISA',   label: 'Carte bancaire', icone: '💳', modes: ['CARTE_BANCAIRE'] },
  { id: 'BON_PAIEMENT', label: 'Bon caissier',   icone: '🧾', modes: ['DEPOT_BANCAIRE', 'ESPECES'] },
];

// ─── BonImprimable ────────────────────────────────────────────
function BonImprimable({ form, reference, universiteLogo, onClose, paymentLabel }) {
  const typLabel = paymentLabel || TYPES_PAIEMENT.find(t => t.id === form.typePaiement)?.label || form.typePaiement;

  const imprimer = () => {
    const w = window.open('', '_blank', 'width=760,height=960');
    w.document.write(`<!DOCTYPE html><html lang="fr"><head>
    <meta charset="UTF-8"><title>Bon — ${reference}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:Arial,sans-serif;color:#1e293b;background:#f0f4f8}
      .page{max-width:700px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.12)}
      .hd{background:linear-gradient(135deg,#0B1F4A,#185FA5);color:#fff;padding:24px 32px;display:flex;justify-content:space-between;align-items:center}
      .hd-left{display:flex;align-items:center;gap:16px}
      .hd-logo{height:50px;width:auto;object-fit:contain}
      .hd-brand{font-size:24px;font-weight:900;letter-spacing:-0.5px}
      .hd-sub{font-size:11px;opacity:.8;margin-top:2px}
      .hd-right{text-align:right}
      .hd-doc{font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:1px}
      .hd-date{font-size:12px;opacity:.8;margin-top:4px}
      .ref-bar{background:#eff6ff;border:1px solid #bfdbfe;padding:14px 32px;display:flex;justify-content:space-between;align-items:center}
      .ref-label{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px}
      .ref-value{font-family:'Courier New',monospace;font-size:18px;font-weight:700;color:#1d4ed8;letter-spacing:2px}
      .ref-validity{font-size:12px;color:#dc2626;font-weight:600}
      .section{padding:18px 32px;border-bottom:1px solid #f1f5f9}
      .sec-title{font-size:10px;font-weight:700;text-transform:uppercase;color:#64748b;margin-bottom:12px;padding-bottom:5px;border-bottom:2px solid #e2e8f0}
      .row{display:flex;justify-content:space-between;padding:5px 0;font-size:13px}
      .row span{color:#64748b}.row strong{color:#1e293b}
      .total-bar{background:#1e293b;color:#fff;padding:18px 32px;display:flex;justify-content:space-between;align-items:center}
      .total-label{font-size:14px;opacity:.8}.total-amount{font-size:30px;font-weight:900;color:#60a5fa}
      .inst{padding:16px 32px;background:#fffbeb;border-bottom:1px solid #fde68a}
      .inst-title{font-weight:700;color:#92400e;font-size:13px;margin-bottom:8px}
      .inst ol{padding-left:20px;color:#78350f;font-size:13px;line-height:2}
      .footer{text-align:center;padding:12px 32px;font-size:11px;color:#94a3b8;background:#f8fafc}
      .cut{border-top:2px dashed #94a3b8;margin:18px 32px 0;padding:12px 32px;text-align:center;font-size:11px;color:#94a3b8;letter-spacing:1px}
      .stub{display:flex;justify-content:space-between;align-items:center;padding:14px 32px 22px;background:#f8fafc}
      .stub-info{font-size:13px;line-height:1.8}
      .stub-amount{font-size:20px;font-weight:900;color:#1d4ed8}
      @media print{body{background:#fff}.page{box-shadow:none;border:1px solid #ddd}.no-print{display:none}}
    </style></head><body>
    <div class="page">
      <div class="hd">
        <div class="hd-left">
          ${universiteLogo ? `<img src="${escHtml(universiteLogo)}" alt="Logo université" class="hd-logo" />` : ''}
          <div><div class="hd-brand">${escHtml(form.universite) || 'GENUC'}</div><div class="hd-sub">République Démocratique du Congo</div></div>
        </div>
        <div class="hd-right"><div class="hd-doc">Bon de paiement</div><div class="hd-date">${today()}</div></div>
      </div>
      <div class="ref-bar">
        <div><div class="ref-label">Référence unique</div><div class="ref-value">${escHtml(reference)}</div></div>
        <div class="ref-validity">⚠ Valable 72 heures</div>
      </div>
      <div class="section"><div class="sec-title">Informations personnelles</div>
        <div class="row"><span>Nom complet</span><strong>${escHtml(form.prenom)} ${escHtml(form.nom)}</strong></div>
        ${form.matricule ? `<div class="row"><span>Matricule</span><strong>${escHtml(form.matricule)}</strong></div>` : ''}
        <div class="row"><span>Email</span><strong>${escHtml(form.email)}</strong></div>
        ${form.telephone ? `<div class="row"><span>Téléphone</span><strong>${escHtml(form.indicatif)} ${escHtml(form.telephone)}</strong></div>` : ''}
        <div class="row"><span>Pays</span><strong>${escHtml(form.pays)}</strong></div>
        ${form.province ? `<div class="row"><span>Province</span><strong>${escHtml(form.province)}</strong></div>` : ''}
        ${form.ville ? `<div class="row"><span>Ville</span><strong>${escHtml(form.ville)}</strong></div>` : ''}
      </div>
      <div class="section"><div class="sec-title">Informations académiques</div>
        <div class="row"><span>Université</span><strong>${escHtml(form.universite)}</strong></div>
        ${form.faculte ? `<div class="row"><span>Faculté</span><strong>${escHtml(form.faculte)}</strong></div>` : ''}
        ${form.filiere ? `<div class="row"><span>Filière</span><strong>${escHtml(form.filiere)}</strong></div>` : ''}
        ${form.promotion ? `<div class="row"><span>Promotion</span><strong>${escHtml(form.promotion)}</strong></div>` : ''}
        ${form.anneeScolaire ? `<div class="row"><span>Année académique</span><strong>${escHtml(form.anneeScolaire)}</strong></div>` : ''}
      </div>
      <div class="section"><div class="sec-title">Détails du paiement</div>
        <div class="row"><span>Type</span><strong>${escHtml(typLabel)}</strong></div>
        <div class="row"><span>Référence</span><strong>${escHtml(reference)}</strong></div>
        <div class="row"><span>Mode</span><strong>Espèces / Caissier</strong></div>
        ${form.notes ? `<div class="row"><span>Notes</span><strong>${escHtml(form.notes)}</strong></div>` : ''}
      </div>
      <div class="total-bar"><div class="total-label">Montant total à verser</div><div class="total-amount">${escHtml(fmt(form.montant, form.devise))}</div></div>
      <div class="inst"><div class="inst-title">📋 Instructions au porteur</div>
        <ol>
          <li>Présentez ce bon au caissier de votre université</li>
          <li>Réglez le montant exact en espèces ou par virement</li>
          <li>Exigez un reçu officiel portant le cachet de l'université</li>
          <li>Ce bon est <strong>strictement personnel</strong> et non transférable</li>
          <li>Ce bon expire après <strong>72 heures</strong> — Réf : ${escHtml(reference)}</li>
        </ol>
      </div>
      <div class="footer">Émis par GENUC le ${today()} · Réf : ${escHtml(reference)} · genuc.cd</div>
      <div class="cut">✂ ─────── TALON CAISSIER — DÉTACHER ET CONSERVER ───────</div>
      <div class="stub">
        <div class="stub-info"><strong>${escHtml(form.prenom)} ${escHtml(form.nom)}</strong>${form.matricule ? ' — ' + escHtml(form.matricule) : ''}<br/>
          ${escHtml(typLabel)} · ${escHtml(form.universite)}</div>
        <div class="stub-amount">${escHtml(fmt(form.montant, form.devise))}</div>
      </div>

    </div>
    <div class="no-print" style="text-align:center;margin:20px"><button onclick="window.print()" style="padding:10px 30px;background:#0B1F4A;color:#fff;border:none;border-radius:30px;font-size:16px;cursor:pointer">🖨️ Imprimer / PDF</button></div>
    </body></html>`);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 400);
  };

  return (
    <div className="tfc-bon-overlay">
      <div className="tfc-bon-wrapper">
        <div className="tfc-bon-toolbar">
          <span className="tfc-bon-toolbar-title">Aperçu du bon de paiement</span>
          <div className="tfc-bon-toolbar-right">
            <button className="tfc-btn tfc-btn-print" onClick={imprimer}>Imprimer / PDF</button>
            <button className="tfc-btn tfc-btn-ghost-w" onClick={onClose}>Retour</button>
          </div>
        </div>
        <div className="tfc-bon-body">
          <div style={{ background: 'var(--bg-card)', padding: 30, borderRadius: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 600 }}>🧾 Bon de paiement généré</p>
            <p>Référence : <strong>{reference}</strong></p>
            <p>Montant : {fmt(form.montant, form.devise)}</p>
            <p>Étudiant : {form.prenom} {form.nom}</p>
            <p style={{ marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
              Cliquez sur « Imprimer / PDF » pour ouvrir le document complet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── État initial ──────────────────────────────────────────────
const INIT_FORM = {
  numeroDossier: '',
  matricule: '', nom: '', prenom: '',
  email: '', telephone: '', indicatif: '+243',
  pays: 'République Démocratique du Congo', province: '', ville: '',
  universite: '', universiteId: '',
  departementId: '', faculte: '', filiereId: '', filiere: '', promotion: '', anneeScolaire: '2024-2025',
  typePaiement: '', montant: '', devise: 'USD', reference: '', notes: '',
  modePaiement: '',
  operateur: '', telPaiement: '',
  inscriptionId: null,
};

// ⚠️ Normalisation des données reçues via prefill (mapping clés alternatives)
const normalizePrefill = (raw = {}) => {
  const mapping = {
    universiteNom: 'universite',
    nomUniversite: 'universite',
    faculteNom: 'faculte',
    nomFaculte: 'faculte',
    filiereNom: 'filiere',
    nomFiliere: 'filiere',
    promotionLibelle: 'promotion',
    annee: 'anneeScolaire',
    tel: 'telephone',
    id: 'inscriptionId',
  };
  const normalized = {};
  for (const [key, value] of Object.entries(raw)) {
    const internalKey = mapping[key] || key;
    normalized[internalKey] = value;
  }
  return normalized;
};

// ─── Composant principal ──────────────────────────────────────
export default function TachPayCheckout({
  isOpen = true,
  onClose,
  onSuccess,
  prefill = {},
  initialFrais = [],
  mode = 'modal',
  disableSearch = false,
}) {
  // Normaliser le prefill reçu
  const cleanPrefill = normalizePrefill(prefill);
  const normalizedInitialFrais = Array.isArray(initialFrais) ? initialFrais : [];
  const initialSelectedFraisIds = normalizedInitialFrais.map(f => f.id);
  const initialMontant = normalizedInitialFrais.reduce((sum, f) => sum + (f.reste || 0), 0);

  // Fusionner avec l'état initial (les valeurs de prefill écrasent les valeurs par défaut)
  const initialState = {
    ...INIT_FORM,
    ...cleanPrefill,
    montant: cleanPrefill.montant || (initialMontant > 0 ? initialMontant.toFixed(2) : INIT_FORM.montant),
  };
  const [form, setForm]                     = useState(initialState);
  const [chargement, setChargement]         = useState(false);
  const [rechercheEnCours, setRechEnCours]  = useState(false);
  const [erreurs, setErreurs]               = useState({});
  const [erreurGlobale, setErreurGlobale]   = useState('');

  // Si disableSearch = true ou matricule déjà fourni, l'étudiant est déjà identifié
  const [etudiantTrouve, setEtudiantTrouve] = useState(disableSearch || !!cleanPrefill.matricule);

  const [universites, setUniversites]       = useState([]);
  const [succes, setSucces]                 = useState(false);
  // Attente de confirmation webhook (mode dossier) : {reference, operateur, montant, statutUrl, message}
  const [attente, setAttente]               = useState(null);
  const [transactionRef, setTransRef]       = useState('');
  const [montrerBon, setMontrerBon]         = useState(false);
  const [bonRef, setBonRef]                 = useState('');
  // Bons émis par le backend (un par banque de règlement) + indicateur de chargement.
  const [bonsServeur, setBonsServeur]       = useState([]);
  const [chargementBon, setChargementBon]   = useState(false);
  const [fraisAPayer, setFraisAPayer]       = useState(normalizedInitialFrais);
  const [selectedFraisIds, setSelectedFraisIds] = useState(initialSelectedFraisIds);
  const [universiteLogo, setUniversiteLogo] = useState('');
  const [departementsAcad, setDepartementsAcad] = useState([]);
  const [filieresAcad, setFilieresAcad]     = useState([]);
  const [promotionsAcad, setPromotionsAcad] = useState([]);

  const lastSearchRef = useRef('');
  const abortControllerRef = useRef(null);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // ═══ DÉTERMINER SI LES CHAMPS SONT VERROUILLÉS ═══
  const champsVerrouilles = disableSearch || etudiantTrouve;

  // ⚠️ Aucun en-tête d'authentification n'est construit ici : les jetons vivent
  // dans des cookies HttpOnly, illisibles par JS. Tout appel AUTHENTIFIÉ doit
  // passer par l'instance `api` (withCredentials + jeton CSRF + refresh 401) —
  // un `fetch` nu part sans cookie et repartirait en 401/403.
  const { user } = useAuth();
  const actorMode = !user
    ? 'public'
    : (user.role === 'ETUDIANT' ? 'student' : 'staff');
  const isDossierMode = Boolean(cleanPrefill.dossierMode || form.numeroDossier);

  const applyCheckoutContext = (context) => {
    const detail = normalizePrefill(context?.data || context || {});
    const frais = Array.isArray(context?.frais) ? context.frais : [];
    const allIds = frais.map(f => f.id);
    const total = frais.reduce((sum, f) => sum + (f.reste || 0), 0);

    setForm(prev => ({
      ...prev,
      ...detail,
      inscriptionId: context?.inscriptionId || detail.inscriptionId || prev.inscriptionId,
      montant: total > 0 ? total.toFixed(2) : prev.montant,
    }));
    setFraisAPayer(frais);
    setSelectedFraisIds(allIds);
    setEtudiantTrouve(true);
  };

  // ─── Chargement des universités (public, sans token) ────────
  useEffect(() => {
    if (mode !== 'page' && !isOpen) return;

    let isMounted = true;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const loadUniversites = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/universites/public`, {
          signal: controller.signal,
        });
        if (!isMounted || controller.signal.aborted) return;
        if (response.ok) {
          const data = await response.json();
          setUniversites(data);
          // Si une université est déjà fournie, retrouver son ID
          if (form.universite && !form.universiteId) {
            const found = data.find(u => u.nom === form.universite);
            if (found) {
              set('universiteId', found.id);
            }
          }
        }
       } catch (err) {
         if (
           err.name !== 'AbortError' &&
           err.name !== 'CanceledError' &&
           err.code !== 'ERR_CANCELED' &&
           isMounted
         ) {
           console.error('Erreur chargement universités', err);
         }
       }
    };

    loadUniversites();

    return () => {
      isMounted = false;
      controller.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode]);

  // ─── Logo de l'université ─────────────────────────────────────
  useEffect(() => {
    const univ = universites.find(u => u.id === parseInt(form.universiteId));
    setUniversiteLogo(univ ? (resolveFileUrl(univ.logo) || LOGOS_CONNUS[univ.code] || '') : '');
  }, [form.universiteId, universites]);

  // ─── Facultés/départements ──────────────────────────────────
  useEffect(() => {
    if (!form.universiteId) { setDepartementsAcad([]); return; }
    let actif = true;
    fetch(`${API_BASE}/api/universites/public/${form.universiteId}/departements`)
      .then(r => (r.ok ? r.json() : []))
      .then(data => { if (actif) setDepartementsAcad(Array.isArray(data) ? data : []); })
      .catch(() => { if (actif) setDepartementsAcad([]); });
    return () => { actif = false; };
  }, [form.universiteId]);

  // ─── Filières ──────────────────────────────────────────────────
  useEffect(() => {
    if (!form.departementId) { setFilieresAcad([]); return; }
    let actif = true;
    fetch(`${API_BASE}/api/departements/public/${form.departementId}/filieres`)
      .then(r => (r.ok ? r.json() : []))
      .then(data => { if (actif) setFilieresAcad(Array.isArray(data) ? data : []); })
      .catch(() => { if (actif) setFilieresAcad([]); });
    return () => { actif = false; };
  }, [form.departementId]);

  // ─── Promotions ───────────────────────────────────────────────
  useEffect(() => {
    if (!form.filiereId) { setPromotionsAcad([]); return; }
    let actif = true;
    // GET public (permitAll côté SecurityConfig) : pas d'authentification requise.
    fetch(`${API_BASE}/api/promotions/filiere/${form.filiereId}`)
      .then(r => (r.ok ? r.json() : []))
      .then(data => { if (actif) setPromotionsAcad(Array.isArray(data) ? data : []); })
      .catch(() => { if (actif) setPromotionsAcad([]); });
    return () => { actif = false; };
  }, [form.filiereId]);

  // ─── Rattachement automatique département/filière ──────────
  useEffect(() => {
    if (!form.faculte || form.departementId || departementsAcad.length === 0) return;
    const trouve = departementsAcad.find(d => d.nom?.toLowerCase() === form.faculte.toLowerCase());
    if (trouve) set('departementId', trouve.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departementsAcad, form.faculte]);

  useEffect(() => {
    if (!form.filiere || form.filiereId || filieresAcad.length === 0) return;
    const trouve = filieresAcad.find(f => f.nom?.toLowerCase() === form.filiere.toLowerCase());
    if (trouve) set('filiereId', trouve.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filieresAcad, form.filiere]);

  // ─── Recherche automatique du matricule PRÉ-REMPLI uniquement ──
  // La saisie manuelle passe par le bouton « Rechercher » ou la touche Entrée :
  // déclencher sur form.matricule envoyait une requête par frappe (H, HE, HEC…).
  useEffect(() => {
    if (disableSearch) return;

    const matricule = cleanPrefill.matricule;
    if (!matricule) return;
    if (matricule === lastSearchRef.current) return;

    lastSearchRef.current = matricule;
    rechercherEtudiant(matricule);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanPrefill.matricule, disableSearch]);

  // ═══ Chargement automatique des frais en mode connecté ═══
  useEffect(() => {
    if (!disableSearch) return;
    if (actorMode === 'student' && fraisAPayer.length > 0 && form.nom && form.universite) return;
    if (actorMode !== 'student' && fraisAPayer.length > 0) return;

    const matricule = cleanPrefill.matricule || form.matricule;
    const inscriptionId = cleanPrefill.inscriptionId || form.inscriptionId;

    if (actorMode !== 'student' && !matricule && !inscriptionId && !isDossierMode) return;

    const chargerFrais = async () => {
      try {
        // Étudiant connecté : via l'instance api (token frais + refresh 401 auto)
        if (actorMode === 'student') {
          const checkoutRes = await api.get('/api/tachpay/etudiant/checkout-context');
          applyCheckoutContext(checkoutRes.data);
          return;
        }

        // Public : appels sans authentification (fetch nu)
        if (actorMode === 'public') {
          let url = '';
          if (isDossierMode && form.numeroDossier) {
            url = `${API_BASE}/api/tachpay/public/dossier/${encodeURIComponent(form.numeroDossier.trim())}/checkout-context`;
          } else if (matricule) {
            url = `${API_BASE}/api/tachpay/public/etudiant/${encodeURIComponent(matricule.trim())}/checkout-context`;
          }
          if (!url) return;
          const fraisRes = await fetch(url, { headers: {} });
          const fraisData = await fraisRes.json();
          if (!fraisRes.ok) {
            throw new Error(fraisData.erreur || 'Impossible de charger les frais.');
          }
          applyCheckoutContext(fraisData);
          return;
        }

        // Caisse / staff : appel authentifié via api (refresh auto)
        if (matricule) {
          const fraisRes = await api.get(
            `/api/tachpay/caisse/etudiant/${encodeURIComponent(matricule.trim())}/frais`);
          const fraisData = fraisRes.data;
          setFraisAPayer(fraisData.frais || []);
          const allIds = (fraisData.frais || []).map(f => f.id);
          setSelectedFraisIds(allIds);
          const total = (fraisData.frais || []).reduce((sum, f) => sum + (f.reste || 0), 0);
          set('montant', total.toFixed(2));
          if (fraisData.inscriptionId) set('inscriptionId', fraisData.inscriptionId);
        }
      } catch (err) {
        console.error('Erreur chargement automatique des frais', err);
      }
    };

    chargerFrais();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disableSearch, cleanPrefill.matricule, cleanPrefill.inscriptionId, actorMode, fraisAPayer.length, form.inscriptionId, form.matricule, form.nom, form.numeroDossier, form.universite, isDossierMode]);

  // ─── Fonction de recherche ───────────────────────────────────
  const rechercherEtudiant = async (matricule) => {
    if (!matricule.trim()) {
      setErreurs(e => ({ ...e, matricule: 'Entrez un numéro de matricule.' }));
      return;
    }
    setRechEnCours(true);
    setErreurs(e => ({ ...e, matricule: '' }));
    setFraisAPayer([]);
    setSelectedFraisIds([]);

    const controller = new AbortController();
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = controller;

    try {
      if (actorMode === 'public') {
        const res = await fetch(
          `${API_BASE}/api/tachpay/public/etudiant/${encodeURIComponent(matricule.trim())}/checkout-context`,
          { signal: controller.signal }
        );
        const checkoutData = await res.json();
        if (!res.ok) {
          throw new Error(checkoutData.erreur || 'Étudiant non trouvé');
        }
        applyCheckoutContext(checkoutData);
        return;
      }

      // Caisse / staff : instance `api` (cookies HttpOnly + refresh 401 auto).
      const res = await api.get(
        `/api/etudiants/recherche?q=${encodeURIComponent(matricule.trim())}`);

      const { data: e } = res.data;
      setForm(f => ({
        ...f,
        nom: e.nom || f.nom,
        prenom: e.prenom || f.prenom,
        email: e.email || f.email,
        telephone: e.telephone || f.telephone,
        filiere: e.filiereNom || e.filiere || f.filiere,
        filiereId: e.filiereId || f.filiereId,
        promotion: e.promotionLibelle || f.promotion,
        universite: e.universiteNom || f.universite,
        universiteId: e.universiteId || f.universiteId,
        departementId: e.departementId || f.departementId,
        faculte: e.faculteNom || f.faculte,
        anneeScolaire: e.anneeScolaire || f.anneeScolaire,
        inscriptionId: e.inscriptionId || e.id || null,
      }));
      setEtudiantTrouve(true);

      if (e.inscriptionId || e.id) {
        try {
          const fraisRes = await api.get(
            `/api/tachpay/caisse/etudiant/${encodeURIComponent(matricule.trim())}/frais`);
          const fraisData = fraisRes.data;
          setFraisAPayer(fraisData.frais || []);
          const allIds = (fraisData.frais || []).map(f => f.id);
          setSelectedFraisIds(allIds);
          const total = (fraisData.frais || []).reduce((sum, f) => sum + (f.reste || 0), 0);
          set('montant', total.toFixed(2));
          if (fraisData.inscriptionId) set('inscriptionId', fraisData.inscriptionId);
        } catch {
          // Frais indisponibles : la fiche étudiant reste exploitable.
        }
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      const message = err.status === 401
        ? '🔒 Vous devez être connecté pour rechercher un étudiant. Veuillez vous identifier.'
        : (err.message || 'Aucun étudiant trouvé pour ce matricule.');
      setErreurs(e => ({ ...e, matricule: message }));
      setEtudiantTrouve(false);
    } finally {
      setRechEnCours(false);
    }
  };

  // ─── Gestion sélection des frais ──────────────────────────
  const toggleFraisSelection = (id) => {
    setSelectedFraisIds(prev => {
      const newIds = prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id];
      const total = fraisAPayer
        .filter(f => newIds.includes(f.id))
        .reduce((sum, f) => sum + (f.reste || 0), 0);
      set('montant', total.toFixed(2));
      return newIds;
    });
  };

  const selectAllFrais = () => {
    const allIds = fraisAPayer.map(f => f.id);
    setSelectedFraisIds(allIds);
    const total = fraisAPayer.reduce((sum, f) => sum + (f.reste || 0), 0);
    set('montant', total.toFixed(2));
  };

  // ─── Validation ─────────────────────────────────────────────
  const valider = () => {
    const errs = {};
    if (!form.nom.trim())    errs.nom    = 'Champ obligatoire';
    if (!form.prenom.trim()) errs.prenom = 'Champ obligatoire';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Email invalide';
    if (!form.pays)              errs.pays         = 'Champ obligatoire';
    if (!form.universite.trim()) errs.universite   = 'Champ obligatoire';
    if (fraisAPayer.length === 0 && !form.typePaiement) errs.typePaiement = 'Sélectionnez un type';
    if (!(parseFloat(form.montant) > 0)) errs.montant = 'Montant invalide';
    if (!form.modePaiement)      errs.modePaiement = 'Sélectionnez un mode de paiement';
    if (!isDossierMode && !form.inscriptionId) errs.inscriptionId = 'Recherchez un étudiant d\'abord';
    if (isDossierMode && !form.numeroDossier) errs.numeroDossier = 'Numero de dossier introuvable';
    if (selectedFraisIds.length === 0) errs.selectedFrais = 'Sélectionnez au moins un frais';
    if (form.modePaiement === 'MOBILE_MONEY') {
      if (!form.operateur) errs.operateur = 'Sélectionnez un opérateur';
      if (form.telPaiement.replace(/\D/g,'').length < 9) errs.telPaiement = 'Numéro invalide';
    }
    setErreurs(errs);
    return errs;
  };

  // ─── Génération du bon ────────────────────────────────────
  const genererBon = async () => {
    const errs = {};
    if (!form.nom.trim())        errs.nom          = 'Champ obligatoire';
    if (!form.prenom.trim())     errs.prenom       = 'Champ obligatoire';
    if (!form.email.trim())      errs.email        = 'Champ obligatoire';
    if (!form.pays)              errs.pays         = 'Champ obligatoire';
    if (!form.universite.trim()) errs.universite   = 'Champ obligatoire';
    if (fraisAPayer.length === 0 && !form.typePaiement) errs.typePaiement = 'Sélectionnez un type';
    if (!(parseFloat(form.montant) > 0)) errs.montant = 'Montant invalide';
    if (!isDossierMode && !form.inscriptionId) errs.inscriptionId = 'Recherchez un étudiant d\'abord';
    if (isDossierMode && !form.numeroDossier) errs.numeroDossier = 'Numero de dossier introuvable';
    if (selectedFraisIds.length === 0) errs.selectedFrais = 'Sélectionnez au moins un frais';
    if (Object.keys(errs).length) {
      // Le bouton « Générer le bon » appelle cette fonction DIRECTEMENT, sans
      // passer par soumettre() : sans message global, les erreurs restaient
      // muettes (les champs fautifs sont en haut d'un formulaire très long) et
      // le clic paraissait sans effet.
      setErreurs(errs);
      const champs = Object.keys(errs).map(k => LABELS_ERREURS[k] || k);
      setErreurGlobale('Veuillez compléter ou corriger : ' + champs.join(', ') + '.');
      setTimeout(() => {
        const el = document.querySelector('.tfc-input-err, .tfc-field-error-block, .tfc-err-msg');
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }

    // Bon SERVEUR : seul le backend produit un numéro opposable, le QR de contrôle,
    // la validité réelle et surtout la BANQUE désignée par l'admin pour ces frais —
    // et il l'enregistre, condition nécessaire pour que /caisse/valider-bon puisse
    // l'accepter plus tard. Deux guichets : l'étudiant connecté signe avec sa propre
    // session, le caissier passe par la route caisse (il agit pour un étudiant
    // identifié par inscriptionId). Seuls les parcours SANS compte — public et
    // dossier — retombent sur le bon imprimable local ci-dessous.
    const endpointBon = isDossierMode ? null
      : actorMode === 'student' ? '/api/tachpay/etudiant/bon-paiement'
      : actorMode === 'staff'   ? '/api/tachpay/caisse/generer-bon'
      : null;

    if (endpointBon) {
      setChargementBon(true);
      setErreurGlobale('');
      try {
        // L'endpoint étudiant prend la liste nue, celui de la caisse a besoin de
        // savoir POUR QUI le bon est émis.
        const payload = actorMode === 'student'
          ? selectedFraisIds
          : { inscriptionId: form.inscriptionId, affectationIds: selectedFraisIds };
        const res = await api.post(endpointBon, payload);
        const data = res.data;

        // Un bon PAR BANQUE : des frais dirigés vers des guichets différents ne
        // peuvent pas tenir sur un même bon.
        setBonsServeur(Array.isArray(data.bons) ? data.bons : []);
        setBonRef(data.numero || '');
        set('reference', data.numero || '');
        return;
      } catch (e) {
        setErreurGlobale(e.message || 'Génération du bon impossible');
        return;
      } finally {
        setChargementBon(false);
      }
    }

    const ref = form.reference || genRef();
    set('reference', ref);
    setBonRef(ref);
    setMontrerBon(true);
  };

  // ─── Soumission du paiement ──────────────────────────────
  const soumettre = async () => {
    const errs = valider();
    if (Object.keys(errs).length > 0) {
      const champs = Object.keys(errs).map(k => LABELS_ERREURS[k] || k);
      setErreurGlobale('Veuillez compléter ou corriger : ' + champs.join(', ') + '.');
      // Faire défiler jusqu'au premier champ fautif
      setTimeout(() => {
        const el = document.querySelector('.tfc-input-err, .tfc-field-error-block, .tfc-err-msg');
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return;
    }
    setChargement(true);
    setErreurGlobale('');

    const basePayload = {
      inscriptionId: form.inscriptionId,
      affectationIds: selectedFraisIds,
      universiteId: form.universiteId,
      numeroDossier: form.numeroDossier,
    };

    try {
      let endpoint = '';
      let payload = {};

      switch (form.modePaiement) {
        case 'CARTE_VISA':
          endpoint = isDossierMode
            ? '/api/tachpay/public/dossier/payer-carte'
            : actorMode === 'student'
            ? '/api/tachpay/etudiant/payer-carte'
            : actorMode === 'public'
              ? '/api/tachpay/public/payer-carte'
              : '/api/tachpay/caisse/payer-carte';
          payload = {
            ...basePayload,
            successUrl: window.location.origin + '/paiement/succes',
            cancelUrl: window.location.origin + '/paiement/annule',
          };
          break;
        case 'MOBILE_MONEY':
          endpoint = isDossierMode
            ? '/api/tachpay/public/dossier/payer-mobile'
            : actorMode === 'student'
            ? '/api/tachpay/etudiant/payer-mobile'
            : actorMode === 'public'
              ? '/api/tachpay/public/payer-mobile'
              : '/api/tachpay/caisse/payer-mobile';
          payload = {
            ...basePayload,
            telephone: form.telPaiement,
            operateur: form.operateur,
          };
          break;
        case 'BON_PAIEMENT':
          genererBon();
          setChargement(false);
          return;
        default:
          throw new Error('Mode de paiement non supporté');
      }

      // TOUS les parcours passent par l'instance `api`, y compris le public.
      // Les endpoints /api/tachpay/public/** sont bien permitAll côté
      // SecurityConfig, mais permitAll n'exempte PAS de CSRF : un `fetch` nu,
      // sans en-tête X-XSRF-TOKEN, se faisait refuser en 403 — aucun paiement
      // public ni aucun paiement de dossier ne pouvait aboutir.
      const res = await api.post(endpoint, payload);
      const data = res.data;

      // Carte bancaire : rediriger vers la page sécurisée Stripe qui collecte
      // réellement les informations de carte. Au retour (successUrl), le
      // webhook Stripe signé confirme le paiement.
      if (form.modePaiement === 'CARTE_VISA' && data.checkoutUrl) {
        // Validation sécurisée de l'URL de redirection Stripe
        safeRedirect(data.checkoutUrl, '/paiement/annule');
        return;
      }

      setTransRef(data.reference || data.numero || 'OK');
      if (isDossierMode && data.reference) {
        // Frais de dossier : le backend n'a fait qu'INITIER la transaction
        // (PENDING) — le dossier n'est payé qu'à la confirmation webhook.
        // On attend le statut réel au lieu d'annoncer un faux succès.
        setAttente({
          reference: data.reference,
          operateur: form.operateur,
          montant: form.montant,
          statutUrl: `/api/dossiers/paiement/statut/${encodeURIComponent(data.reference)}`,
          message: form.modePaiement === 'CARTE_VISA'
            ? 'Confirmation du paiement par carte en cours…'
            : undefined,
        });
      } else {
        setSucces(true);
        if (onSuccess) onSuccess(data);
      }
    } catch (err) {
      let errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.erreur) {
        errorMessage = err.response.data.erreur;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setErreurGlobale(errorMessage);
    } finally {
      setChargement(false);
    }
  };

  // ─── Variables d'affichage ────────────────────────────────
  const op = OPERATEURS.find(o => o.id === form.operateur);
  const selectedFrais = fraisAPayer.filter(f => selectedFraisIds.includes(f.id));

  // Modes ouverts par l'admin sur TOUS les frais sélectionnés (intersection) :
  // un même paiement ne peut pas emprunter un canal refusé à l'un d'eux.
  // null = aucune restriction. Intersection vide (canaux incompatibles entre
  // frais) → on laisse tous les onglets plutôt que de bloquer l'étudiant.
  const modesCommuns = canauxCommuns(selectedFrais, 'modesPaiementAutorises');
  const ongletsDisponibles = (modesCommuns && modesCommuns.length > 0)
    ? ONGLETS_PAIEMENT.filter(o => o.modes.some(m => modesCommuns.includes(m)))
    : ONGLETS_PAIEMENT;

  // L'onglet actif peut devenir indisponible quand la sélection de frais change :
  // sans ce recalage, l'étudiant reste sur un panneau qu'il n'a plus le droit d'utiliser.
  useEffect(() => {
    if (ongletsDisponibles.length === 0) return;
    if (!ongletsDisponibles.some(o => o.id === form.modePaiement)) {
      set('modePaiement', ongletsDisponibles[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ongletsDisponibles.map(o => o.id).join(','), form.modePaiement]);
  const typLbl = selectedFrais.length === 1
    ? (selectedFrais[0].libelle || selectedFrais[0].code || '')
    : selectedFrais.length > 1
      ? `${selectedFrais.length} frais académiques`
      : (TYPES_PAIEMENT.find(t => t.id === form.typePaiement)?.label || '');
  const montF = fmt(form.montant, form.devise);

  // ─── Écran d'attente de confirmation (frais de dossier) ──────
  // Le succès n'est affiché QUE lorsque le webhook opérateur a confirmé
  // la transaction (statut VALIDE sur l'endpoint public de polling).
  if (attente) {
    return (
      <div className="tfc-overlay">
        <div className="tfc-success-page">
          <div className="tfc-success-header">
            <img src="/assets/TachPay-logo.png" alt="TachPay" style={{ height: 40 }} />
            <div className="tfc-brand-name">TachPay — GENUC</div>
          </div>
          <PaiementStatutPoller
            reference={attente.reference}
            operateur={attente.operateur}
            montant={attente.montant}
            statutUrl={attente.statutUrl}
            message={attente.message}
            onSuccess={(data) => {
              setAttente(null);
              setSucces(true);
              if (onSuccess) onSuccess(data);
            }}
            onEchec={(motif) => {
              setAttente(null);
              setErreurGlobale(motif || 'Le paiement a été refusé. Veuillez réessayer.');
            }}
          />
        </div>
      </div>
    );
  }

  // ─── Écran de succès ──────────────────────────────────────
  if (succes) {
    return (
      <div className="tfc-overlay">
        <div className="tfc-success-page">
          <div className="tfc-success-header">
            <img src="/assets/TachPay-logo.png" alt="TachPay" style={{ height: 40 }} />
            <div className="tfc-brand-name">TachPay — GENUC</div>
          </div>
          <div className="tfc-success-body">
            <div className="tfc-success-circle-wrap">
              <div className="tfc-success-circle">✓</div>
            </div>
            <h2 className="tfc-success-title">Paiement initié avec succès !</h2>
            <p className="tfc-success-sub">
              {form.modePaiement === 'MOBILE_MONEY'
                ? <>Demande envoyée au <strong>+243 {form.telPaiement}</strong> via <strong>{op?.label}</strong>. Confirmez sur votre téléphone.</>
                : <>Votre paiement par carte de <strong>{montF}</strong> a été initié sur la page sécurisée du prestataire.</>
              }
            </p>
            <div className="tfc-success-card">
              <div className="tfc-success-row"><span>Référence transaction</span><strong className="tfc-mono">{transactionRef}</strong></div>
              <div className="tfc-success-row"><span>Étudiant</span><strong>{form.prenom} {form.nom}</strong></div>
              {form.matricule && <div className="tfc-success-row"><span>Matricule</span><strong>{form.matricule}</strong></div>}
              <div className="tfc-success-row"><span>Université</span><strong>{form.universite}</strong></div>
              <div className="tfc-success-row"><span>Type</span><strong>{typLbl}</strong></div>
              <div className="tfc-success-row tfc-success-total"><span>Montant payé</span><strong>{montF}</strong></div>
            </div>
            <p className="tfc-success-note">Email de confirmation envoyé à <strong>{form.email}</strong></p>
            <button className="tfc-btn tfc-btn-primary tfc-success-close" onClick={onClose}>Terminer</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Contenu principal (formulaire) ──────────────────────
  const Content = () => (
    <div className="tfc-checkout">
      {/* Header */}
      <div className="tfc-checkout-header">
        <div className="tfc-checkout-brand">
          <img src="/assets/TachPay-logo.png" alt="TachPay" className="tfc-logo-img" />
          <div>
            <span className="tfc-brand-title">TachPay</span>
            <span className="tfc-brand-divider"> · </span>
            <span className="tfc-brand-subtitle">Plateforme de paiement des frais académiques</span>
          </div>
        </div>
        <div className="tfc-header-security"><span>🔒</span><span>Connexion sécurisée SSL</span></div>
        {mode !== 'page' && (
          <button className="tfc-close" onClick={onClose} aria-label="Fermer">×</button>
        )}
      </div>

      <div className="tfc-layout">
        {/* Colonne gauche : formulaire */}
        <div className="tfc-form-col">
          <div className="tfc-form-scroll">
            {erreurGlobale && (
              <div className="tfc-global-error"><span className="tfc-error-icon">!</span>{erreurGlobale}</div>
            )}

            {/* Section 1 : Identification */}
            <div className="tfc-form-section">
              <div className="tfc-section-header tfc-sh-blue">
                <div className="tfc-sh-icon-wrap">👤</div>
                <div className="tfc-sh-text">
                  <div className="tfc-sh-step">Étape 1 · Identité</div>
                  <h3 className="tfc-section-title">Identification de l'étudiant</h3>
                </div>
                <span className="tfc-sh-badge">1</span>
              </div>

              {/* ─── Champ matricule – affiché uniquement si recherche active ─── */}
              {!disableSearch && (
                <div className="tfc-field">
                  <label className="tfc-label">Numéro matricule <span className="tfc-req">*</span></label>
                  <div className="tfc-matricule-row">
                    <input
                      className={`tfc-input${erreurs.matricule ? ' tfc-input-err' : ''}${champsVerrouilles ? ' tfc-input-locked' : ''}`}
                      placeholder="Ex : UNK-2024-001"
                      value={form.matricule}
                      onChange={e => { set('matricule', e.target.value); setEtudiantTrouve(false); }}
                      onKeyDown={e => e.key === 'Enter' && rechercherEtudiant(form.matricule)}
                      readOnly={champsVerrouilles}
                    />
                    <button
                      className="tfc-btn tfc-btn-search"
                      onClick={() => rechercherEtudiant(form.matricule)}
                      disabled={rechercheEnCours || champsVerrouilles}
                    >
                      {rechercheEnCours ? <span className="tfc-spin-sm" /> : 'Rechercher'}
                    </button>
                  </div>
                  {erreurs.matricule && <span className="tfc-err-msg">{erreurs.matricule}</span>}
                  {etudiantTrouve && (form.nom || form.prenom) && (
                    <div className="tfc-found-badge">
                      <div className="tfc-found-avatar">{form.prenom?.[0]?.toUpperCase()}{form.nom?.[0]?.toUpperCase()}</div>
                      <div className="tfc-found-info">
                        <div className="tfc-found-name">{form.prenom} {form.nom}</div>
                        <div className="tfc-found-meta">
                          {form.email && <span>{form.email}</span>}
                          {form.filiere && <span> · {form.filiere}</span>}
                        </div>
                      </div>
                      <span className="tfc-found-check">✓ Trouvé</span>
                    </div>
                  )}
                </div>
              )}

              <div className="tfc-row-2">
                <div className="tfc-field">
                  <label className="tfc-label">Nom <span className="tfc-req">*</span></label>
                  <input
                    className={`tfc-input${erreurs.nom ? ' tfc-input-err' : ''}${champsVerrouilles ? ' tfc-input-locked' : ''}`}
                    placeholder="Nom de famille"
                    value={form.nom}
                    onChange={e => set('nom', e.target.value)}
                    readOnly={champsVerrouilles}
                  />
                  {erreurs.nom && <span className="tfc-err-msg">{erreurs.nom}</span>}
                </div>
                <div className="tfc-field">
                  <label className="tfc-label">Prénom <span className="tfc-req">*</span></label>
                  <input
                    className={`tfc-input${erreurs.prenom ? ' tfc-input-err' : ''}${champsVerrouilles ? ' tfc-input-locked' : ''}`}
                    placeholder="Prénom"
                    value={form.prenom}
                    onChange={e => set('prenom', e.target.value)}
                    readOnly={champsVerrouilles}
                  />
                  {erreurs.prenom && <span className="tfc-err-msg">{erreurs.prenom}</span>}
                </div>
              </div>

              <div className="tfc-field">
                <label className="tfc-label">Adresse email <span className="tfc-req">*</span></label>
                <input
                  className={`tfc-input${erreurs.email ? ' tfc-input-err' : ''}${champsVerrouilles ? ' tfc-input-locked' : ''}`}
                  type="email"
                  placeholder="etudiant@universite.cd"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  readOnly={champsVerrouilles}
                />
                {erreurs.email && <span className="tfc-err-msg">{erreurs.email}</span>}
              </div>

              <div className="tfc-field">
                <label className="tfc-label">Numéro de téléphone</label>
                <div className="tfc-phone-combo">
                  <select
                    className={`tfc-input tfc-indicatif${champsVerrouilles ? ' tfc-input-locked' : ''}`}
                    value={form.indicatif}
                    onChange={e => set('indicatif', e.target.value)}
                    disabled={champsVerrouilles}
                  >
                    {PAYS.map(p => <option key={p.code} value={p.indicatif}>{p.code} {p.indicatif}</option>)}
                  </select>
                  <input
                    className={`tfc-input tfc-tel-field${champsVerrouilles ? ' tfc-input-locked' : ''}`}
                    type="tel"
                    placeholder="8X XXX XX XX"
                    value={form.telephone}
                    onChange={e => set('telephone', e.target.value.replace(/\D/g,''))}
                    readOnly={champsVerrouilles}
                  />
                </div>
              </div>
            </div>

            {/* Section 2 : Localisation */}
            <div className="tfc-form-section">
              <div className="tfc-section-header tfc-sh-green">
                <div className="tfc-sh-icon-wrap">🌍</div>
                <div className="tfc-sh-text">
                  <div className="tfc-sh-step">Étape 2 · Lieu</div>
                  <h3 className="tfc-section-title">Localisation</h3>
                </div>
                <span className="tfc-sh-badge">2</span>
              </div>
              <div className="tfc-field">
                <label className="tfc-label">Pays <span className="tfc-req">*</span></label>
                {champsVerrouilles ? (
                  <span className="tfc-readonly-text">{form.pays}</span>
                ) : (
                  <select
                    className={`tfc-input${erreurs.pays ? ' tfc-input-err' : ''}`}
                    value={form.pays}
                    onChange={e => set('pays', e.target.value)}
                  >
                    <option value="">— Sélectionnez votre pays —</option>
                    {PAYS.map(p => <option key={p.code} value={p.nom}>{p.nom}</option>)}
                  </select>
                )}
                {erreurs.pays && <span className="tfc-err-msg">{erreurs.pays}</span>}
              </div>
              {form.pays === 'République Démocratique du Congo' && (
                <div className="tfc-row-2">
                  <div className="tfc-field">
                    <label className="tfc-label">Province</label>
                    {champsVerrouilles ? (
                      <span className="tfc-readonly-text">{form.province}</span>
                    ) : (
                      <select className="tfc-input" value={form.province} onChange={e => set('province', e.target.value)}>
                        <option value="">— Province —</option>
                        {PROVINCES_RDC.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    )}
                  </div>
                  <div className="tfc-field">
                    <label className="tfc-label">Ville / Commune</label>
                    <input
                      className={`tfc-input${champsVerrouilles ? ' tfc-input-locked' : ''}`}
                      placeholder="Ex : Gombe, Limete…"
                      value={form.ville}
                      onChange={e => set('ville', e.target.value)}
                      readOnly={champsVerrouilles}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 3 : Informations académiques */}
            <div className="tfc-form-section">
              <div className="tfc-section-header tfc-sh-purple">
                <div className="tfc-sh-icon-wrap">🎓</div>
                <div className="tfc-sh-text">
                  <div className="tfc-sh-step">Étape 3 · Scolarité</div>
                  <h3 className="tfc-section-title">Informations académiques</h3>
                </div>
                <span className="tfc-sh-badge">3</span>
              </div>

              {/* Université */}
              <div className="tfc-field">
                <label className="tfc-label">Université / Établissement <span className="tfc-req">*</span></label>
                {champsVerrouilles ? (
                  <span className="tfc-readonly-text">{form.universite}</span>
                ) : (
                  <select
                    className={`tfc-input${erreurs.universite ? ' tfc-input-err' : ''}`}
                    value={form.universiteId || ''}
                    onChange={e => {
                      const id = e.target.value;
                      const univ = universites.find(u => u.id === parseInt(id));
                      setForm(f => ({
                        ...f,
                        universiteId: id,
                        universite: univ ? univ.nom : '',
                        departementId: '', faculte: '',
                        filiereId: '', filiere: '',
                        promotion: '',
                      }));
                    }}
                  >
                    <option value="">— Sélectionnez votre université —</option>
                    {universites.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.nom} {u.ville ? `— ${u.ville}` : ''}
                      </option>
                    ))}
                  </select>
                )}
                {erreurs.universite && <span className="tfc-err-msg">{erreurs.universite}</span>}
              </div>

              {/* Faculté / Département */}
              <div className="tfc-row-2">
                <div className="tfc-field">
                  <label className="tfc-label">Faculté / Département</label>
                  {champsVerrouilles ? (
                    <span className="tfc-readonly-text">{form.faculte}</span>
                  ) : (
                    <select
                      className="tfc-input"
                      value={form.departementId || ''}
                      disabled={!form.universiteId || departementsAcad.length === 0}
                      onChange={e => {
                        const id = e.target.value;
                        const dept = departementsAcad.find(d => String(d.id) === id);
                        setForm(f => ({ ...f, departementId: id, faculte: dept ? dept.nom : '', filiereId: '', filiere: '', promotion: '' }));
                      }}
                    >
                      <option value="">
                        {form.universiteId ? '— Sélectionner —' : '— Choisissez d\'abord une université —'}
                      </option>
                      {departementsAcad.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                    </select>
                  )}
                </div>

                {/* Filière */}
                <div className="tfc-field">
                  <label className="tfc-label">Filière / Spécialité</label>
                  {champsVerrouilles ? (
                    <span className="tfc-readonly-text">{form.filiere}</span>
                  ) : (
                    <select
                      className="tfc-input"
                      value={form.filiereId || ''}
                      disabled={!form.departementId || filieresAcad.length === 0}
                      onChange={e => {
                        const id = e.target.value;
                        const fil = filieresAcad.find(f => String(f.id) === id);
                        setForm(f => ({ ...f, filiereId: id, filiere: fil ? fil.nom : '', promotion: '' }));
                      }}
                    >
                      <option value="">
                        {form.departementId ? '— Sélectionner —' : '— Choisissez d\'abord une faculté —'}
                      </option>
                      {filieresAcad.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                    </select>
                  )}
                </div>
              </div>

              {/* Promotion et Année académique */}
              <div className="tfc-row-3">
                <div className="tfc-field">
                  <label className="tfc-label">Promotion</label>
                  {champsVerrouilles ? (
                    <span className="tfc-readonly-text">{form.promotion}</span>
                  ) : (
                    <select
                      className="tfc-input"
                      value={form.promotion}
                      disabled={!form.filiereId || promotionsAcad.length === 0}
                      onChange={e => set('promotion', e.target.value)}
                    >
                      <option value="">
                        {form.filiereId ? '— Sélectionner —' : '— Choisissez d\'abord une filière —'}
                      </option>
                      {promotionsAcad.map(p => (
                        <option key={p.id} value={p.libelle}>{p.libelle}{p.vacations ? ` (${p.vacations})` : ''}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="tfc-field">
                  <label className="tfc-label">Année académique</label>
                  <input
                    className={`tfc-input${champsVerrouilles ? ' tfc-input-locked' : ''}`}
                    placeholder="2024-2025"
                    value={form.anneeScolaire}
                    onChange={e => set('anneeScolaire', e.target.value)}
                    readOnly={champsVerrouilles}
                  />
                </div>
              </div>
            </div>

            {/* Section 4 : Mode de paiement – toujours modifiable */}
            <div className="tfc-form-section tfc-last-section">
              <div className="tfc-section-header tfc-sh-amber">
                <div className="tfc-sh-icon-wrap">💳</div>
                <div className="tfc-sh-text">
                  <div className="tfc-sh-step">Étape 4 · Règlement</div>
                  <h3 className="tfc-section-title">Mode de paiement</h3>
                </div>
                <span className="tfc-sh-badge">4</span>
              </div>
              {erreurs.modePaiement && <div className="tfc-field-error-block">{erreurs.modePaiement}</div>}
              <div className="tfc-mode-tabs">
                {ongletsDisponibles.map(m => (
                  <button key={m.id} className={`tfc-mode-tab${form.modePaiement === m.id ? ' active' : ''}`}
                    onClick={() => { set('modePaiement', m.id); setErreurs(e => ({...e, modePaiement:''})); }}>
                    <span className="tfc-tab-icon">{m.icone}</span>
                    <span className="tfc-tab-label">{m.label}</span>
                  </button>
                ))}
              </div>
              {ongletsDisponibles.length < ONGLETS_PAIEMENT.length && (
                <p className="tfc-hint" style={{ fontSize: 12, opacity: .75, marginTop: 6 }}>
                  Seuls ces modes sont acceptés pour les frais sélectionnés (choix de votre université).
                </p>
              )}

              {/* Mobile Money */}
              {form.modePaiement === 'MOBILE_MONEY' && (
                <div className="tfc-pay-panel">
                  <div className="tfc-field">
                    <label className="tfc-label">Opérateur mobile <span className="tfc-req">*</span></label>
                    <div className="tfc-ops">
                      {OPERATEURS.map(o => (
                        <div key={o.id} className={`tfc-op${form.operateur === o.id ? ' active' : ''}`}
                          style={form.operateur === o.id ? { borderColor: o.couleur, background: o.bgLight } : {}}
                          onClick={() => { set('operateur', o.id); setErreurs(e => ({...e, operateur:''})); }}>
                          <OperatorLogo id={o.id} />
                          <div style={{ flex: 1 }}>
                            <div className="tfc-op-name">{o.label}</div>
                            <div className="tfc-op-num">+243 {o.prefixes}</div>
                          </div>
                          {form.operateur === o.id && (
                            <div className="tfc-op-sel" style={{ background: o.couleur }}>✓</div>
                          )}
                        </div>
                      ))}
                    </div>
                    {erreurs.operateur && <span className="tfc-err-msg">{erreurs.operateur}</span>}
                  </div>
                  <div className="tfc-field">
                    <label className="tfc-label">Numéro pour le paiement <span className="tfc-req">*</span></label>
                    <div className="tfc-phone-combo">
                      <span className="tfc-country-tag">🇨🇩 +243</span>
                      <input className={`tfc-input tfc-tel-pay${erreurs.telPaiement ? ' tfc-input-err' : ''}`}
                        type="tel" placeholder="8X XXX XX XX" maxLength={10}
                        value={form.telPaiement} onChange={e => set('telPaiement', e.target.value.replace(/\D/g,''))} />
                    </div>
                    {erreurs.telPaiement && <span className="tfc-err-msg">{erreurs.telPaiement}</span>}
                    {op && <p className="tfc-op-hint">Préfixes {op.label} : +243 {op.prefixes}</p>}
                  </div>
                  <div className="tfc-how-box">
                    <div className="tfc-how-title">Comment ça marche</div>
                    <div className="tfc-how-steps">
                      {['Cliquez sur "Payer maintenant"', `Ouvrez votre app ${op?.label || 'Mobile Money'}`,
                        'Confirmez le paiement avec votre PIN', 'Reçu envoyé automatiquement par email'].map((s, i) => (
                        <div key={i} className="tfc-how-step"><div className="tfc-how-num">{i + 1}</div><span>{s}</span></div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Carte bancaire */}
              {form.modePaiement === 'CARTE_VISA' && (
                <div className="tfc-pay-panel">
                  <div className="tfc-card-brands-row">
                    <CardLogo type="visa" />
                    <CardLogo type="mastercard" />
                    <CardLogo type="maestro" />
                    <CardLogo type="verve" />
                    <span className="tfc-secure-txt">🔒 100% sécurisé</span>
                  </div>
                  <div className="tfc-how-box">
                    <div className="tfc-how-title">Comment ça marche</div>
                    <div className="tfc-how-steps">
                      {['Cliquez sur "Payer maintenant"', 'Vous serez redirigé vers une page de paiement sécurisée',
                        'Saisissez les informations de votre carte sur cette page (jamais sur ce site)', 'Reçu envoyé automatiquement par email'].map((s, i) => (
                        <div key={i} className="tfc-how-step"><div className="tfc-how-num">{i + 1}</div><span>{s}</span></div>
                      ))}
                    </div>
                  </div>
                  <p className="tfc-card-disclaimer">
                    🔒 Pour votre sécurité, vos informations de carte bancaire sont saisies exclusivement sur la page de paiement sécurisée de notre prestataire et ne transitent jamais par ce site.
                  </p>
                </div>
              )}

              {/* Bon de paiement */}
              {form.modePaiement === 'BON_PAIEMENT' && (
                <div className="tfc-pay-panel tfc-bon-panel">
                  <div className="tfc-bon-explain">
                    <div className="tfc-bon-explain-icon">🧾</div>
                    <div>
                      <strong>Bon de paiement physique</strong>
                      <p>Un bon imprimable sera généré. L'étudiant le remet au caissier de l'université pour régler en espèces.</p>
                      <div className="tfc-bon-includes">
                        <span>✓ Nom &amp; matricule</span>
                        <span>✓ Université, faculté &amp; filière</span>
                        <span>✓ Montant exact &amp; référence unique</span>
                        <span>✓ Talon détachable pour le caissier</span>
                        <span>⏳ Valable 72 heures</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Colonne droite : Résumé */}
        <div className="tfc-summary-col">
          <div className="tfc-summary-sticky">
            <div className="tfc-summary-header">
              <div className="tfc-summary-univ-logo">
                {universiteLogo ? (
                  <img src={universiteLogo} alt={form.universite} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={() => setUniversiteLogo('')} />
                ) : (
                  form.universite ? form.universite.substring(0,2).toUpperCase() : 'UN'
                )}
              </div>
              <div>
                <div className="tfc-summary-univ-name">{form.universite || 'Université sélectionnée'}</div>
                {form.anneeScolaire && <div className="tfc-summary-year">Année {form.anneeScolaire}</div>}
              </div>
            </div>
            <div className="tfc-summary-body">
              <div className="tfc-summary-section-title">Récapitulatif du paiement</div>

              {/* Type de paiement – toujours modifiable */}
              {fraisAPayer.length === 0 ? (
                <div className="tfc-field">
                  <label className="tfc-label">Type de paiement <span className="tfc-req">*</span></label>
                  <select className={`tfc-input${erreurs.typePaiement ? ' tfc-input-err' : ''}`} value={form.typePaiement} onChange={e => set('typePaiement', e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {TYPES_PAIEMENT.map(t => <option key={t.id} value={t.id}>{t.icone} {t.label}</option>)}
                  </select>
                  {erreurs.typePaiement && <span className="tfc-err-msg">{erreurs.typePaiement}</span>}
                </div>
              ) : (
                <div className="tfc-field">
                  <label className="tfc-label">Type de frais détecté</label>
                  <span className="tfc-readonly-text">{typLbl || 'Les frais sélectionnés détermineront automatiquement le paiement.'}</span>
                </div>
              )}

              {/* Frais à payer */}
              {fraisAPayer.length > 0 && (
                <div className="tfc-field" style={{ marginBottom: 12 }}>
                  <label className="tfc-label">Frais à payer <span className="tfc-req">*</span></label>
                  <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8 }}>
                    {fraisAPayer.map(f => (
                      <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                        <input
                          type="checkbox"
                          checked={selectedFraisIds.includes(f.id)}
                          onChange={() => toggleFraisSelection(f.id)}
                        />
                        <span style={{ fontSize: 13 }}>{f.libelle || f.code}</span>
                        <span style={{ marginLeft: 'auto', fontWeight: 600, fontSize: 13 }}>
                          {f.reste} {form.devise || 'USD'}
                        </span>
                      </div>
                    ))}
                  </div>
                  {erreurs.selectedFrais && <span className="tfc-err-msg">{erreurs.selectedFrais}</span>}
                  <button className="tfc-btn tfc-btn-ghost" style={{ marginTop: 6, fontSize: 12, padding: '4px 8px' }} onClick={selectAllFrais}>
                    Tout sélectionner
                  </button>
                </div>
              )}

              {/* Montant */}
              <div className="tfc-field">
                <label className="tfc-label">Montant <span className="tfc-req">*</span></label>
                <div className="tfc-amount-combo">
                  <input className={`tfc-input tfc-amount-field${erreurs.montant ? ' tfc-input-err' : ''}`}
                    type="number" min="0" step="0.01" placeholder="0.00" value={form.montant}
                    onChange={e => set('montant', e.target.value)} />
                  <select className="tfc-input tfc-devise-field" value={form.devise} onChange={e => set('devise', e.target.value)}>
                    <option value="USD">USD</option>
                    <option value="CDF">CDF</option>
                  </select>
                </div>
                {erreurs.montant && <span className="tfc-err-msg">{erreurs.montant}</span>}
              </div>

              {/* Référence */}
              <div className="tfc-field">
                <label className="tfc-label">Référence de paiement</label>
                <input className="tfc-input" placeholder="Laissez vide — auto-générée" value={form.reference} onChange={e => set('reference', e.target.value)} />
              </div>

              {/* Notes */}
              <div className="tfc-field">
                <label className="tfc-label">Notes / Observations</label>
                <textarea className="tfc-input tfc-textarea" rows={2} placeholder="Informations complémentaires (optionnel)" value={form.notes} onChange={e => set('notes', e.target.value)} />
              </div>

              {parseFloat(form.montant) > 0 && (
                <div className="tfc-total-box">
                  <div className="tfc-total-row"><span>{typLbl || 'Paiement'}</span><span>{montF}</span></div>
                  <div className="tfc-total-divider" />
                  <div className="tfc-total-final"><span>Total</span><strong>{montF}</strong></div>
                </div>
              )}
            </div>

            <div className="tfc-summary-footer">
              {/* Le bouton du bon est désactivé pendant l'appel : un double clic
                  émettrait deux bons, qui consommeraient tous deux le quota de
                  3 bons actifs par étudiant. */}
              {form.modePaiement === 'BON_PAIEMENT' ? (
                <button
                  className="tfc-btn tfc-btn-bon-main"
                  onClick={genererBon}
                  disabled={chargementBon}
                >
                  {chargementBon ? 'Génération…' : '🧾 Générer le bon de paiement'}
                </button>
              ) : (
                <button className="tfc-btn tfc-btn-pay" onClick={soumettre} disabled={chargement}>
                  {chargement ? <><span className="tfc-spin-sm-w" /> Traitement en cours…</> : <>🔒 Payer {parseFloat(form.montant) > 0 ? montF : 'maintenant'}</>}
                </button>
              )}
              <div className="tfc-security-badges">
                <span className="tfc-badge">🔒 SSL</span>
                <span className="tfc-badge">✓ Sécurisé</span>
                <span className="tfc-badge">🇨🇩 GENUC RDC</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Bon de paiement imprimable (modal) ────────────────────
  const bonImprimable = montrerBon && (
    <BonImprimable
      form={form}
      reference={bonRef}
      universiteLogo={universiteLogo}
      paymentLabel={typLbl}
      onClose={() => setMontrerBon(false)}
    />
  );

  // Le PDF du bon est protégé : un <a href> partirait sans cookie de session.
  // On récupère le flux via l'instance authentifiée, puis on l'ouvre depuis une
  // URL d'objet.
  const telechargerBonPdf = async (bon) => {
    try {
      const res = await api.get(bon.pdfUrl, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bon_${bon.numero}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (e) {
      setErreurGlobale(e.message || 'Téléchargement du bon impossible');
    }
  };

  // Bons émis par le backend : un par banque de dépôt. L'étudiant y lit le
  // guichet où il doit déposer les espèces, et télécharge le PDF officiel.
  const bonsServeurPanneau = bonsServeur.length > 0 && (
    <div className="tfc-overlay" onClick={() => setBonsServeur([])}>
      <div className="tfc-card" style={{ maxWidth: 560, padding: 24 }} onClick={e => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>
          {bonsServeur.length > 1
            ? `${bonsServeur.length} bons de caisse générés`
            : 'Bon de caisse généré'}
        </h3>
        {bonsServeur.length > 1 && (
          <p style={{ fontSize: 13, opacity: .8 }}>
            Vos frais se déposent dans des banques différentes : un bon distinct a été
            émis pour chaque guichet.
          </p>
        )}

        {bonsServeur.map(bon => (
          <div key={bon.numero} style={{
            border: '1px solid var(--border-color, #ddd)', borderRadius: 10,
            padding: 14, marginBottom: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <strong>{bon.numero}</strong>
              <strong>{Number(bon.montant).toFixed(2)} USD</strong>
            </div>

            {Array.isArray(bon.banques) && bon.banques.length > 0 ? (
              <div style={{ marginTop: 8, fontSize: 13 }}>
                <div style={{ opacity: .75, marginBottom: 4 }}>
                  {bon.banques.length === 1
                    ? 'Dépôt d\'espèces à effectuer à :'
                    : 'Dépôt d\'espèces au guichet de l\'une de ces banques :'}
                </div>
                {bon.banques.map(b => (
                  <div key={`${b.nom}-${b.compte}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    {logoBanque(b.nom) && (
                      <img src={logoBanque(b.nom)} alt="" style={{
                        height: 22, width: 34, objectFit: 'contain',
                        background: '#fff', borderRadius: 4, padding: 1,
                      }} />
                    )}
                    <span><strong>{b.nom}</strong>{b.compte ? ` — ${b.compte}` : ''}{b.devise ? ` (${b.devise})` : ''}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 8, fontSize: 13, opacity: .75 }}>
                À régler à la caisse de votre université.
              </div>
            )}

            <button
              className="tfc-btn"
              style={{ marginTop: 12 }}
              onClick={() => telechargerBonPdf(bon)}
            >
              📄 Télécharger le bon (PDF)
            </button>
          </div>
        ))}

        <button className="tfc-btn tfc-btn-ghost" onClick={() => setBonsServeur([])}>Fermer</button>
      </div>
    </div>
  );

  // ─── Rendu selon le mode ──────────────────────────────────
  if (mode === 'page') {
    return <div className="tfc-page-wrapper">{Content()}{bonImprimable}{bonsServeurPanneau}</div>;
  }

  if (!isOpen) return null;

  return (
    <div className="tfc-overlay">
      {Content()}
      {bonImprimable}
      {bonsServeurPanneau}
    </div>
  );
}