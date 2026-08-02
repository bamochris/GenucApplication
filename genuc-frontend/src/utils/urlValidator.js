// src/utils/urlValidator.js
// Utilitaires pour valider les URLs et sécuriser les redirections

/**
 * Liste des domaines autorisés pour les redirections
 * Ajoutez ici tous les domaines de confiance pour votre application
 */
const ALLOWED_DOMAINS = [
  'localhost',
  'genuc.cd',
  'www.genuc.cd',
  // Ajoutez d'autres domaines de confiance si nécessaire
];

/**
 * Liste des protocoles autorisés
 */
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

/**
 * Valide si une URL est sécurisée pour une redirection
 * @param {string} url - L'URL à valider
 * @returns {boolean} - true si l'URL est sécurisée, false sinon
 */
export function isValidRedirectUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsedUrl = new URL(url, window.location.origin);

    // Vérifier le protocole
    if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
      return false;
    }

    // Pour les URLs relatives, les autoriser
    if (!parsedUrl.host) {
      return true;
    }

    // Vérifier le domaine
    const domain = parsedUrl.hostname.toLowerCase();
    const isAllowed = ALLOWED_DOMAINS.some(allowedDomain =>
      domain === allowedDomain || domain.endsWith(`.${allowedDomain}`)
    );

    return isAllowed;
  } catch (e) {
    // Si l'URL est invalide, la rejeter
    return false;
  }
}

/**
 * Valide si une URL est sécurisée pour les liens externes
 * @param {string} url - L'URL à valider
 * @returns {boolean} - true si l'URL est sécurisée, false sinon
 */
export function isValidExternalUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsedUrl = new URL(url, window.location.origin);

    // Vérifier le protocole
    if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Effectue une redirection sécurisée
 * @param {string} url - L'URL de destination
 * @param {string} fallback - L'URL de repli si l'URL principale est invalide
 */
export function safeRedirect(url, fallback = '/') {
  if (isValidRedirectUrl(url)) {
    window.location.href = url;
  } else {
    console.warn(`URL de redirection non sécurisée bloquée: ${url}`);
    window.location.href = fallback;
  }
}

/**
 * Génère un lien sécurisé pour target="_blank"
 * @param {string} url - L'URL du lien
 * @returns {object} - Objet avec les attributs sécurisés
 */
export function getSecureLinkProps(url) {
  return {
    href: url,
    target: '_blank',
    rel: 'noopener noreferrer',
  };
}

export default {
  isValidRedirectUrl,
  isValidExternalUrl,
  safeRedirect,
  getSecureLinkProps,
};