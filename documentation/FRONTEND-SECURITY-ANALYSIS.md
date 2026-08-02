# Analyse de Sécurité - Frontend GENUC
**Date**: 2026-07-26  
**Frontend**: React 19 SPA (genuc-frontend)  
**Backend**: Spring Boot 3.5 REST API (genuc-backend)

---

## 📋 Résumé Exécutif

Cette analyse a identifié **plusieurs failles de sécurité et problèmes critiques** dans le frontend GENUC. Bien que certaines bonnes pratiques soient en place (comme l'utilisation de DOMPurify pour XSS), il existe des vulnérabilités sérieuses, notamment liées à la gestion des tokens, l'utilisation de `innerHTML`, et l'absence de certaines protections XSS sur certains liens.

---

## 🔐 1. Pages de Déconnexion

### ✅ Pages de déconnexion identifiées

1. **LogoutModal.jsx** (`src/components/LogoutModal.jsx`)
   - Modal de confirmation de déconnexion
   - Déclenche la fonction `logout()` du contexte AuthContext
   - Nettoie le localStorage (tokens et user)

2. **AuthContext.jsx** (`src/context/AuthContext.jsx`)
   - Fonction `logout()` (lignes 241-257)
   - Appelle l'API backend `/api/auth/logout` avec refresh token
   - Nettoie localStorage (`genuc_token`, `genuc_refresh_token`, `genuc_user`, `genuc_user_role`)
   - Désactive les notifications push

3. **Navbar.jsx** (`src/components/Navbar.jsx`)
   - Bouton de déconnexion dans la barre de navigation
   - Affiche le modal de confirmation

### ⚠️ Problèmes identifiés

1. **Déconnexion incomplète en cas d'erreur API**
   - Dans `AuthContext.jsx` (lignes 241-257), si l'appel `/api/auth/logout` échoue, la déconnexion locale est quand même effectuée
   - Cela peut laisser des sessions actives côté backend
   - Le refresh token n'est pas révoqué côté serveur

2. **Pas de nettoyage du sessionStorage**
   - Seul le localStorage est nettoyé
   - Si d'autres composants utilisent sessionStorage, ces données persistent

---

## ❌ 2. Pages Générant des Erreurs

### ✅ Pages d'erreur identifiées

1. **ErrorBoundary.jsx** (`src/components/ErrorBoundary.jsx`)
   - Capture les erreurs React non gérées
   - Affiche une page d'erreur avec ID d'erreur
   - Permet de réessayer ou retourner à l'accueil
   - Affiche les détails de l'erreur en mode développement

2. **Forbidden.jsx** (`src/pages/Forbidden.jsx`)
   - Page 403 pour accès refusé
   - Affiche le rôle actuel de l'utilisateur
   - Redirection personnalisée selon le rôle

3. **ErrorDisplay.jsx** (`src/components/common/ErrorDisplay.jsx`)
   - Composant générique d'affichage d'erreur
   - Permet de réessayer une action

4. **PaiementRetour.jsx** (`src/pages/PaiementRetour.jsx`)
   - Page de retour après paiement Stripe
   - Gère les succès et annulations

### ⚠️ Problèmes identifiés

1. **Information leakage dans ErrorBoundary**
   - En mode développement, les détails complets de l'erreur sont affichés
   - Cela peut révéler des informations sensibles sur la structure de l'application
   - Risque si activé accidentellement en production

2. **Pas de gestion centralisée des erreurs réseau**
   - Chaque composant gère ses erreurs individuellement
   - Pas de tracking ou de logging centralisé des erreurs

---

## 🚨 3. Failles de Sécurité Critiques

### 3.1 XSS (Cross-Site Scripting)

#### ✅ Bonnes pratiques en place
- **DOMPurify utilisé** pour nettoyer le HTML injecté via `dangerouslySetInnerHTML`
- Hook DOMPurify pour forcer `rel="noopener noreferrer"` sur les liens externes
- Configuration restrictive des balises et attributs autorisés

#### ❌ Failles identifiées

1. **XSS via innerHTML dans Home.jsx**
   - **Fichier**: `src/pages/Home.jsx` (ligne 198)
   - **Code**: `e.target.parentElement.innerHTML = '<span style="font-size:32px;">💳</span>';`
   - **Problème**: Utilisation directe de `innerHTML` sans sanitization
   - **Impact**: Si un attaquant peut manipuler l'image ou son conteneur, il peut injecter du code malveillant
   - **Sévérité**: Élevée
   - **Correction**: Utiliser React (`setState`) ou `DOMPurify.sanitize()`

2. **XSS potentiel via dangerouslySetInnerHTML**
   - **Fichiers**: 
     - `src/pages/etudiant/EtudiantCoursDetail.jsx` (ligne 212)
     - `src/pages/etudiant/cours/DetailCours.jsx` (lignes 319, 342)
   - **Code**: `dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedLecon.contenuHtml) }}`
   - **Analyse**: DOMPurify est utilisé (✅), mais si le backend est compromis, il peut envoyer du HTML malveillant qui contourne DOMPurify
   - **Sévérité**: Moyenne (dépend de la sécurité backend)

3. **Liens externes sans protection adéquate**
   - Certains liens avec `target="_blank"` n'ont pas `rel="noopener noreferrer"`
   - **Fichiers**: 
     - `src/pages/etudiant/EtudiantCoursDetail.jsx` (ligne 202) - `rel="noreferrer"` uniquement
     - `src/pages/etudiant/cours/DetailCours.jsx` (lignes 200, 307, 352) - `rel="noreferrer"` uniquement
   - **Problème**: `rel="noreferrer"` empêche le referrer mais pas `noopener` (protection contre tabnabbing)
   - **Sévérité**: Faible à moyenne
   - **Correction**: Toujours utiliser `rel="noopener noreferrer"`

### 3.2 CSRF (Cross-Site Request Forgery)

#### ✅ Protection en place
- Les tokens JWT sont stockés dans localStorage et envoyés via header Authorization
- Les cookies ne sont pas utilisés pour l'authentification

#### ⚠️ Problèmes identifiés
1. **Pas de token CSRF explicite**
   - Aucun mécanisme CSRF token explicite n'est implémenté
   - Bien que localStorage ne soit pas vulnérable à CSRF par défaut, une XSS pourrait permettre à un attaquant d'effectuer des requêtes authentifiées

### 3.3 Stockage des Tokens

#### ❌ Problème critique
1. **Tokens JWT dans localStorage**
   - **Fichiers**: `AuthContext.jsx`, `axios.js`, `axiosInstance.js`
   - **Problème**: Les tokens sont stockés dans localStorage (vulnérable à XSS)
   - **Impact**: Si une XSS est exploitée, l'attaquant peut voler les tokens et se faire passer pour l'utilisateur
   - **Sévérité**: Critique
   - **Correction**: Utiliser httpOnly cookies ou sessionStorage avec des protections supplémentaires

2. **Pas de rotation des tokens côté frontend**
   - Le refresh token est utilisé mais la rotation n'est pas forcée côté frontend
   - Le backend implémente la rotation mais le frontend ne valide pas systématiquement

### 3.4 Autres Problèmes de Sécurité

1. **Absence de Content Security Policy (CSP)**
   - Pas de header CSP configuré dans `index.html`
   - Permet l'exécution de scripts inline (sauf si configuré côté serveur)
   - **Sévérité**: Élevée
   - **Correction**: Ajouter un header CSP strict

2. **Données sensibles dans localStorage**
   - **Fichiers**: Plusieurs fichiers utilisent localStorage pour des données sensibles
   - **Exemples**:
     - `TachPayCheckout.jsx` (lignes 414, 421): Token JWT récupéré depuis localStorage
     - `Navbar.jsx` (lignes 572, 588): État du sidebar persisté
     - Plusieurs pages étudiant: Données utilisateur stockées
   - **Problème**: Toutes ces données sont accessibles par XSS
   - **Sévérité**: Moyenne

3. **Pas de validation côté frontend des données provenant du backend**
   - Les données du backend sont affichées directement sans validation
   - Si le backend est compromis, le frontend peut afficher du contenu malveillant
   - **Sévérité**: Moyenne

4. **Utilisation de window.location.href pour redirections**
   - **Fichiers**: 
     - `TachPayCheckout.jsx` (ligne 874): `window.location.href = data.checkoutUrl;`
     - `axiosInstance.js` (ligne 121): `window.location.href = '/login';`
   - **Problème**: Si l'URL provient du backend sans validation, cela peut mener à des redirections ouvertes
   - **Sévérité**: Moyenne
   - **Correction**: Valider l'URL avant la redirection

---

## 💳 4. Analyse des Composants de Paiement

### 4.1 TachPayCheckout.jsx

#### ✅ Bonnes pratiques
- Validation des données de formulaire
- Gestion des erreurs de paiement
- Polling du statut de paiement
- Support de plusieurs modes de paiement

#### ❌ Problèmes identifiés

1. **URL de redirection non validée**
   - **Ligne 874**: `window.location.href = data.checkoutUrl;`
   - **Problème**: L'URL de redirection Stripe provient du backend sans validation
   - **Impact**: Redirection ouverte possible si backend compromis
   - **Sévérité**: Moyenne

2. **Données sensibles dans localStorage**
   - **Lignes 414, 421**: Token JWT stocké/récupéré depuis localStorage
   - **Problème**: Si XSS, le token peut être volé pendant le paiement
   - **Sévérité**: Élevée

3. **Pas de validation du montant côté frontend**
   - Le montant est affiché mais pas validé avant envoi
   - Si le backend est compromis, un montant incorrect peut être affiché
   - **Sévérité**: Faible (le backend valide)

### 4.2 PaiementInscription.jsx

#### ✅ Bonnes pratiques
- Validation du numéro de dossier
- Polling du statut de paiement
- Gestion des erreurs

#### ⚠️ Problèmes identifiés
1. **Pas de protection supplémentaire pour les paiements publics**
   - Ce composant est accessible sans authentification
   - Pas de CAPTCHA ou rate limiting côté frontend
   - **Sévérité**: Moyenne

### 4.3 PaiementStatutPoller.jsx

#### ✅ Bonnes pratiques
- Polling avec intervalle raisonnable (5s)
- Timeout après 3 minutes
- Gestion des erreurs réseau

#### ⚠️ Problèmes identifiés
1. **Pas de validation de la référence**
   - La référence est utilisée directement sans validation
   - **Sévérité**: Faible

---

## 🔑 5. Gestion des Tokens JWT

### 5.1 AuthContext.jsx

#### ✅ Bonnes pratiques
- Validation des tokens avant utilisation
- Gestion du refresh token
- Rotation des refresh tokens
- Nettoyage des tokens à la déconnexion

#### ❌ Problèmes identifiés

1. **Tokens dans localStorage**
   - **Lignes 52, 151, 153, 155, 156, 220, 222, 224, 225, 244, 249, 250, 251, 252, 275, 281, 285**
   - **Problème**: Tokens stockés dans localStorage (vulnérable à XSS)
   - **Sévérité**: Critique
   - **Correction**: Utiliser httpOnly cookies

2. **Pas de validation de l'expiration du token**
   - Le token est validé côté backend mais pas côté frontend
   - Le frontend essaie d'utiliser des tokens expirés avant de les rafraîchir
   - **Sévérité**: Faible

3. **Pas de révocation explicite du refresh token**
   - À la déconnexion, le refresh token n'est pas explicitement révoqué côté serveur (si l'API échoue)
   - **Sévérité**: Moyenne

