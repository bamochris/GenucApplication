// src/pages/admin/GestionFraisTachPay.jsx
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import {
  FiFileText, FiBookOpen, FiBook, FiBriefcase, FiActivity, FiAward,
  FiCreditCard, FiUsers, FiTag, FiCalendar, FiClock, FiInfo, FiAlertTriangle,
  FiCheckCircle, FiStar, FiEdit2, FiArchive, FiPlay, FiPause,
  FiSmartphone, FiHome, FiRepeat, FiFileMinus, FiDollarSign, FiCheck,
} from 'react-icons/fi';
import informationBancaireService from '../../services/informationBancaireService';
import { logoBanque } from '../../constants/banquesRdc';
import '../Dashboard.css';

const TYPES = ['ACADEMIQUE', 'INSCRIPTION', 'LABORATOIRE', 'BIBLIOTHEQUE', 'STAGE', 'SESSION_SPECIALE', 'AUTRE'];
const ANNEE_EN_COURS = new Date().getFullYear() + '-' + (new Date().getFullYear() + 1);

const FRAIS_CATALOGUE = [
  {
    code: 'INSCRIPTION',
    libelle: "Frais d'inscription",
    type: 'INSCRIPTION',
    description: 'Paiement initial pour toute nouvelle inscription.',
  },
  {
    code: 'REINSCRIPTION',
    libelle: 'Frais de reinscription',
    type: 'INSCRIPTION',
    description: 'Pour les étudiants qui passent en promotion supérieure.',
  },
  {
    code: 'FRAIS_ACADEMIQUE',
    libelle: 'Frais académiques',
    type: 'ACADEMIQUE',
    description: 'Total annuel. Peut couvrir acompte, tranches ou solde selon le paramétrage de l’université.',
  },
  {
    code: 'FRAIS_LABORATOIRE',
    libelle: 'Frais de laboratoire',
    type: 'ACADEMIQUE',
    description: 'Frais liés aux travaux pratiques et laboratoires.',
  },
  {
    code: 'ENROLEMENT_S1',
    libelle: 'Enrôlement 1er semestre',
    type: 'SESSION_SPECIALE',
    description: 'Validation administrative et académique du premier semestre.',
  },
  {
    code: 'ENROLEMENT_S2',
    libelle: 'Enrôlement 2e semestre',
    type: 'SESSION_SPECIALE',
    description: 'Validation administrative et académique du second semestre.',
  },
  {
    code: 'ENROLEMENT_RATTRAPAGE',
    libelle: 'Enrôlement de rattrapage',
    type: 'SESSION_SPECIALE',
    description: 'Accès aux sessions de rattrapage.',
  },
  {
    code: 'ABONNEMENT_BIBLIOTHEQUE',
    libelle: 'Abonnement bibliothèque',
    type: 'BIBLIOTHEQUE',
    description: 'Activation des services de bibliothèque.',
  },
  {
    code: 'STAGE_OBSERVATION',
    libelle: "Stage d'observation",
    type: 'ACADEMIQUE',
    description: 'Frais administratifs liés au stage d’observation.',
  },
  {
    code: 'PRATIQUE_PROFESSIONNELLE',
    libelle: 'Pratique professionnelle',
    type: 'ACADEMIQUE',
    description: 'Frais pour activités professionnelles encadrées.',
  },
  {
    code: 'ATTESTATION_FREQUENTATION',
    libelle: 'Attestation de fréquentation',
    type: 'AUTRE',
    description: 'Le document reste bloqué tant que ce frais n’est pas payé.',
  },
  {
    code: 'RELEVE_SEMESTRIEL',
    libelle: 'Relevé de cotes semestriel',
    type: 'AUTRE',
    description: 'Débloque la délivrance du relevé semestriel.',
  },
  {
    code: 'RELEVE_ANNUEL',
    libelle: 'Relevé de cotes annuel',
    type: 'AUTRE',
    description: 'Débloque la délivrance du relevé annuel.',
  },
  {
    code: 'RELEVE_FINAL',
    libelle: 'Relevé de cotes final',
    type: 'AUTRE',
    description: 'Débloque la délivrance du relevé complet de fin d’études.',
  },
  {
    code: 'AUTRE',
    libelle: 'Autres frais',
    type: 'AUTRE',
    description: 'Frais personnalisés propres à l’université.',
  },
];

const CATALOGUE_BY_CODE = Object.fromEntries(FRAIS_CATALOGUE.map(item => [item.code, item]));

