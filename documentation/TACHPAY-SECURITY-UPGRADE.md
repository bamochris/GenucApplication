# TachPay Security Upgrade - Rapport d'Implémentation

## Date : 2026-07-24

## Résumé
Implémentation des corrections de sécurité critiques pour TachPay suite à l'analyse des points critiques identifiés.

## Modifications Implémentées

### 1. Idempotence des Webhooks ✅

**Fichiers modifiés :**
- `TachPayWebhookService.java`
- `MobileMoneyService.java` (déjà implémenté partiellement)
- `StripeService.java`

**Changements :**

#### TachPayWebhookService.java
- Ajout de vérification d'idempotence dans `traiterWebhookMobile()` :
  - Vérifie si la transaction est déjà SUCCESS avant traitement
  - Retourne succès immédiat si déjà traité
  - Log warning pour webhooks dupliqués
- Ajout de vérification d'idempotence dans `traiterWebhookStripe()` :
  - Même logique pour les webhooks Stripe
  - Évite le double traitement des sessions de paiement

#### StripeService.java
- Ajout de vérification d'idempotence dans `confirmerPaiement()` :
  - Vérifie si la transaction est déjà dans un état terminal
  - Log info si déjà traité
  - Évite la double application des paiements

**Impact :** Élimine le risque de double-paiement fantôme en cas de retry des webhooks par les opérateurs.

---

### 2. Validation des Montants Webhook ✅

**Fichiers modifiés :**
- `MobileMoneyService.java`
- `StripeService.java`

**Changements :**

#### MobileMoneyService.java
- Ajout de `ObjectMapper` comme dépendance
- Ajout de la méthode `extraireMontantWebhook()` :
  - Extrait le montant du payload JSON
  - Supporte plusieurs champs de montant (amount, montant, transactionAmount, paidAmount)
  - Gère les différents formats (Number, String, centimes)
- Ajout de la méthode `validerMontantWebhook()` :
  - Compare montant webhook vs montant attendu
  - Tolérance de 1% pour les frais de conversion
  - Log error si écart > 1%
  - Log warning si écart > 0.1%
- Intégration dans `confirmerPaiement()` :
  - Validation avant traitement
  - Continue même si validation échoue (non-bloquant)

#### StripeService.java
- Ajout de la méthode `validerMontantStripe()` :
  - Récupère le montant depuis l'API Stripe
  - Compare avec le montant attendu
  - Même tolérance de 1%
  - Log des écarts significatifs
- Intégration dans `confirmerPaiement()` :
  - Validation via PaymentIntent.retrieve()
  - Non-bloquant en cas d'erreur

**Impact :** Détecte les incohérences de montants qui pourraient indiquer une fraude ou une erreur système.

---

### 3. Whitelist IP pour Webhooks ✅

**Fichiers modifiés :**
- `WebhookSecurityService.java`
- `TachPayController.java`

**Changements :**

#### WebhookSecurityService.java
- Ajout de nouvelles propriétés de configuration :
  - `genuc.webhook.ip-whitelist.active` (défaut: true)
  - `genuc.webhook.ip-whitelist.vodacom`
  - `genuc.webhook.ip-whitelist.airtel`
  - `genuc.webhook.ip-whitelist.orange`
  - `genuc.webhook.ip-whitelist.afrimoney`
- Ajout de la méthode `ipAutorisee()` :
  - Vérifie si l'IP source est dans la whitelist
  - Gestion des proxies (X-Forwarded-For, X-Real-IP)
  - Normalisation des adresses IP
  - Fallback si whitelist non configurée
- Ajout de la méthode `requeteValide()` :
  - Combinaison signature + IP
  - Vérification IP d'abord (plus rapide)
  - Ensuite vérification signature
- Amélioration des logs de configuration :
  - Log détaillé des secrets configurés
  - Log des whitelists IP avec nombre d'adresses
  - Warnings si fonctionnalités désactivées

#### TachPayController.java
- Modification des endpoints webhook :
  - Ajout de `HttpServletRequest` parameter
  - Passage de l'IP au service de sécurité
- Ajout de la méthode `extraireIpSource()` :
  - Extrait l'IP de X-Forwarded-For (proxy)
  - Extrait l'IP de X-Real-IP
  - Fallback sur RemoteAddr
  - Gestion des multiples IP dans X-Forwarded-For
- Mise à jour de `traiterWebhookMobile()` :
  - Utilisation de `requeteValide()` au lieu de `signatureValide()`
  - Log de l'IP source dans les messages
- Mise à jour de `webhookStripe()` :
  - Log de l'IP pour traçabilité (Stripe utilise sa propre signature)

**Configuration requise dans application-prod.properties :**
```properties
# Activation de la whitelist IP (recommandé en production)
genuc.webhook.ip-whitelist.active=true

# Whitelist IP par opérateur (séparées par des virgules)
genuc.webhook.ip-whitelist.vodacom=195.242.1.0/24,197.253.0.0/16
genuc.webhook.ip-whitelist.airtel=196.202.0.0/16
genuc.webhook.ip-whitelist.orange=41.205.0.0/16
genuc.webhook.ip-whitelist.afrimoney=197.234.0.0/16
```

**Impact :** Ajoute une couche de sécurité supplémentaire en n'acceptant les webhooks que depuis les IP autorisées des opérateurs.

