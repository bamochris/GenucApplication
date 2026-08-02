# 📚 GENUC - Architecture Complète

## 📦 Arborescence Frontend (React)

```
GENUC-FRONTEND-ME/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
│
├── src/
│   ├── api/
│   │   └── axios.js                  # ✅ Config axios + intercepteurs (refresh token, retry)
│   │
│   ├── components/
│   │   ├── ErrorBoundary.jsx         # ✅ Gestion globale erreurs React
│   │   ├── FormField.jsx             # ✅ Input component réutilisable
│   │   ├── FormField.css
│   │   ├── LoadingSpinner.jsx        # ✅ Loaders 3 variantes (spinner/dots/skeleton)
│   │   ├── LoadingSpinner.css
│   │   ├── PrivateRoute.jsx          # ✅ RBAC composant
│   │   ├── Navbar.jsx
│   │   └── ...
│   │
│   ├── context/
│   │   ├── AuthContext.jsx           # ✅ Auth + token validation + RBAC
│   │   ├── ThemeContext.jsx
│   │   └── ...
│   │
│   ├── hooks/
│   │   ├── useFormValidation.js      # ✅ Validation forms avec validateurs centralisés
│   │   ├── useLocalStorage.js        # ✅ localStorage sécurisé avec expiration
│   │   └── ...
│   │
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Login.jsx                 # À améliorer avec FormField + validation
│   │   ├── Inscriptions.jsx
│   │   ├── admin/
│   │   │   ├── AdminUniversiteDashboard.jsx
│   │   │   ├── UniversiteDetail.jsx
│   │   │   ├── FilieresGestion.jsx
│   │   │   ├── PromotionGestion.jsx
│   │   │   ├── AnneeAcademiqueGestion.jsx
│   │   │   ├── GenererPalmares.jsx
│   │   │   ├── DeliberationWorkflow.jsx
│   │   │   └── deliberation/           # Module délibération
│   │   │       ├── ParametresLMD.jsx
│   │   │       ├── DeliberationSemestre.jsx
│   │   │       ├── DeliberationAnnuelle.jsx
│   │   │       ├── SalleJury.jsx
│   │   │       ├── ProcesVerbaux.jsx
│   │   │       ├── HistoriqueAudit.jsx
│   │   │       ├── GestionRecours.jsx
│   │   │       ├── StatistiquesDeliberation.jsx
│   │   │       ├── Consolidation.jsx
│   │   │       └── PreDeliberation.jsx
│   │   ├── superadmin/
│   │   │   ├── SuperAdminDashboard.jsx
│   │   │   └── EnregistrementUniversite.jsx
│   │   ├── etudiant/
│   │   │   ├── EtudiantDashboard.jsx
│   │   │   ├── frais/
│   │   │   │   ├── FraisAcademiques.jsx
│   │   │   │   └── HistoriquePaiements.jsx
│   │   │   ├── cours/
│   │   │   │   ├── MesCours.jsx
│   │   │   │   └── DetailCours.jsx
│   │   │   ├── resultats/
│   │   │   │   ├── Resultats.jsx
│   │   │   │   └── Deliberation.jsx
│   │   │   ├── bulletins/
│   │   │   │   └── Bulletins.jsx
│   │   │   ├── stages/
│   │   │   │   └── Stages.jsx
│   │   │   ├── tfc/
│   │   │   │   └── TfcMemoire.jsx
│   │   │   ├── profil/
│   │   │   │   ├── MonProfil.jsx
│   │   │   │   └── DocumentsPersonnels.jsx
│   │   │   ├── presences/
│   │   │   │   └── Presences.jsx
│   │   │   ├── evaluations/
│   │   │   │   └── Evaluations.jsx
│   │   │   ├── travaux/
│   │   │   │   └── TravauxDevoirs.jsx
│   │   │   ├── bibliotheque/
│   │   │   │   └── BibliothequeEtudiant.jsx
│   │   │   ├── messagerie/
│   │   │   │   └── MessagerieEtudiant.jsx
│   │   │   ├── notifications/
│   │   │   │   └── NotificationsEtudiant.jsx
│   │   │   ├── vie-universitaire/
│   │   │   │   └── VieUniversitaire.jsx
│   │   │   ├── recours/
│   │   │   │   └── RecoursAcademiques.jsx
│   │   │   ├── parametres/
│   │   │   │   └── ParametresEtudiant.jsx
│   │   │   ├── horaire/
│   │   │   │   └── Horaire.jsx
│   │   │   ├── reinscription/
│   │   │   │   └── Reinscription.jsx
│   │   │   └── documents/
│   │   │       └── DocumentsOfficiels.jsx
│   │   ├── professeur/
│   │   │   ├── ProfesseurDashboard.jsx
│   │   │   ├── cours/
│   │   │   │   ├── MesCours.jsx
│   │   │   │   ├── SupportsCours.jsx
│   │   │   │   ├── PlanningCours.jsx
│   │   │   │   └── EtudiantsCours.jsx
│   │   │   ├── etudiants/
│   │   │   │   └── MesEtudiants.jsx
│   │   │   ├── presences/
│   │   │   │   ├── SaisiePresences.jsx
│   │   │   │   ├── HistoriquePresences.jsx
│   │   │   │   ├── StatistiquesPresences.jsx
│   │   │   │   └── TableauPresences.jsx
│   │   │   ├── notes/
│   │   │   │   ├── SaisieNotes.jsx
│   │   │   │   ├── ImportNotes.jsx
│   │   │   │   ├── ExportNotes.jsx
│   │   │   │   ├── CalculsNotes.jsx
│   │   │   │   └── HistoriqueNotes.jsx
│   │   │   ├── evaluations/
│   │   │   │   ├── Interrogations.jsx
│   │   │   │   ├── TpD.jsx
│   │   │   │   ├── Examens.jsx
│   │   │   │   └── Baremes.jsx
│   │   │   ├── deliberation/
│   │   │   │   └── Deliberation.jsx
│   │   │   ├── tfc/
│   │   │   │   ├── Encadrements.jsx
│   │   │   │   ├── Sujets.jsx
│   │   │   │   └── SuiviMemoire.jsx
│   │   │   ├── stages/
│   │   │   │   ├── ValidationStages.jsx
│   │   │   │   ├── SuiviStages.jsx
│   │   │   │   └── RapportsStages.jsx
│   │   │   ├── rapports/
│   │   │   │   ├── TauxReussite.jsx
│   │   │   │   ├── PresencesPromotion.jsx
│   │   │   │   └── RepartitionNotes.jsx
│   │   │   ├── messagerie/
│   │   │   │   └── Messagerie.jsx
│   │   │   ├── notifications/
│   │   │   │   └── Notifications.jsx
│   │   │   ├── bibliotheque/
│   │   │   │   └── Bibliotheque.jsx
│   │   │   ├── recherche/
│   │   │   │   ├── Publications.jsx
│   │   │   │   ├── Projets.jsx
│   │   │   │   ├── Conferences.jsx
│   │   │   │   └── Laboratoires.jsx
│   │   │   ├── calendrier/
│   │   │   │   └── CalendrierAcademique.jsx
│   │   │   ├── documents/
│   │   │   │   ├── Contrats.jsx
│   │   │   │   ├── Arretes.jsx
│   │   │   │   └── Attestations.jsx
│   │   │   ├── parametres/
│   │   │   │   └── Parametres.jsx
│   │   │   ├── GenererQR.jsx
│   │   │   └── ProfesseurDashboard.css
│   │   ├── finances/
│   │   │   ├── FinanceDashboard.jsx
│   │   │   ├── admin/
│   │   │   │   ├── CategoriesFrais.jsx
│   │   │   │   ├── GestionFrais.jsx
│   │   │   │   ├── AffectationFrais.jsx
│   │   │   │   └── HistoriqueFrais.jsx
│   │   │   ├── caissier/
│   │   │   │   ├── Encaissement.jsx
│   │   │   │   ├── JournalCaisse.jsx
│   │   │   │   ├── ClotureCaisse.jsx
│   │   │   │   └── RapportsCaisse.jsx
│   │   │   ├── etudiant/
│   │   │   │   ├── MesFrais.jsx
│   │   │   │   ├── HistoriquePaiements.jsx
│   │   │   │   ├── Recus.jsx
│   │   │   │   └── EtatFinancier.jsx
│   │   │   ├── rapports/
│   │   │   │   ├── RapportDettes.jsx
│   │   │   │   ├── RapportRecouvrement.jsx
│   │   │   │   ├── RapportFaculte.jsx
│   │   │   │   └── RapportEvolution.jsx
│   │   │   └── FinanceDashboard.css
│   │   ├── caissier/
│   │   │   └── CaissierDashboard.jsx
│   │   ├── chef/
│   │   │   ├── ChefDashboard.jsx
│   │   │   └── ControleAcademique.jsx
│   │   ├── doyen/
│   │   │   └── DoyenDashboard.jsx
│   │   ├── recteur/
│   │   │   └── RecteurDashboard.jsx
│   │   ├── secretaire/
│   │   │   └── SecretaireDashboard.jsx
│   │   ├── rh/
│   │   │   └── RHDashboard.jsx
│   │   ├── comptable/
│   │   │   ├── ComptableDashboard.jsx
│   │   │   └── ValidationPaieComptable.jsx
│   │   ├── social/
│   │   │   └── SocialDashboard.jsx
│   │   ├── bibliothecaire/
│   │   │   └── BibliothecaireDashboard.jsx
│   │   ├── appariteur/
│   │   │   └── AppariteurDashboard.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Universites.jsx
│   │   ├── Paiements.jsx
│   │   ├── Cours.jsx
│   │   ├── Notes.jsx
│   │   ├── Diplomes.jsx
│   │   ├── Utilisateurs.jsx
│   │   ├── AdminDossiers.jsx
│   │   ├── UniversitesPubliques.jsx
│   │   ├── CoursPublics.jsx
│   │   ├── Infos.jsx
│   │   ├── ActivationCompte.jsx
│   │   ├── VerifierDiplome.jsx
│   │   ├── VerifierAttestation.jsx
│   │   ├── PalmaresPublic.jsx
│   │   └── SuiviDossier.jsx
│   │
│   ├── layouts/
│   │   ├── EtudiantLayout.jsx        # Layout pour étudiant
│   │   ├── ProfesseurLayout.jsx      # Layout pour professeur
│   │   ├── FinanceLayout.jsx         # Layout pour finances
│   │   └── ...
│   │
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── coursService.js
│   │   ├── notesService.js
│   │   ├── presencesService.js
│   │   ├── paiementService.js
│   │   └── ...
│   │
│   ├── utils/
│   │   ├── validators.js             # ✅ Validateurs centralisés
│   │   ├── errorHandler.js           # ✅ Gestion erreurs conformes backend
│   │   ├── logger.js                 # ✅ Logging structuré
│   │   ├── apiInterceptors.js        # ✅ Retry logic, deduplication, rate limiting
│   │   ├── constants.js
│   │   ├── formatters.js
│   │   ├── helpers.js
│   │   └── ...
│   │
│   ├── config/
│   │   ├── api.config.js
│   │   ├── routes.js
│   │   └── ...
│   │
│   ├── styles/
│   │   ├── index.css
│   │   ├── variables.css
│   │   ├── globals.css
│   │   └── ...
│   │
│   ├── App.js                        # ✅ App principal amélioré
│   ├── index.js
│   └── index.css
│
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
├── README.md
└── public/
    └── ...
```

