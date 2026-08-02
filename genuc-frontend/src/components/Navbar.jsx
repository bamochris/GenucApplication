// src/components/Navbar.jsx
import { useMemo, useCallback, useState, useEffect, lazy, Suspense } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';
import NotificationBell from './NotificationBell';
import LogoutModal from './LogoutModal';
import api from '../api/axios';
import usePhotosIdentite, { urlPhoto } from '../hooks/usePhotosIdentite';

// ─── Import des icônes FontAwesome ────────────────────────
import {
  FaHome, FaUniversity, FaClipboardList, FaFileAlt, FaCreditCard,
  FaVideo, FaChartBar, FaGraduationCap, FaUsers, FaTrophy,
  FaCalendarAlt, FaCog, FaExclamationTriangle, FaCheckCircle,
  FaLock, FaMoneyBillWave, FaBook, FaUser, FaEnvelope,
  FaSync, FaGavel, FaFilePdf, FaFileInvoice, FaHistory,
  FaUserGraduate, FaUserTie, FaBuilding, FaMapMarkerAlt,
  FaPhone, FaGlobe, FaFacebook, FaLinkedin, FaImage,
  FaPen, FaDatabase, FaDollarSign, FaWallet, FaReceipt,
  FaChartLine, FaChartPie, FaFileExport, FaFileImport,
  FaCheckDouble, FaTimes, FaPlus, FaMinus, FaArrowLeft,
  FaArrowRight, FaBars, FaTimesCircle, FaExclamationCircle,
  FaInfoCircle, FaQuestionCircle, FaSearch, FaFilter,
  FaSort, FaEdit, FaTrash, FaEye, FaEyeSlash, FaLockOpen,
  FaKey, FaUserSecret, FaUserMd, FaUserNurse,
  FaUserAstronaut, FaUserNinja, FaChalkboardTeacher,
  FaTools, FaFolder, FaMobileAlt, FaHospital, FaHandshake,
  FaUpload, FaDownload, FaIdCard, FaFlask, FaBullseye,
  FaBalanceScale, FaCalendarCheck, FaBookOpen, FaSignOutAlt,
  FaFileSignature, FaClock, FaShieldAlt, FaUsersCog, FaServer,
} from 'react-icons/fa';

// Chargé uniquement quand l'utilisateur ouvre « Mot de passe » (hors bundle des autres rôles)
const PasswordDialog = lazy(() => import('./settings/PasswordDialog'));

// ─── Map des icônes (clé → composant) ──────────────────────
const ICON_MAP = {
  home: FaHome,
  university: FaUniversity,
  'clipboard-list': FaClipboardList,
  'file-alt': FaFileAlt,
  'credit-card': FaCreditCard,
  video: FaVideo,
  'chart-bar': FaChartBar,
  'graduation-cap': FaGraduationCap,
  users: FaUsers,
  trophy: FaTrophy,
  'calendar-alt': FaCalendarAlt,
  cog: FaCog,
  'exclamation-triangle': FaExclamationTriangle,
  'check-circle': FaCheckCircle,
  lock: FaLock,
  'money-bill-wave': FaMoneyBillWave,
  book: FaBook,
  user: FaUser,
  envelope: FaEnvelope,
  'book-open': FaBookOpen,
  sync: FaSync,
  gavel: FaGavel,
  'file-pdf': FaFilePdf,
  'file-invoice': FaFileInvoice,
  history: FaHistory,
  'user-graduate': FaUserGraduate,
  'user-tie': FaUserTie,
  building: FaBuilding,
  'map-marker-alt': FaMapMarkerAlt,
  phone: FaPhone,
  globe: FaGlobe,
  facebook: FaFacebook,
  linkedin: FaLinkedin,
  image: FaImage,
  pen: FaPen,
  database: FaDatabase,
  'dollar-sign': FaDollarSign,
  wallet: FaWallet,
  receipt: FaReceipt,
  'chart-line': FaChartLine,
  'chart-pie': FaChartPie,
  'file-export': FaFileExport,
  'file-import': FaFileImport,
  'check-double': FaCheckDouble,
  times: FaTimes,
  plus: FaPlus,
  minus: FaMinus,
  'arrow-left': FaArrowLeft,
  'arrow-right': FaArrowRight,
  bars: FaBars,
  'times-circle': FaTimesCircle,
  'exclamation-circle': FaExclamationCircle,
  'info-circle': FaInfoCircle,
  'question-circle': FaQuestionCircle,
  search: FaSearch,
  filter: FaFilter,
  sort: FaSort,
  edit: FaEdit,
  trash: FaTrash,
  eye: FaEye,
  'eye-slash': FaEyeSlash,
  'lock-open': FaLockOpen,
  key: FaKey,
  'user-secret': FaUserSecret,
  'user-md': FaUserMd,
  'user-nurse': FaUserNurse,
  'user-astronaut': FaUserAstronaut,
  'user-ninja': FaUserNinja,
  'chalkboard-teacher': FaChalkboardTeacher,
  tools: FaTools,
  folder: FaFolder,
  'mobile-alt': FaMobileAlt,
  hospital: FaHospital,
  handshake: FaHandshake,
  upload: FaUpload,
  download: FaDownload,
  'id-card': FaIdCard,
  flask: FaFlask,
  bullseye: FaBullseye,
  'balance-scale': FaBalanceScale,
  'calendar-check': FaCalendarCheck,
  signature: FaFileSignature,
  clock: FaClock,
  'shield-alt': FaShieldAlt,
  'users-cog': FaUsersCog,
  server: FaServer,
};

