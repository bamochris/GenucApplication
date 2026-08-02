// src/App.js
/**
 * 🎯 APP PRINCIPALE - Intégration complète des améliorations
 * ✅ ErrorBoundary, Loaders, Validation, Logging, RBAC
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { I18nProvider } from './context/i18nContext';
import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import Navbar, { ModuleTabs } from './components/Navbar';
import { ThemeProvider } from './context/ThemeContext';
import ChatbotWidget from './components/ChatbotWidget';
import CommandPalette from './components/CommandPalette';
import PortalTopbar from './components/PortalTopbar';
import DesignSwitcher from './components/DesignSwitcher';
// Layouts — chargés eagerly (petits, toujours nécessaires)
import ProfesseurLayout from './layouts/ProfesseurLayout';
import EtudiantLayout from './layouts/EtudiantLayout';
import FinanceLayout from './layouts/FinanceLayout';
import Logger from './utils/logger';
import './styles/variables.css';
import './styles/main.css';
import './index.css';
import './styles/themes/dark.css';
import './styles/utilities/responsive.css';
import './styles/dialog-interactions.css';
import './theme-premium.css';

// ─── MODULE DÉLIBÉRATION ──────────────────────
const ParametresLMD = lazy(() => import('./pages/admin/deliberation/ParametresLMD'));
const DeliberationSemestre = lazy(() => import('./pages/admin/deliberation/DeliberationSemestre'));
const DeliberationAnnuelle = lazy(() => import('./pages/admin/deliberation/DeliberationAnnuelle'));
const SalleJury = lazy(() => import('./pages/admin/deliberation/SalleJury'));
const ProcesVerbaux = lazy(() => import('./pages/admin/deliberation/ProcesVerbaux'));
const HistoriqueAudit = lazy(() => import('./pages/admin/deliberation/HistoriqueAudit'));
const GestionRecours = lazy(() => import('./pages/admin/deliberation/GestionRecours'));
const StatistiquesDeliberation = lazy(() => import('./pages/admin/deliberation/StatistiquesDeliberation'));
const Consolidation = lazy(() => import('./pages/admin/deliberation/Consolidation'));
const PreDeliberation = lazy(() => import('./pages/admin/deliberation/PreDeliberation'));

// ─── AUTRES PAGES ──────────────────────────────────────────────────
const ControleAcademique = lazy(() => import('./pages/chef/ControleAcademique'));
const ChefEnseignants = lazy(() => import('./pages/chef/ChefEnseignants'));
const ChefCours = lazy(() => import('./pages/chef/ChefCours'));
const ChefNotes = lazy(() => import('./pages/chef/ChefNotes'));
const ChefDeliberations = lazy(() => import('./pages/chef/ChefDeliberations'));
const ChefMessagerie = lazy(() => import('./pages/chef/ChefMessagerie'));
const ChefPresences = lazy(() => import('./pages/chef/ChefPresences'));
const ChefStatistiques = lazy(() => import('./pages/chef/ChefStatistiques'));
const TachPayPage = lazy(() => import('./pages/TachPayPage'));

// Pages publiques
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Inscriptions = lazy(() => import('./pages/Inscriptions'));
const InscriptionsUniversites = lazy(() => import('./pages/InscriptionsUniversites'));
const UniversitesPubliques = lazy(() => import('./pages/UniversitesPubliques'));
const CoursPublics = lazy(() => import('./pages/CoursPublics'));
const Infos = lazy(() => import('./pages/Infos'));
const ActivationCompte = lazy(() => import('./pages/ActivationCompte'));
const MotDePasseOublie = lazy(() => import('./pages/MotDePasseOublie'));
const MonCompte = lazy(() => import('./pages/MonCompte'));
const VerifierDiplome = lazy(() => import('./pages/VerifierDiplome'));
const VerifierAttestation = lazy(() => import('./pages/VerifierAttestation'));
const VerifierLettreAcceptation = lazy(() => import('./pages/VerifierLettreAcceptation'));
const VerifierAdmission = lazy(() => import('./pages/VerifierAdmission'));
const PalmaresPublic = lazy(() => import('./pages/PalmaresPublic'));
const SuiviDossier = lazy(() => import('./pages/SuiviDossier'));
const PaiementInscription = lazy(() => import('./pages/PaiementInscription'));
const PaiementRetour = lazy(() => import('./pages/PaiementRetour'));
const EnregistrementUniversite = lazy(() => import('./pages/superadmin/EnregistrementUniversite'));
const GestionAdminsUniversite = lazy(() => import('./pages/superadmin/GestionAdminsUniversite'));
const GestionUtilisateursUniversite = lazy(() => import('./pages/admin/GestionUtilisateursUniversite'));
const MigrationAssistee = lazy(() => import('./pages/admin/MigrationAssistee'));
const AdministrateurSystemeDashboard = lazy(() => import('./pages/administrateur-systeme/AdministrateurSystemeDashboard'));
const ValidationPaieComptable = lazy(() => import('./pages/comptable/ValidationPaieComptable'));

// Pages ADMIN
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/SuperAdminDashboard'));
const AdminUniversiteDashboard = lazy(() => import('./pages/admin/AdminUniversiteDashboard'));
const Universites = lazy(() => import('./pages/Universites'));
const Paiements = lazy(() => import('./pages/Paiements'));
const Cours = lazy(() => import('./pages/Cours'));
const Notes = lazy(() => import('./pages/Notes'));
const Diplomes = lazy(() => import('./pages/Diplomes'));
const Utilisateurs = lazy(() => import('./pages/Utilisateurs'));
const AdminDossiers = lazy(() => import('./pages/AdminDossiers'));
const UniversiteDetail = lazy(() => import('./pages/admin/UniversiteDetail'));
const FilieresGestion = lazy(() => import('./pages/admin/FilieresGestion'));
const AnneeAcademiqueGestion = lazy(() => import('./pages/admin/AnneeAcademiqueGestion'));
const PromotionGestion = lazy(() => import('./pages/admin/PromotionGestion'));
const GenererPalmares = lazy(() => import('./pages/admin/GenererPalmares'));
const DeliberationWorkflow = lazy(() => import('./pages/admin/DeliberationWorkflow'));
const GestionFraisTachPay = lazy(() => import('./pages/admin/GestionFraisTachPay'));
const GestionBonsDePaiement = lazy(() => import('./pages/admin/GestionBonsDePaiement'));
const GestionComptesBancaires = lazy(() => import('./pages/admin/GestionComptesBancaires'));
const GestionVacations = lazy(() => import('./pages/admin/GestionVacations'));
const GestionEquivalencesDiplomes = lazy(() => import('./pages/admin/GestionEquivalencesDiplomes'));
const Securite2FA = lazy(() => import('./pages/securite/Securite2FA'));
const GestionSignatairesElectroniques = lazy(() => import('./pages/admin/GestionSignatairesElectroniques'));
const ParametresUniversite = lazy(() => import('./pages/admin/ParametresUniversite'));
const ParametresPaiement = lazy(() => import('./pages/admin/ParametresPaiement'));
const MesDemandesSignature = lazy(() => import('./pages/securite/MesDemandesSignature'));
const SignatureBanner = lazy(() => import('./components/SignatureBanner'));
const RapportsUniversite = lazy(() => import('./pages/admin/RapportsUniversite'));
const ModuleCommunication = lazy(() => import('./pages/admin/modules/ModuleCommunication'));
const ModuleInfrastructure = lazy(() => import('./pages/admin/modules/ModuleInfrastructure'));
const ModulePatrimoine = lazy(() => import('./pages/admin/modules/ModulePatrimoine'));
const ModuleRecherche = lazy(() => import('./pages/admin/modules/ModuleRecherche'));
const GestionAttestations = lazy(() => import('./pages/admin/GestionAttestations'));
const CalendrierGestion = lazy(() => import('./pages/admin/CalendrierGestion'));
const GestionCartesAdmin = lazy(() => import('./pages/admin/GestionCartesAdmin'));
const AlertesDashboard = lazy(() => import('./pages/admin/AlertesDashboard'));
const EcheancierGestion = lazy(() => import('./pages/admin/EcheancierGestion'));
const GestionSocialeAdmin = lazy(() => import('./pages/admin/GestionSocialeAdmin'));
const GestionBibliothequeAdmin = lazy(() => import('./pages/admin/GestionBibliothequeAdmin'));
const PalmaresAdmin = lazy(() => import('./pages/admin/PalmaresAdmin'));

// ─── PROFESSEUR ────────────────────────────────────────────────────────
const ProfesseurDashboard = lazy(() => import('./pages/professeur/ProfesseurDashboard'));
const MesCoursProf = lazy(() => import('./pages/professeur/cours/MesCours'));
const SupportsCours = lazy(() => import('./pages/professeur/cours/SupportsCours'));
const PlanningCours = lazy(() => import('./pages/professeur/cours/PlanningCours'));
const EtudiantsCours = lazy(() => import('./pages/professeur/cours/EtudiantsCours'));
const MesEtudiants = lazy(() => import('./pages/professeur/etudiants/MesEtudiants'));
const SaisiePresences = lazy(() => import('./pages/professeur/presences/SaisiePresences'));
const HistoriquePresences = lazy(() => import('./pages/professeur/presences/HistoriquePresences'));
const StatistiquesPresences = lazy(() => import('./pages/professeur/presences/StatistiquesPresences'));
const SaisieNotes = lazy(() => import('./pages/professeur/SaisieNotes'));
const ImportNotes = lazy(() => import('./pages/professeur/ImportNotes'));
const ExportNotes = lazy(() => import('./pages/professeur/ExportNotes'));
const GenererQR = lazy(() => import('./pages/professeur/GenererQR'));
const TableauPresences = lazy(() => import('./pages/professeur/TableauPresences'));
const Interrogations = lazy(() => import('./pages/professeur/evaluations/Interrogations'));
const TpD = lazy(() => import('./pages/professeur/evaluations/TpD'));
const Examens = lazy(() => import('./pages/professeur/evaluations/Examens'));
const Baremes = lazy(() => import('./pages/professeur/evaluations/Baremes'));
const CalculsNotes = lazy(() => import('./pages/professeur/notes/CalculsNotes'));
const HistoriqueNotes = lazy(() => import('./pages/professeur/notes/HistoriqueNotes'));
const DeliberationProf = lazy(() => import('./pages/professeur/deliberation/Deliberation'));
const Encadrements = lazy(() => import('./pages/professeur/tfc/Encadrements'));
const Sujets = lazy(() => import('./pages/professeur/tfc/Sujets'));
const SuiviMemoire = lazy(() => import('./pages/professeur/tfc/SuiviMemoire'));
const ValidationStages = lazy(() => import('./pages/professeur/stages/ValidationStages'));
const SuiviStages = lazy(() => import('./pages/professeur/stages/SuiviStages'));
const RapportsStages = lazy(() => import('./pages/professeur/stages/RapportsStages'));
const Messagerie = lazy(() => import('./pages/professeur/messagerie/Messagerie'));
const Notifications = lazy(() => import('./pages/professeur/notifications/Notifications'));
const BibliothequeProf = lazy(() => import('./pages/professeur/bibliotheque/Bibliotheque'));
const PublicationsProf = lazy(() => import('./pages/professeur/recherche/Publications'));
const ProjetsProf = lazy(() => import('./pages/professeur/recherche/Projets'));
const ConferencesProf = lazy(() => import('./pages/professeur/recherche/Conferences'));
const LaboratoiresProf = lazy(() => import('./pages/professeur/recherche/Laboratoires'));
const CalendrierAcademique = lazy(() => import('./pages/professeur/calendrier/CalendrierAcademique'));
const TauxReussite = lazy(() => import('./pages/professeur/rapports/TauxReussite'));
const PresencesPromotion = lazy(() => import('./pages/professeur/rapports/PresencesPromotion'));
const RepartitionNotes = lazy(() => import('./pages/professeur/rapports/RepartitionNotes'));
const Contrats = lazy(() => import('./pages/professeur/documents/Contrats'));
const Arretes = lazy(() => import('./pages/professeur/documents/Arretes'));
const AttestationsProf = lazy(() => import('./pages/professeur/documents/Attestations'));
const ParametresProf = lazy(() => import('./pages/professeur/parametres/Parametres'));
const ContenuCours = lazy(() => import('./pages/professeur/lms/ContenuCours'));
const StatistiquesApprentissage = lazy(() => import('./pages/professeur/lms/StatistiquesApprentissage'));
const MonEvaluation = lazy(() => import('./pages/professeur/MonEvaluation'));
const EvaluationsEnseignantsAdmin = lazy(() => import('./pages/admin/rh/EvaluationsEnseignants'));

// ─── ÉTUDIANT ──────────────────────────────────────────────────
const EtudiantDashboard = lazy(() => import('./pages/etudiant/EtudiantDashboard'));
const MonProfil = lazy(() => import('./pages/etudiant/profil/MonProfil'));
const DocumentsPersonnels = lazy(() => import('./pages/etudiant/profil/DocumentsPersonnels'));
const Reinscription = lazy(() => import('./pages/etudiant/reinscription/Reinscription'));
const FraisAcademiques = lazy(() => import('./pages/etudiant/frais/FraisAcademiques'));
const HistoriquePaiements = lazy(() => import('./pages/etudiant/frais/HistoriquePaiements'));
const MesCoursEtudiant = lazy(() => import('./pages/etudiant/cours/MesCours'));
const DetailCours = lazy(() => import('./pages/etudiant/cours/DetailCours'));
const Horaire = lazy(() => import('./pages/etudiant/horaire/Horaire'));
const Presences = lazy(() => import('./pages/etudiant/presences/Presences'));
const Evaluations = lazy(() => import('./pages/etudiant/evaluations/Evaluations'));
const Resultats = lazy(() => import('./pages/etudiant/resultats/Resultats'));
const DeliberationEtudiant = lazy(() => import('./pages/etudiant/resultats/Deliberation'));
const Bulletins = lazy(() => import('./pages/etudiant/bulletins/Bulletins'));
const ParcoursAcademique = lazy(() => import('./pages/etudiant/parcours/ParcoursAcademique'));
const TravauxDevoirs = lazy(() => import('./pages/etudiant/travaux/TravauxDevoirs'));
const TfcMemoire = lazy(() => import('./pages/etudiant/tfc/TfcMemoire'));
const Stages = lazy(() => import('./pages/etudiant/stages/Stages'));
const BibliothequeEtudiant = lazy(() => import('./pages/etudiant/bibliotheque/BibliothequeEtudiant'));
const MessagerieEtudiant = lazy(() => import('./pages/etudiant/messagerie/MessagerieEtudiant'));
const NotificationsEtudiant = lazy(() => import('./pages/etudiant/notifications/NotificationsEtudiant'));
const DocumentsOfficiels = lazy(() => import('./pages/etudiant/documents/DocumentsOfficiels'));
const VieUniversitaire = lazy(() => import('./pages/etudiant/vie-universitaire/VieUniversitaire'));
const ParametresEtudiant = lazy(() => import('./pages/etudiant/parametres/ParametresEtudiant'));
const RecoursAcademiques = lazy(() => import('./pages/etudiant/recours/RecoursAcademiques'));
const EquivalencesDiplomes = lazy(() => import('./pages/etudiant/equivalences/EquivalencesDiplomes'));
const ApprendreCours = lazy(() => import('./pages/etudiant/lms/ApprendreCours'));
const EvaluationEnseignants = lazy(() => import('./pages/etudiant/EvaluationEnseignants'));
const EmploiEtudiant = lazy(() => import('./pages/etudiant/Emploi'));
const AlumniDashboard = lazy(() => import('./pages/alumni/AlumniDashboard'));
const CarteEtudiant = lazy(() => import('./pages/etudiant/CarteEtudiant'));
const QuizList = lazy(() => import('./pages/etudiant/QuizList'));
const QuizAttempt = lazy(() => import('./pages/etudiant/QuizAttempt'));
const QuizResult = lazy(() => import('./pages/etudiant/QuizResult'));

// ─── FINANCES ──────────────────────────────────────────────────
const FinanceDashboard = lazy(() => import('./pages/finances/FinanceDashboard'));
const CategoriesFrais = lazy(() => import('./pages/finances/admin/CategoriesFrais'));
const GestionFrais = lazy(() => import('./pages/finances/admin/GestionFrais'));
const AffectationFrais = lazy(() => import('./pages/finances/admin/AffectationFrais'));
const HistoriqueFrais = lazy(() => import('./pages/finances/admin/HistoriqueFrais'));
const Encaissement = lazy(() => import('./pages/finances/caissier/Encaissement'));
const JournalCaisse = lazy(() => import('./pages/finances/caissier/JournalCaisse'));
const ClotureCaisse = lazy(() => import('./pages/finances/caissier/ClotureCaisse'));
const RapportsCaisse = lazy(() => import('./pages/finances/caissier/RapportsCaisse'));
const MesFrais = lazy(() => import('./pages/finances/etudiant/MesFrais'));
const HistoriquePaiementsEtudiant = lazy(() => import('./pages/finances/etudiant/HistoriquePaiements'));
const Recus = lazy(() => import('./pages/finances/etudiant/Recus'));
const EtatFinancier = lazy(() => import('./pages/finances/etudiant/EtatFinancier'));
const PlanPaiement = lazy(() => import('./pages/finances/etudiant/PlanPaiement'));
const Bourses = lazy(() => import('./pages/finances/etudiant/Bourses'));
const RapportDettes = lazy(() => import('./pages/finances/rapports/RapportDettes'));
const RapportRecouvrement = lazy(() => import('./pages/finances/rapports/RapportRecouvrement'));
const RapportFaculte = lazy(() => import('./pages/finances/rapports/RapportFaculte'));
const RapportEvolution = lazy(() => import('./pages/finances/rapports/RapportEvolution'));

// ─── AUTRES RÔLES ──────────────────────────────────────────────
const CaissierDashboard = lazy(() => import('./pages/caissier/CaissierDashboard'));
const ChefDashboard = lazy(() => import('./pages/chef/ChefDashboard'));
const AppariteurDashboard = lazy(() => import('./pages/appariteur/AppariteurDashboard'));
const DoyenDashboard = lazy(() => import('./pages/doyen/DoyenDashboard'));
const RecteurDashboard = lazy(() => import('./pages/recteur/RecteurDashboard'));
const SecretaireDashboard = lazy(() => import('./pages/secretaire/SecretaireDashboard'));
const GestionTestAdmission = lazy(() => import('./pages/secretaire/GestionTestAdmission'));
const RHDashboard = lazy(() => import('./pages/rh/RHDashboard'));
const GestionEmployes = lazy(() => import('./pages/rh/GestionEmployes'));
const GestionCongesRH = lazy(() => import('./pages/rh/GestionCongesRH'));
const GestionPaieRH = lazy(() => import('./pages/rh/GestionPaieRH'));
const ComptableDashboard = lazy(() => import('./pages/comptable/ComptableDashboard'));
const ComptableDashboardPremium = lazy(() => import('./pages/comptable/ComptableDashboardPremium'));
const GestionComptes = lazy(() => import('./pages/comptable/GestionComptes'));
const EcrituresComptables = lazy(() => import('./pages/comptable/EcrituresComptables'));
const GestionBudgets = lazy(() => import('./pages/comptable/GestionBudgets'));
const BalanceGenerale = lazy(() => import('./pages/comptable/BalanceGenerale'));
const RapportsFinanciers = lazy(() => import('./pages/comptable/RapportsFinanciers'));
const SocialDashboard = lazy(() => import('./pages/social/SocialDashboard'));
const BibliothecaireDashboard = lazy(() => import('./pages/bibliothecaire/BibliothecaireDashboard'));
const ChefPromotionDashboard = lazy(() => import('./pages/chef-promotion/ChefPromotionDashboard'));
const AuditLogs = lazy(() => import('./pages/administrateur-systeme/AuditLogs'));
const AdministrationSysteme = lazy(() => import('./pages/administrateur-systeme/AdministrationSysteme'));
const SystemSettings = lazy(() => import('./pages/administrateur-systeme/SystemSettings'));
const SecurityMonitor = lazy(() => import('./pages/securite/SecurityMonitor'));
const GestionVacationsSec = lazy(() => import('./pages/secretaire/GestionVacations'));

// ─── PAGES UTILITAIRES ──────────────────────────────────────
const Forbidden = lazy(() => import('./pages/Forbidden'));

// ─── EMPLOI UNIVERSITAIRE ──────────────────────────────────
const EmploiUniversitaire = lazy(() => import('./pages/EmploiUniversitaire'));
const MesJobsUniversitaires = lazy(() => import('./pages/etudiant/MesJobsUniversitaires'));
const GestionEmploiEtudiant = lazy(() => import('./pages/admin/rh/GestionEmploiEtudiant'));

// ─── NOUVELLES PAGES PUBLIQUES ──────────────────────────────
const Actualites = lazy(() => import('./pages/Actualites'));
const BibliothequePublique = lazy(() => import('./pages/BibliothequePublique'));
const Orientation = lazy(() => import('./pages/Orientation'));
const Contact = lazy(() => import('./pages/Contact'));

// ─── COMPONENTS UTILITAIRES ────────────────────────────────────
const AppLayout = ({ children }) => {
  Logger.info('AppLayout rendered');
  
  return (
    <div className="app-layout">
      <Navbar />
      <DesignSwitcher />
      {/* overflow-x est porté par le wrapper interne (pas par <main>) pour ne
          pas casser le position:sticky de la topbar de compte */}
      <main className="app-content">
        <PortalTopbar />
        <ModuleTabs />
        <ErrorBoundary>
          {/* Flux signature électronique : invitation à déposer sa signature
              + demandes en attente, visibles sur toutes les pages privées */}
          <Suspense fallback={null}>
            <SignatureBanner />
          </Suspense>
          <div style={{ overflowX: 'hidden' }}>{children}</div>
        </ErrorBoundary>
      </main>
    </div>
  );
};