### 5.2 axios.js

#### ✅ Bonnes pratiques
- Interceptor pour ajouter le token aux requêtes
- Gestion automatique du refresh token (401)
- Rotation des refresh tokens
- Queue pour les requêtes pendant le refresh

#### ❌ Problèmes identifiés

1. **Tokens dans localStorage**
   - **Lignes 52, 220, 237, 244, 257, 258, 259**
   - **Problème**: Même problème que AuthContext
   - **Sévérité**: Critique

2. **Pas de validation de l'URL de refresh**
   - L'URL de refresh est construite avec `process.env.REACT_APP_API_BASE_URL`
   - Si cette variable est compromise, les tokens peuvent être envoyés à un serveur malveillant
   - **Sévérité**: Moyenne

### 5.3 axiosInstance.js

#### ✅ Bonnes pratiques
- Similaire à axios.js
- Gestion du refresh token
- Queue pour les requêtes pendant le refresh

#### ❌ Problèmes identifiés

1. **Redirection vers login sans validation**
   - **Ligne 121**: `window.location.href = '/login';`
   - **Problème**: Redirection non validée
   - **Sévérité**: Faible

---

## 📊 6. Autres Problèmes de Sécurité

### 6.1 Configuration
1. **Pas de fichier .env.local détecté**
   - Seul `.env.example` existe
   - Si les variables par défaut sont utilisées en production, cela pose problème
   - **Sévérité**: Moyenne

