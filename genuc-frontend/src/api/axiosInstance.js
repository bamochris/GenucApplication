/**
 * Axios Instance — Configuration avec interceptors
 * Authentification par cookies HttpOnly (genuc_token / genuc_refresh_token)
 * + jeton CSRF X-XSRF-TOKEN. Aligné avec backend GENUC Spring Boot.
 *
 * ⚠️ Deuxième instance Axios du projet, à côté de api/axios.js : tout correctif
 * d'intercepteur doit être appliqué aux DEUX (cf. CLAUDE.md).
 */

import axios from 'axios';
import API_CONFIG, { buildUrl } from '../config/apiConfig';
import { handleApiError } from '../utils/errorHandler';
import {
  lire as lireCache,
  marquerEnVol,
  memoriser,
  oublier,
  invaliderPour,
  estMutualisable,
} from './requestCache';
import { estAnnulation } from './annulation';

// ═══════════════════════════════════════════
// CREATE AXIOS INSTANCE
// ═══════════════════════════════════════════

const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: API_CONFIG.SECURITY.CORS_CREDENTIALS === 'include',
});

// ═══════════════════════════════════════════
// CSRF — CookieCsrfTokenRepository
// Le backend écrit le cookie XSRF-TOKEN (non HttpOnly) sur CHAQUE réponse ;
// toute écriture doit le renvoyer dans X-XSRF-TOKEN, sinon 403. Seuls les
// endpoints d'amorçage (connecter/login/inscrire/refresh…) en sont exemptés
// côté SecurityConfig — /api/auth/logout, lui, ne l'est PAS.
// ═══════════════════════════════════════════

const getCsrfToken = () => {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

/** Fabrique une réponse Axios servie sans toucher au réseau. */
const reponseLocale = (config, donnees, origine) => ({
  data: donnees,
  status: 200,
  statusText: `OK (${origine})`,
  headers: {},
  config,
  request: {},
});

// ═══════════════════════════════════════════
// REQUEST INTERCEPTOR — CSRF + Content-Type
// ═══════════════════════════════════════════

axiosInstance.interceptors.request.use(
  (config) => {
    // ⚠️ Aucun header Authorization : le JWT vit dans le cookie HttpOnly
    // genuc_token, envoyé automatiquement par le navigateur grâce à
    // withCredentials. TokenManager.getAuthHeader() retourne null depuis la
    // migration cookies — le lire ne faisait qu'entretenir l'illusion.
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['X-XSRF-TOKEN'] = csrfToken;
    }

    // Ajoute Content-Type si nécessaire
    if (!config.headers['Content-Type'] && config.data) {
      config.headers['Content-Type'] = 'application/json';
    }

    // Même cache et même mutualisation des GET que api/axios.js — le registre
    // ./requestCache est partagé, deux composants utilisant chacun une instance
    // différente ne déclenchent donc qu'un seul appel réseau.
    //
    // ⚠️ Même garde que api/axios.js : réservé aux ressources DÉCLARÉES. Sans
    // `estMutualisable`, chaque GET fabriquait une promesse `_dedup` orpheline dont le
    // rejet (annulation au démontage, 4xx/5xx) remontait en « unhandled rejection ».
    if (config.method?.toUpperCase() === 'GET' && !config._retry && estMutualisable(config)) {
      const disponible = lireCache(config);
      if (disponible?.type === 'donnees') {
        config.adapter = () => Promise.resolve(reponseLocale(config, disponible.donnees, 'cache'));
        return config;
      }
      if (disponible?.type === 'promesse') {
        config.adapter = () =>
          disponible.promesse.then(
            (reponse) => reponseLocale(config, reponse.data, 'mutualisée'),
            (erreur) => {
              // Annulation du meneur : les raccrochés n'en héritent pas, ils repartent
              // sur le réseau (cf. commentaire détaillé dans api/axios.js).
              if (estAnnulation(erreur)) {
                return axios.getAdapter(axiosInstance.defaults.adapter)(config);
              }
              return Promise.reject(erreur);
            }
          );
        return config;
      }
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
  (error) => {
    console.error('[Axios] Request error:', error);
    return Promise.reject(error);
  }
);

// ═══════════════════════════════════════════
// RESPONSE INTERCEPTOR — Gère erreurs & refresh
// ═══════════════════════════════════════════

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => {
    const config = response.config;
    if (config) {
      if (config.method?.toUpperCase() === 'GET') {
        memoriser(config, response.data);
      } else {
        invaliderPour(config.url);
      }
      config._dedup?.resoudre(response);
      delete config._dedup;
    }
    return response;
  },
  async (error) => {
    const { config, response } = error;

    if (config) {
      oublier(config);
      config._dedup?.rejeter(error);
      delete config._dedup;
    }

    // Requête annulée — court-circuit, identique à api/axios.js.
    // ⚠️ Doit rester AVANT handleApiError : une annulation n'est pas une panne, la
    // transformer en ApiError ferait afficher « canceled » à l'utilisateur.
    if (estAnnulation(error)) {
      return Promise.reject(error);
    }

    // 401 Unauthorized — Token expiré?
    if (response?.status === 401 && !config._retry) {
      if (isRefreshing) {
        // Requête en attente du refresh en cours : une fois les nouveaux
        // cookies posés par le backend, il suffit de rejouer telle quelle.
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => axiosInstance(config));
      }

      config._retry = true;
      isRefreshing = true;

      try {
        // Le refresh token est un cookie HttpOnly : illisible en JS et envoyé
        // automatiquement. L'ancienne version lisait TokenManager.getRefreshToken()
        // — qui retourne null depuis la migration cookies — et partait donc
        // TOUJOURS dans le catch : tout 401 sur cette instance provoquait une
        // redirection brutale vers /login au lieu d'un refresh silencieux.
        await axiosInstance.post(API_CONFIG.ENDPOINTS.AUTH.REFRESH, {});

        processQueue(null, null);

        // Les nouveaux cookies sont posés : on rejoue la requête d'origine.
        return axiosInstance(config);
      } catch (err) {
        processQueue(err, null);
        // Même signal que l'instance api/axios.js : c'est AuthContext qui décide
        // s'il faut déconnecter et rediriger. Un visiteur anonyme sur une page
        // publique ne doit PAS être envoyé sur /login.
        window.dispatchEvent(new CustomEvent('genuc:session-expired'));
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // Autres erreurs — Gestion centralisée
    const apiError = handleApiError(error);
    return Promise.reject(apiError);
  }
);

// ═══════════════════════════════════════════
// HELPER METHODS
// ═══════════════════════════════════════════

/**
 * GET request
 */
export const get = (endpoint, params = {}, config = {}) => {
  const url = buildUrl(endpoint, params);
  return axiosInstance.get(url, config);
};

/**
 * POST request
 */
export const post = (endpoint, data = {}, params = {}, config = {}) => {
  const url = buildUrl(endpoint, params);
  return axiosInstance.post(url, data, config);
};

/**
 * PATCH request
 */
export const patch = (endpoint, data = {}, params = {}, config = {}) => {
  const url = buildUrl(endpoint, params);
  return axiosInstance.patch(url, data, config);
};

/**
 * PUT request
 */
export const put = (endpoint, data = {}, params = {}, config = {}) => {
  const url = buildUrl(endpoint, params);
  return axiosInstance.put(url, data, config);
};

/**
 * DELETE request
 */
export const deleteRequest = (endpoint, params = {}, config = {}) => {
  const url = buildUrl(endpoint, params);
  return axiosInstance.delete(url, config);
};

export default axiosInstance;