const PrivatePage = ({ children, roles }) => {
  return (
    <PrivateRoute roles={roles} fallback={<LoadingSpinner fullscreen variant="spinner" />}>
      <AppLayout>{children}</AppLayout>
    </PrivateRoute>
  );
};

// URL interne inexistante : un utilisateur connecte rebondit vers SON
// dashboard (jamais vers la vitrine publique — le portail ne se ferme pas) ;
// un visiteur non connecte retourne a l'accueil public.
const CatchAllRedirect = () => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <LoadingSpinner fullscreen variant="spinner" message="Redirection..." />;
  }
  return <Navigate to={user ? '/accueil' : '/'} replace />;
};

const RoleRedirect = () => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner fullscreen variant="spinner" message="Redirection..." />;
  }
  
  if (!user) {
    Logger.warn('RoleRedirect: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  const rolePaths = {
    ETUDIANT: '/etudiant/dashboard',
    SUPER_ADMIN: '/super-admin/dashboard',
    ADMIN_UNIVERSITE: '/admin/dashboard',
    PROFESSEUR: '/professeur/dashboard',
    CAISSIER: '/caissier/dashboard',
    CHEF_DEPARTEMENT: '/chef/dashboard',
    RECTEUR: '/recteur/dashboard',
    DOYEN: '/doyen/dashboard',
    SECRETAIRE_ACADEMIQUE: '/secretaire/dashboard',
    APPARITEUR: '/appariteur/dashboard',
    RH: '/rh/dashboard',
    COMPTABLE: '/comptable/dashboard',
    SERVICE_SOCIAL: '/social/dashboard',
    BIBLIOTHECAIRE: '/bibliothecaire/dashboard',
    CHEF_PROMOTION: '/chef-promotion/dashboard',
  };
  
  const redirectPath = rolePaths[user.role] || '/dashboard';
  Logger.info(`RoleRedirect: User ${user.role} redirected to ${redirectPath}`);
  
  return <Navigate to={redirectPath} replace />;
};

