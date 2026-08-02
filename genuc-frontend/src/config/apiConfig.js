import { API_BASE_URL } from './apiBaseUrl';
/**
 * Configuration API GENUC Frontend
 * ✅ ÉTAPE 1 : URLs centralisées du backend
 * Aligne avec GENUC-BACKEND endpoints (Java Spring Boot)
 */

const API_CONFIG = {
  // Base URL du backend Spring Boot
  BASE_URL: API_BASE_URL,
  
  // Timeout des requêtes (ms)
  TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT || '10000', 10),
  
  // Endpoints API — Alligné avec le backend Java
  ENDPOINTS: {
    // ═══════════════════════════════════════════
    // AUTHENTICATION
    // ═══════════════════════════════════════════
    AUTH: {
      LOGIN: '/api/auth/connecter',
      REGISTER: '/api/auth/inscrire',
      LOGOUT: '/api/auth/logout',
      PROFILE: '/api/auth/moi',
      REFRESH: '/api/auth/refresh',
      FIX_ADMIN: '/api/auth/fix-admin',
      TEST_ADMIN: '/api/auth/test-admin',
    },
    
    // ═══════════════════════════════════════════
    // PAIEMENTS
    // ═══════════════════════════════════════════
    PAIEMENTS: {
      // Étudiant
      SUBMIT: '/api/paiements/etudiant',
      LIST_BY_INSCRIPTION: '/api/paiements/etudiant/inscription/:inscriptionId',
      SITUATION_FINANCIERE: '/api/paiements/etudiant/situation/:inscriptionId',
      RECEIPT: '/api/etudiant/frais/recu/:paiementId',
      BY_REFERENCE: '/api/paiements/reference/:reference',
      
      // Agent/Caisse - Gestion des paiements
      GESTION_ALL: '/api/paiements/gestion/universite/:uniId',
      
      // Actions sur paiement
      VALIDATE: '/api/paiements/gestion/:id/valider',
      REJECT: '/api/paiements/gestion/:id/rejeter',
      REFUND: '/api/paiements/gestion/:id/rembourser',
      
      // Rapports
      DAILY_REPORT: '/api/paiements/rapports/:uniId/journalier',
      MONTHLY_REPORT: '/api/paiements/rapports/:uniId/mensuel',
      
      // Barèmes
      CREATE_BAREME: '/api/paiements/baremes',
      LIST_BAREMES: '/api/paiements/baremes/:uniId',
    },
    
    // ═══════════════════════════════════════════
    // BONS DE PAIEMENT (avec QR Code)
    // ═══════════════════════════════════════════
    BONS_PAIEMENT: {
      GENERER: '/api/bons-paiement',
      LIST_ALL: '/api/bons-paiement',
      GET_BY_ID: '/api/bons-paiement/:id',
      GET_BY_NUMERO: '/api/bons-paiement/numero/:numero',
      BY_INSCRIPTION: '/api/bons-paiement/inscription/:inscriptionId',
      ACTIFS_BY_INSCRIPTION: '/api/bons-paiement/inscription/:inscriptionId/actifs',
      VERIFIER: '/api/bons-paiement/:numero/verifier',
      ANNULER: '/api/bons-paiement/:id/annuler',
    },
    
    // ═══════════════════════════════════════════
    // INSCRIPTIONS
    // ═══════════════════════════════════════════

    INSCRIPTIONS: {
      LIST: '/api/inscriptions',
      GET: '/api/inscriptions/:id',
      CREATE: '/api/inscriptions',
      UPDATE: '/api/inscriptions/:id',
      DELETE: '/api/inscriptions/:id',
    },
    
    // ═══════════════════════════════════════════
    // UNIVERSITÉS
    // ═══════════════════════════════════════════
    UNIVERSITES: {
      LIST: '/api/universites',
      GET: '/api/universites/:id',
    },
    
    // ═══════════════════════════════════════════
    // DÉPARTEMENTS
    // ═══════════════════════════════════════════
    DEPARTEMENTS: {
      LIST: '/api/departements',
      BY_UNIVERSITE: '/api/departements/universite/:uniId',
    },
  },
  
  // ═══════════════════════════════════════════
  // Configuration JWT
  // ═══════════════════════════════════════════
  JWT: {
    TOKEN_KEY: process.env.REACT_APP_JWT_TOKEN_KEY || 'genuc_token',
    REFRESH_TOKEN_KEY: process.env.REACT_APP_REFRESH_TOKEN_KEY || 'genuc_refresh_token',
    HEADER_NAME: 'Authorization',
    HEADER_PREFIX: 'Bearer ',
    // HttpOnly cookie activé par défaut pour la sécurité (XSS protection).
    // Mettre à 'true' uniquement si le backend supporte Set-Cookie avec
    // SameSite=Strict/Lax et HttpOnly. Sinon, laisser à 'false' (localStorage).
    USE_COOKIE: process.env.REACT_APP_USE_COOKIE_JWT !== 'false',
  },
  
  // ═══════════════════════════════════════════
  // Pagination
  // ═══════════════════════════════════════════
  PAGINATION: {
    DEFAULT_PAGE_SIZE: parseInt(process.env.REACT_APP_DEFAULT_PAGE_SIZE || '20', 10),
    MAX_PAGE_SIZE: parseInt(process.env.REACT_APP_MAX_PAGE_SIZE || '100', 10),
  },
  
  // ═══════════════════════════════════════════
  // Sécurité
  // ═══════════════════════════════════════════
  SECURITY: {
    RECAPTCHA_SITE_KEY: process.env.REACT_APP_RECAPTCHA_SITE_KEY || '',
    // L'authentification se fait via cookies HttpOnly (JWT + refresh).
    // CORS est configuré avec allowCredentials=true, donc on utilise 'include'.
    CORS_CREDENTIALS: 'include',
  },
  
  // ═══════════════════════════════════════════
  // Notifications Toast
  // ═══════════════════════════════════════════
  TOAST: {
    POSITION: process.env.REACT_APP_TOAST_POSITION || 'bottom-right',
    DURATION: parseInt(process.env.REACT_APP_TOAST_DURATION || '3000', 10),
  },
  
  // ═══════════════════════════════════════════
  // Environment
  // ═══════════════════════════════════════════
  ENV: process.env.REACT_APP_ENV || 'development',
  LOG_LEVEL: process.env.REACT_APP_LOG_LEVEL || 'info',
};

/**
 * Construit une URL complète avec les paramètres
 * Exemple: buildUrl('/api/paiements/:id', { id: 123 })
 * Résultat: '/api/paiements/123'
 */
export const buildUrl = (endpoint, params = {}) => {
  let url = endpoint;
  Object.keys(params).forEach((key) => {
    url = url.replace(`:${key}`, params[key]);
  });
  return url;
};

/**
 * Construit l'URL complète (base + endpoint)
 */
export const getFullUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export default API_CONFIG;