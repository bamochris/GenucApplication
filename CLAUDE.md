# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GENUC is a university management platform (Plateforme Nationale de Gestion Universitaire — RDC) consisting of two independent sub-projects:

- **`genuc-frontend/`** — React 19 SPA (Create React App)
- **`genuc-backend/`** — Spring Boot 3.5 REST API (Java 21, Maven)

They communicate over HTTP; neither shares a package manager or build system with the other.

**In-depth documentation** lives in `documentation/` (13 files, French): start with `documentation/00-sommaire.txt`. It documents mechanisms, known pitfalls, and verified discrepancies — prefer it over re-exploring the codebase.

---

## Commands

### Frontend (`genuc-frontend/`)

```bash
npm install          # Install dependencies
npm start            # Dev server on http://localhost:3000 (listens on 0.0.0.0)
npm run build        # Production build → build/
npm test             # Jest via react-scripts (tooling installed, but NO test files exist yet)
```

Copy `.env.example` to `.env` before first run.

### Backend (`genuc-backend/`)

```bash
mvn spring-boot:run                          # Dev server on http://localhost:8082
mvn clean package                            # Build JAR
mvn test                                     # Run all tests
mvn test -Dtest=AuthServiceTest              # Run a single test class
mvn test -Dtest=AuthServiceTest#loginTest    # Run a single test method
```

Requires PostgreSQL on `localhost:5432` and Redis on `localhost:6379` (start them BEFORE the backend). See `src/main/resources/application-dev.properties` for overrides.

Swagger UI: `http://localhost:8082/swagger-ui.html` — **requires authentication** (no `permitAll` rule covers it; send a Bearer token). In the dev profile the OpenAPI JSON is at `/api-docs`, NOT the springdoc default `/v3/api-docs` (`springdoc.api-docs.path` is overridden in `application-dev.properties`).

Notes on tests (verified 2026-07-26):
- 20 test classes / 149 tests. Most are Mockito unit tests.
- `AuthControllerTest` and `SecurityConfigTest` are real integration tests: they extend `cd.genuc.IntegrationTestBase`, which starts a **Testcontainers PostgreSQL 15** container (skipped automatically if Docker is absent). H2 is only used by `@DataJpaTest`.
- JaCoCo generates a report on `mvn test` (`target/site/jacoco/`), but the 70% threshold is bound to the `verify` phase and is currently far from met — do **not** wire `mvn verify` into CI without adjusting it.

### Full Stack (Docker)

The compose file is at **`genuc-backend/docker-compose.yml`** (not the repo root). Container names use underscores (`genuc_postgres`, `genuc_redis`, ...).

```bash
docker-compose up -d     # All services: Postgres + replica, PgBouncer, Redis, Kafka/Zookeeper, Tempo, backend, frontend/Nginx
docker-compose up -d redis   # A single service (common in dev)
docker-compose down
```

---

## Architecture

### Communication

```
Browser (React SPA)
    │  Axios (src/api/axios.js)
    ▼
Nginx reverse proxy  ──►  /api  →  Spring Boot :8082
                                   /swagger-ui.html
```

The frontend never directly queries PostgreSQL or Redis — all data flows through the REST API.

**No servlet context path is configured**: the `/api` prefix is hard-coded in each controller's `@RequestMapping`. A new controller must include `/api` itself.

### Frontend Structure

The core routing and role-gating lives in `src/App.js`. Access control is enforced by `src/components/PrivateRoute.jsx`, which reads the authenticated user's role from `src/pages/context/AuthContext.jsx`.

```
src/
├── App.js                  # All routes defined here (~150 lazy imports)
├── pages/context/          # AuthContext — global auth state (JWT + user)
├── pages/<role>/           # One folder per user role (etudiant, professeur, admin, etc.)
├── components/             # Shared components (PrivateRoute, ErrorBoundary, FormField, etc.)
├── layouts/                # Etudiant/Professeur/Finance layouts (SuperAdminLayout exists but is unused)
├── services/               # Per-domain API calls (authService.js, paiementService.js, etc.)
├── api/                    # TWO parallel Axios instances: axios.js AND axiosInstance.js — apply interceptor fixes to BOTH
└── utils/                  # Validators, formatters, error handlers, logger, Axios interceptors
```