const ProfesseurPrivateRoute = ({ children }) => {
  return (
    <PrivateRoute roles={['PROFESSEUR']} fallback={<LoadingSpinner fullscreen />}>
      <ProfesseurLayout>{children}</ProfesseurLayout>
    </PrivateRoute>
  );
};

const EtudiantPrivateRoute = ({ children }) => {
  return (
    <PrivateRoute roles={['ETUDIANT']} fallback={<LoadingSpinner fullscreen />}>
      <EtudiantLayout>{children}</EtudiantLayout>
    </PrivateRoute>
  );
};

const FinancePrivateRoute = ({ children }) => {
  return (
    <PrivateRoute 
      roles={['ADMIN_UNIVERSITE', 'COMPTABLE', 'CAISSIER', 'ETUDIANT', 'RECTEUR', 'SUPER_ADMIN']}
      fallback={<LoadingSpinner fullscreen />}
    >
      <FinanceLayout>{children}</FinanceLayout>
    </PrivateRoute>
  );
};

// ─── COMPOSANT PRINCIPAL ────────────────────────────────────
export default function App() {
  Logger.info('App initialized', {
    version: '1.0.0',
    apiUrl: process.env.REACT_APP_API_BASE_URL,
    env: process.env.NODE_ENV,
  });

  return (
    <BrowserRouter>
      <AuthProvider>
        <I18nProvider>
        <ThemeProvider>
          <ErrorBoundary>
            {/* 🔔 Toaster pour notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  padding: '16px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                },
                success: {
                  style: { background: '#1d9e75' },
                  iconTheme: { primary: '#fff', secondary: '#1d9e75' },
                },
                error: {
                  style: { background: '#cc0000' },
                  iconTheme: { primary: '#fff', secondary: '#cc0000' },
                },
              }}
            />

            <ChatbotWidget headless />
            <CommandPalette />
          <Suspense fallback={<LoadingSpinner fullscreen variant="spinner" />}>
            <Routes>
              {/* ─── PAGES PUBLIQUES ─── */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />
              {/* Mon compte : commun a tous les roles connectes (photos d'identite) */}
              <Route path="/mon-compte" element={
                <PrivatePage><MonCompte /></PrivatePage>
              } />
              <Route path="/inscriptions" element={<Inscriptions />} />
              <Route path="/inscriptions-universites" element={<InscriptionsUniversites />} />
              <Route path="/universites-publiques" element={<UniversitesPubliques />} />
              <Route path="/cours-publics" element={<CoursPublics />} />
              <Route path="/infos" element={<Infos />} />
              <Route path="/activer-compte" element={<ActivationCompte />} />
              <Route path="/verifier" element={<VerifierDiplome />} />
              <Route path="/verifier-attestation" element={<VerifierAttestation />} />
              <Route path="/verifier-attestation/:uuid" element={<VerifierAttestation />} />
              <Route path="/verifier-lettre/:uuid" element={<VerifierLettreAcceptation />} />
              <Route path="/verifier-admission" element={<VerifierAdmission />} />
              <Route path="/palmares-public" element={<PalmaresPublic />} />
              <Route path="/suivi-dossier" element={<SuiviDossier />} />
              <Route path="/paiement-inscription" element={<PaiementInscription />} />
              <Route path="/accueil" element={<RoleRedirect />} />
              
              {/* ✅ AJOUT TACHPAY : Route publique vers la page de paiement */}
              <Route path="/paiement-tachpay" element={<TachPayPage />} />
              {/* Alias hérité (ancien nom TachFee) : liens/QR déjà émis par email */}
              <Route path="/paiement-tachfee" element={<TachPayPage />} />
              {/* Retour après paiement carte (redirection Stripe Checkout) */}
              <Route path="/paiement/succes" element={<PaiementRetour statut="succes" />} />
              <Route path="/paiement/annule" element={<PaiementRetour statut="annule" />} />

              {/* ─── SUPER_ADMIN ─── */}
              <Route path="/super-admin/dashboard" element={
                <PrivatePage roles={['SUPER_ADMIN']}><SuperAdminDashboard /></PrivatePage>
              } />
              <Route path="/superadmin/enregistrement-universite" element={
                <PrivatePage roles={['SUPER_ADMIN']}><EnregistrementUniversite /></PrivatePage>
              } />
              <Route path="/super-admin/admins-universites" element={
                <PrivatePage roles={['SUPER_ADMIN']}><GestionAdminsUniversite /></PrivatePage>
              } />
               <Route path="/admin-systeme" element={
                 <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_SYSTEME']}><AdministrateurSystemeDashboard /></PrivatePage>
               } />
               <Route path="/admin-systeme/utilisateurs" element={
                 <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_SYSTEME']}><GestionUtilisateursUniversite /></PrivatePage>
               } />
               <Route path="/admin-systeme/audit" element={
                 <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_SYSTEME']}><AuditLogs /></PrivatePage>
               } />
               <Route path="/admin-systeme/sauvegardes" element={
                 <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_SYSTEME']}><AdministrationSysteme /></PrivatePage>
               } />
               <Route path="/admin-systeme/parametres" element={
                 <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_SYSTEME']}><SystemSettings /></PrivatePage>
               } />

              {/* ─── ADMIN_UNIVERSITE ─── */}
              <Route path="/admin/dashboard" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE']}><AdminUniversiteDashboard /></PrivatePage>
              } />
              <Route path="/admin/annees-academiques" element={
                <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_UNIVERSITE']}><AnneeAcademiqueGestion /></PrivatePage>
              } />
              <Route path="/admin/vacations" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN']}><GestionVacations /></PrivatePage>
              } />
              <Route path="/admin/equivalences-diplomes" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'DOYEN', 'SECRETAIRE_ACADEMIQUE']}><GestionEquivalencesDiplomes /></PrivatePage>
              } />
              <Route path="/securite/2fa" element={
                 <PrivatePage><Securite2FA /></PrivatePage>
               } />
               <Route path="/securite/surveillance" element={
                 <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_SYSTEME', 'RECTEUR', 'DOYEN']}><SecurityMonitor /></PrivatePage>
               } />
              <Route path="/admin/signataires" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'DOYEN', 'SECRETAIRE_ACADEMIQUE']}><GestionSignatairesElectroniques /></PrivatePage>
              } />
              <Route path="/admin/promotions/filiere/:filiereId" element={
                <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_UNIVERSITE']}><PromotionGestion /></PrivatePage>
              } />
              <Route path="/admin/universite/:id" element={
                <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_UNIVERSITE']}><UniversiteDetail /></PrivatePage>
              } />
              <Route path="/admin/departement/:departementId/filieres" element={
                <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_UNIVERSITE', 'CHEF_DEPARTEMENT']}><FilieresGestion /></PrivatePage>
              } />
              <Route path="/admin/deliberations" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN']}><DeliberationWorkflow /></PrivatePage>
              } />
              <Route path="/admin/tachpay/frais" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN']}><GestionFraisTachPay /></PrivatePage>
              } />
              <Route path="/admin/bons-paiement" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'CAISSIER', 'COMPTABLE']}><GestionBonsDePaiement /></PrivatePage>
              } />
              <Route path="/admin/comptes-bancaires" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN']}><GestionComptesBancaires /></PrivatePage>
              } />
              <Route path="/admin/generer-palmares" element={
                <PrivatePage roles={['SUPER_ADMIN']}><GenererPalmares /></PrivatePage>
              } />
              <Route path="/admin/dossiers" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE']}><AdminDossiers /></PrivatePage>
              } />
              <Route path="/admin/utilisateurs" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE']}><GestionUtilisateursUniversite /></PrivatePage>
              } />
              <Route path="/admin/migration" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN']}><MigrationAssistee /></PrivatePage>
              } />
              <Route path="/admin/attestations" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SECRETAIRE_ACADEMIQUE']}><GestionAttestations /></PrivatePage>
              } />
              <Route path="/admin/calendrier" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN']}><CalendrierGestion /></PrivatePage>
              } />
              <Route path="/admin/cartes-etudiant" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN']}><GestionCartesAdmin /></PrivatePage>
              } />
              <Route path="/admin/alertes" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN']}><AlertesDashboard /></PrivatePage>
              } />
              <Route path="/admin/echeanciers" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'COMPTABLE']}><EcheancierGestion /></PrivatePage>
              } />
              <Route path="/admin/social" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SERVICE_SOCIAL']}><GestionSocialeAdmin /></PrivatePage>
              } />
              <Route path="/admin/bibliotheque" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'BIBLIOTHECAIRE']}><GestionBibliothequeAdmin /></PrivatePage>
              } />
              <Route path="/admin/palmares/config" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN']}><PalmaresAdmin /></PrivatePage>
              } />
              <Route path="/admin/palmares/validation" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN']}><PalmaresAdmin /></PrivatePage>
              } />

              {/* ─── MODULE DÉLIBÉRATION ─── */}
              <Route path="/admin/deliberation/annuelle" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN']}>
                  <DeliberationAnnuelle />
                </PrivatePage>
              } />
              <Route path="/admin/deliberation/recours" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'CHEF_DEPARTEMENT', 'DOYEN']}>
                  <GestionRecours />
                </PrivatePage>
              } />
              <Route path="/admin/deliberation/jury" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'CHEF_DEPARTEMENT', 'DOYEN', 'RECTEUR']}>
                  <SalleJury />
                </PrivatePage>
              } />
              <Route path="/admin/deliberation/pv" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'DOYEN', 'RECTEUR']}>
                  <ProcesVerbaux />
                </PrivatePage>
              } />
              <Route path="/admin/deliberation/audit" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN']}>
                  <HistoriqueAudit />
                </PrivatePage>
              } />
              <Route path="/admin/deliberation/statistiques" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'DOYEN', 'RECTEUR']}>
                  <StatistiquesDeliberation />
                </PrivatePage>
              } />
              <Route path="/admin/deliberation/consolidation" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN']}>
                  <Consolidation />
                </PrivatePage>
              } />
              <Route path="/admin/deliberation/pre-deliberation" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'CHEF_DEPARTEMENT']}>
                  <PreDeliberation />
                </PrivatePage>
              } />
              <Route path="/admin/deliberation/semestre/:semestreId" element={
                <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_UNIVERSITE', 'CHEF_DEPARTEMENT', 'DOYEN']}>
                  <DeliberationSemestre />
                </PrivatePage>
              } />
              <Route path="/admin/parametres-lmd" element={
                <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_UNIVERSITE']}>
                  <ParametresLMD />
                </PrivatePage>
              } />
              <Route path="/admin/parametres" element={
                <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_UNIVERSITE']}>
                  <ParametresUniversite />
                </PrivatePage>
              } />
              <Route path="/admin/messagerie" element={
                <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_UNIVERSITE']}>
                  <Messagerie />
                </PrivatePage>
              } />
              <Route path="/admin/parametres-paiement" element={
                <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_UNIVERSITE']}>
                  <ParametresPaiement />
                </PrivatePage>
              } />
              <Route path="/signature/demandes" element={
                <PrivatePage><MesDemandesSignature /></PrivatePage>
              } />
              <Route path="/admin/rapports" element={
                <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_UNIVERSITE', 'RECTEUR', 'COMPTABLE', 'RH']}>
                  <RapportsUniversite />
                </PrivatePage>
              } />
              <Route path="/admin/modules/communication" element={
                <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE']}>
                  <ModuleCommunication />
                </PrivatePage>
              } />
              <Route path="/admin/modules/infrastructure" element={
                <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_UNIVERSITE']}>
                  <ModuleInfrastructure />
                </PrivatePage>
              } />
              <Route path="/admin/modules/patrimoine" element={
                <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_UNIVERSITE']}>
                  <ModulePatrimoine />
                </PrivatePage>
              } />
              <Route path="/admin/modules/recherche" element={
                <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_UNIVERSITE']}>
                  <ModuleRecherche />
                </PrivatePage>
              } />

              {/* ─── ADMIN GÉNÉRIQUES ─── */}
              <Route path="/dashboard" element={
                <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_UNIVERSITE']}><Dashboard /></PrivatePage>
              } />
              <Route path="/universites" element={
                <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_UNIVERSITE']}><Universites /></PrivatePage>
              } />
              <Route path="/paiements" element={
                <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_UNIVERSITE']}><Paiements /></PrivatePage>
              } />
              <Route path="/cours" element={
                <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_UNIVERSITE']}><Cours /></PrivatePage>
              } />
              <Route path="/notes" element={
                <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_UNIVERSITE']}><Notes /></PrivatePage>
              } />
              <Route path="/diplomes" element={
                <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_UNIVERSITE']}><Diplomes /></PrivatePage>
              } />
              <Route path="/utilisateurs" element={
                <PrivatePage roles={['SUPER_ADMIN', 'ADMIN_UNIVERSITE']}><Utilisateurs /></PrivatePage>
              } />

              {/* ─── FINANCES ─── */}
              <Route path="/finances" element={<FinancePrivateRoute><FinanceLayout /></FinancePrivateRoute>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<FinanceDashboard />} />
                <Route path="admin/categories" element={<CategoriesFrais />} />
                <Route path="admin/frais" element={<GestionFrais />} />
                <Route path="admin/affectations" element={<AffectationFrais />} />
                <Route path="admin/historique" element={<HistoriqueFrais />} />
                <Route path="caissier/encaissement" element={<Encaissement />} />
                <Route path="caissier/journal" element={<JournalCaisse />} />
                <Route path="caissier/cloture" element={<ClotureCaisse />} />
                <Route path="caissier/rapports" element={<RapportsCaisse />} />
                <Route path="etudiant/mes-frais" element={<MesFrais />} />
                <Route path="etudiant/historique" element={<HistoriquePaiementsEtudiant />} />
                <Route path="etudiant/recus" element={<Recus />} />
                <Route path="etudiant/etat-financier" element={<EtatFinancier />} />
                <Route path="etudiant/plan-paiement" element={<PlanPaiement />} />
                <Route path="etudiant/bourses" element={<Bourses />} />
                <Route path="rapports/dettes" element={<RapportDettes />} />
                <Route path="rapports/recouvrement" element={<RapportRecouvrement />} />
                <Route path="rapports/faculte" element={<RapportFaculte />} />
                <Route path="rapports/evolution" element={<RapportEvolution />} />
              </Route>

              {/* ─── ÉTUDIANT ─── */}
              <Route path="/etudiant/recours" element={
                <EtudiantPrivateRoute><RecoursAcademiques /></EtudiantPrivateRoute>
              } />
              <Route path="/etudiant/equivalences-diplomes" element={
                <EtudiantPrivateRoute><EquivalencesDiplomes /></EtudiantPrivateRoute>
              } />
              <Route path="/etudiant" element={<EtudiantPrivateRoute><EtudiantLayout /></EtudiantPrivateRoute>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<EtudiantDashboard />} />
                <Route path="profil" element={<MonProfil />} />
                <Route path="profil/documents" element={<DocumentsPersonnels />} />
                <Route path="reinscription" element={<Reinscription />} />
                <Route path="frais" element={<FraisAcademiques />} />
                <Route path="frais/historique" element={<HistoriquePaiements />} />
                <Route path="mes-cours" element={<MesCoursEtudiant />} />
                <Route path="cours/:coursId" element={<DetailCours />} />
                <Route path="horaire" element={<Horaire />} />
                <Route path="presences" element={<Presences />} />
                <Route path="evaluations" element={<Evaluations />} />
                <Route path="resultats" element={<Resultats />} />
                <Route path="deliberation" element={<DeliberationEtudiant />} />
                <Route path="bulletins" element={<Bulletins />} />
                <Route path="parcours" element={<ParcoursAcademique />} />
                <Route path="travaux" element={<TravauxDevoirs />} />
                <Route path="tfc" element={<TfcMemoire />} />
                <Route path="stages" element={<Stages />} />
                <Route path="bibliotheque" element={<BibliothequeEtudiant />} />
                <Route path="messagerie" element={<MessagerieEtudiant />} />
                <Route path="notifications" element={<NotificationsEtudiant />} />
                <Route path="documents" element={<DocumentsOfficiels />} />
                <Route path="vie-universitaire" element={<VieUniversitaire />} />
                <Route path="parametres" element={<ParametresEtudiant />} />
                {/* ── Nouvelles fonctionnalités ── */}
                <Route path="cours/:id/apprendre" element={<ApprendreCours />} />
                <Route path="evaluations/enseignants" element={<EvaluationEnseignants />} />
                <Route path="emploi" element={<EmploiEtudiant />} />
                <Route path="mes-jobs-universitaires" element={<MesJobsUniversitaires />} />
                {/* ── Carte étudiante et Quiz (existaient mais n'étaient pas routés) ── */}
                <Route path="carte" element={<CarteEtudiant />} />
                <Route path="quiz/cours/:coursId" element={<QuizList />} />
                <Route path="quiz/:quizId" element={<QuizAttempt />} />
                <Route path="quiz/:quizId/resultats" element={<QuizResult />} />
              </Route>

              {/* Alumni */}
              <Route path="/alumni/dashboard" element={
                <PrivateRoute roles={['ETUDIANT', 'ALUMNI']} fallback={<LoadingSpinner fullscreen />}>
                  <AlumniDashboard />
                </PrivateRoute>
              } />

              {/* Redirections compatibilité étudiant */}
              <Route path="/etudiant/mes-notes" element={<Navigate to="/etudiant/resultats" replace />} />
              <Route path="/etudiant/mes-paiements" element={<Navigate to="/etudiant/frais" replace />} />
              <Route path="/etudiant/messagerie" element={<Navigate to="/etudiant/messagerie" replace />} />
              <Route path="/etudiant/mon-profil" element={<Navigate to="/etudiant/profil" replace />} />
              <Route path="/etudiant/mes-resultats" element={<Navigate to="/etudiant/resultats" replace />} />
              <Route path="/etudiant/bibliotheque" element={<Navigate to="/etudiant/bibliotheque" replace />} />
              <Route path="/etudiant/mes-emprunts" element={<Navigate to="/etudiant/bibliotheque" replace />} />

              {/* ─── PROFESSEUR ─── */}
              <Route path="/professeur" element={<ProfesseurPrivateRoute><ProfesseurLayout /></ProfesseurPrivateRoute>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<ProfesseurDashboard />} />
                <Route path="mes-cours" element={<MesCoursProf />} />
                <Route path="mes-cours/supports" element={<SupportsCours />} />
                <Route path="mes-cours/planning" element={<PlanningCours />} />
                <Route path="mes-cours/etudiants" element={<EtudiantsCours />} />
                <Route path="mes-etudiants" element={<MesEtudiants />} />
                <Route path="presences/saisie" element={<SaisiePresences />} />
                <Route path="presences/historique" element={<HistoriquePresences />} />
                <Route path="presences/statistiques" element={<StatistiquesPresences />} />
                <Route path="presences/qrcode" element={<GenererQR />} />
                <Route path="presences/cours/:coursId" element={<TableauPresences />} />
                <Route path="notes/saisie" element={<SaisieNotes />} />
                <Route path="notes/import" element={<ImportNotes />} />
                <Route path="notes/export" element={<ExportNotes />} />
                <Route path="notes/calculs" element={<CalculsNotes />} />
                <Route path="notes/historique" element={<HistoriqueNotes />} />
                <Route path="evaluations/interrogations" element={<Interrogations />} />
                <Route path="evaluations/tp-td" element={<TpD />} />
                <Route path="evaluations/examens" element={<Examens />} />
                <Route path="evaluations/baremes" element={<Baremes />} />
                <Route path="deliberation" element={<DeliberationProf />} />
                <Route path="tfc/encadrements" element={<Encadrements />} />
                <Route path="tfc/sujets" element={<Sujets />} />
                <Route path="tfc/suivi" element={<SuiviMemoire />} />
                <Route path="stages/validation" element={<ValidationStages />} />
                <Route path="stages/suivi" element={<SuiviStages />} />
                <Route path="stages/rapports" element={<RapportsStages />} />
                <Route path="messagerie" element={<Messagerie />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="bibliotheque" element={<BibliothequeProf />} />
                <Route path="recherche/publications" element={<PublicationsProf />} />
                <Route path="recherche/projets" element={<ProjetsProf />} />
                <Route path="recherche/conferences" element={<ConferencesProf />} />
                <Route path="recherche/laboratoires" element={<LaboratoiresProf />} />
                <Route path="calendrier" element={<CalendrierAcademique />} />
                <Route path="rapports/reussite" element={<TauxReussite />} />
                <Route path="rapports/presences" element={<PresencesPromotion />} />
                <Route path="rapports/notes" element={<RepartitionNotes />} />
                <Route path="documents/contrats" element={<Contrats />} />
                <Route path="documents/arretes" element={<Arretes />} />
                <Route path="documents/attestations" element={<AttestationsProf />} />
                <Route path="parametres" element={<ParametresProf />} />
                {/* ── LMS ── */}
                <Route path="cours/:id/contenu" element={<ContenuCours />} />
                <Route path="cours/:id/statistiques-apprentissage" element={<StatistiquesApprentissage />} />
                {/* ── Évaluation ── */}
                <Route path="mon-evaluation" element={<MonEvaluation />} />
              </Route>

              {/* Redirections compatibilité professeur */}
              <Route path="/professeur/saisie-notes" element={<Navigate to="/professeur/notes/saisie" replace />} />
              <Route path="/professeur/generer-qr" element={<Navigate to="/professeur/presences/qrcode" replace />} />
              <Route path="/professeur/import-notes" element={<Navigate to="/professeur/notes/import" replace />} />
              <Route path="/professeur/export-notes" element={<Navigate to="/professeur/notes/export" replace />} />

               {/* ─── CHEF DÉPARTEMENT ─── */}
               <Route path="/chef/controle-academique" element={
                 <PrivatePage roles={['CHEF_DEPARTEMENT']}><ControleAcademique /></PrivatePage>
               } />
               <Route path="/chef/dashboard" element={
                 <PrivatePage roles={['CHEF_DEPARTEMENT']}><ChefDashboard /></PrivatePage>
               } />
               <Route path="/chef/enseignants" element={
                 <PrivatePage roles={['CHEF_DEPARTEMENT']}><ChefEnseignants /></PrivatePage>
               } />
               <Route path="/chef/cours" element={
                 <PrivatePage roles={['CHEF_DEPARTEMENT']}><ChefCours /></PrivatePage>
               } />
               <Route path="/chef/notes" element={
                 <PrivatePage roles={['CHEF_DEPARTEMENT']}><ChefNotes /></PrivatePage>
               } />
               <Route path="/chef/deliberations" element={
                 <PrivatePage roles={['CHEF_DEPARTEMENT']}><ChefDeliberations /></PrivatePage>
               } />
               <Route path="/chef/messagerie" element={
                 <PrivatePage roles={['CHEF_DEPARTEMENT']}><ChefMessagerie /></PrivatePage>
               } />
               <Route path="/chef/presences" element={
                 <PrivatePage roles={['CHEF_DEPARTEMENT']}><ChefPresences /></PrivatePage>
               } />
               <Route path="/chef/statistiques" element={
                 <PrivatePage roles={['CHEF_DEPARTEMENT']}><ChefStatistiques /></PrivatePage>
               } />
               <Route path="/chef-promotion/dashboard" element={
                 <PrivatePage roles={['CHEF_PROMOTION']}><ChefPromotionDashboard /></PrivatePage>
               } />

              {/* ─── AUTRES RÔLES ─── */}
              <Route path="/caissier/dashboard" element={
                <PrivatePage roles={['CAISSIER']}><CaissierDashboard /></PrivatePage>
              } />
              <Route path="/comptable/validation-paie" element={
                <PrivatePage roles={['COMPTABLE']}><ValidationPaieComptable /></PrivatePage>
              } />
              <Route path="/comptable/dashboard" element={
                <PrivatePage roles={['COMPTABLE']}><ComptableDashboard /></PrivatePage>
              } />
              <Route path="/comptable/premium-dashboard" element={
                <PrivatePage roles={['COMPTABLE']}><ComptableDashboardPremium /></PrivatePage>
              } />
              <Route path="/comptable/comptes" element={
                <PrivatePage roles={['COMPTABLE', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN']}><GestionComptes /></PrivatePage>
              } />
              <Route path="/comptable/ecritures" element={
                <PrivatePage roles={['COMPTABLE', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN']}><EcrituresComptables /></PrivatePage>
              } />
              <Route path="/comptable/budgets" element={
                <PrivatePage roles={['COMPTABLE', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN']}><GestionBudgets /></PrivatePage>
              } />
              <Route path="/comptable/balance" element={
                <PrivatePage roles={['COMPTABLE', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN']}><BalanceGenerale /></PrivatePage>
              } />
              <Route path="/comptable/rapports" element={
                <PrivatePage roles={['COMPTABLE', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN']}><RapportsFinanciers /></PrivatePage>
              } />
              <Route path="/appariteur/dashboard" element={
                <PrivatePage roles={['APPARITEUR']}><AppariteurDashboard /></PrivatePage>
              } />
              <Route path="/doyen/dashboard" element={
                <PrivatePage roles={['DOYEN']}><DoyenDashboard /></PrivatePage>
              } />
              <Route path="/recteur/dashboard" element={
                <PrivatePage roles={['RECTEUR']}><RecteurDashboard /></PrivatePage>
              } />
              <Route path="/secretaire/dashboard" element={
                <PrivatePage roles={['SECRETAIRE_ACADEMIQUE']}><SecretaireDashboard /></PrivatePage>
              } />
              <Route path="/secretaire/test-admission" element={
                 <PrivatePage roles={['SECRETAIRE_ACADEMIQUE', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN']}><GestionTestAdmission /></PrivatePage>
               } />
               <Route path="/secretaire/vacations" element={
                 <PrivatePage roles={['SECRETAIRE_ACADEMIQUE', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN']}><GestionVacationsSec /></PrivatePage>
               } />
              <Route path="/rh/dashboard" element={
                <PrivatePage roles={['RH', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN']}><RHDashboard /></PrivatePage>
              } />
              <Route path="/rh/employes" element={
                <PrivatePage roles={['RH', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN']}><GestionEmployes /></PrivatePage>
              } />
              <Route path="/rh/conges" element={
                <PrivatePage roles={['RH', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN']}><GestionCongesRH /></PrivatePage>
              } />
              <Route path="/rh/paie" element={
                <PrivatePage roles={['RH', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN']}><GestionPaieRH /></PrivatePage>
              } />
              <Route path="/admin/rh/evaluations-enseignants" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'RH', 'RECTEUR']}><EvaluationsEnseignantsAdmin /></PrivatePage>
              } />
              <Route path="/bibliothecaire/dashboard" element={
                <PrivatePage roles={['BIBLIOTHECAIRE']}><BibliothecaireDashboard /></PrivatePage>
              } />
              <Route path="/social/dashboard" element={
                <PrivatePage roles={['SERVICE_SOCIAL']}><SocialDashboard /></PrivatePage>
              } />

              {/* ─── EMPLOI UNIVERSITAIRE ─── */}
              <Route path="/emploi-universitaire" element={<EmploiUniversitaire />} />
              <Route path="/admin/rh/gestion-emploi-etudiant" element={
                <PrivatePage roles={['ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'RH']}><GestionEmploiEtudiant /></PrivatePage>
              } />

              <Route path="/actualites" element={<Actualites />} />
              <Route path="/bibliotheque-publique" element={<BibliothequePublique />} />
              <Route path="/orientation" element={<Orientation />} />
              <Route path="/contact" element={<Contact />} />

              {/* ─── ERREURS ─── */}
              <Route path="/forbidden" element={<Forbidden />} />
              <Route path="*" element={<CatchAllRedirect />} />
            </Routes>
            </Suspense>
          </ErrorBoundary>
        </ThemeProvider>
        </I18nProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}