// ─── Couleurs claires pour chaque icône ─────────────────────
const ICON_COLORS = {
  home: '#60A5FA',              // bleu clair
  university: '#34D399',        // vert menthe
  'clipboard-list': '#FCD34D',  // jaune clair
  'file-alt': '#F472B6',        // rose clair
  'credit-card': '#A78BFA',     // violet clair
  video: '#FBBF24',             // ambre
  'chart-bar': '#60A5FA',       // bleu clair
  'graduation-cap': '#34D399',  // vert menthe
  users: '#F472B6',             // rose clair
  trophy: '#FBBF24',            // ambre
  'calendar-alt': '#60A5FA',    // bleu clair
  cog: '#9CA3AF',               // gris clair
  'exclamation-triangle': '#F87171', // rouge clair
  'check-circle': '#34D399',    // vert menthe
  lock: '#9CA3AF',              // gris clair
  'money-bill-wave': '#34D399', // vert menthe
  book: '#FCD34D',              // jaune clair
  user: '#60A5FA',              // bleu clair
  envelope: '#60A5FA',          // bleu clair
  'book-open': '#FCD34D',       // jaune clair
  sync: '#34D399',              // vert menthe
  gavel: '#A78BFA',             // violet clair
  'file-pdf': '#F87171',        // rouge clair
  'file-invoice': '#60A5FA',    // bleu clair
  history: '#FCD34D',           // jaune clair
  'user-graduate': '#60A5FA',   // bleu clair
  'user-tie': '#A78BFA',        // violet clair
  building: '#9CA3AF',          // gris clair
  'map-marker-alt': '#F87171',  // rouge clair
  phone: '#34D399',             // vert menthe
  globe: '#60A5FA',             // bleu clair
  facebook: '#60A5FA',          // bleu clair (Facebook)
  linkedin: '#60A5FA',          // bleu clair (LinkedIn)
  image: '#9CA3AF',             // gris clair
  pen: '#FBBF24',               // ambre
  database: '#9CA3AF',          // gris clair
  'dollar-sign': '#34D399',     // vert menthe
  wallet: '#60A5FA',            // bleu clair
  receipt: '#34D399',           // vert menthe
  'chart-line': '#34D399',      // vert menthe
  'chart-pie': '#60A5FA',       // bleu clair
  'file-export': '#60A5FA',     // bleu clair
  'file-import': '#60A5FA',     // bleu clair
  'check-double': '#34D399',    // vert menthe
  times: '#F87171',             // rouge clair
  plus: '#34D399',              // vert menthe
  minus: '#F87171',             // rouge clair
  'arrow-left': '#60A5FA',      // bleu clair
  'arrow-right': '#60A5FA',     // bleu clair
  bars: '#9CA3AF',              // gris clair
  'times-circle': '#F87171',    // rouge clair
  'exclamation-circle': '#F87171', // rouge clair
  'info-circle': '#60A5FA',     // bleu clair
  'question-circle': '#60A5FA', // bleu clair
  search: '#9CA3AF',            // gris clair
  filter: '#9CA3AF',            // gris clair
  sort: '#9CA3AF',              // gris clair
  edit: '#FBBF24',              // ambre
  trash: '#F87171',             // rouge clair
  eye: '#60A5FA',               // bleu clair
  'eye-slash': '#9CA3AF',       // gris clair
  'lock-open': '#34D399',       // vert menthe
  key: '#FBBF24',               // ambre
  'user-secret': '#9CA3AF',     // gris clair
  'user-md': '#60A5FA',         // bleu clair
  'user-nurse': '#60A5FA',      // bleu clair
  'user-astronaut': '#9CA3AF',  // gris clair
  'user-ninja': '#9CA3AF',      // gris clair
  'chalkboard-teacher': '#60A5FA', // bleu clair
  tools: '#9CA3AF',             // gris clair
  folder: '#FCD34D',            // jaune clair
  'mobile-alt': '#60A5FA',      // bleu clair
  hospital: '#F87171',          // rouge clair
  handshake: '#34D399',         // vert menthe
  upload: '#60A5FA',            // bleu clair
  download: '#60A5FA',          // bleu clair
  'id-card': '#60A5FA',         // bleu clair
  flask: '#FCD34D',             // jaune clair
  bullseye: '#34D399',          // vert menthe
  'balance-scale': '#A78BFA',   // violet clair
  'calendar-check': '#34D399',  // vert menthe
  signature: '#FBBF24',         // ambre (signature électronique)
  clock: '#60A5FA',             // bleu clair
  'shield-alt': '#FBBF24',      // ambre (sécurité)
  'users-cog': '#F472B6',       // rose clair
  server: '#F87171',            // rouge clair (critique)
};