const STATUT_PILL = {
  ACTIF:   { cls: 'frais-statut--actif',   Icon: FiCheckCircle, label: 'Actif' },
  INACTIF: { cls: 'frais-statut--inactif', Icon: FiPause,       label: 'Inactif' },
  ARCHIVE: { cls: 'frais-statut--archive', Icon: FiArchive,     label: 'Archivé' },
};

// Icône d'en-tête selon le type de frais
const TYPE_ICON = {
  INSCRIPTION: FiFileText,
  ACADEMIQUE: FiBookOpen,
  LABORATOIRE: FiActivity,
  BIBLIOTHEQUE: FiBook,
  STAGE: FiBriefcase,
  SESSION_SPECIALE: FiAward,
  AUTRE: FiFileText,
};

const FORM_VIDE = {
  code: '',
  libelle: '', montant: '', devise: 'USD', type: 'ACADEMIQUE',
  anneeAcademique: ANNEE_EN_COURS, promotionId: '', categorieId: '', dateLimite: '', description: '',
  // Canaux ouverts pour ce frais. Listes vides = aucune restriction (tous les
  // modes et toutes les banques actives de l'établissement).
  modesPaiementAutorises: [], banquesAutorisees: [],
};

// Modes proposés à l'admin. Les libellés doivent rester ceux vus par l'étudiant.
const MODES_PAIEMENT = [
  { code: 'MOBILE_MONEY',   label: 'Mobile Money',      aide: 'M-Pesa, Orange, Airtel',        Icone: FiSmartphone,
    logo: '/assets/TachPay-logo.png' },
  { code: 'CARTE_BANCAIRE', label: 'Carte bancaire',    aide: 'En ligne via TachPay',          Icone: FiCreditCard,
    logo: '/assets/TachPay-logo.png' },
  { code: 'ESPECES',        label: 'Espèces en caisse', aide: "Guichet de l'université",       Icone: FiDollarSign },
  { code: 'DEPOT_BANCAIRE', label: 'Dépôt en banque',   aide: 'Espèces au guichet bancaire',   Icone: FiHome },
  { code: 'VIREMENT',       label: 'Virement bancaire', aide: 'De compte à compte',            Icone: FiRepeat },
  { code: 'CHEQUE',         label: 'Chèque',            aide: 'Remis à la caisse',             Icone: FiFileMinus },
];

/**
 * Carte à bascule utilisée pour ouvrir/fermer un canal de paiement.
 * Reprend le langage visuel du sélecteur de modèles plus haut dans cette page
 * (bordure et fond d'accent à l'état sélectionné), et n'utilise que des
 * variables de thème pour rester lisible en clair comme en sombre.
 */
function CarteCanal({ actif, titre, aide, Icone, logo, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={actif}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%',
        textAlign: 'left', padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
        border: `1.5px solid ${actif ? 'var(--color-accent)' : 'var(--border-color)'}`,
        background: actif ? 'var(--color-info-bg, rgba(24,95,165,0.08))' : 'var(--bg-card)',
        color: 'var(--text-primary)',
        transition: 'border-color .15s ease, background .15s ease',
      }}
    >
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 34, height: 34, borderRadius: 8, flexShrink: 0, overflow: 'hidden',
        // Fond neutre derrière un logo : les logos bancaires sont dessinés pour
        // du blanc et deviendraient illisibles sur l'aplat d'accent.
        background: logo ? '#fff' : (actif ? 'var(--color-accent)' : 'var(--bg-input)'),
        color: actif ? '#fff' : 'var(--text-muted)',
        border: logo ? '1px solid var(--border-color)' : 'none',
      }}>
        {logo
          ? <img src={logo} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          : (Icone ? <Icone size={16} /> : <FiTag size={16} />)}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontWeight: 600, fontSize: 13 }}>{titre}</span>
        {aide && (
          <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {aide}
          </span>
        )}
      </span>
      {actif && <FiCheck size={16} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />}
    </button>
  );
}

/** En-tête de section avec compteur et raccourcis « tout / aucun ». */
function EnteteCanaux({ titre, aide, nbSelection, nbTotal, onTout, onAucun }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{titre}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{aide}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
          background: nbSelection > 0 ? 'var(--color-info-bg, rgba(24,95,165,0.08))' : 'var(--bg-input)',
          color: nbSelection > 0 ? 'var(--color-accent)' : 'var(--text-muted)',
        }}>
          {nbSelection > 0 ? `${nbSelection}/${nbTotal}` : 'Tous'}
        </span>
        <button type="button" onClick={onTout}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 11, color: 'var(--color-accent)' }}>
          Tout
        </button>
        <span style={{ color: 'var(--border-color)' }}>|</span>
        <button type="button" onClick={onAucun}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)' }}>
          Effacer
        </button>
      </div>
    </div>
  );
}

