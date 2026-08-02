// src/api/axios.js

import axios from 'axios';
import {
  lire as lireCache,
  marquerEnVol,
  memoriser,
  oublier,
  invaliderPour,
  estRejouable,
  estMutualisable,
} from './requestCache';
import { estAnnulation } from './annulation';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8082',
  timeout: 10000,
  withCredentials: true,
});

class ApiError extends Error {
  constructor(message, { status, code, errors } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors || {};
  }
}

// Le cache mémoire des GET peu volatils et la mutualisation des requêtes identiques
// vivent maintenant dans ./requestCache — partagés avec axiosInstance.js, et déclarés
// pour toutes les ressources de référence, plus seulement la liste des universités.
// Objectif : ne pas saturer le rate limiter backend (300 req/min/IP en prod, partagé
// entre tous les endpoints /api/**) à chaque navigation.

/** Fabrique une réponse Axios servie sans toucher au réseau. */
const reponseLocale = (config, donnees, origine) => ({
  data: donnees,
  status: 200,
  statusText: `OK (${origine})`,
  headers: {},
  config,
  request: {},
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

// ================================
// CSRF — CookieCsrfTokenRepository
// Le backend définit le cookie XSRF-TOKEN (non HttpOnly, lisible par JS).
// Le frontend le lit et l'envoie dans le header X-XSRF-TOKEN.
// ================================

const getCsrfToken = () => {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

// ================================
// REQUEST INTERCEPTOR
// ================================

api.interceptors.request.use(
  (config) => {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['X-XSRF-TOKEN'] = csrfToken;
    }

    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] =
        config.headers['Content-Type'] || 'application/json';
    }

    // ⚠️ NE PAS annuler les GET identiques déjà en vol.
    //
    // L'ancienne version annulait la requête PRÉCÉDENTE dès qu'une identique
    // partait. Or React 19 en StrictMode monte les effets DEUX FOIS en dev :
    // AuthContext émettait donc deux GET /api/auth/moi concurrents, le premier
    // était tué, son `await` rejetait avec CanceledError, et le catch concluait
    // « pas de session valide » → setIsAuthenticated(false) → redirection vers
    // /login alors que le backend répondait 200. Selon l'ordre d'arrivée, la
    // déconnexion était intermittente.
    //
    // La bonne réponse n'est pas d'annuler mais de PARTAGER : les appelants
    // concurrents attendent la même promesse, un seul appel part sur le réseau,
    // et tous reçoivent la même réponse. (Annuler ne réduisait d'ailleurs rien :
    // la requête tuée est déjà partie et compte dans le quota du rate limiter.)
    //
    // ⚠️ Le bloc entier est réservé aux ressources DÉCLARÉES dans requestCache : y entrer
    // pour n'importe quel GET fabriquait une promesse `_dedup` que `marquerEnVol` jetait
    // aussitôt (elle sort avant d'y attacher un catch pour une URL non déclarée). Cette
    // promesse orpheline était pourtant rejetée par l'intercepteur d'erreur ci-dessous :
    // chaque GET annulé — c'est-à-dire chacun d'eux au premier montage de StrictMode —
    // laissait donc un rejet non géré, que l'overlay de webpack-dev-server affiche en
    // plein écran sous le titre « canceled ».
    if (
      config.method?.toUpperCase() === 'GET' &&
      !config._retry &&
      !config._retryCount &&
      estMutualisable(config)
    ) {
      const disponible = lireCache(config);
      if (disponible?.type === 'donnees') {
        config.adapter = () =>
          Promise.resolve(reponseLocale(config, disponible.donnees, 'cache'));
        return config;
      }
      if (disponible?.type === 'promesse') {
        config.adapter = () =>
          disponible.promesse.then(
            (reponse) => reponseLocale(config, reponse.data, 'mutualisée'),
            (erreur) => {
              // L'annulation du MENEUR ne concerne pas les raccrochés : son composant
              // s'est démonté, pas les leurs. Hériter de son CanceledError leur ferait
              // conclure à tort « pas de données » (et, sur /api/auth/moi, « pas de
              // session » → déconnexion intempestive). Chacun repart donc sur le réseau
              // pour son propre compte ; son propre signal, lui, est bien respecté :
              // l'adaptateur XHR traite un signal déjà avorté comme une annulation.
              if (estAnnulation(erreur)) {
                return axios.getAdapter(api.defaults.adapter)(config);
              }
              return Promise.reject(erreur);
            }
          );
        return config;
      }

      // Premier demandeur : il publie sa promesse pour que les suivants s'y raccrochent.
      // Elle est dénouée par les intercepteurs de réponse ci-dessous.
      let resoudre;
      let rejeter;
      const promesse = new Promise((res, rej) => {
        resoudre = res;
        rejeter = rej;
      });
      config._dedup = { resoudre, rejeter };
      marquerEnVol(config, promesse);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ================================
// RESPONSE INTERCEPTOR
// ================================

api.interceptors.response.use(
  (response) => {
    const config = response.config;
    if (config) {
      const method = config.method?.toUpperCase();
      if (method === 'GET') {
        memoriser(config, response.data);
      } else {
        // Une écriture périme les lectures de la même ressource : sans cela, la liste
        // publique continuerait d'afficher l'établissement tel qu'il était avant l'édition.
        invaliderPour(config.url);
      }
      config._dedup?.resoudre(response);
      delete config._dedup;
    }

    return response;
  },

  async (error) => {
    const originalRequest = error.config;

    // Libère l'entrée mutualisée : les appelants raccrochés reçoivent la même erreur,
    // et la requête suivante repartira bien sur le réseau.
    if (originalRequest) {
      oublier(originalRequest);
      originalRequest._dedup?.rejeter(error);
      delete originalRequest._dedup;
    }

    // ===========================
    // REQUÊTE ANNULÉE
    // ===========================
    if (estAnnulation(error)) {
      return Promise.reject(error);
    }

    // ===========================
    // CSRF 403 — Relecture du cookie XSRF-TOKEN et retry
    // Le backend définit le cookie XSRF-TOKEN dans la réponse 403.
    // Le frontend le relit et retente la requête.
    // ===========================
    const CSRF_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
    const isCsrfFailure =
      error.response?.status === 403 &&
      CSRF_METHODS.includes(originalRequest?.method?.toUpperCase()) &&
      !originalRequest?._csrfRetry;

    if (isCsrfFailure) {
      const newCsrfToken = getCsrfToken();
      if (newCsrfToken) {
        originalRequest._csrfRetry = true;
        originalRequest.headers['X-XSRF-TOKEN'] = newCsrfToken;
        return api(originalRequest);
      }
    }

    // ===========================
    // RETRY EXPONENTIEL (5xx, timeout, réseau)
    //
    // 429 (rate limit) est volontairement exclu : réessayer aggrave la
    // limitation au lieu de la résoudre.
    //
    // ⚠️ Réservé aux méthodes IDEMPOTENTES (GET/HEAD/OPTIONS). Le rejeu s'appliquait
    // auparavant à toutes les méthodes, y compris POST — or une requête sans réponse
    // (timeout, 502 d'un proxy) a très bien pu être traitée côté serveur. Sur
    // POST /api/tachpay/.../payer ou POST /api/dossiers/{id}/payer, cela revenait à
    // relancer jusqu'à trois fois une initiation de paiement déjà partie chez
    // l'opérateur : double, voire quadruple débit pour l'étudiant. Une écriture qui
    // échoue doit remonter à l'utilisateur, pas être rejouée en silence.
    // ===========================
    const RETRY_STATUSES = [408, 500, 502, 503, 504];
    const isRetryable =
      !originalRequest?._retry && // pas déjà en cours de refresh 401
      originalRequest &&
      estRejouable(originalRequest) &&
      (
        !error.response ||
        RETRY_STATUSES.includes(error.response?.status)
      ) &&
      !axios.isCancel(error);

    if (isRetryable) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      if (originalRequest._retryCount <= 3) {
        const delay = Math.pow(2, originalRequest._retryCount - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return api(originalRequest);
      }
    }

    // ===========================
    // PAS DE RÉPONSE DU SERVEUR
    // ===========================
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return Promise.reject(new ApiError(
          'Le serveur met trop de temps à répondre. Réessayez dans un instant.',
          { status: 0, code: 'TIMEOUT_ERROR' }
        ));
      }
      return Promise.reject(new ApiError(
        'Impossible de contacter le serveur. Vérifiez votre connexion.',
        { status: 0, code: 'NETWORK_ERROR' }
      ));
    }

    const status = error.response.status;
    const errorData = error.response.data;

    // ===========================
    // TOKEN EXPIRÉ (401 uniquement)
    // Le backend renvoie désormais 401 pour « non authentifié » (entry point JSON
    // dans SecurityConfig) et 403 pour « rôle insuffisant ». Déclencher un refresh
    // sur 403 déconnecterait un utilisateur légitime qui touche un endpoint interdit.
    // ===========================
    if (status === 401 && !originalRequest._retry) {
      // Ne pas traiter les requêtes vers les endpoints publics
      const isPublic = originalRequest.url.includes('/auth/login') ||
                       originalRequest.url.includes('/auth/refresh') ||
                       originalRequest.url.includes('/auth/inscrire') ||
                       originalRequest.url.includes('/universites/public') ||
                       originalRequest.url.includes('/public/') ||
                       originalRequest.url.endsWith('/public');
      if (isPublic) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        await api.post('/api/auth/refresh', {}, {}, { _retry: true });

        // Les nouveaux tokens sont définis comme cookies HttpOnly par le
        // backend. Le navigateur les enverra automatiquement avec la
        // requête retry. On supprime simplement le header Authorization
        // statique pour qu'il soit recalculé si besoin.
        delete api.defaults.headers.common.Authorization;

        processQueue(null, null);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);

        window.dispatchEvent(new CustomEvent('genuc:session-expired'));

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ===========================
    // AUTRES ERREURS
    // ===========================
    // Le backend expose le message soit dans `erreur` (handlers inline des
    // controllers), soit dans `message` (GlobalExceptionHandler). On lit les
    // deux avant de retomber sur le message générique d'Axios (« Request failed
    // with status code 4xx »), inutilisable côté UI.
    return Promise.reject(new ApiError(
      errorData?.erreur || errorData?.message || error.message,
      { status, code: errorData?.code || `HTTP_${status}`, errors: errorData?.errors }
    ));
  }
);

export default api;