**State management**: React Context API only — no Redux or Zustand. Auth state is stored in `AuthContext` and persisted to `localStorage`. Forms use React Hook Form + Yup.

**API layer**: `src/api/axios.js` is the main Axios instance. `src/utils/apiInterceptors.js` attaches the JWT to every request and handles 401 → token refresh automatically.

**UI conventions**: brand background via `body::before` with transparent surfaces; always use CSS theme variables (never hard-coded colors); dashboard quick actions go through `QuickActionsGrid`/`QuickActionDialog`.

### Backend Structure

Layered architecture: Controller → Service → Repository → Database.

```
cd/genuc/
├── GenucPlatformApplication.java   # Entry point
├── config/           # SecurityConfig, SwaggerConfig, GlobalExceptionHandler, seeds, payment/mail/Redis configs
├── controller/       # 105 REST controllers, grouped by domain (763 endpoints)
├── service/          # Business logic; tachpay/ (mobile money) and kafka/ sub-packages
├── repository/       # 128 Spring Data JPA repositories
├── model/            # JPA entities + enums (~141 files)
├── dto/              # FLAT package (no request/response subfolders); dto/callback/ and dto/kafka/ only
├── security/         # JwtAuthFilter, JwtService, RateLimitFilter, LoginAttemptService
├── exception/        # Typed exceptions (GlobalExceptionHandler itself lives in config/)
└── util/             # PdfGenerateur, PasswordHashGenerator (only these two)
```

There is **no `mapper/` package** — DTO ↔ entity conversion happens inline in services.

**Response format**: `cd.genuc.dto.ApiResponse<T>` (created 2026-07-16) standardizes responses. `GlobalExceptionHandler` uses it for ALL error responses: `{ success:false, code, message, status, timestamp, erreurs? }` — same historical keys plus additive `success`. New endpoints should return `ApiResponse.ok(data)`; legacy endpoints still return ad-hoc DTO/Map shapes consumed by the frontend, so migrate them together with the front (`utils/errorHandler.js`).

Errors: throw a typed exception from `exception/` and let `GlobalExceptionHandler` format it — never build error bodies in controllers.

Database migrations exist in Flyway format (`src/main/resources/db/migration/`) but **Flyway is disabled in dev** (`FLYWAY_ENABLED=false`; Hibernate `ddl-auto=update` drives the dev schema). Flyway runs in prod (`application-prod.properties`) with `ddl-auto=validate`. Schema changes must be coded in BOTH the entity and a migration, and migrations tested with `FLYWAY_ENABLED=true` on a throwaway DB.

### Authentication Flow

1. `POST /api/auth/connecter` (alias `/login`) → returns JWT access token + refresh token. Login works with email **or** student matricule.
2. Frontend stores tokens in `localStorage` (key: `REACT_APP_JWT_TOKEN_KEY`).
3. Axios interceptor attaches `Authorization: Bearer <token>` to all requests.
4. On 401, the interceptor automatically calls `POST /api/auth/refresh` and retries.
5. Backend: `JwtAuthFilter` validates the token on every request before reaching controllers.
6. Authorization is role-based via **`@PreAuthorize`** annotations (not `@Secured`) plus URL rules in `SecurityConfig`, and `PrivateRoute` on the frontend. Beware: `permitAll` URL rules do NOT cancel method-level `@PreAuthorize` (e.g. the SUPER_ADMIN-only debug endpoints under `/api/auth/**`).
7. Accounts are created with `actif=false`; a non-activated account cannot log in (classic pitfall — see `documentation/12-guide-developpeur.txt` §5a).

### Payment Architecture

The payment module uses a strategy pattern. `PaymentOrchestratorService` delegates to provider-specific implementations (Vodacom M-Pesa, Orange Money, Airtel Money, cash, bank transfer). The `tachpay/` sub-package handles mobile money webhooks (HMAC-SHA256 verified) and reconciliation. `ReconciliationService` validates transaction states.

Dossier fees (public, no account) follow the same webhook-confirmed pattern since 2026-07-16: `TransactionDossier` (PENDING on initiation) + operator call, confirmed ONLY by the signed webhook (`InscriptionPubliqueService.confirmerPaiementFraisDossier`); frontend polls `GET /api/dossiers/paiement/statut/{reference}` (reference = `<numeroDossier>-<timestamp>`, no extra `DOS-` prefix).