// Styles d'entrée réutilisés par la barre de filtres (variables de thème → OK en clair/sombre)
const filtreInputStyle = {
  padding: '8px 12px',
  border: '1px solid var(--border-color)',
  borderRadius: 8,
  fontSize: 13,
  background: 'var(--bg-input)',
  color: 'var(--text-primary)',
};

const construirePayload = (form) => {
  const payload = {
    code: form.code?.trim(),
    libelle: form.libelle?.trim(),
    montant: form.montant,
    devise: form.devise,
    type: form.type,
    anneeAcademique: form.anneeAcademique?.trim(),
    promotionId: form.promotionId,
    description: form.description?.trim() || null,
  };

  if (form.categorieId) {
    payload.categorieId = form.categorieId;
  }
  // Toujours transmises, même vides : c'est ce qui permet à l'admin de RETIRER
  // un mode ou une banque en modifiant un frais existant.
  payload.modesPaiementAutorises = form.modesPaiementAutorises || [];
  payload.banquesAutorisees = form.banquesAutorisees || [];
  if (form.dateLimite) {
    payload.dateLimite = form.dateLimite;
  }

  return payload;
};

const fmtMontant = (montant, devise) =>
  `${Number(montant || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${devise || ''}`.trim();

// "2026-10-15" → "15 Octobre 2026" (mois capitalisé)
const dateLongue = (d) =>
  new Date(d)
    .toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    .replace(/ (\S)/, (_, c) => ' ' + c.toUpperCase());

