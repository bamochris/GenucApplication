/**
 * Token Manager — Gestion JWT via HttpOnly cookies
 * Les tokens sont stockés dans des cookies HttpOnly par le backend.
 * Le frontend ne peut ni les lire ni les écrire directement.
 */

class TokenManager {
  /**
   * Les tokens sont définis par le backend via Set-Cookie.
   * Le frontend ne fait rien ici — le navigateur gère automatiquement.
   */
  static setTokens(accessToken, refreshToken = null) {
    // Ne fait rien — le backend définit les cookies HttpOnly via Set-Cookie.
    // Le navigateur les stocke et les envoie automatiquement avec chaque requête.
  }

  /**
   * Récupère l'access token
   * ⚠️ Impossible via JS pour un cookie HttpOnly.
   * Retourne null — le token est envoyé automatiquement par le navigateur.
   */
  static getAccessToken() {
    return null;
  }

  /**
   * Récupère le refresh token
   * ⚠️ Impossible via JS pour un cookie HttpOnly.
   */
  static getRefreshToken() {
    return null;
  }

  /**
   * Supprime tous les tokens (logout)
   * ⚠️ La révocation côté serveur est gérée par le backend.
   * Les cookies sont effacés par le backend via Set-Cookie avec Max-Age=0.
   */
  static clearTokens() {
    // Ne fait rien — le backend efface les cookies via Set-Cookie.
  }

  /**
   * Vérifie si un token est valide
   * ⚠️ Impossible de vérifier un HttpOnly cookie côté client.
   * La validité est contrôlée par le backend sur chaque requête.
   */
  static isTokenValid(token = null) {
    return false;
  }

  /**
   * Récupère les infos du token (payload)
   * ⚠️ Impossible de lire un HttpOnly cookie côté client.
   */
  static getTokenInfo(token = null) {
    return null;
  }

  /**
   * Format le header Authorization
   * ⚠️ Non nécessaire avec HttpOnly cookies — le navigateur envoie
   * automatiquement le cookie genuc_token avec chaque requête.
   */
  static getAuthHeader() {
    return null;
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   * ⚠️ La vérification d'authentification est faite par le backend.
   * Le frontend peut vérifier via un appel à /api/auth/moI.
   */
  static isAuthenticated() {
    return false;
  }
}

export default TokenManager;