2. **API URL dans les variables d'environnement**
   - `REACT_APP_API_BASE_URL` dans `.env.example`
   - Si cette variable est changée par un attaquant (via XSS), les requêtes peuvent être redirigées
   - **Sévérité**: Moyenne

### 6.2 Autres
1. **Utilisation de localStorage dans 57 fichiers**
   - Beaucoup de données stockées dans localStorage
   - Si XSS, toutes ces données sont accessibles
   - **Sévérité**: Moyenne

2. **Pas de rate limiting côté frontend**
   - Pas de protection contre les abus d'API côté frontend
   - Dépend entièrement du rate limiting backend
   - **Sévérité**: Faible

---

## 🛠️ 7. Recommandations de Correction

### 7.1 Priorité Critique

1. **Remplacer localStorage par httpOnly cookies pour les tokens**
   - Configurer le backend pour envoyer les tokens via httpOnly cookies
   - Modifier le frontend pour ne plus stocker les tokens dans localStorage
   - **Impact**: Élimine le vol de tokens via XSS

2. **Corriger l'XSS dans Home.jsx**
   - Remplacer `innerHTML` par une solution React sécurisée
   - Utiliser `DOMPurify` si nécessaire
   - **Fichier**: `src/pages/Home.jsx` ligne 198

3. **Ajouter un Content Security Policy (CSP)**
   - Configurer un header CSP strict côté serveur
   - Interdire les scripts inline et l'eval
   - **Impact**: Réduit considérablement le risque XSS

