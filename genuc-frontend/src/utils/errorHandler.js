/**
 * Error Handler — Gestion centralisée des erreurs API
 * ✅ ÉTAPE 2 : Normalisation des erreurs du backend
 * Alligné avec GlobalExceptionHandler backend Java
 */

import API_CONFIG from '../config/apiConfig';

/**
 * Classes d'erreur personnalisées
 */
export class ApiError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends ApiError {
  constructor(message, validationErrors = {}) {
    super(message, 400, validationErrors);
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
  }
}

export class NotFoundError extends ApiError {
  constructor(message, resource = null) {
    super(message, 404, { resource });
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

// ═══════════════════════════════════════════
// ERROR HANDLER
// ═══════════════════════════════════════════

/**
 * Parse et normalise les erreurs API
 * Format backend GlobalExceptionHandler :
 * {
 *   "timestamp": "2026-06-25T01:00:00.000Z",
 *   "status": 400,
 *   "error": "Bad Request",
 *   "message": "Validation error message",
 *   "path": "/api/endpoint",
 *   "details": { ... détails supplémentaires ... }
 * }
 */
export const handleApiError = (error) => {
  const { response, request, message: axiosMessage } = error;

  // Erreur réseau
  if (!response && !request) {
    const networkError = new ApiError(
      'Erreur réseau. Vérifiez votre connexion Internet.',
      0,
      null
    );
    networkError.originalError = error;
    logError('NETWORK_ERROR', networkError);
    return networkError;
  }

  // Timeout
  if (error.code === 'ECONNABORTED') {
    const timeoutError = new ApiError(
      'La requête a expiré. Essayez à nouveau.',
      408,
      null
    );
    logError('TIMEOUT_ERROR', timeoutError);
    return timeoutError;
  }

  // Erreur serveur avec réponse
  if (response) {
    const { status, data } = response;

    // Backend retourne format GlobalExceptionHandler
    if (data && typeof data === 'object') {
      const { message, details } = data;

      switch (status) {
        case 400:
          const validationErr = new ValidationError(
            message || 'Erreur de validation',
            details
          );
          logError('VALIDATION_ERROR', validationErr);
          return validationErr;

        case 401:
          const unauthorizedErr = new UnauthorizedError(
            message || 'Authentification requise'
          );
          logError('UNAUTHORIZED_ERROR', unauthorizedErr);
          return unauthorizedErr;

        case 403:
          const forbiddenErr = new ForbiddenError(
            message || 'Accès refusé'
          );
          logError('FORBIDDEN_ERROR', forbiddenErr);
          return forbiddenErr;

        case 404:
          const notFoundErr = new NotFoundError(
            message || 'Ressource non trouvée',
            details?.resource
          );
          logError('NOT_FOUND_ERROR', notFoundErr);
          return notFoundErr;

        case 409:
          const conflictErr = new ApiError(
            message || 'Conflit — ressource existe déjà',
            status,
            details
          );
          logError('CONFLICT_ERROR', conflictErr);
          return conflictErr;

        case 422:
          const unprocessableErr = new ValidationError(
            message || 'Entité non traitable',
            details
          );
          logError('UNPROCESSABLE_ERROR', unprocessableErr);
          return unprocessableErr;

        case 500:
        case 502:
        case 503:
        case 504:
          const serverErr = new ApiError(
            message || 'Erreur serveur. Essayez plus tard.',
            status,
            details
          );
          logError('SERVER_ERROR', serverErr);
          return serverErr;

        default:
          const genericErr = new ApiError(
            message || `Erreur HTTP ${status}`,
            status,
            details
          );
          logError('GENERIC_ERROR', genericErr);
          return genericErr;
      }
    }

    // Réponse sans données structurées
    const unstructuredErr = new ApiError(
      `Erreur ${status}: ${response.statusText}`,
      status,
      response.data
    );
    logError('UNSTRUCTURED_ERROR', unstructuredErr);
    return unstructuredErr;
  }

  // Erreur request (pas de réponse)
  const requestErr = new ApiError(
    axiosMessage || 'Erreur de requête',
    0,
    null
  );
  requestErr.originalError = error;
  logError('REQUEST_ERROR', requestErr);
  return requestErr;
};

// ═══════════════════════════════════════════
// LOGGING
// ═══════════════════════════════════════════

const logError = (type, error) => {
  const logLevel = API_CONFIG.LOG_LEVEL || 'info';

  if (logLevel === 'debug' || logLevel === 'error') {
    console.error(`[${type}]`, error);
  }
};

// ═══════════════════════════════════════════
// ERROR MESSAGE FORMATTER
// ═══════════════════════════════════════════

/**
 * Format un ApiError pour l'affichage utilisateur
 */
export const formatErrorMessage = (error) => {
  if (error instanceof ValidationError) {
    const errors = Object.entries(error.validationErrors || {})
      .map(([field, msg]) => `${field}: ${msg}`)
      .join('; ');
    return errors || error.message;
  }

  return error.message || 'Une erreur est survenue';
};

/**
 * Récupère les détails d'erreur pour debugging
 */
export const getErrorDetails = (error) => {
  return {
    name: error.name,
    message: error.message,
    statusCode: error.statusCode,
    details: error.details,
    validationErrors: error.validationErrors || null,
  };
};