---

## 🔧 Arborescence Backend (Spring Boot Java)

```
GENUC-BACKEND/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/genuc/
│   │   │       ├── config/
│   │   │       │   ├── SecurityConfig.java        # ✅ Spring Security + JWT
│   │   │       │   ├── JwtTokenProvider.java      # ✅ JWT token generation/validation
│   │   │       │   ├── CorsConfig.java
│   │   │       │   ├── ObjectMapperConfig.java
│   │   │       │   └── WebMvcConfig.java
│   │   │       │
│   │   │       ├── exception/
│   │   │       │   ├── GlobalExceptionHandler.java # ✅ Exception handler global
│   │   │       │   ├── AppException.java
│   │   │       │   ├── ResourceNotFoundException.java
│   │   │       │   ├── BadRequestException.java
│   │   │       │   ├── UnauthorizedException.java
│   │   │       │   ├── ForbiddenException.java
│   │   │       │   └── ConflictException.java
│   │   │       │
│   │   │       ├── security/
│   │   │       │   ├── JwtAuthenticationFilter.java
│   │   │       │   ├── JwtAuthenticationEntryPoint.java
│   │   │       │   ├── JwtAccessDeniedHandler.java
│   │   │       │   ├── CustomUserDetailsService.java
│   │   │       │   └── SecurityContextUtils.java
│   │   │       │
│   │   │       ├── controller/
│   │   │       │   ├── auth/
│   │   │       │   │   ├── AuthController.java      # ✅ Login, Register, Refresh Token
│   │   │       │   │   └── AuthDto.java
│   │   │       │   │
│   │   │       │   ├── user/
│   │   │       │   │   ├── UserController.java
│   │   │       │   │   ├── UserDto.java
│   │   │       │   │   └── UserMapper.java
│   │   │       │   │
│   │   │       │   ├── universite/
│   │   │       │   │   ├── UniversiteController.java
│   │   │       │   │   ├── UniversiteDto.java
│   │   │       │   │   └── UniversiteMapper.java
│   │   │       │   │
│   │   │       │   ├── filiere/
│   │   │       │   │   ├── FiliereController.java
│   │   │       │   │   ├── FiliereDto.java
│   │   │       │   │   └── FiliereMapper.java
│   │   │       │   │
│   │   │       │   ├── promotion/
│   │   │       │   │   ├── PromotionController.java
│   │   │       │   │   ├── PromotionDto.java
│   │   │       │   │   └── PromotionMapper.java
│   │   │       │   │
│   │   │       │   ├── cours/
│   │   │       │   │   ├── CoursController.java
│   │   │       │   │   ├── CoursDto.java
│   │   │       │   │   └── CoursMapper.java
│   │   │       │   │
│   │   │       │   ├── notes/
│   │   │       │   │   ├── NotesController.java
│   │   │       │   │   ├── NotesDto.java
│   │   │       │   │   └── NotesMapper.java
│   │   │       │   │
│   │   │       │   ├── presences/
│   │   │       │   │   ├── PresenceController.java
│   │   │       │   │   ├── PresenceDto.java
│   │   │       │   │   └── PresenceMapper.java
│   │   │       │   │
│   │   │       │   ├── frais/
│   │   │       │   │   ├── FraisController.java
│   │   │       │   │   ├── FraisDto.java
│   │   │       │   │   └── FraisMapper.java
│   │   │       │   │
│   │   │       │   ├── paiement/
│   │   │       │   │   ├── PaiementController.java
│   │   │       │   │   ├── PaiementDto.java
│   │   │       │   │   ├── PaiementMapper.java
│   │   │       │   │   └── PaiementService.java
│   │   │       │   │
│   │   │       │   ├── deliberation/
│   │   │       │   │   ├── DeliberationController.java
│   │   │       │   │   ├── DeliberationDto.java
│   │   │       │   │   └── DeliberationMapper.java
│   │   │       │   │
│   │   │       │   ├── diplome/
│   │   │       │   │   ├── DiplomeController.java
│   │   │       │   │   ├── DiplomeDto.java
│   │   │       │   │   └── DiplomeMapper.java
│   │   │       │   │
│   │   │       │   ├── stages/
│   │   │       │   │   ├── StageController.java
│   │   │       │   │   ├── StageDto.java
│   │   │       │   │   └── StageMapper.java
│   │   │       │   │
│   │   │       │   └── rapport/
│   │   │       │       ├── RapportController.java
│   │   │       │       ├── RapportDto.java
│   │   │       │       └── RapportMapper.java
│   │   │       │
│   │   │       ├── service/
│   │   │       │   ├── auth/
│   │   │       │   │   ├── AuthService.java          # ✅ Login, Register, Refresh
│   │   │       │   │   └── AuthServiceImpl.java
│   │   │       │   │
│   │   │       │   ├── user/
│   │   │       │   │   ├── UserService.java
│   │   │       │   │   └── UserServiceImpl.java
│   │   │       │   │
│   │   │       │   ├── universite/
│   │   │       │   │   ├── UniversiteService.java
│   │   │       │   │   └── UniversiteServiceImpl.java
│   │   │       │   │
│   │   │       │   ├── filiere/
│   │   │       │   │   ├── FiliereService.java
│   │   │       │   │   └── FiliereServiceImpl.java
│   │   │       │   │
│   │   │       │   ├── cours/
│   │   │       │   │   ├── CoursService.java
│   │   │       │   │   └── CoursServiceImpl.java
│   │   │       │   │
│   │   │       │   ├── notes/
│   │   │       │   │   ├── NotesService.java
│   │   │       │   │   └── NotesServiceImpl.java
│   │   │       │   │
│   │   │       │   ├── presences/
│   │   │       │   │   ├── PresenceService.java
│   │   │       │   │   └── PresenceServiceImpl.java
│   │   │       │   │
│   │   │       │   ├── frais/
│   │   │       │   │   ├── FraisService.java
│   │   │       │   │   └── FraisServiceImpl.java
│   │   │       │   │
│   │   │       │   ├── paiement/
│   │   │       │   │   ├── PaiementService.java      # ✅ Paiement logic
│   │   │       │   │   └── PaiementServiceImpl.java
│   │   │       │   │
│   │   │       │   ├── deliberation/
│   │   │       │   │   ├── DeliberationService.java
│   │   │       │   │   └── DeliberationServiceImpl.java
│   │   │       │   │
│   │   │       │   ├── diplome/
│   │   │       │   │   ├── DiplomeService.java
│   │   │       │   │   └── DiplomeServiceImpl.java
│   │   │       │   │
│   │   │       │   ├── stages/
│   │   │       │   │   ├── StageService.java
│   │   │       │   │   └── StageServiceImpl.java
│   │   │       │   │
│   │   │       │   └── rapport/
│   │   │       │       ├── RapportService.java
│   │   │       │       └── RapportServiceImpl.java
│   │   │       │
│   │   │       ├── repository/
│   │   │       │   ├── UserRepository.java
│   │   │       │   ├── UniversiteRepository.java
│   │   │       │   ├── FiliereRepository.java
│   │   │       │   ├── PromotionRepository.java
│   │   │       │   ├── CoursRepository.java
│   │   │       │   ├── NotesRepository.java
│   │   │       │   ├── PresenceRepository.java
│   │   │       │   ├── FraisRepository.java
│   │   │       │   ├── PaiementRepository.java
│   │   │       │   ├── DeliberationRepository.java
│   │   │       │   ├── DiplomeRepository.java
│   │   │       │   ├── StageRepository.java
│   │   │       │   └── RapportRepository.java
│   │   │       │
│   │   │       ├── entity/
│   │   │       │   ├── User.java                    # ✅ JPA entity
│   │   │       │   ├── Universite.java
│   │   │       │   ├── Filiere.java
│   │   │       │   ├── Promotion.java
│   │   │       │   ├── Cours.java
│   │   │       │   ├── Notes.java
│   │   │       │   ├── Presence.java
│   │   │       │   ├── Frais.java
│   │   │       │   ├── Paiement.java
│   │   │       │   ├── Deliberation.java
│   │   │       │   ├── Diplome.java
│   │   │       │   ├── Stage.java
│   │   │       │   ├── Rapport.java
│   │   │       │   ├── BaseEntity.java              # ✅ Entité de base (id, createdAt, updatedAt)
│   │   │       │   ├── RoleEnum.java
│   │   │       │   └── StatusEnum.java
│   │   │       │
│   │   │       ├── dto/
│   │   │       │   ├── request/
│   │   │       │   │   ├── LoginRequest.java
│   │   │       │   │   ├── RegisterRequest.java
│   │   │       │   │   ├── RefreshTokenRequest.java
│   │   │       │   │   └── ...
│   │   │       │   ├── response/
│   │   │       │   │   ├── AuthResponse.java
│   │   │       │   │   ├── ApiResponse.java         # ✅ Response standardisée
│   │   │       │   │   ├── ErrorResponse.java       # ✅ Error standardisée
│   │   │       │   │   └── ...
│   │   │       │   └── ...
│   │   │       │
│   │   │       ├── validator/
│   │   │       │   ├── EmailValidator.java
│   │   │       │   ├── PasswordValidator.java
│   │   │       │   └── ...
│   │   │       │
│   │   │       ├── util/
│   │   │       │   ├── JwtUtil.java
│   │   │       │   ├── DateUtil.java
│   │   │       │   ├── ValidationUtil.java
│   │   │       │   └── ...
│   │   │       │
│   │   │       ├── mapper/
│   │   │       │   ├── UserMapper.java
│   │   │       │   ├── UniversiteMapper.java
│   │   │       │   └── ...
│   │   │       │
│   │   │       └── GenucApplication.java            # ✅ Main app
│   │   │
│   │   └── resources/
│   │       ├── application.properties               # ✅ Prod config
│   │       ├── application-dev.properties           # ✅ Dev config
│   │       ├── application-test.properties          # ✅ Test config
│   │       ├── db/
│   │       │   └── migration/
│   │       │       ├── V1__Initial_Schema.sql       # ✅ Flyway migration
│   │       │       ├── V2__Add_Tables.sql
│   │       │       └── ...
│   │       └── data/
│   │           └── sample.sql                       # ✅ Sample data
│   │
│   └── test/
│       ├── java/
│       │   └── com/genuc/
│       │       ├── controller/
│       │       │   ├── AuthControllerTest.java
│       │       │   ├── UserControllerTest.java
│       │       │   └── ...
│       │       ├── service/
│       │       │   ├── AuthServiceTest.java
│       │       │   ├── UserServiceTest.java
│       │       │   └── ...
│       │       └── security/
│       │           ├── JwtTokenProviderTest.java
│       │           └── ...
│       └── resources/
│           └── application-test.properties
│
├── pom.xml
├── .gitignore
├── README.md
├── docker-compose.yml
└── Dockerfile
```

