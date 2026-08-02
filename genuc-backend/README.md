# GENUC Backend

API REST Spring Boot 3.5 pour la Plateforme Nationale de Gestion Universitaire (RDC).

## Prérequis

- Java 21
- Maven 3.9+
- PostgreSQL 15
- Redis 7

## Configuration

```bash
cp .env.example .env
# Remplir les variables : DB_URL, DB_USERNAME, DB_PASSWORD, JWT_SECRET, etc.
```

## Lancer en développement

```bash
mvn spring-boot:run
# http://localhost:8082
```

## Build

```bash
mvn clean package
java -jar target/genuc-platform.jar
```

## Tests

```bash
mvn test
```

## Variables d'environnement clés

| Variable | Description |
|----------|-------------|
| `DB_URL` | JDBC PostgreSQL |
| `DB_USERNAME` / `DB_PASSWORD` | Identifiants base |
| `JWT_SECRET` | Clé >= 64 caractères |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | SMTP |
| `REDIS_HOST` / `REDIS_PORT` | Cache and rate limiting |
| `ACTIVE_PROFILE` | `dev` ou `prod` |

## Sécurité

- Authentification JWT + refresh token rotation
- Rate limiting Redis (Lua sliding window)
- 2FA TOTP
- Uploads restreints (seuls logos/certificats publics)
- Circuit breakers Resilience4j sur opérateurs de paiement
- Webhooks HMAC-SHA256
