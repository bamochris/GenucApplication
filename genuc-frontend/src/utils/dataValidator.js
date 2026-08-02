// src/utils/dataValidator.js
// Utilitaires pour valider les données provenant du backend
// Protection contre un backend compromis ou des données malveillantes

/**
 * Valide les données de paiement
 * @param {object} data - Données de paiement à valider
 * @returns {boolean} - true si les données sont valides, false sinon
 */
export function validatePaiementData(data) {
  if (!data || typeof data !== 'object') {
    console.warn('[Validation] Données de paiement invalides: pas un objet');
    return false;
  }

  // Validation du montant
  if (data.montant !== undefined && data.montant !== null) {
    if (typeof data.montant !== 'number' || isNaN(data.montant)) {
      console.warn('[Validation] Montant invalide: pas un nombre');
      return false;
    }
    if (data.montant < 0 || data.montant > 1000000) {
      console.warn('[Validation] Montant hors limites acceptables');
      return false;
    }
  }

  // Validation de la référence
  if (data.reference !== undefined && data.reference !== null) {
    if (typeof data.reference !== 'string') {
      console.warn('[Validation] Référence invalide: pas une chaîne');
      return false;
    }
    if (data.reference.length > 500) {
      console.warn('[Validation] Référence trop longue');
      return false;
    }
    // Vérifier que la référence ne contient que des caractères alphanumériques et certains symboles
    if (!/^[A-Za-z0-9\-_]+$/.test(data.reference)) {
      console.warn('[Validation] Référence contient des caractères invalides');
      return false;
    }
  }

  // Validation de la devise
  if (data.devise !== undefined && data.devise !== null) {
    if (typeof data.devise !== 'string') {
      console.warn('[Validation] Devise invalide: pas une chaîne');
      return false;
    }
    if (data.devise.length > 10) {
      console.warn('[Validation] Devise trop longue');
      return false;
    }
  }

  // Validation du numéro de dossier
  if (data.numeroDossier !== undefined && data.numeroDossier !== null) {
    if (typeof data.numeroDossier !== 'string') {
      console.warn('[Validation] Numéro de dossier invalide: pas une chaîne');
      return false;
    }
    if (data.numeroDossier.length > 100) {
      console.warn('[Validation] Numéro de dossier trop long');
      return false;
    }
  }

  return true;
}

/**
 * Valide les données d'utilisateur
 * @param {object} data - Données utilisateur à valider
 * @returns {boolean} - true si les données sont valides, false sinon
 */
export function validateUserData(data) {
  if (!data || typeof data !== 'object') {
    console.warn('[Validation] Données utilisateur invalides: pas un objet');
    return false;
  }

  // Validation de l'email
  if (data.email !== undefined && data.email !== null) {
    if (typeof data.email !== 'string') {
      console.warn('[Validation] Email invalide: pas une chaîne');
      return false;
    }
    if (data.email.length > 255) {
      console.warn('[Validation] Email trop long');
      return false;
    }
    // Validation basique de l'email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      console.warn('[Validation] Email format invalide');
      return false;
    }
  }

  // Validation du nom
  if (data.nom !== undefined && data.nom !== null) {
    if (typeof data.nom !== 'string') {
      console.warn('[Validation] Nom invalide: pas une chaîne');
      return false;
    }
    if (data.nom.length > 100) {
      console.warn('[Validation] Nom trop long');
      return false;
    }
  }

  // Validation du prénom
  if (data.prenom !== undefined && data.prenom !== null) {
    if (typeof data.prenom !== 'string') {
      console.warn('[Validation] Prénom invalide: pas une chaîne');
      return false;
    }
    if (data.prenom.length > 100) {
      console.warn('[Validation] Prénom trop long');
      return false;
    }
  }

  // Validation du rôle
  if (data.role !== undefined && data.role !== null) {
    if (typeof data.role !== 'string') {
      console.warn('[Validation] Rôle invalide: pas une chaîne');
      return false;
    }
    const rolesAutorises = [
      'SUPER_ADMIN', 'ADMIN_UNIVERSITE', 'PROFESSEUR', 'ETUDIANT',
      'RECTEUR', 'DOYEN', 'CHEF_DEPARTEMENT', 'CAISSIER', 'COMPTABLE',
      'RH', 'BIBLIOTHECAIRE', 'SECRETAIRE_ACADEMIQUE', 'APPARITEUR',
      'SERVICE_SOCIAL'
    ];
    if (!rolesAutorises.includes(data.role)) {
      console.warn('[Validation] Rôle non autorisé');
      return false;
    }
  }

  return true;
}