---

## 📌 Architecture Détails

### Frontend - Points clés ✅

```javascript
// 1. API Client (axios.js)
- Refresh token automatique sur 401
- Retry logic avec exponential backoff
- Request deduplication
- Error standardisation

// 2. Authentication (AuthContext.jsx)
- Token validation stricte
- RBAC (Role-Based Access Control)
- Profile fetch on init
- Auto-logout on token expiry

// 3. Validation (validators.js, useFormValidation.js)
- Validateurs centralisés
- Hook useFormValidation pour formulaires
- FormField component réutilisable

// 4. Error Handling (errorHandler.js, ErrorBoundary.jsx)
- Global ErrorBoundary
- Erreurs conformes backend
- Logging structuré

// 5. Performance
- LoadingSpinner avec skeleton loaders
- useLocalStorage avec expiration
- Code splitting (lazy loading routes)
```

### Backend - Points clés ✅

```java
// 1. Security (SecurityConfig.java, JwtTokenProvider.java)
- Spring Security + JWT
- Refresh token rotation
- CORS configuration
- RBAC avec @Secured

// 2. Exception Handling (GlobalExceptionHandler.java)
- Exception standardisée
- Error response format uniforme
- Logging centralisé

// 3. Authentication (AuthService.java)
- Login avec validation
- Register avec email verification
- Token refresh logic
- Password encryption (BCrypt)

// 4. Database (JPA Entities + Repositories)
- Database migrations (Flyway)
- Lazy loading optimization
- Query optimization (indexes)

// 5. Data Transfer Objects (DTOs)
- Request/Response separation
- Input validation with @Validated
- Mapper pattern pour conversion
```