// ─── Liens par rôle (CONSERVÉS TELS QUELS) ─────────────────
// Exporté : GENUC Cleverly (ChatbotWidget) s'en sert comme base de
// connaissance pour guider l'utilisateur vers chaque page de son rôle.
export const LINKS_CONFIG = {
  SUPER_ADMIN: [
    { to: '/super-admin/dashboard', icon: 'home', label: 'Dashboard national', ariaLabel: 'Aller au Dashboard national' },
    { to: '/universites', icon: 'university', label: 'Universités', ariaLabel: 'Gérer les universités' },
    { to: '/admin/dossiers', icon: 'clipboard-list', label: 'Dossiers', ariaLabel: 'Consulter les dossiers' },
    { to: '/inscriptions', icon: 'file-alt', label: 'Inscriptions', ariaLabel: 'Gérer les inscriptions' },
    { to: '/paiements', icon: 'credit-card', label: 'Paiements', ariaLabel: 'Consulter les paiements' },
    { to: '/cours', icon: 'video', label: 'Cours en ligne', ariaLabel: 'Accéder aux cours en ligne' },
    { to: '/notes', icon: 'chart-bar', label: 'Notes', ariaLabel: 'Consulter les notes' },
    { to: '/diplomes', icon: 'graduation-cap', label: 'Diplômes', ariaLabel: 'Gérer les diplômes' },
    { to: '/admin/equivalences-diplomes', icon: 'graduation-cap', label: 'Équivalences diplômes', ariaLabel: 'Gérer les équivalences de diplômes' },
    { to: '/admin/vacations', icon: 'clock', label: 'Vacations Jour/Soir', ariaLabel: 'Gérer les vacations Jour/Soir' },
    { to: '/admin/migration', icon: 'upload', label: 'Migration', ariaLabel: 'Migration assistée des données existantes' },
    { to: '/admin/generer-palmares', icon: 'trophy', label: 'Palmarès', ariaLabel: 'Générer le palmarès' },
    { to: '/admin/annees-academiques', icon: 'calendar-alt', label: 'Années académiques', ariaLabel: 'Gérer les années académiques' },
    // Sécurité (2FA), Signataires, Utilisateurs, Admin Système, Journal d'audit,
    // mot de passe… sont regroupés dans le sous-menu Paramètres (chaque entrée est une
    // vraie page ; seul « Mot de passe » ouvre une boîte de dialogue, par nature ponctuelle).
    {
      group: 'parametres', icon: 'cog', label: 'Paramètres',
      ariaLabel: 'Ouvrir le sous-menu Paramètres',
      items: [
        { action: 'password', icon: 'key', label: 'Mot de passe' },
        { to: '/securite/2fa', icon: 'shield-alt', label: 'Double authentification' },
        { to: '/utilisateurs', icon: 'users-cog', label: 'Gestion des utilisateurs' },
        { to: '/super-admin/admins-universites', icon: 'university', label: "Administrateurs d'universités" },
        { to: '/admin/signataires', icon: 'signature', label: 'Signataires électroniques' },
        { to: '/admin-systeme', icon: 'server', label: 'Administration système' },
      ],
    },
    { to: '/finances/dashboard', icon: 'money-bill-wave', label: 'Finances', ariaLabel: 'Consulter le dashboard finances' },
    { to: '/admin/deliberation/pre-deliberation', icon: 'clipboard-list', label: 'Pré-délibération', ariaLabel: 'Accéder à la pré-délibération' },
    { to: '/admin/deliberation/consolidation', icon: 'sync', label: 'Consolidation', ariaLabel: 'Accéder à la consolidation' },
    { to: '/admin/deliberation/annuelle', icon: 'calendar-alt', label: 'Délibération annuelle', ariaLabel: 'Accéder à la délibération annuelle' },
    { to: '/admin/deliberation/jury', icon: 'gavel', label: 'Salle de jury', ariaLabel: 'Accéder à la salle de jury' },
    { to: '/admin/deliberation/pv', icon: 'file-pdf', label: 'Procès-verbaux', ariaLabel: 'Consulter les procès-verbaux' },
    { to: '/admin/deliberation/recours', icon: 'file-invoice', label: 'Gestion des recours', ariaLabel: 'Gérer les recours' },
    { to: '/admin/deliberation/audit', icon: 'search', label: 'Historique & Audit', ariaLabel: "Consulter l'historique et audit" },
  ],
  // Sidebar structurée en modules : la sidebar affiche les modules, puis la
  // barre du haut affiche leurs options directes. Les contenus internes restent
  // dans les pages conteneurs (ex. Université, Infrastructure).
  ADMIN_UNIVERSITE: [
    { to: '/admin/dashboard', icon: 'home', label: 'Dashboard', ariaLabel: 'Aller au Dashboard' },
    { to: '/admin/migration', icon: 'upload', label: 'Migration', ariaLabel: 'Migration assistée des données existantes' },
    {
      group: 'administration', icon: 'university', label: 'Administration',
      ariaLabel: "Ouvrir le module Administration",
      items: [
        { to: '/universites', icon: 'university', label: 'Université' },
        { to: '/admin/modules/infrastructure', icon: 'building', label: 'Infrastructure' },
        { to: '/admin/parametres-lmd', icon: 'sort', label: 'Semestres' },
        { to: '/admin/annees-academiques', icon: 'calendar-alt', label: 'Années académiques' },
        { to: '/admin/calendrier', icon: 'calendar-check', label: 'Calendrier académique' },
        { to: '/admin/parametres', icon: 'cog', label: 'Paramètres université' },
        { to: '/admin/vacations', icon: 'clock', label: 'Vacations Jour/Soir' },
        { to: '/admin/cartes-etudiant', icon: 'id-card', label: 'Cartes étudiant' },
        { to: '/admin/alertes', icon: 'exclamation-triangle', label: 'Alertes' },
      ],
    },
    {
      group: 'academique', icon: 'graduation-cap', label: 'Académique',
      ariaLabel: 'Ouvrir le module Académique',
      items: [
        { to: '/admin/dossiers', icon: 'clipboard-list', label: 'Dossiers' },
        { to: '/inscriptions', icon: 'file-alt', label: 'Inscriptions' },
        { to: '/cours', icon: 'video', label: 'Cours en ligne' },
        { to: '/notes', icon: 'chart-bar', label: 'Notes' },
        { to: '/diplomes', icon: 'graduation-cap', label: 'Diplômes' },
        { to: '/admin/equivalences-diplomes', icon: 'graduation-cap', label: 'Équivalences diplômes' },
        { to: '/admin/attestations', icon: 'file-invoice', label: 'Attestations' },
        { to: '/admin/palmares/config', icon: 'cog', label: 'Palmarès - Paramètres' },
        { to: '/admin/palmares/validation', icon: 'check-circle', label: 'Palmarès - Validation' },
      ],
    },
    {
      group: 'deliberations', icon: 'balance-scale', label: 'Délibérations',
      ariaLabel: 'Ouvrir le module Délibérations',
      items: [
        { to: '/admin/deliberations', icon: 'balance-scale', label: 'Délibérations (3 phases)' },
        { to: '/admin/deliberation/pre-deliberation', icon: 'clipboard-list', label: 'Pré-délibération' },
        { to: '/admin/deliberation/consolidation', icon: 'sync', label: 'Consolidation' },
        { to: '/admin/deliberation/annuelle', icon: 'calendar-alt', label: 'Délibération annuelle' },
        { to: '/admin/deliberation/jury', icon: 'gavel', label: 'Salle de jury' },
        { to: '/admin/deliberation/pv', icon: 'file-pdf', label: 'Procès-verbaux' },
        { to: '/admin/deliberation/recours', icon: 'file-invoice', label: 'Gestion des recours' },
      ],
    },
    {
      group: 'finance', icon: 'money-bill-wave', label: 'Finance',
      ariaLabel: 'Ouvrir le module Finance',
      items: [
        { to: '/finances/dashboard', icon: 'money-bill-wave', label: 'Dashboard finances' },
        { to: '/paiements', icon: 'credit-card', label: 'Paiements' },
        { to: '/finances/admin/categories', icon: 'folder', label: 'Catégories de frais' },
        { to: '/finances/admin/frais', icon: 'money-bill-wave', label: 'Gestion des frais' },
        { to: '/finances/admin/affectations', icon: 'clipboard-list', label: 'Affectations' },
        { to: '/admin/echeanciers', icon: 'calendar-check', label: 'Échéanciers' },
        { to: '/admin/parametres-paiement', icon: 'wallet', label: 'Encaissement (comptes)' },
        { to: '/finances/admin/historique', icon: 'history', label: 'Historique des frais' },
        { to: '/admin/bons-paiement', icon: 'file-invoice', label: 'Bons de paiement' },
        { to: '/admin/comptes-bancaires', icon: 'university', label: 'Comptes bancaires' },
      ],
    },
    {
      group: 'rh', icon: 'users', label: 'Ressources Humaines',
      ariaLabel: 'Ouvrir le module Ressources Humaines',
      items: [
        { to: '/rh/dashboard', icon: 'home', label: 'Portail RH' },
        { to: '/rh/employes', icon: 'users', label: 'Employés' },
        { to: '/rh/conges', icon: 'calendar-check', label: 'Congés' },
        { to: '/rh/paie', icon: 'money-bill-wave', label: 'Paie' },
        { to: '/admin/rh/evaluations-enseignants', icon: 'chart-line', label: 'Évaluations enseignants' },
        { to: '/admin/rh/gestion-emploi-etudiant', icon: 'user-graduate', label: 'Emploi étudiant' },
      ],
    },
    {
      group: 'bibliotheque', icon: 'book', label: 'Bibliothèque',
      ariaLabel: 'Ouvrir le module Bibliothèque',
      items: [
        { to: '/admin/bibliotheque', icon: 'book', label: 'Gestion de la bibliothèque' },
        { to: '/admin/bibliotheque', icon: 'book-open', label: 'Ouvrages & emprunts' },
      ],
    },
    {
      group: 'patrimoine', icon: 'tools', label: 'Patrimoine',
      ariaLabel: 'Ouvrir le module Patrimoine',
      items: [
        { to: '/admin/modules/patrimoine', icon: 'tools', label: 'Inventaire & maintenance' },
      ],
    },
    {
      group: 'recherche', icon: 'flask', label: 'Recherche',
      ariaLabel: 'Ouvrir le module Recherche',
      items: [
        { to: '/admin/modules/recherche', icon: 'flask', label: 'Laboratoires & projets' },
      ],
    },
    {
      group: 'communication', icon: 'envelope', label: 'Communication',
      ariaLabel: 'Ouvrir le module Communication',
      items: [
        { to: '/admin/modules/communication', icon: 'file-alt', label: 'Annonces & événements' },
        { to: '/admin/messagerie', icon: 'envelope', label: 'Messagerie interne' },
      ],
    },
    {
      group: 'services', icon: 'handshake', label: 'Services',
      ariaLabel: 'Ouvrir le module Services',
      items: [
        { to: '/admin/social', icon: 'hospital', label: 'Service Social' },
      ],
    },
    {
      group: 'rapports', icon: 'chart-bar', label: 'Rapports',
      ariaLabel: 'Ouvrir le module Rapports',
      items: [
        { to: '/admin/rapports', icon: 'chart-bar', label: 'Rapports & statistiques' },
        { to: '/admin/deliberation/statistiques', icon: 'chart-pie', label: 'Statistiques délibération' },
      ],
    },
    { to: '/admin/signataires', icon: 'signature', label: 'Signature électronique', ariaLabel: 'Gérer les signataires électroniques' },
    {
      group: 'parametres', icon: 'cog', label: 'Paramètres & sécurité',
      ariaLabel: "Ouvrir le sous-menu Paramètres & sécurité",
      items: [
        { action: 'password', icon: 'key', label: 'Mot de passe' },
        { to: '/securite/2fa', icon: 'shield-alt', label: 'Double authentification' },
        { to: '/utilisateurs', icon: 'users-cog', label: 'Gestion des utilisateurs' },
        { to: '/admin/deliberation/audit', icon: 'search', label: 'Historique & Audit' },
      ],
    },
  ],
  COMPTABLE: [
    { to: '/comptable/dashboard', icon: 'home', label: 'Dashboard', ariaLabel: 'Aller au Dashboard' },
    { to: '/comptable/comptes', icon: 'folder', label: 'Comptes', ariaLabel: 'Gérer les comptes' },
    { to: '/comptable/ecritures', icon: 'edit', label: 'Écritures', ariaLabel: 'Gérer les écritures' },
    { to: '/comptable/budgets', icon: 'wallet', label: 'Budgets', ariaLabel: 'Gérer les budgets' },
    { to: '/comptable/balance', icon: 'balance-scale', label: 'Balance', ariaLabel: 'Consulter la balance' },
    { to: '/comptable/rapports', icon: 'chart-bar', label: 'Rapports', ariaLabel: 'Consulter les rapports' },
    { to: '/comptable/validation-paie', icon: 'check-circle', label: 'Validation paie', ariaLabel: 'Valider la paie' },
    { to: '/finances/dashboard', icon: 'money-bill-wave', label: 'Finances', ariaLabel: 'Consulter le dashboard finances' },
    { to: '/finances/admin/historique', icon: 'history', label: 'Historique', ariaLabel: "Consulter l'historique" },
    { to: '/finances/rapports/dettes', icon: 'credit-card', label: 'Dettes étudiantes', ariaLabel: 'Consulter les dettes étudiantes' },
    { to: '/finances/rapports/recouvrement', icon: 'chart-line', label: 'Recouvrement', ariaLabel: 'Consulter le taux de recouvrement' },
    { to: '/finances/rapports/evolution', icon: 'chart-bar', label: 'Évolution', ariaLabel: "Consulter l'évolution des recettes" },
  ],
  CAISSIER: [
    { to: '/caissier/dashboard', icon: 'home', label: 'Caisse', ariaLabel: 'Aller à la Caisse' },
    { to: '/finances/dashboard', icon: 'money-bill-wave', label: 'Finances', ariaLabel: 'Consulter le dashboard finances' },
    { to: '/finances/caissier/encaissement', icon: 'plus', label: 'Encaissement', ariaLabel: "Gérer l'encaissement" },
    { to: '/finances/caissier/journal', icon: 'clipboard-list', label: 'Journal de caisse', ariaLabel: 'Consulter le journal de caisse' },
    { to: '/finances/caissier/cloture', icon: 'lock', label: 'Clôture de caisse', ariaLabel: 'Effectuer la clôture de caisse' },
    { to: '/finances/caissier/rapports', icon: 'chart-bar', label: 'Rapports de caisse', ariaLabel: 'Consulter les rapports de caisse' },
  ],
  ETUDIANT: [
    { to: '/etudiant/dashboard', icon: 'home', label: 'Tableau de bord', ariaLabel: 'Aller au tableau de bord' },
    { to: '/etudiant/mes-cours', icon: 'book', label: 'Mes cours', ariaLabel: 'Consulter mes cours' },
    { to: '/etudiant/resultats', icon: 'chart-bar', label: 'Mes résultats', ariaLabel: 'Consulter mes résultats' },
    { to: '/etudiant/bulletins', icon: 'file-pdf', label: 'Mes bulletins', ariaLabel: 'Télécharger mes bulletins' },
    { to: '/etudiant/frais', icon: 'credit-card', label: 'Mes paiements', ariaLabel: 'Consulter mes paiements' },
    { to: '/etudiant/bibliotheque', icon: 'book', label: 'Bibliothèque', ariaLabel: 'Accéder à la bibliothèque' },
    { to: '/etudiant/messagerie', icon: 'envelope', label: 'Messagerie', ariaLabel: 'Consulter mes messages' },
    { to: '/etudiant/profil', icon: 'user', label: 'Mon profil', ariaLabel: 'Consulter mon profil' },
    { to: '/etudiant/recours', icon: 'file-invoice', label: 'Recours académiques', ariaLabel: 'Déposer un recours' },
    { to: '/etudiant/equivalences-diplomes', icon: 'graduation-cap', label: 'Équivalences diplômes', ariaLabel: "Demander une équivalence de diplôme" },
    { to: '/etudiant/parcours', icon: 'clipboard-list', label: 'Mon parcours', ariaLabel: 'Consulter mon parcours' },
    { to: '/etudiant/horaire', icon: 'calendar-alt', label: 'Mon horaire', ariaLabel: 'Consulter mon horaire' },
    { to: '/etudiant/presences', icon: 'check-circle', label: 'Mes présences', ariaLabel: 'Consulter mes présences' },
  ],
  RECTEUR: [
    { to: '/recteur/dashboard', icon: 'home', label: 'Dashboard exécutif', ariaLabel: 'Aller au Dashboard exécutif' },
    { to: '/admin/rapports', icon: 'chart-bar', label: 'Rapports stratégiques', ariaLabel: 'Consulter les rapports stratégiques' },
    { to: '/finances/dashboard', icon: 'money-bill-wave', label: 'Finances', ariaLabel: 'Consulter le dashboard finances' },
    { to: '/finances/rapports/dettes', icon: 'credit-card', label: 'Dettes étudiantes', ariaLabel: 'Consulter les dettes étudiantes' },
    { to: '/finances/rapports/recouvrement', icon: 'chart-line', label: 'Taux de recouvrement', ariaLabel: 'Consulter le taux de recouvrement' },
    { to: '/finances/rapports/evolution', icon: 'chart-bar', label: 'Évolution des recettes', ariaLabel: "Consulter l'évolution des recettes" },
    { to: '/admin/deliberation/jury', icon: 'gavel', label: 'Salle de jury', ariaLabel: 'Accéder à la salle de jury' },
    { to: '/admin/deliberation/pv', icon: 'file-pdf', label: 'Procès-verbaux', ariaLabel: 'Consulter les procès-verbaux' },
    { to: '/admin/deliberation/statistiques', icon: 'chart-bar', label: 'Statistiques délibération', ariaLabel: 'Consulter les statistiques de délibération' },
    { to: '/securite/2fa', icon: 'lock', label: 'Sécurité (2FA)', ariaLabel: 'Gérer la double authentification' },
    { to: '/admin/signataires', icon: 'signature', label: 'Signataires électroniques', ariaLabel: 'Gérer les signataires électroniques' },
  ],
  PROFESSEUR: [
    { to: '/professeur/dashboard', icon: 'home', label: 'Tableau de bord', ariaLabel: 'Aller au tableau de bord' },
    { to: '/professeur/notes/saisie', icon: 'edit', label: 'Saisie notes', ariaLabel: 'Saisir les notes' },
    { to: '/professeur/notes/import', icon: 'upload', label: 'Import intelligent', ariaLabel: 'Importer les notes' },
    { to: '/professeur/notes/export', icon: 'download', label: 'Export Excel', ariaLabel: 'Exporter les notes' },
    { to: '/professeur/presences/qrcode', icon: 'mobile-alt', label: 'Présences QR', ariaLabel: 'Gérer les présences par QR code' },
    { to: '/professeur/mes-cours', icon: 'book', label: 'Mes cours', ariaLabel: 'Consulter mes cours' },
    { to: '/professeur/deliberation', icon: 'balance-scale', label: 'Délibération', ariaLabel: 'Participer à la délibération' },
    { to: '/professeur/messagerie', icon: 'envelope', label: 'Messagerie', ariaLabel: 'Consulter mes messages' },
    { to: '/professeur/parametres', icon: 'cog', label: 'Paramètres', ariaLabel: 'Configurer mes paramètres' },
  ],
  CHEF_DEPARTEMENT: [
    { to: '/chef/dashboard', icon: 'home', label: 'Dashboard', ariaLabel: 'Aller au Dashboard' },
    { to: '/chef/controle-academique', icon: 'clipboard-list', label: 'Contrôle Académique', ariaLabel: 'Effectuer le contrôle académique' },
    { to: '/admin/deliberation/pre-deliberation', icon: 'clipboard-list', label: 'Pré-délibération', ariaLabel: 'Accéder à la pré-délibération' },
    { to: '/admin/deliberation/jury', icon: 'gavel', label: 'Salle de jury', ariaLabel: 'Accéder à la salle de jury' },
    { to: '/admin/deliberation/recours', icon: 'file-invoice', label: 'Gestion des recours', ariaLabel: 'Gérer les recours' },
  ],
  CHEF_PROMOTION: [
    { to: '/chef-promotion/dashboard', icon: 'user-graduate', label: 'Dashboard Promotion', ariaLabel: 'Aller au Dashboard Promotion' },
  ],
  RH: [
    { to: '/rh/dashboard', icon: 'home', label: 'Dashboard RH', ariaLabel: 'Aller au Dashboard RH' },
    { to: '/rh/employes', icon: 'users', label: 'Employés', ariaLabel: 'Gérer les employés' },
    // Les contrats se gèrent dans la fiche employé (pas de route dédiée)
    { to: '/rh/employes', icon: 'file-invoice', label: 'Contrats', ariaLabel: 'Gérer les contrats' },
    { to: '/rh/paie', icon: 'money-bill-wave', label: 'Gestion de la paie', ariaLabel: 'Gérer la paie' },
    { to: '/rh/conges', icon: 'calendar-alt', label: 'Congés', ariaLabel: 'Gérer les congés' },
    { to: '/admin/rh/evaluations-enseignants', icon: 'chart-line', label: 'Évaluations enseignants', ariaLabel: 'Consulter les évaluations des enseignants' },
    { to: '/admin/rh/gestion-emploi-etudiant', icon: 'user-graduate', label: 'Emploi étudiant', ariaLabel: "Gérer l'emploi étudiant" },
  ],
  DOYEN: [
    { to: '/doyen/dashboard', icon: 'home', label: 'Dashboard', ariaLabel: 'Aller au Dashboard' },
    { to: '/admin/deliberation/statistiques', icon: 'chart-pie', label: 'Statistiques délibération', ariaLabel: 'Consulter les statistiques de délibération' },
    { to: '/admin/deliberation/recours', icon: 'file-invoice', label: 'Gestion des recours', ariaLabel: 'Gérer les recours' },
    { to: '/admin/deliberation/jury', icon: 'gavel', label: 'Salle de jury', ariaLabel: 'Accéder à la salle de jury' },
    { to: '/admin/deliberation/pv', icon: 'file-pdf', label: 'Procès-verbaux', ariaLabel: 'Consulter les procès-verbaux' },
    { to: '/admin/equivalences-diplomes', icon: 'graduation-cap', label: 'Équivalences diplômes', ariaLabel: 'Gérer les équivalences de diplômes' },
    { to: '/admin/signataires', icon: 'signature', label: 'Signataires électroniques', ariaLabel: 'Gérer les signataires électroniques' },
  ],
  SECRETAIRE_ACADEMIQUE: [
    { to: '/secretaire/dashboard', icon: 'home', label: 'Dashboard', ariaLabel: 'Aller au Dashboard' },
    {
      group: 'academique', icon: 'graduation-cap', label: 'Académique',
      ariaLabel: 'Ouvrir le module Académique',
      items: [
        { to: '/admin/dossiers', icon: 'clipboard-list', label: 'Admissions' },
        { to: '/admin/dossiers', icon: 'user-graduate', label: 'Étudiants' },
        { to: '/inscriptions', icon: 'file-alt', label: 'Inscriptions' },
        { to: '/inscriptions', icon: 'sync', label: 'Réinscriptions' },
        { to: '/cours', icon: 'book', label: 'Cours' },
        { to: '/cours', icon: 'book-open', label: "Unités d'enseignement" },
        { to: '/admin/calendrier', icon: 'calendar-alt', label: 'Emploi du temps' },
        { to: '/cours', icon: 'chalkboard-teacher', label: 'Affectation des enseignants' },
        { to: '/admin/rapports', icon: 'check-circle', label: 'Présences' },
        { to: '/notes', icon: 'edit', label: 'Examens' },
        { to: '/notes', icon: 'chart-bar', label: 'Notes' },
     { to: '/admin/deliberations', icon: 'balance-scale', label: 'Délibérations' },
     { to: '/admin/deliberation/jury', icon: 'gavel', label: 'Jury' },
     { to: '/diplomes', icon: 'graduation-cap', label: 'Diplômes' },
     { to: '/admin/attestations', icon: 'file-pdf', label: 'Relevés de notes' },
     { to: '/admin/vacations', icon: 'calendar-alt', label: 'Vacations', ariaLabel: 'Gérer les vacations' },
   ],
    },
    { to: '/admin/attestations', icon: 'file-invoice', label: 'Attestations', ariaLabel: 'Gérer les attestations' },
    { to: '/admin/equivalences-diplomes', icon: 'graduation-cap', label: 'Équivalences diplômes', ariaLabel: 'Gérer les équivalences de diplômes' },
    { to: '/admin/signataires', icon: 'signature', label: 'Signature électronique', ariaLabel: 'Gérer les signataires électroniques' },
  ],
  APPARITEUR: [
    { to: '/appariteur/dashboard', icon: 'home', label: 'Dashboard', ariaLabel: 'Aller au Dashboard' },
    { to: '/appariteur/bureaux', icon: 'building', label: 'Bureaux de vote', ariaLabel: 'Gérer les bureaux de vote' },
    { to: '/appariteur/scrutins', icon: 'clipboard-list', label: 'Scrutins', ariaLabel: 'Gérer les scrutins' },
    { to: '/appariteur/electeurs', icon: 'users', label: 'Électeurs', ariaLabel: 'Gérer les électeurs' },
    { to: '/appariteur/resultats', icon: 'chart-bar', label: 'Résultats', ariaLabel: 'Consulter les résultats' },
  ],
  SERVICE_SOCIAL: [
    { to: '/social/dashboard', icon: 'home', label: 'Dashboard', ariaLabel: 'Aller au Dashboard' },
    { to: '/admin/social', icon: 'clipboard-list', label: 'Dossiers sociaux', ariaLabel: 'Gérer les dossiers sociaux' },
    { to: '/admin/social', icon: 'money-bill-wave', label: 'Bourses & aides', ariaLabel: 'Gérer les bourses et aides sociales' },
  ],
  BIBLIOTHECAIRE: [
    { to: '/bibliothecaire/dashboard', icon: 'home', label: 'Dashboard', ariaLabel: 'Aller au Dashboard' },
    { to: '/admin/bibliotheque', icon: 'book', label: 'Ouvrages', ariaLabel: 'Gérer les ouvrages' },
    { to: '/admin/bibliotheque', icon: 'file-export', label: 'Emprunts', ariaLabel: 'Gérer les emprunts' },
    { to: '/admin/bibliotheque', icon: 'file-import', label: 'Réservations', ariaLabel: 'Gérer les réservations' },
  ],
  ADMIN_SYSTEME: [
    { to: '/admin-systeme', icon: 'server', label: 'Dashboard', ariaLabel: 'Aller au Dashboard système' },
    { to: '/admin-systeme/audit', icon: 'shield-alt', label: 'Audit & logs', ariaLabel: 'Consulter les logs d\'audit' },
    { to: '/admin-systeme/sauvegardes', icon: 'database', label: 'Sauvegardes', ariaLabel: 'Gérer les sauvegardes' },
    { to: '/admin-systeme/utilisateurs', icon: 'users-cog', label: 'Utilisateurs', ariaLabel: 'Gérer les utilisateurs' },
    { to: '/admin-systeme/parametres', icon: 'cog', label: 'Paramètres', ariaLabel: 'Configurer le système' },
  ],
  SECURITE: [
    { to: '/securite/surveillance', icon: 'shield-alt', label: 'Surveillance', ariaLabel: 'Surveillance de sécurité' },
    { to: '/securite/2fa', icon: 'lock', label: 'Double authentification', ariaLabel: 'Gérer la 2FA' },
    { to: '/signature/demandes', icon: 'signature', label: 'Demandes de signature', ariaLabel: 'Consulter les demandes de signature' },
  ],
};