Dossier numbers are `<establishment prefix>DOS-<year>-<6 digits>` (e.g. `HADOS-2026-123456` for Haute École de Commerce, `UKDOS-...` for Université de Kinshasa) — see `InscriptionPubliqueService.prefixeEtablissement`. Vacation choice is REQUIRED at submission when the university has vacations open for inscriptions (fee copied from the vacation); with no open vacation the fee falls back to `universite.fraisInscription`. Operator API calls in `MobileMoneyService` are still SIMULATED (local `VOD_`/`AIR_`/`ORA_` ids) — wiring real operator APIs is the remaining pre-production step.

### Role System

15+ distinct user roles (etudiant, professeur, admin, superadmin, doyen, chef, caissier, comptable, etc.). Each role has a dedicated `pages/<role>/` directory on the frontend and `@PreAuthorize` annotations on backend controllers. Use `hasRole`/`hasAnyRole` (never `hasAnyAuthority` without the `ROLE_` prefix). Admin lists are multi-tenant: filtered by the `universiteId` embedded in the JWT.

---

## Environment Variables

**Frontend** (`.env` based on `.env.example`):

| Variable | Purpose |
|---|---|
| `REACT_APP_API_BASE_URL` | Backend URL (default: `http://localhost:8082`) |
| `REACT_APP_JWT_TOKEN_KEY` | localStorage key for JWT |
| `REACT_APP_RECAPTCHA_SITE_KEY` | Google reCAPTCHA v2 key |
| `REACT_APP_ENV` | `development` or `production` |

**Backend** (`application.yml` / `-dev.properties` / `-prod.properties`):

Key externalized secrets: `JWT_SECRET` (min 32 chars — JwtService refuses shorter), database credentials, Twilio keys, mobile money API keys, Gmail SMTP password. `APP_BASE_URL` builds every emailed/QR verification link — keep it pointing at the frontend origin.

---

## Key Infrastructure Details

- **Backend port**: 8082 (no context path — `/api` comes from the controllers)
- **Frontend dev port**: 3000
- **Database**: PostgreSQL 15 (`genuc_db`); dev schema driven by Hibernate `ddl-auto=update`
- **Cache**: two-level — Caffeine in-memory (L1) in front of Redis (L2). Every cache name, TTL and L1-eligibility is declared in `config/cache/CacheNames.java`; the manager **refuses to create an undeclared cache**, so a typo in `@Cacheable` fails instead of creating a ghost cache (`DeclarationCachesTest` catches it at build time). L1 is restricted to non-personal reference data and is invalidated across instances via Redis pub/sub (`genuc:cache:invalidation`); disable with `genuc.cache.local.enabled=false`. Cached values are serialized with a **type allowlist** (`cd.genuc.*` + core JDK) — never widen it. Redis also backs rate limiting (Lua sliding window — bucket4j is NOT used).
  - Admin: `GET /api/admin/cache` + `DELETE /api/admin/cache[/{name}]` (SUPER_ADMIN only).
  - `@CacheEvict` does **not** fire on self-invocation (Spring proxy is bypassed) — that is why bulk methods evict `allEntries`.
- **HTTP caching**: `HttpCacheConfig` sets `no-store` on all `/api/**` by default and `public, max-age=60` + ETag only on an explicit public allowlist. Never add a user-specific endpoint to that list.
- **Frontend requests**: `src/api/requestCache.js` is shared by BOTH Axios instances — short-TTL cache for reference GETs plus in-flight sharing of identical GETs (never cancel duplicates: that caused intermittent logouts). It is a module-level registry that outlives a session, so it is purged on every session change (`viderTout` in `AuthContext.finalizeLogin`/`logout` and `AuthService.logout`). Automatic retry is restricted to GET/HEAD/OPTIONS — retrying a POST could double-charge a payment.
- **File upload limit**: 50 MB
- **Backend test DB**: Testcontainers PostgreSQL for `@SpringBootTest` (via `IntegrationTestBase`); H2 for `@DataJpaTest`

## Test Accounts (from backend seed data)

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@genuc.cd | Genuc2024! |
| Professor | professeur@unikin.cd | Prof123! |
| Student | etudiant@unikin.cd | Etudiant123! |
| Sysadmin | sysadmin@genuc.cd | Sysadmin123! |

Students can also log in with their matricule (e.g. `HECKIN202500001`).