---

## 🔗 Communication Frontend ↔ Backend

### Endpoints API Standards

```

--- AUTH ---
POST   /api/auth/login                 # Login
POST   /api/auth/register              # Register
POST   /api/auth/refresh               # Refresh Token
POST   /api/auth/logout                # Logout
GET    /api/auth/profile               # Get User Profile

--- USER ---
GET    /api/users/:id                  # Get user
PUT    /api/users/:id                  # Update user
GET    /api/users                      # List users (ADMIN)
DELETE /api/users/:id                  # Delete user (ADMIN)

--- UNIVERSITES ---
GET    /api/universites                # List universities
GET    /api/universites/:id            # Get university
POST   /api/universites                # Create (ADMIN)
PUT    /api/universites/:id            # Update (ADMIN)
DELETE /api/universites/:id            # Delete (ADMIN)

--- FILIERES ---
GET    /api/filieres                   # List
GET    /api/filieres/:id               # Get
POST   /api/filieres                   # Create (ADMIN)
PUT    /api/filieres/:id               # Update (ADMIN)

--- PROMOTIONS ---
GET    /api/promotions                 # List
GET    /api/promotions/:id             # Get
POST   /api/promotions                 # Create (ADMIN)
PUT    /api/promotions/:id             # Update (ADMIN)

--- COURS ---
GET    /api/cours                      # List
GET    /api/cours/:id                  # Get
GET    /api/cours/professeur/:profId   # Prof courses
GET    /api/cours/etudiant/:etuId     # Student courses
POST   /api/cours                      # Create (ADMIN/PROF)

--- NOTES ---
GET    /api/notes                      # List
GET    /api/notes/:coursId/:etuId     # Get grade
POST   /api/notes                      # Create (PROF)
PUT    /api/notes/:id                  # Update (PROF)

--- PRESENCES ---
GET    /api/presences                  # List
GET    /api/presences/:coursId        # Presence list
POST   /api/presences                  # Mark presence (PROF)

--- FRAIS ---
GET    /api/frais                      # List
GET    /api/frais/etudiant/:etuId    # Student fees
GET    /api/frais/categories           # Fee categories
POST   /api/frais                      # Create (ADMIN)

--- PAIEMENTS ---
GET    /api/paiements                  # List
GET    /api/paiements/:etuId          # Student payments
POST   /api/paiements                  # Create payment
GET    /api/paiements/:id/receipt      # Receipt

--- DELIBERATIONS ---
GET    /api/deliberations              # List
GET    /api/deliberations/:id          # Get
POST   /api/deliberations              # Create (ADMIN)
PUT    /api/deliberations/:id          # Update

--- RAPPORTS ---
GET    /api/rapports/financiers        # Financial reports
GET    /api/rapports/academiques       # Academic reports
GET    /api/rapports/presences         # Attendance reports

```

