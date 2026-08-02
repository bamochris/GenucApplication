// src/utils/securityLogger.js
// Utilitaire de logging sécurisé pour les événements de sécurité
// Ne jamais logger de données sensibles (tokens, passwords, etc.)

/**
 * Liste des champs sensibles à ne jamais logger
 */
const SENSITIVE_FIELDS = [
  'password',
  'motDePasse',
  'token',
  'refreshToken',
  'accessToken',
  'secret',
  'apiKey',
  'apiSecret',
  'creditCard',
  'cardNumber',
  'cvv',
  'ssn',
  'socialSecurityNumber',
];

/**
 * Sanitize un objet en supprimant les champs sensibles
 * @param {object} data - Données à sanitizer
 * @returns {object} - Données sanitisées
 */
function sanitizeData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  const sanitized = { ...data };

  SENSITIVE_FIELDS.forEach(field => {
    if (sanitized[field] !== undefined) {
      sanitized[field] = '[REDACTED]';
    }
  });

  // Sanitizer récursif pour les objets imbriqués
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  });

  return sanitized;
}

/**
 * Logger un événement de sécurité
 * @param {string} event - Type d'événement
 * @param {object} data - Données associées (seront sanitisées)
 * @param {string} level - Niveau de log (info, warn, error)
 */
export function logSecurityEvent(event, data = {}, level = 'info') {
  const safeData = sanitizeData(data);
  const timestamp = new Date().toISOString();
  const logMessage = `[SECURITY][${timestamp}] ${event}`;

  switch (level) {
    case 'error':
      console.error(logMessage, safeData);
      break;
    case 'warn':
      console.warn(logMessage, safeData);
      break;
    case 'info':
    default:
      console.log(logMessage, safeData);
      break;
  }

  // En production, envoyer à un serveur de monitoring
  if (process.env.NODE_ENV === 'production') {
    sendToMonitoringService(event, safeData, level);
  }
}

/**
 * Logger une erreur de sécurité
 * @param {string} event - Type d'erreur
 * @param {Error} error - Objet erreur
 * @param {object} context - Contexte additionnel
 */
export function logSecurityError(event, error, context = {}) {
  const safeContext = sanitizeData(context);
  const timestamp = new Date().toISOString();

  console.error(`[SECURITY][${timestamp}] ERROR: ${event}`, {
    message: error.message,
    stack: error.stack,
    ...safeContext
  });

  if (process.env.NODE_ENV === 'production') {
    sendToMonitoringService(event, {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      ...safeContext
    }, 'error');
  }
}

/**
 * Logger une tentative d'accès non autorisée
 * @param {string} resource - Ressource ciblée
 * @param {object} context - Contexte de la tentative
 */
export function logUnauthorizedAttempt(resource, context = {}) {
  logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', {
    resource,
    ...context
  }, 'warn');
}

/**
 * Logger une activité suspecte
 * @param {string} activity - Type d'activité suspecte
 * @param {object} context - Contexte de l'activité
 */
export function logSuspiciousActivity(activity, context = {}) {
  logSecurityEvent('SUSPICIOUS_ACTIVITY', {
    activity,
    ...context
  }, 'warn');
}

/**
 * Logger une validation échouée
 * @param {string} validationType - Type de validation
 * @param {object} context - Contexte de l'échec
 */
export function logValidationFailure(validationType, context = {}) {
  logSecurityEvent('VALIDATION_FAILURE', {
    validationType,
    ...context
  }, 'warn');
}

/**
 * Logger une erreur de rate limiting
 * @param {string} endpoint - Endpoint concerné
 * @param {object} context - Contexte de l'erreur
 */
export function logRateLimitError(endpoint, context = {}) {
  logSecurityEvent('RATE_LIMIT_EXCEEDED', {
    endpoint,
    ...context
  }, 'warn');
}

/**
 * Envoyer les logs à un service de monitoring (Sentry, LogRocket, etc.)
 * @param {string} event - Type d'événement
 * @param {object} data - Données sanitisées
 * @param {string} level - Niveau de log
 */
function sendToMonitoringService(event, data, level) {
  // TODO: Intégrer avec un service de monitoring réel
  // Exemple avec Sentry:
  // if (window.Sentry) {
  //   window.Sentry.captureMessage(event, {
  //     level: level,
  //     extra: data
  //   });
  // }

  // Pour l'instant, on stocke dans localStorage pour le débogage
  try {
    const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
    logs.push({
      event,
      data,
      level,
      timestamp: new Date().toISOString()
    });

    // Garder seulement les 100 derniers logs
    if (logs.length > 100) {
      logs.shift();
    }

    localStorage.setItem('security_logs', JSON.stringify(logs));
  } catch (e) {
    // Silencer les erreurs de logging pour éviter les boucles infinies
  }
}

/**
 * Récupérer les logs de sécurité stockés
 * @returns {array} - Liste des logs
 */
export function getSecurityLogs() {
  try {
    return JSON.parse(localStorage.getItem('security_logs') || '[]');
  } catch (e) {
    return [];
  }
}

/**
 * Effacer les logs de sécurité stockés
 */
export function clearSecurityLogs() {
  try {
    localStorage.removeItem('security_logs');
  } catch (e) {
    // Silencer les erreurs
  }
}

/**
 * Logger une performance de sécurité
 * @param {string} metric - Nom de la métrique
 * @param {number} value - Valeur de la métrique
 * @param {object} context - Contexte additionnel
 */
export function logSecurityMetric(metric, value, context = {}) {
  logSecurityEvent('SECURITY_METRIC', {
    metric,
    value,
    ...context
  }, 'info');
}

export default {
  logSecurityEvent,
  logSecurityError,
  logUnauthorizedAttempt,
  logSuspiciousActivity,
  logValidationFailure,
  logRateLimitError,
  getSecurityLogs,
  clearSecurityLogs,
  logSecurityMetric,
};