# Déploiement GENUC sur Railway

Quatre composants dans un même projet Railway :

| Composant | Type | Source |
|---|---|---|
| `genuc-backend` | Service | Dépôt, racine `genuc-backend/`, `Dockerfile.backend` |
| `genuc-frontend` | Service | Dépôt, racine `/`, `genuc-backend/Dockerfile.frontend` |
| `Postgres` | Base managée | Modèle Railway |
| `Redis` | Base managée | Modèle Railway |

> **Coût** — Railway n'a plus d'offre gratuite depuis août 2023. Il reste un
> crédit d'essai unique, puis le plan Hobby (5 $/mois) avec moyen de paiement
> obligatoire. Quatre composants dont une JVM consomment ce crédit vite : ce
> déploiement sert à valider, pas à tenir en production sans abonnement.

---

## 1. Créer le projet

<https://railway.com/new/github> → dépôt `bamochris/GenucApplication`, branche `main`.

Railway crée un premier service. Le dépôt contenant deux applications, il faut
lui indiquer laquelle : voir §2.

## 2. Service `genuc-backend`

**Settings → Source**

| Champ | Valeur |
|---|---|
| Root Directory | `genuc-backend` |
| Config-as-code | `railway.json` (détecté automatiquement) |

`genuc-backend/railway.json` fixe déjà le Dockerfile, la sonde
`/actuator/health` et un délai de 600 s — le démarrage Spring prend plus d'une
minute, et la valeur par défaut de Railway le déclarerait mort avant.

**Settings → Networking → Public Networking** : ne PAS générer de domaine.
Le backend n'est joint que par le frontend, en réseau privé.

**Variables**

```
SPRING_PROFILES_ACTIVE=prod
PORT=8082

DB_URL=jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}

REDIS_HOST=${{Redis.REDISHOST}}
REDIS_PORT=${{Redis.REDISPORT}}
REDIS_PASSWORD=${{Redis.REDISPASSWORD}}

JWT_SECRET=<openssl rand -base64 64>
PAYMENT_MODE_PILOTE=true

APP_BASE_URL=https://<domaine-du-frontend>
CORS_ALLOWED_ORIGINS=https://<domaine-du-frontend>
```

Points à ne pas manquer :

- **`PORT=8082` est fixé explicitement.** Railway en attribue un au hasard
  sinon, et le frontend n'aurait aucun port stable à viser en réseau privé.
- **`DB_URL` est reconstruite en JDBC.** Railway expose `DATABASE_URL` au format
  `postgresql://user:mot-de-passe@hote:port/base`, que le pilote JDBC refuse :
  il lui faut le préfixe `jdbc:` et pas d'identifiants dans l'URL.
- **`JWT_SECRET` sans valeur fait échouer le démarrage**, volontairement.
- `APP_BASE_URL` construit tous les liens envoyés par mail et les QR de
  vérification. À renseigner une fois le domaine du frontend connu (§3), puis
  redéployer le backend.

## 3. Service `genuc-frontend`

**Settings → Source**

| Champ | Valeur |
|---|---|
| Root Directory | `/` (racine du dépôt) |
| Dockerfile Path | `genuc-backend/Dockerfile.frontend` |

La racine est bien celle du dépôt : ce Dockerfile copie `genuc-frontend/` **et**
`genuc-backend/nginx.conf.template`, qui n'ont pas de répertoire commun plus bas.

**Settings → Networking** : générer un domaine public. C'est l'URL du site.

**Variables**

```
BACKEND_URL=http://${{genuc-backend.RAILWAY_PRIVATE_DOMAIN}}:8082
```

Nginx écoute sur le `$PORT` imposé par Railway et proxifie `/api/` vers cette
adresse — `docker-entrypoint-frontend.sh` rend le gabarit au démarrage.

## 4. Bases de données

**+ New → Database → PostgreSQL**, puis **Redis**. Aucune configuration : les
variables sont référencées depuis le backend via `${{Postgres.*}}` et
`${{Redis.*}}`.

Le schéma est créé par Flyway au premier démarrage (15 migrations). Le profil
`prod` utilise `ddl-auto=validate` : Hibernate ne crée rien, il vérifie.

## 5. Boucler les URLs

Une fois le domaine du frontend attribué, revenir sur le backend et renseigner
`APP_BASE_URL` et `CORS_ALLOWED_ORIGINS` avec cette URL exacte, **sans barre
oblique finale**. Redéployer le backend.

## 6. Vérifier

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://<domaine>/                        # 200
curl -s -o /dev/null -w '%{http_code}\n' https://<domaine>/api/universites/public  # 200
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
     https://<domaine>/api/payments/mobile/initiate                                # 503 (mode pilote)
```

Un **502** sur `/api/` signifie que le frontend ne joint pas le backend :
vérifier `BACKEND_URL`, et que le backend a bien `PORT=8082`.

---

## Mode pilote

`PAYMENT_MODE_PILOTE=true` : les encaissements par prestataire externe
répondent 503, la caisse et toute la scolarité fonctionnent. Détail dans
`deploy/tencent/README.md`, section « Mode pilote ».

## Limites connues

- **Pas de volume pour les pièces jointes.** Les uploads vont dans le système de
  fichiers du conteneur et **disparaissent à chaque redéploiement**. Pour
  conserver dossiers, TFC et photos, il faut attacher un volume Railway sur
  `/app/uploads`, ou basculer le stockage sur S3.
- Le plan d'essai limite la mémoire ; le backend démarre à environ 1 Go.