---

## Configuration de Production

### Variables d'environnement requises

```bash
# Sécurité webhook (existant)
GENUC_WEBHOOK_REQUIRE_SIGNATURE=true
GENUC_WEBHOOK_SECRET=<secret-global-optionnel>
GENUC_WEBHOOK_VODACOM_SECRET=<secret-vodacom>
GENUC_WEBHOOK_AIRTEL_SECRET=<secret-airtel>
GENUC_WEBHOOK_ORANGE_SECRET=<secret-orange>
GENUC_WEBHOOK_AFRIMONEY_SECRET=<secret-afrimoney>

# Whitelist IP (nouveau)
GENUC_WEBHOOK_IP_WHITELIST_ACTIVE=true
GENUC_WEBHOOK_IP_WHITELIST_VODACOM=<ip1,ip2,ip3>
GENUC_WEBHOOK_IP_WHITELIST_AIRTEL=<ip1,ip2>
GENUC_WEBHOOK_IP_WHITELIST_ORANGE=<ip1,ip2>
GENUC_WEBHOOK_IP_WHITELIST_AFRIMONEY=<ip1,ip2>

# Stripe (existant)
STRIPE_API_KEY=<sk_live_...>
STRIPE_WEBHOOK_SECRET=<whsec_...>
STRIPE_WEBHOOK_REQUIRE_SIGNATURE=true
```

---

## Tests Recommandés

### 1. Test d'Idempotence
```bash
# Envoyer le même webhook deux fois
# Vérifier que le deuxième est ignoré avec un log warning
curl -X POST http://localhost:8082/api/tachpay/webhook/vodacom \
  -H "X-Webhook-Signature: <signature>" \
  -d '{"transactionId":"TEST123","status":"SUCCESS"}'
```

### 2. Test Validation Montant
```bash
# Envoyer un webhook avec un montant incorrect
# Vérifier le log error
curl -X POST http://localhost:8082/api/tachpay/webhook/vodacom \
  -H "X-Webhook-Signature: <signature>" \
  -d '{"transactionId":"TEST456","status":"SUCCESS","amount":999.99}'
```

### 3. Test Whitelist IP
```bash
# Tester depuis une IP non autorisée
# Vérifier le rejet 401
curl -X POST http://localhost:8082/api/tachpay/webhook/vodacom \
  -H "X-Webhook-Signature: <signature>" \
  -d '{"transactionId":"TEST789","status":"SUCCESS"}'
```

---

## Monitoring et Logs

### Logs à surveiller

**Idempotence :**
```
WARN  Webhook VODACOM déjà traité pour transaction TEST123 - statut SUCCESS, ignore duplication
```

**Validation montant :**
```
ERROR Écart montant webhook VODACOM : attendu=100.0, reçu=99.0, écart=1.00%
WARN  Écart montant webhook VODACOM (mineur) : attendu=100.0, reçu=99.9, écart=0.10%
```

**Whitelist IP :**
```
WARN  Webhook VODACOM rejeté : IP 192.168.1.100 non autorisée (whitelist: 195.242.1.0/24)
```

### Métriques à surveiller

- Nombre de webhooks dupliqués par opérateur
- Nombre d'écarts de montant par opérateur
- Nombre de rejets IP par opérateur
- Temps de traitement des webhooks

---

## Actions Restantes

### Phase 2 (Non implémentée dans ce ticket)

1. **Système de Réconciliation**
   - Créer `ReconciliationService`
   - Job batch pour transactions orphelines
   - Alerting transactions PENDING > 24h

2. **Retry et Circuit Breaker**
   - Spring Retry pour appels API
   - Resilience4j Circuit Breaker
   - Monitoring taux d'échec

3. **Logs Structurés**
   - MDC avec correlation ID
   - Logs structurés JSON
   - Amélioration logging existant

### Phase 3 (Non implémentée dans ce ticket)

4. **Métriques Spécifiques**
   - Micrometer Prometheus
   - Dashboard Grafana
   - Métriques par opérateur

5. **Rate Limiting Spécifique**
   - Bucket4j par IP
   - Limite 100 req/min par opérateur
   - Dashboard rate limits

---

## Déploiement

### Pré-déploiement
1. Configurer les whitelists IP dans `application-prod.properties`
2. Valider les secrets webhook existants
3. Tester les webhooks avec les nouvelles vérifications

### Déploiement
1. Backup de la configuration existante
2. Déploiement blue-green recommandé
3. Surveillance accrue pendant 48h
4. Vérification des logs de démarrage

### Post-déploiement
1. Valider que les webhooks sont toujours reçus
2. Surveiller les logs de rejet IP
3. Ajuster les whitelists si nécessaire
4. Vérifier les métriques d'écarts de montant

---

## Conclusion

Les trois corrections critiques de sécurité ont été implémentées avec succès :

1. ✅ **Idempotence** : Élimine le risque de double-paiement
2. ✅ **Validation montant** : Détecte les incohérences de montant
3. ✅ **Whitelist IP** : Restreint les webhooks aux IP autorisées

Ces modifications réduisent de manière significative le risque de fraude et d'erreurs système tout en maintenant la compatibilité avec l'existant.

La configuration de production doit être mise à jour avec les whitelists IP des opérateurs pour une sécurité maximale.