### 7.2 Priorité Élevée

1. **Corriger les liens externes**
   - Ajouter `rel="noopener noreferrer"` à tous les liens avec `target="_blank"`
   - **Fichiers**: `EtudiantCoursDetail.jsx`, `DetailCours.jsx`

2. **Valider les URLs de redirection**
   - Valider toutes les URLs avant d'utiliser `window.location.href`
   - Utiliser une whitelist d'URLs autorisées
   - **Fichiers**: `TachPayCheckout.jsx`, `axiosInstance.js`

3. **Améliorer la déconnexion**
   - Forcer la révocation du refresh token côté serveur
   - Nettoyer également le sessionStorage
   - **Fichier**: `AuthContext.jsx`

### 7.3 Priorité Moyenne

1. **Réduire l'utilisation de localStorage**
   - Utiliser sessionStorage pour les données temporaires
   - Stocker uniquement les données non sensibles dans localStorage
   - **Impact**: Réduit l'impact d'une XSS

2. **Ajouter des validations côté frontend**
   - Valider toutes les données provenant du backend
   - Utiliser des schémas de validation (Yup, Zod)
   - **Impact**: Protection contre un backend compromis

3. **Améliorer ErrorBoundary**
   - Ne jamais afficher les détails de l'erreur en production
   - Logger les erreurs côté serveur uniquement
   - **Fichier**: `ErrorBoundary.jsx`

### 7.4 Priorité Faible

1. **Ajouter un rate limiting côté frontend**
   - Limiter le nombre de requêtes par utilisateur
   - Empêcher les abus d'API

2. **Ajouter un CAPTCHA sur les pages sensibles**
   - Notamment sur les pages de paiement public
   - **Fichier**: `PaiementInscription.jsx`

3. **Implémenter un système de logging centralisé**
   - Centraliser la gestion des erreurs
   - Envoyer les logs à un serveur de monitoring

---

## 📈 8. Évaluation Globale

### Score de Sécurité: 5/10

**Points forts:**
- ✅ Utilisation de DOMPurify pour XSS
- ✅ Gestion du refresh token avec rotation
- ✅ ErrorBoundary pour les erreurs React
- ✅ Validation des formulaires
- ✅ Interceptors Axios pour la gestion des tokens

**Points faibles:**
- ❌ Tokens dans localStorage (critique)
- ❌ XSS via innerHTML (critique)
- ❌ Pas de CSP (élevé)
- ❌ Liens externes non protégés (moyen)
- ❌ Redirections non validées (moyen)
- ❌ Beaucoup de données dans localStorage (moyen)

---

## 📝 9. Conclusion

Le frontend GENUC présente **des failles de sécurité significatives** qui doivent être corrigées, notamment:

1. **Le stockage des tokens dans localStorage** est la faille la plus critique et doit être corrigée en priorité
2. **L'XSS via innerHTML** dans Home.jsx doit être corrigée immédiatement
3. **L'absence de CSP** expose l'application à de nombreuses attaques XSS
4. **Les liens externes et redirections non validés** présentent des risques de phishing et tabnabbing

Il est recommandé de mettre en œuvre les corrections de priorité critique et élevée dès que possible, puis de progresser vers les corrections de priorité moyenne et faible.

---

**Document généré automatiquement par Devin**  
**Date d'analyse**: 2026-07-26