/**
 * Valide les données de cours
 * @param {object} data - Données de cours à valider
 * @returns {boolean} - true si les données sont valides, false sinon
 */
export function validateCoursData(data) {
  if (!data || typeof data !== 'object') {
    console.warn('[Validation] Données de cours invalides: pas un objet');
    return false;
  }

  // Validation du titre
  if (data.titre !== undefined && data.titre !== null) {
    if (typeof data.titre !== 'string') {
      console.warn('[Validation] Titre de cours invalide: pas une chaîne');
      return false;
    }
    if (data.titre.length > 500) {
      console.warn('[Validation] Titre de cours trop long');
      return false;
    }
  }

  // Validation de la description
  if (data.description !== undefined && data.description !== null) {
    if (typeof data.description !== 'string') {
      console.warn('[Validation] Description invalide: pas une chaîne');
      return false;
    }
    if (data.description.length > 10000) {
      console.warn('[Validation] Description trop longue');
      return false;
    }
  }

  // Validation du contenu HTML
  if (data.contenuHtml !== undefined && data.contenuHtml !== null) {
    if (typeof data.contenuHtml !== 'string') {
      console.warn('[Validation] Contenu HTML invalide: pas une chaîne');
      return false;
    }
    if (data.contenuHtml.length > 100000) {
      console.warn('[Validation] Contenu HTML trop long');
      return false;
    }
  }

  return true;
}

/**
 * Valide une chaîne de caractères générique
 * @param {string} str - Chaîne à valider
 * @param {object} options - Options de validation
 * @returns {boolean} - true si la chaîne est valide, false sinon
 */
export function validateString(str, options = {}) {
  const {
    maxLength = 1000,
    minLength = 0,
    allowEmpty = false,
    allowedChars = null
  } = options;

  if (str === undefined || str === null) {
    return allowEmpty;
  }

  if (typeof str !== 'string') {
    return false;
  }

  if (!allowEmpty && str.trim().length === 0) {
    return false;
  }

  if (str.length < minLength || str.length > maxLength) {
    return false;
  }

  if (allowedChars && !new RegExp(`^[${allowedChars}]+$`).test(str)) {
    return false;
  }

  return true;
}

/**
 * Valide un nombre
 * @param {number} num - Nombre à valider
 * @param {object} options - Options de validation
 * @returns {boolean} - true si le nombre est valide, false sinon
 */
export function validateNumber(num, options = {}) {
  const {
    min = -Infinity,
    max = Infinity,
    allowZero = true,
    allowNegative = true,
    integer = false
  } = options;

  if (num === undefined || num === null) {
    return false;
  }

  if (typeof num !== 'number' || isNaN(num)) {
    return false;
  }

  if (!allowZero && num === 0) {
    return false;
  }

  if (!allowNegative && num < 0) {
    return false;
  }

  if (integer && !Number.isInteger(num)) {
    return false;
  }

  if (num < min || num > max) {
    return false;
  }

  return true;
}

/**
 * Sanitize un objet en supprimant les champs sensibles
 * @param {object} obj - Objet à sanitizer
 * @param {array} sensitiveFields - Liste des champs sensibles à supprimer
 * @returns {object} - Objet sanitisé
 */
export function sanitizeObject(obj, sensitiveFields = ['password', 'token', 'refreshToken', 'secret']) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = { ...obj };

  sensitiveFields.forEach(field => {
    if (sanitized[field] !== undefined) {
      delete sanitized[field];
    }
  });

  return sanitized;
}

/**
 * Valide et sanitize les données d'API
 * @param {object} data - Données à valider
 * @param {string} type - Type de données (paiement, user, cours, etc.)
 * @returns {object} - { valid: boolean, data: object|null, error: string|null }
 */
export function validateApiData(data, type) {
  const validators = {
    paiement: validatePaiementData,
    user: validateUserData,
    cours: validateCoursData
  };

  const validator = validators[type];
  if (!validator) {
    console.warn(`[Validation] Type de données inconnu: ${type}`);
    return { valid: false, data: null, error: 'Type de données inconnu' };
  }

  const isValid = validator(data);
  if (!isValid) {
    return { valid: false, data: null, error: 'Données invalides' };
  }

  return { valid: true, data: sanitizeObject(data), error: null };
}

export default {
  validatePaiementData,
  validateUserData,
  validateCoursData,
  validateString,
  validateNumber,
  sanitizeObject,
  validateApiData
};