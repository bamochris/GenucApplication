# Déploiement GENUC — Tencent Cloud CVM (Francfort)

Procédure de mise en ligne sur une machine virtuelle CVM, avec la pile Docker
Compose de `docker-compose.prod.yml`.

**Région : Francfort (`eu-frankfurt`).** C'est la région Tencent la plus proche
de Kinshasa, et surtout la seule décision qui évite l'enregistrement ICP (备案) :
toute région de Chine continentale exige ce dépôt administratif — entité
juridique chinoise et plusieurs semaines de délai — pour servir un domaine.
Hors continent, aucune formalité.

---

## 1. Créer l'instance CVM

Console Tencent Cloud → **Cloud Virtual Machine** → *Create*.

| Paramètre | Valeur | Pourquoi |
|---|---|---|
| Région | Frankfurt | Pas d'ICP, latence la plus faible depuis la RDC |
| Type | S5.MEDIUM4 (2 vCPU / 4 Go) minimum | Le backend Spring démarre à ~1 Go ; en dessous de 4 Go, Postgres et la JVM se disputent la RAM |
| Image | Ubuntu Server 22.04 LTS 64-bit | |
| Disque système | 50 Go SSD Premium | Images Docker + base + uploads |
| Réseau | Attribuer une IP publique, bande passante 5 Mbps facturée à l'usage | |
| Connexion | Paire de clés SSH (pas de mot de passe) | |

Prévoir un **disque de données CBS séparé** si le volume de pièces jointes doit
grandir : les uploads sont dans un volume Docker, à déplacer sur ce disque.

## 2. Groupe de sécurité

Le pare-feu se règle dans le **Security Group**, pas sur la machine. N'ouvrir que :

| Port | Source | Usage |
|---|---|---|
| 22 | Votre IP fixe uniquement | SSH |
| 80 | 0.0.0.0/0 | HTTP (redirection vers HTTPS une fois le certificat posé) |
| 443 | 0.0.0.0/0 | HTTPS |

**Ne jamais ouvrir 5432 ni 6379.** La pile ne publie aucun port pour Postgres et
Redis : ils ne sont joignables que depuis le réseau Docker interne.

## 3. Préparer la machine

```bash
ssh ubuntu@<IP_PUBLIQUE>

sudo apt-get update && sudo apt-get upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
exit   # se reconnecter pour que le groupe docker prenne effet
```

En Chine continentale il faudrait un miroir de registre Docker ; depuis
Francfort, Docker Hub est joignable directement.

## 4. Récupérer le code

```bash
ssh ubuntu@<IP_PUBLIQUE>
git clone https://github.com/bamochris/GenucApplication.git genuc
cd genuc
```

## 5. Renseigner les secrets

```bash
cp deploy/tencent/.env.example deploy/tencent/.env
openssl rand -base64 48        # pour JWT_SECRET
openssl rand -base64 24        # pour DB_PASSWORD et REDIS_PASSWORD
nano deploy/tencent/.env
```

Cinq variables sont **obligatoires** — la pile refuse de démarrer sans elles,
volontairement : `DB_PASSWORD`, `JWT_SECRET`, `APP_BASE_URL`,
`CORS_ALLOWED_ORIGINS`, et `DB_USERNAME` (qui a un défaut).

Tant que le nom de domaine n'est pas en place, mettre l'IP publique :

```
APP_BASE_URL=http://<IP_PUBLIQUE>
CORS_ALLOWED_ORIGINS=http://<IP_PUBLIQUE>
```

`APP_BASE_URL` construit **tous** les liens envoyés par mail et les QR de
vérification de documents : une valeur erronée produit des liens morts dans des
documents déjà imprimés.

## 6. Démarrer

```bash
docker compose -f deploy/tencent/docker-compose.prod.yml \
               --env-file deploy/tencent/.env up -d --build
```

Le premier build prend 10 à 20 minutes (compilation Maven + build React). Suivre :

```bash
docker compose -f deploy/tencent/docker-compose.prod.yml logs -f backend
```

Démarrage réussi quand le healthcheck passe :

```bash
docker compose -f deploy/tencent/docker-compose.prod.yml ps
curl -s http://localhost/api/../actuator/health   # depuis le CVM
```

### Si le backend refuse de démarrer

Le profil `prod` utilise `spring.jpa.hibernate.ddl-auto=validate` avec Flyway
actif : le schéma vient des migrations, jamais d'Hibernate. Une entité JPA non
couverte par une migration fait échouer le démarrage — c'est le garde-fou, pas
une panne. Le message nomme la table ou la colonne manquante ; il faut ajouter
la migration correspondante dans
`genuc-backend/src/main/resources/db/migration/`.

