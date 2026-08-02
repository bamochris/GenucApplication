# GENUC Platform

Plateforme Nationale de Gestion Universitaire — République Démocratique du Congo.

Stack technique : Spring Boot 3.5 (Java 21) + React 19 (SPA).

## Structure

```
├── genuc-backend/          # API REST Spring Boot
├── genuc-frontend/         # SPA React (Create React App)
├── genuc-ui/               # Librairie de composants UI (Vite + TypeScript)
├── documentation/          # Guides, architecture, contrats API
├── docker-compose.yml      # Stack complète (PostgreSQL, Redis, Kafka, Tempo)
└── CLAUDE.md               # Instructions pour Claude Code
```

## Prérequis

- Java 21, Maven 3.9+
- Node.js 20+, npm 9+
- PostgreSQL 15, Redis 7
- Docker & Docker Compose (pour la stack complète)

## Démarrage rapide

### Backend

```bash
cd genuc-backend
cp .env.example .env          # Remplir les variables (DB, JWT, mail...)
mvn spring-boot:run           # http://localhost:8082
```

### Frontend

```bash
cd genuc-frontend
cp .env.example .env
npm install
npm start                     # http://localhost:3000
```

### Stack complète (Docker)

```bash
docker-compose up -d
```

## Tests

```bash
# Backend
cd genuc-backend && mvn test

# Frontend
cd genuc-frontend && npm test -- --watchAll=false
```

## CI/CD

Le workflow GitHub Actions exécute :
- Tests backend (Java 21 + Testcontainers)
- Tests frontend (Node 20)
- Scan OWASP Dependency-Check (fail si CVSS >= 8)

## Documentation

Toute la documentation détaillée est dans `documentation/`.

## Sécurité

- JWT + refresh token rotation
- Rate limiting (Redis Lua sliding window)
- 2FA (TOTP)
- Uploads protégés (seuls logos/certificats sont publics)
- Circuit breakers Resilience4j sur les opérateurs de paiement
- Webhooks signés HMAC-SHA256
- CSP, HSTS, CSRF protection

**Ne jamais committer `.env`, `application-dev.properties` ou secrets similaires.**