### Response Format (Standardisé)

```json
// SUCCESS (200)
{
  "code": "SUCCESS",
  "message": "Operation successful",
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "timestamp": "2026-06-25T12:00:00Z"
}

// ERROR (400/401/403/500)
{
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": {
    "email": "Email already exists",
    "password": "Password too short"
  },
  "timestamp": "2026-06-25T12:00:00Z"
}
```

---

## 🚀 Tech Stack Summary

### Frontend
- **React 18** - UI library
- **React Router v6** - Navigation
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **CSS3** - Styling
- **LocalStorage API** - Client storage

### Backend
- **Spring Boot 3** - Framework
- **Spring Security** - Authentication
- **JWT** - Token-based auth
- **JPA/Hibernate** - ORM
- **PostgreSQL/MySQL** - Database
- **Flyway** - Database migrations
- **Lombok** - Code generation
- **MapStruct** - Object mapping
- **Validation** - Input validation

---

## 📊 Database Schema Overview

```sql
-- USERS
CREATE TABLE users (
  id BIGINT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  role ENUM('ETUDIANT', 'PROFESSEUR', 'ADMIN', ...),
  status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- UNIVERSITES
CREATE TABLE universites (
  id BIGINT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  location VARCHAR(255),
  created_at TIMESTAMP
);

-- FILIERES
CREATE TABLE filieres (
  id BIGINT PRIMARY KEY,
  universite_id BIGINT,
  name VARCHAR(255),
  code VARCHAR(50),
  FOREIGN KEY (universite_id) REFERENCES universites(id)
);

-- PROMOTIONS
CREATE TABLE promotions (
  id BIGINT PRIMARY KEY,
  filiere_id BIGINT,
  year VARCHAR(10),
  level INT,
  FOREIGN KEY (filiere_id) REFERENCES filieres(id)
);

-- COURS
CREATE TABLE cours (
  id BIGINT PRIMARY KEY,
  promotion_id BIGINT,
  code VARCHAR(50),
  title VARCHAR(255),
  credits INT,
  professor_id BIGINT,
  created_at TIMESTAMP,
  FOREIGN KEY (promotion_id) REFERENCES promotions(id),
  FOREIGN KEY (professor_id) REFERENCES users(id)
);

-- NOTES
CREATE TABLE notes (
  id BIGINT PRIMARY KEY,
  cours_id BIGINT,
  etudiant_id BIGINT,
  note DECIMAL(5,2),
  evaluation_type VARCHAR(50),
  created_at TIMESTAMP,
  FOREIGN KEY (cours_id) REFERENCES cours(id),
  FOREIGN KEY (etudiant_id) REFERENCES users(id)
);

-- PAIEMENTS
CREATE TABLE paiements (
  id BIGINT PRIMARY KEY,
  etudiant_id BIGINT,
  montant DECIMAL(10,2),
  type_paiement VARCHAR(50),
  date_paiement TIMESTAMP,
  status ENUM('PENDING', 'SUCCESS', 'FAILED'),
  reference VARCHAR(255),
  FOREIGN KEY (etudiant_id) REFERENCES users(id)
);
```

---

## ✅ Checklist Implémentation

### Frontend
- [x] ErrorBoundary global + local
- [x] LoadingSpinner (3 variantes)
- [x] Validateurs centralisés
- [x] useFormValidation hook
- [x] useLocalStorage hook
- [x] FormField component
- [x] PrivateRoute avec RBAC
- [x] Logger structuré
- [x] Error handling centralisé
- [x] axios avec refresh token
- [ ] Tests unitaires
- [ ] E2E tests
- [ ] Sentry integration

### Backend
- [x] GlobalExceptionHandler
- [x] JWT authentication
- [x] RBAC
- [x] Password encryption
- [x] Input validation
- [x] CORS configuration
- [ ] Unit tests
- [ ] Integration tests
- [ ] API documentation (Swagger)
- [ ] Performance optimization
- [ ] Database indexing
- [ ] Caching strategy