export default function GestionFraisTachPay() {
  const { user } = useAuth();
  const universiteId = user?.universiteId;

  const [frais, setFrais]           = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filtreAnnee, setFiltreAnnee] = useState('');
  const [filtreType, setFiltreType]   = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [recherche, setRecherche]     = useState('');
  const [showCatalogue, setShowCatalogue] = useState(false);

  const [showForm, setShowForm]     = useState(false);
  const [editId, setEditId]         = useState(null);
  const [form, setForm]             = useState(FORM_VIDE);
  const [saving, setSaving]         = useState(false);
  const [message, setMessage]       = useState({ type: '', text: '' });
  const [templateCode, setTemplateCode] = useState('');

  // Comptes bancaires de l'établissement, proposés à la sélection par frais.
  const [banques, setBanques] = useState([]);

  const [affectModal, setAffectModal] = useState(null); // frais en cours d'affectation
  const [affectLoading, setAffectLoading] = useState(false);

  // Comptes bancaires déclarés par l'établissement (écran « Comptes bancaires »).
  // Échec silencieux : sans compte publié, la section reste simplement vide.
  useEffect(() => {
    if (!universiteId) return;
    informationBancaireService.lister(universiteId)
      .then(r => setBanques(Array.isArray(r.data) ? r.data.filter(b => b.actif !== false) : []))
      .catch(() => setBanques([]));
  }, [universiteId]);

  // ─── Chargement ────────────────────────────────────────────────
  const charger = useCallback(async () => {
    if (!universiteId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtreAnnee) params.append('annee', filtreAnnee);
      const [fraisRes, promoRes, categoriesRes] = await Promise.all([
        api.get(`/api/tachpay/admin/frais?${params}`),
        api.get(`/api/promotions/universite/${universiteId}`).catch(() => ({ data: [] })),
        api.get('/api/admin/frais/categories').catch(() => ({ data: [] })),
      ]);
      const liste = fraisRes.data?.frais || [];
      setFrais(liste);
      setPromotions(promoRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (err) {
      showMsg('error', 'Erreur lors du chargement des frais');
    } finally {
      setLoading(false);
    }
  }, [universiteId, filtreAnnee]);

  useEffect(() => { charger(); }, [charger]);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  // ─── Index promotions / catégories (résolution des libellés) ────
  const promoById = Object.fromEntries(promotions.map(p => [String(p.id), p]));
  const catById   = Object.fromEntries(categories.map(c => [String(c.id), c]));

  const nomPromotion = (id) => {
    const p = promoById[String(id)];
    if (!p) return id ? `Promotion #${id}` : '—';
    return [p.nom || p.libelle, p.filiere?.nom].filter(Boolean).join(' — ');
  };
  const nomCategorie = (id) => catById[String(id)]?.designation || (id ? `Catégorie #${id}` : '—');

  // ─── Sauvegarde ────────────────────────────────────────────────
  const sauvegarder = async (e) => {
    e.preventDefault();
    if (!form.code || !form.libelle || !form.montant || !form.promotionId || !form.categorieId) {
      return showMsg('error', 'Code, libellé, montant, promotion et catégorie sont obligatoires');
    }
    setSaving(true);
    const payload = construirePayload(form);
    try {
      if (editId) {
        await api.put(`/api/tachpay/admin/frais/${editId}`, payload);
        showMsg('success', 'Frais modifié avec succès');
      } else {
        await api.post('/api/tachpay/admin/frais', payload);
        showMsg('success', 'Frais créé avec succès');
      }
      setShowForm(false);
      setEditId(null);
      setTemplateCode('');
      setForm(FORM_VIDE);
      charger();
    } catch (err) {
      showMsg('error', err.response?.data?.erreur || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const editer = (f) => {
    setEditId(f.id);
    setTemplateCode(f.code && CATALOGUE_BY_CODE[f.code] ? f.code : '');
    setForm({
      code: f.code || '',
      libelle: f.libelle || '',
      montant: f.montant || '',
      devise: f.devise || 'USD',
      type: f.type || 'ACADEMIQUE',
      anneeAcademique: f.anneeAcademique || ANNEE_EN_COURS,
      promotionId: f.promotionId || '',
      categorieId: f.categorieId || '', // désormais exposé par le backend (évite de reperdre la catégorie)
      dateLimite: f.dateLimite || '',
      description: f.description || '',
      modesPaiementAutorises: f.modesPaiementAutorises || [],
      banquesAutorisees: f.banquesAutorisees || [],
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const changerStatut = async (id, statut) => {
    try {
      await api.patch(`/api/tachpay/admin/frais/${id}/statut`, { statut });
      showMsg('success', `Statut changé en ${statut}`);
      charger();
    } catch (err) {
      showMsg('error', err.response?.data?.erreur || 'Erreur changement statut');
    }
  };

  const archiver = (f) => {
    if (!window.confirm(`Archiver le frais « ${f.libelle} » ?\nLes affectations non encore payées seront annulées.`)) return;
    changerStatut(f.id, 'ARCHIVE');
  };

  const affecter = async (fraisId) => {
    setAffectLoading(true);
    try {
      const res = await api.post(`/api/tachpay/admin/frais/${fraisId}/affecter`);
      showMsg('success', res.data?.message || 'Affectation effectuée');
      setAffectModal(null);
      charger();
    } catch (err) {
      showMsg('error', err.response?.data?.erreur || 'Erreur affectation');
    } finally {
      setAffectLoading(false);
    }
  };

  const appliquerTemplate = (code) => {
    setTemplateCode(code);
    const template = CATALOGUE_BY_CODE[code];
    if (!template) return;
    setForm(prev => ({
      ...prev,
      code: template.code,
      libelle: template.libelle,
      type: template.type,
      description: prev.description?.trim() ? prev.description : template.description,
    }));
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ─── Filtres client + statistiques ──────────────────────────────
  const rechercheNorm = recherche.trim().toLowerCase();
  const fraisFiltres = frais.filter(f => {
    if (filtreType && f.type !== filtreType) return false;
    if (filtreStatut && f.statut !== filtreStatut) return false;
    if (rechercheNorm) {
      const cible = `${f.code || ''} ${f.libelle || ''} ${f.description || ''}`.toLowerCase();
      if (!cible.includes(rechercheNorm)) return false;
    }
    return true;
  });

  const filtresActifs = !!(filtreType || filtreStatut || rechercheNorm);
  const reinitialiserFiltres = () => { setFiltreType(''); setFiltreStatut(''); setRecherche(''); };

  const stats = {
    total:    frais.length,
    actifs:   frais.filter(f => f.statut === 'ACTIF').length,
    inactifs: frais.filter(f => f.statut === 'INACTIF').length,
    archives: frais.filter(f => f.statut === 'ARCHIVE').length,
  };
  // Valeur cumulée des frais ACTIFS, par devise
  const valeurParDevise = frais
    .filter(f => f.statut === 'ACTIF')
    .reduce((acc, f) => {
      const d = f.devise || 'USD';
      acc[d] = (acc[d] || 0) + (f.montant || 0);
      return acc;
    }, {});
  const valeurTexte = Object.keys(valeurParDevise).length
    ? Object.entries(valeurParDevise).map(([d, m]) => fmtMontant(m, d)).join(' · ')
    : '—';

  if (!universiteId) return (
    <div className="page">
      <div className="alert-erreur">Aucune université associée à votre compte.</div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">💳 TachPay — Gestion des frais</h1>
          <p className="page-sub">Activez les frais standards par promotion et fixez le montant propre à votre université.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-outline" onClick={charger}>🔄 Rafraîchir</button>
          <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setForm(FORM_VIDE); setTemplateCode(''); }}>
            {showForm ? '✕ Annuler' : '➕ Nouveau frais'}
          </button>
        </div>
      </div>

      {message.text && (
        <div className={message.type === 'success' ? 'alert-success' : 'alert-erreur'} onClick={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </div>
      )}

      {categories.length === 0 && (
        <div className="alert-erreur" style={{ marginBottom: 20 }}>
          Créez d’abord au moins une catégorie de frais dans le module des catégories avant d’ajouter un frais TachPay.
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total frais</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--color-success-text)' }}>{stats.actifs}</div>
          <div className="stat-label">Actifs</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.inactifs}</div>
          <div className="stat-label">Inactifs</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--color-warning, #ff9800)' }}>{stats.archives}</div>
          <div className="stat-label">Archivés</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ fontSize: 18 }}>{valeurTexte}</div>
          <div className="stat-label">Valeur des frais actifs</div>
        </div>
      </div>

      {/* Catalogue standard (repliable) */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 className="card-title">Catalogue standard des frais</h2>
            <p className="page-sub" style={{ margin: '4px 0 0' }}>
              Sélectionnez un frais pour préremplir le formulaire, puis choisissez la promotion et le montant.
            </p>
          </div>
          <button
            className="btn-outline"
            onClick={() => setShowCatalogue(v => !v)}
            style={{ whiteSpace: 'nowrap' }}
            aria-expanded={showCatalogue}
          >
            {showCatalogue ? '▲ Masquer' : `▼ Afficher (${FRAIS_CATALOGUE.length})`}
          </button>
        </div>
        {showCatalogue && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
            marginTop: 16,
          }}>
            {FRAIS_CATALOGUE.map(item => {
              const dejaConfigure = frais.some(f => f.code === item.code);
              const selectionne = templateCode === item.code;
              return (
                <button
                  key={item.code}
                  type="button"
                  className="btn-outline"
                  onClick={() => appliquerTemplate(item.code)}
                  style={{
                    textAlign: 'left',
                    padding: 14,
                    borderRadius: 12,
                    borderColor: selectionne ? 'var(--color-accent)' : 'var(--border-color)',
                    background: selectionne ? 'var(--color-info-bg, rgba(24,95,165,0.08))' : 'var(--bg-card)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--color-accent)', fontWeight: 700 }}>{item.code}</span>
                    {dejaConfigure && (
                      <span style={{ fontSize: 10, color: 'var(--color-success-text)', fontWeight: 700 }}>✓ configuré</span>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{item.libelle}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.45 }}>{item.description}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Formulaire création/édition */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20, border: '2px solid var(--color-accent)' }}>
          <h2 className="card-title" style={{ color: 'var(--color-accent)' }}>
            {editId ? '✏️ Modifier le frais' : '➕ Créer un nouveau frais'}
          </h2>
          <form onSubmit={sauvegarder} className="form-grid">
            <div className="form-group">
              <label>Frais standard</label>
              <select value={templateCode} onChange={e => appliquerTemplate(e.target.value)}>
                <option value="">Personnalisé / hors catalogue</option>
                {FRAIS_CATALOGUE.map(item => (
                  <option key={item.code} value={item.code}>{item.libelle}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Code interne *</label>
              <input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().replace(/\s+/g, '_') }))}
                placeholder="Ex: RELEVE_ANNUEL"
                required
              />
            </div>
            <div className="form-group">
              <label>Libellé *</label>
              <input
                value={form.libelle}
                onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))}
                placeholder="Ex: Frais d'inscription 2024-2025"
                required
              />
            </div>
            <div className="form-group">
              <label>Montant *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.montant}
                  onChange={e => setForm(f => ({ ...f, montant: e.target.value }))}
                  placeholder="0.00"
                  required
                  style={{ flex: 1 }}
                />
                <select
                  value={form.devise}
                  onChange={e => setForm(f => ({ ...f, devise: e.target.value }))}
                  style={{ width: 80 }}
                >
                  <option value="USD">USD</option>
                  <option value="CDF">CDF</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Catégorie *</label>
              <select value={form.categorieId} onChange={e => setForm(f => ({ ...f, categorieId: e.target.value }))} required>
                <option value="">— Sélectionnez une catégorie —</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.designation} {cat.code ? `(${cat.code})` : ''}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Année académique</label>
              <input
                value={form.anneeAcademique}
                onChange={e => setForm(f => ({ ...f, anneeAcademique: e.target.value }))}
                placeholder="Ex: 2024-2025"
              />
              <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4, display: 'block' }}>
                ℹ️ Alignée automatiquement sur l'année de la promotion choisie — sinon le frais reste invisible dans le portail étudiant.
              </small>
            </div>
            <div className="form-group">
              <label>Promotion concernée *</label>
              <select value={form.promotionId} onChange={e => setForm(f => ({ ...f, promotionId: e.target.value }))} required>
                <option value="">— Sélectionnez une promotion —</option>
                {promotions.map(p => (
                  <option key={p.id} value={p.id}>{p.nom || p.libelle} — {p.filiere?.nom}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Date limite de paiement</label>
              <input
                type="date"
                value={form.dateLimite}
                onChange={e => setForm(f => ({ ...f, dateLimite: e.target.value }))}
              />
            </div>
            {/* ─── Canaux de paiement ouverts pour ce frais ─────────────────
                Choisis ici, au moment où le frais est créé puis affecté à la
                promotion : plusieurs modes ET plusieurs banques peuvent être
                activés. Rien de coché = aucune restriction. */}
            <div style={{
              gridColumn: '1 / span 2',
              border: '1px solid var(--border-color)',
              borderRadius: 14,
              padding: 16,
              background: 'var(--bg-input)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <FiCreditCard size={16} style={{ color: 'var(--color-accent)' }} />
                <h3 style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)' }}>
                  Comment ce frais peut-il être payé ?
                </h3>
              </div>
              <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--text-muted)' }}>
                Ce choix s'applique à tous les étudiants de la promotion à qui le frais est affecté,
                et détermine ce que l'étudiant voit dans son portail et sur son bon de caisse.
              </p>

              <EnteteCanaux
                titre="Modes de paiement acceptés"
                aide="Aucun coché = tous les canaux de l'établissement sont ouverts."
                nbSelection={(form.modesPaiementAutorises || []).length}
                nbTotal={MODES_PAIEMENT.length}
                onTout={() => setForm(f => ({ ...f, modesPaiementAutorises: MODES_PAIEMENT.map(m => m.code) }))}
                onAucun={() => setForm(f => ({ ...f, modesPaiementAutorises: [] }))}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8 }}>
                {MODES_PAIEMENT.map(mode => {
                  const actif = (form.modesPaiementAutorises || []).includes(mode.code);
                  return (
                    <CarteCanal
                      key={mode.code}
                      actif={actif}
                      titre={mode.label}
                      aide={mode.aide}
                      Icone={mode.Icone}
                      logo={mode.logo}
                      onToggle={() => setForm(f => ({
                        ...f,
                        modesPaiementAutorises: actif
                          ? f.modesPaiementAutorises.filter(m => m !== mode.code)
                          : [...(f.modesPaiementAutorises || []), mode.code],
                      }))}
                    />
                  );
                })}
              </div>

              <div style={{ height: 1, background: 'var(--border-color)', margin: '16px 0' }} />

              <EnteteCanaux
                titre="Banques acceptées"
                aide="Elles s'impriment sur le bon de caisse que l'étudiant présente au guichet."
                nbSelection={(form.banquesAutorisees || []).length}
                nbTotal={banques.length}
                onTout={() => setForm(f => ({ ...f, banquesAutorisees: banques.map(b => b.id) }))}
                onAucun={() => setForm(f => ({ ...f, banquesAutorisees: [] }))}
              />
              {banques.length === 0 ? (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 10,
                  background: 'var(--bg-card)', border: '1px dashed var(--border-color)',
                  fontSize: 12, color: 'var(--text-muted)',
                }}>
                  <FiAlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>
                    Aucun compte bancaire n'est déclaré pour votre établissement.
                    Ajoutez-en dans <strong>Comptes bancaires</strong> pour que l'étudiant
                    puisse déposer ses espèces en banque.
                  </span>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8 }}>
                  {banques.map(b => {
                    const actif = (form.banquesAutorisees || []).includes(b.id);
                    return (
                      <CarteCanal
                        key={b.id}
                        actif={actif}
                        titre={b.nomBanque}
                        aide={`${b.devise || ''}${b.numeroCompte ? ` · ${b.numeroCompte}` : ''}`}
                        Icone={FiHome}
                        logo={logoBanque(b.nomBanque)}
                        onToggle={() => setForm(f => ({
                          ...f,
                          banquesAutorisees: actif
                            ? f.banquesAutorisees.filter(id => id !== b.id)
                            : [...(f.banquesAutorisees || []), b.id],
                        }))}
                      />
                    );
                  })}
                </div>
              )}

              {/* Récapitulatif : évite de relire toutes les cartes pour savoir ce qui est ouvert. */}
              <div style={{
                marginTop: 14, padding: '10px 12px', borderRadius: 10,
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 8,
              }}>
                <FiInfo size={14} style={{ flexShrink: 0, marginTop: 2, color: 'var(--color-accent)' }} />
                <span>
                  {(form.modesPaiementAutorises || []).length === 0
                    ? "Tous les modes de paiement seront proposés à l'étudiant."
                    : `${form.modesPaiementAutorises.length} mode(s) autorisé(s) : ${
                        MODES_PAIEMENT.filter(m => form.modesPaiementAutorises.includes(m.code))
                          .map(m => m.label).join(', ')}.`}
                  {' '}
                  {(form.banquesAutorisees || []).length === 0
                    ? 'Toutes les banques actives seront proposées.'
                    : `${form.banquesAutorisees.length} banque(s) : ${
                        banques.filter(b => form.banquesAutorisees.includes(b.id))
                          .map(b => b.nomBanque).join(', ')}.`}
                </span>
              </div>
            </div>

            <div className="form-group" style={{ gridColumn: '1 / span 2' }}>
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Détails complémentaires..."
              />
            </div>
            <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn-outline" onClick={() => { setShowForm(false); setEditId(null); setForm(FORM_VIDE); setTemplateCode(''); }}>
                Annuler
              </button>
              <button type="submit" className="btn-primary" disabled={saving || categories.length === 0}>
                {saving ? '⏳ Sauvegarde...' : editId ? '💾 Modifier' : '✅ Créer le frais'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          placeholder="🔎 Rechercher (code, libellé...)"
          style={{ ...filtreInputStyle, width: 240 }}
        />
        <select value={filtreType} onChange={e => setFiltreType(e.target.value)} style={filtreInputStyle}>
          <option value="">Tous les types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)} style={filtreInputStyle}>
          <option value="">Tous les statuts</option>
          <option value="ACTIF">Actifs</option>
          <option value="INACTIF">Inactifs</option>
          <option value="ARCHIVE">Archivés</option>
        </select>
        <input
          value={filtreAnnee}
          onChange={e => setFiltreAnnee(e.target.value)}
          placeholder="Année (ex: 2024-2025)"
          style={{ ...filtreInputStyle, width: 170 }}
          onKeyDown={e => e.key === 'Enter' && charger()}
          title="Filtre appliqué côté serveur — validez avec Entrée ou « Appliquer »"
        />
        <button className="btn-outline" onClick={charger} style={{ fontSize: 13 }}>Appliquer l’année</button>
        {filtresActifs && (
          <button className="btn-outline" onClick={reinitialiserFiltres} style={{ fontSize: 13 }}>✕ Réinitialiser</button>
        )}
        <span style={{ color: 'var(--text-muted)', fontSize: 13, marginLeft: 'auto' }}>
          {fraisFiltres.length} / {frais.length} frais
        </span>
      </div>

      {/* Liste des frais (cartes) */}
      {loading ? (
        <div className="card"><div className="loading">Chargement des frais...</div></div>
      ) : fraisFiltres.length === 0 ? (
        <div className="card">
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
            <p>
              {frais.length === 0
                ? 'Aucun frais trouvé. Créez votre premier frais en cliquant sur « Nouveau frais ».'
                : 'Aucun frais ne correspond aux filtres sélectionnés.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="frais-grid">
          {fraisFiltres.map(f => {
            const echeanceDepassee = f.dateLimite && new Date(f.dateLimite) < new Date();
            const pill = STATUT_PILL[f.statut] || STATUT_PILL.INACTIF;
            const StatutIcon = pill.Icon;
            const TypeIcon = TYPE_ICON[f.type] || FiFileText;
            const promo = nomPromotion(f.promotionId);
            const cat = nomCategorie(f.categorieId);
            return (
              <div key={f.id} className={`frais-card is-${(f.statut || '').toLowerCase()}`}>
                {/* En-tête : logo + titre + puces / statut */}
                <div className="frais-head">
                  <div className="frais-head-main">
                    <span className="frais-logo"><TypeIcon /></span>
                    <div style={{ minWidth: 0 }}>
                      <h3 className="frais-titre">{f.libelle}</h3>
                      <div className="frais-chips">
                        <span className="frais-chip frais-chip--type">{f.type}</span>
                        {CATALOGUE_BY_CODE[f.code] && (
                          <span className="frais-chip frais-chip--std"><FiStar /> Standard</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={`frais-statut ${pill.cls}`}>
                    <StatutIcon /> {pill.label}
                  </span>
                </div>

                {/* Montant en hero */}
                <div>
                  <div className="frais-montant-row">
                    <span className="frais-montant-ic"><FiCreditCard /></span>
                    <div className="frais-montant">
                      {Number(f.montant || 0).toLocaleString('fr-FR', { maximumFractionDigits: 2 })}
                      <span className="frais-devise">{f.devise || 'USD'}</span>
                    </div>
                  </div>
                  {f.description && <p className="frais-sub">{f.description}</p>}
                </div>

                {/* Panneau méta */}
                <div className="frais-meta">
                  <div className="frais-meta-row">
                    <span className="frais-ic frais-ic--promo"><FiUsers /></span>
                    <span className="frais-meta-label">Promotion</span>
                    <span className="frais-leader" />
                    <span className="frais-meta-value" title={promo}>{promo}</span>
                  </div>
                  <div className="frais-meta-row">
                    <span className="frais-ic frais-ic--cat"><FiTag /></span>
                    <span className="frais-meta-label">Catégorie</span>
                    <span className="frais-leader" />
                    <span className="frais-meta-value" title={cat}>{cat}</span>
                  </div>
                  <div className="frais-meta-row">
                    <span className="frais-ic frais-ic--year"><FiCalendar /></span>
                    <span className="frais-meta-label">Année</span>
                    <span className="frais-leader" />
                    <span className="frais-meta-value">{f.anneeAcademique}</span>
                  </div>
                  <div className="frais-meta-row">
                    <span className="frais-ic frais-ic--date"><FiClock /></span>
                    <span className="frais-meta-label">Échéance</span>
                    <span className="frais-leader" />
                    <span className={`frais-meta-value${echeanceDepassee ? ' is-depassee' : ''}`}>
                      {f.dateLimite ? dateLongue(f.dateLimite) : 'Sans échéance'}
                    </span>
                  </div>
                </div>

                {/* Bandeau échéance */}
                {f.dateLimite && (
                  <div className={`frais-note${echeanceDepassee ? ' frais-note--warn' : ''}`}>
                    {echeanceDepassee ? <FiAlertTriangle /> : <FiInfo />}
                    <span>
                      {echeanceDepassee
                        ? `Échéance dépassée le ${dateLongue(f.dateLimite)} — paiement en retard.`
                        : `À régler avant le ${dateLongue(f.dateLimite)}.`}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="frais-actions">
                  <button
                    className="frais-btn frais-btn--primary"
                    onClick={() => editer(f)}
                    aria-label={`Modifier le frais ${f.libelle || f.id}`}
                  >
                    <FiEdit2 /> Modifier
                  </button>
                  {f.statut === 'ACTIF' && (
                    <button
                      className="frais-btn frais-btn--promo"
                      onClick={() => setAffectModal(f)}
                      aria-label={`Affecter le frais ${f.libelle || f.id}`}
                    >
                      <FiUsers /> Affecter
                    </button>
                  )}
                  {f.statut === 'ACTIF' ? (
                    <button
                      className="frais-btn"
                      onClick={() => changerStatut(f.id, 'INACTIF')}
                      aria-label={`Désactiver le frais ${f.libelle || f.id}`}
                    >
                      <FiPause /> Désactiver
                    </button>
                  ) : (
                    <button
                      className="frais-btn frais-btn--go"
                      onClick={() => changerStatut(f.id, 'ACTIF')}
                      aria-label={`Activer le frais ${f.libelle || f.id}`}
                    >
                      <FiPlay /> {f.statut === 'ARCHIVE' ? 'Restaurer' : 'Activer'}
                    </button>
                  )}
                  {f.statut !== 'ARCHIVE' && (
                    <button
                      className="frais-btn frais-btn--archive"
                      onClick={() => archiver(f)}
                      aria-label={`Archiver le frais ${f.libelle || f.id}`}
                    >
                      <FiArchive /> Archiver
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal affectation */}
      {affectModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 12, padding: 28, width: 460, maxWidth: '92vw' }}>
            <h3 style={{ marginBottom: 12, color: 'var(--text-primary)' }}>👥 Affecter le frais aux étudiants</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
              <strong>{affectModal.libelle}</strong> — {fmtMontant(affectModal.montant, affectModal.devise)}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              Promotion : <strong style={{ color: 'var(--text-secondary)' }}>{nomPromotion(affectModal.promotionId)}</strong><br />
              Une affectation sera créée pour chaque étudiant de cette promotion qui n’en a pas encore.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setAffectModal(null)} disabled={affectLoading}>
                Annuler
              </button>
              <button className="btn-primary" onClick={() => affecter(affectModal.id)} disabled={affectLoading}>
                {affectLoading ? '⏳ Affectation...' : '✅ Confirmer l\'affectation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