const LIENS_PAR_ROLE = Object.freeze(LINKS_CONFIG);

const ROLE_LABELS = Object.freeze({
  SUPER_ADMIN: 'Super Admin',
  ADMIN_UNIVERSITE: 'Admin université',
  PROFESSEUR: 'Professeur',
  CAISSIER: 'Caissier',
  CHEF_DEPARTEMENT: 'Chef département',
  ETUDIANT: 'Étudiant',
  RECTEUR: 'Recteur',
  RH: 'RH',
  DOYEN: 'Doyen',
  SECRETAIRE_ACADEMIQUE: 'Secrétaire Académique',
  APPARITEUR: 'Appariteur',
  COMPTABLE: 'Comptable',
  SERVICE_SOCIAL: 'Service Social',
  BIBLIOTHECAIRE: 'Bibliothécaire',
  CHEF_PROMOTION: 'Chef Promotion',
  ADMIN_SYSTEME: 'Administrateur système',
  SECURITE: 'Sécurité',
});

function getInitials(user) {
  if (!user) return 'GN';
  const fullName = user.nomComplet?.trim() || user.prenom?.trim() || user.email?.trim();
  if (!fullName) return 'GN';
  const parts = fullName.split(' ');
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return fullName.substring(0, 2).toUpperCase();
}