## 7. HTTPS

Une fois le domaine pointé sur l'IP publique (enregistrement A) :

```bash
sudo apt-get install -y certbot
sudo certbot certonly --standalone -d genuc.cd -d www.genuc.cd
```

Puis monter les certificats dans le conteneur `frontend` et activer le bloc
`listen 443 ssl` dans `genuc-backend/nginx.conf`. Repasser ensuite
`APP_BASE_URL` et `CORS_ALLOWED_ORIGINS` en `https://` et redémarrer le backend.

Alternative Tencent : un **CLB** (Cloud Load Balancer) avec certificat géré,
qui termine le TLS avant le CVM. Plus simple à renouveler, coût mensuel en plus.

## 8. Sauvegardes

Rien n'est sauvegardé automatiquement. Deux volumes portent des données non
reconstructibles :

```bash
# Base
docker exec genuc_postgres pg_dump -U genuc_user genuc_db | gzip > genuc-$(date +%F).sql.gz

# Pièces jointes (dossiers, TFC, photos)
docker run --rm -v genuc_uploads_data:/data -v $PWD:/backup alpine \
  tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

À planifier en cron et à copier vers **COS** (Cloud Object Storage, région
Francfort) — un instantané CVM seul ne suffit pas : il ne permet pas de
restaurer une base sans revenir à l'état complet de la machine.

## 9. Exploitation

```bash
# Mise à jour
git pull && docker compose -f deploy/tencent/docker-compose.prod.yml up -d --build

# Journaux
docker compose -f deploy/tencent/docker-compose.prod.yml logs -f --tail=100 backend

# Redémarrage d'un service
docker compose -f deploy/tencent/docker-compose.prod.yml restart backend
```

Les métriques Prometheus sont sur `/actuator/prometheus`, **non exposé par
Nginx** : accessible seulement depuis le CVM. Pour les collecter, brancher
Tencent Cloud Observability Platform ou un Prometheus sur le réseau privé.

---

## Mode pilote (paiements en ligne fermés)

Par défaut, `PAYMENT_MODE_PILOTE=true`. La plateforme démarre sans les
identifiants des opérateurs mobile money, qui ne sont pas encore
contractualisés.

Ce que cela change, concrètement :

| Flux | En mode pilote |
|---|---|
| Mobile money (`/api/payments/mobile/**`) | **503** |
| API paiement v1 (`/api/v1/payments/**`) | **503** |
| Portail TachPay (`/api/tachpay/**`, `/api/tachfee/**`) | **503** |
| Frais de dossier en ligne (`/api/dossiers/*/payer`) | **503** |
| Callbacks opérateurs (`/api/payments/callback/**`) | **503** |
| Caisse : espèces, virement, dépôt (`/api/paiements`, `/api/caisse/**`) | **ouvert** |
| Dépôt et suivi de dossier, scolarité, notes, bibliothèque… | **ouvert** |

Le refus est explicite côté client :

```json
{"success":false,"code":"PAIEMENT_INDISPONIBLE",
 "message":"Le paiement en ligne n'est pas encore disponible. Veuillez vous adresser à la caisse de votre établissement.",
 "status":503}
```

Ce mode **ferme** les encaissements externes, il ne les assouplit pas :
`MobileMoneyService` simule encore les appels opérateurs, et laisser passer ces
requêtes enregistrerait des paiements fictifs comme réels. Les deux garde-fous
qui comptent restent vérifiés au démarrage — aucune simulation activée,
signature de webhook toujours exigée.

**Pour ouvrir les paiements** : renseigner les identifiants des quatre
opérateurs et de Stripe dans `.env`, puis passer `PAYMENT_MODE_PILOTE=false`.
Le démarrage échouera tant qu'il manquera une valeur — c'est voulu.

---

## Points de vigilance

- **Comptes de démonstration** : les seeds (`DataInitializer`,
  `PaiementDataInitializer`) sont annotés `@Profile("!prod")`. Ils ne
  s'exécutent pas ici. Vérifier que `SPRING_PROFILES_ACTIVE=prod` est bien
  actif — sinon des comptes dont les mots de passe sont publiés dans
  `CLAUDE.md` seraient créés.
- **Opérateurs mobile money** : `MobileMoneyService` simule encore les appels
  (identifiants locaux `VOD_`/`AIR_`/`ORA_`). Le branchement des API réelles
  reste à faire avant de sortir du mode pilote.
- **Secrets exposés** : les 9 valeurs de l'ancien `k8s/02-secrets.yaml` ont été
  publiées sur un dépôt GitHub public. Ne pas les réutiliser ici.
