/**
 * Service Authentification — Appels API auth
 * ✅ ÉTAPE 4 : Login, register, refresh token
 */

import * as apiClient from '../api/axiosInstance';
import { viderTout as viderCacheRequetes } from '../api/requestCache';
import API_CONFIG from '../config/apiConfig';
import TokenManager from '../utils/tokenManager';
import { handleApiError } from '../utils/errorHandler';

class AuthService {
  /**
   * Login utilisateur
   */
  static async login(email, password) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
        email,
        motDePasse: password,
      });

      const { token, refreshToken, id, nomComplet, email: userEmail, role,
              universiteId, departementId, compteActive, inscriptionId } = response.data;
      const user = { id, nomComplet, email: userEmail, role, universiteId, departementId, compteActive, inscriptionId };

      // Sauvegarde les tokens
      TokenManager.setTokens(token, refreshToken);

      return {
        success: true,
        user,
        token,
      };
    } catch (error) {
      const apiError = handleApiError(error);
      throw apiError;
    }
  }

  /**
   * Register nouvel utilisateur
   */
  static async register(userData) {
    try {
      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.AUTH.REGISTER,
        userData
      );

      const { token, refreshToken, id, nomComplet, email: userEmail, role,
              universiteId, departementId, compteActive, inscriptionId } = response.data;
      const user = { id, nomComplet, email: userEmail, role, universiteId, departementId, compteActive, inscriptionId };

      // Sauvegarde les tokens
      TokenManager.setTokens(token, refreshToken);

      return {
        success: true,
        user,
        token,
      };
    } catch (error) {
      const apiError = handleApiError(error);
      throw apiError;
    }
  }

  /**
   * Logout utilisateur
   */
  static async logout() {
    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('[AuthService] Logout error:', error);
    } finally {
      // Nettoie les tokens même si l'appel échoue
      TokenManager.clearTokens();
      // Le cache de requêtes est partagé par les DEUX instances Axios et vit à
      // l'échelle du module : le vider ici évite qu'une déconnexion passant par
      // ce service laisse les lectures de la session close resservables.
      viderCacheRequetes();
    }
  }

  /**
   * Récupère le profil utilisateur
   */
  static async getProfile() {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.AUTH.PROFILE);
      return response.data;
    } catch (error) {
      const apiError = handleApiError(error);
      throw apiError;
    }
  }

  /**
   * Rafraichit le token
   */
  static async refreshToken() {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.AUTH.REFRESH,
        { refreshToken }
      );

      const { token: accessToken, refreshToken: newRefreshToken } = response.data;

      // Sauvegarde les nouveaux tokens
      TokenManager.setTokens(accessToken, newRefreshToken);

      return accessToken;
    } catch (error) {
      TokenManager.clearTokens();
      const apiError = handleApiError(error);
      throw apiError;
    }
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  static isAuthenticated() {
    return TokenManager.isAuthenticated();
  }

  /**
   * Récupère les infos du token
   */
  static getTokenInfo() {
    return TokenManager.getTokenInfo();
  }
}

export default AuthService;