function isValidRole(role) {
  return role && LIENS_PAR_ROLE.hasOwnProperty(role);
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // ★ État pour le repli/dépliage (persisté dans localStorage)
  const [logoutModal, setLogoutModal] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    document.body.dataset.sidebarCollapsed = String(isCollapsed);
  }, [isCollapsed]);

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(prev => {
      const newState = !prev;
      localStorage.setItem('sidebarCollapsed', String(newState));
      return newState;
    });
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  // ★★★ TOUS LES HOOKS SONT APPELÉS AVANT LES RETOURS CONDITIONNELS ★★★
  const initiales = useMemo(() => getInitials(user), [user]);
  const roleLabel = ROLE_LABELS[user?.role] || user?.role || '';

  // ─── Modules actifs de l'université (pilotés par l'admin dans
  //     Paramètres → Modules des portails). null = tout actif. ───
  const photosIdentite = usePhotosIdentite(!!user);
  const photoProfilUrl = urlPhoto(photosIdentite.photoProfil || user?.photoProfil);
  const [modulesActifs, setModulesActifs] = useState(null);
  useEffect(() => {
    // Seuls les portails étudiant/professeur sont filtrés par modules
    if (!user?.universiteId || !['ETUDIANT', 'PROFESSEUR'].includes(user.role)) {
      setModulesActifs(null);
      return;
    }
    let annule = false;
    api.get(`/api/universites/public/${user.universiteId}`)
      .then(r => {
        if (annule) return;
        try { setModulesActifs(JSON.parse(r.data?.modulesActifs || '{}')); }
        catch { setModulesActifs(null); }
      })
      .catch(() => { if (!annule) setModulesActifs(null); });
    return () => { annule = true; };
  }, [user?.universiteId, user?.role]);

  const liens = useMemo(() => {
    if (!user || !isValidRole(user.role)) return [];
    const base = LIENS_PAR_ROLE[user.role] || LIENS_PAR_ROLE.ADMIN_UNIVERSITE;
    if (!modulesActifs || !['ETUDIANT', 'PROFESSEUR'].includes(user.role)) return base;

    // Un lien appartient à un module si son chemin contient le motif ;
    // module absent de la config = actif (compatibilité ascendante).
    const MODULE_PAR_MOTIF = {
      bibliotheque: 'bibliotheque', palmares: 'palmares', attestation: 'attestations',
      recours: 'recours', calendrier: 'calendrier', carte: 'cartes',
      social: 'social', stage: 'stages', emploi: 'emplois',
    };
    const lienActif = (to) => {
      if (!to) return true;
      const chemin = to.toLowerCase();
      for (const [motif, cle] of Object.entries(MODULE_PAR_MOTIF)) {
        if (chemin.includes(motif) && modulesActifs[cle] === false) return false;
      }
      return true;
    };
    const filtrer = (items) => items
      .map(item => {
        if (item.group && Array.isArray(item.items)) {
          const sousItems = item.items.filter(si => lienActif(si.to));
          return sousItems.length > 0 ? { ...item, items: sousItems } : null;
        }
        return lienActif(item.to) ? item : null;
      })
      .filter(Boolean);
    return filtrer(base);
  }, [user, modulesActifs]);

  // Module actif = groupe dont l'une des sous-options correspond à la route
  // courante. Ses sous-options s'affichent dans la barre d'onglets du haut
  // (et non plus en accordéon dans la sidebar).
  const activeGroup = useMemo(() => {
    const path = location.pathname;
    let best = null, bestLen = -1;
    for (const link of liens) {
      if (link.group && Array.isArray(link.items)) {
        for (const it of link.items) {
          if (it.to && (path === it.to || path.startsWith(it.to + '/')) && it.to.length > bestLen) {
            best = link;
            bestLen = it.to.length;
          }
        }
      }
    }
    return best;
  }, [liens, location.pathname]);

  const handleLogout = useCallback(() => setLogoutModal(true), []);
  const confirmerLogout = useCallback(() => { setLogoutModal(false); logout(); }, [logout]);

  const handleThemeToggle = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  // ─── Vérifications après les hooks ────────────────────────────────
  if (!user) {
    console.warn('Navbar: Utilisateur non authentifié');
    return null;
  }

  if (!isValidRole(user.role)) {
    console.error(`Navbar: Rôle utilisateur invalide: ${user.role}`);
    return null;
  }

  return (
    <>
      <button
        className="mobile-menu-toggle"
        onClick={toggleMobileMenu}
        aria-label={isMobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={isMobileOpen}
        title={isMobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
      >
        {isMobileOpen ? <FaTimes /> : <FaBars />}
      </button>

      {isMobileOpen && (
        <div className="sidebar-overlay" onClick={closeMobileMenu} aria-hidden="true" />
      )}

      <aside
        className={`sidebar${isCollapsed ? ' collapsed' : ''}${isMobileOpen ? ' mobile-open' : ''}`}
        aria-label="Navigation principale"
      >
        {/* Logo + bouton toggle */}
        <div className="sidebar-logo">
          <img src="/assets/logo-genuc2.png" alt="Logo GENUC" className="logo-image" />
          <button
            className="sidebar-toggle"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? 'Déplier le menu' : 'Replier le menu'}
            title={isCollapsed ? 'Déplier' : 'Replier'}
          >
            {isCollapsed ? <FaBars /> : <FaTimes />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav" aria-label="Menu de navigation">
          {liens.map((link) => {
            // Libellé de section : regroupe les liens par module (Administration,
            // Académique, Finance, RH, …) sans être cliquable.
            if (link.section) {
              return (
                <div key={`section-${link.section}`} className="nav-section-label">
                  {link.section}
                </div>
              );
            }

            const IconComponent = ICON_MAP[link.icon];
            const iconColor = ICON_COLORS[link.icon] || '#e0e7ff'; // couleur claire par défaut

            // Entrée « module » : ne se déplie plus en accordéon dans la sidebar.
            // Un clic navigue vers le module ; ses sous-options s'affichent dans la
            // barre d'onglets horizontale en haut du contenu (voir plus bas).
            if (link.group) {
              const premierLien = link.items.find((it) => it.to)?.to;
              const estActif = activeGroup?.group === link.group;
              return (
                <button
                  key={`group-${link.group}`}
                  type="button"
                  className={`nav-link nav-link-action${estActif ? ' active' : ''}`}
                  aria-label={link.ariaLabel || link.label}
                  aria-current={estActif ? 'page' : undefined}
                  onClick={() => {
                    closeMobileMenu();
                    if (premierLien) navigate(premierLien);
                  }}
                >
                  <span className="nav-icon" aria-hidden="true" style={{ color: iconColor }}>
                    {IconComponent ? <IconComponent /> : <span>❓</span>}
                  </span>
                  <span className="nav-label">{link.label}</span>
                </button>
              );
            }

            return (
              <NavLink
                key={`${link.to}-${link.label}`}
                to={link.to}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                aria-label={link.ariaLabel || link.label}
                aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
                onClick={closeMobileMenu}
              >
                <span className="nav-icon" aria-hidden="true" style={{ color: iconColor }}>
                  {IconComponent ? <IconComponent /> : <span>❓</span>}
                </span>
                <span className="nav-label">{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

      {/* Utilisateur connecté + NotificationBell + Theme Toggle */}
      <div className="sidebar-user">
        <div className="sidebar-user-left">
          <div 
            className="user-avatar"
            title={`Utilisateur: ${user.nomComplet || user.prenom || user.email}`}
            aria-label={`Avatar de ${user.nomComplet || user.prenom || user.email}`}
          
            style={photoProfilUrl ? { padding: 0, overflow: 'hidden' } : undefined}
          >
            {photoProfilUrl ? (
              <img key={photoProfilUrl} src={photoProfilUrl} alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
            ) : initiales}
          </div>
          <div className="user-info">
            <div className="user-name">
              {user.nomComplet || user.prenom || user.email}
            </div>
            <div className="user-role">{roleLabel}</div>
          </div>
        </div>
        
        <div className="sidebar-user-right">
          <button
            className="theme-toggle"
            onClick={handleThemeToggle}
            aria-label={theme === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'}
            title={theme === 'light' ? 'Mode sombre' : 'Mode clair'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          
          <NotificationBell aria-label="Notifications" />

          <button
            className="logout-btn"
            onClick={handleLogout}
            aria-label="Déconnexion"
            title="Se déconnecter"
          >
            <FaSignOutAlt />
          </button>
        </div>
      </div>

        {logoutModal && (
          <LogoutModal onConfirm={confirmerLogout} onCancel={() => setLogoutModal(false)} />
        )}
      </aside>

      {/* Hors de l'aside : la sidebar utilise transform (mobile/repli), qui casserait
          le positionnement fixed de l'overlay du dialogue. Seule « Mot de passe »
          reste une boîte de dialogue — action courte et ponctuelle, sans liste ni
          tableau ; toutes les autres options ouvrent désormais de vraies pages. */}
      {showPasswordDialog && (
        <Suspense fallback={null}>
          <PasswordDialog onClose={() => setShowPasswordDialog(false)} />
        </Suspense>
      )}
    </>
  );
}

// ─── Barre d'onglets du module actif ──────────────────────────────
// Rendue par AppLayout, juste SOUS la barre supérieure (PortalTopbar) :
// affiche les sous-options du module sélectionné dans la sidebar.
export function ModuleTabs() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user || !isValidRole(user.role)) return null;

  const base = LIENS_PAR_ROLE[user.role] || LIENS_PAR_ROLE.ADMIN_UNIVERSITE;

  // Module actif = groupe dont l'une des sous-options correspond à la route.
  let groupe = null;
  let meilleur = -1;
  for (const link of base) {
    if (link.group && Array.isArray(link.items)) {
      for (const it of link.items) {
        if (it.to && (location.pathname === it.to || location.pathname.startsWith(it.to + '/')) && it.to.length > meilleur) {
          groupe = link;
          meilleur = it.to.length;
        }
      }
    }
  }
  if (!groupe) return null;

  const items = groupe.items.filter((it) => it.to);
  if (items.length === 0) return null;

  return (
    <nav className="module-topbar" aria-label={`Sous-menu ${groupe.label}`}>
      <div className="module-topbar-inner">
        {items.map((item) => (
          <NavLink
            key={`tab-${item.to}-${item.label}`}
            to={item.to}
            end
            className={({ isActive }) => `module-tab${isActive ? ' active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}