/**
 * Service Inscriptions — Appels API inscriptions
 * ✅ ÉTAPE 5 : CRUD inscriptions
 * Alligné avec backend GENUC InscriptionController
 */

import * as apiClient from '../api/axiosInstance';
import API_CONFIG, { buildUrl } from '../config/apiConfig';
import { handleApiError } from '../utils/errorHandler';

class InscriptionService {
  /**
   * Liste les inscriptions (GET /api/inscriptions)
   */
  static async getAllInscriptions(page = 0, size = 20) {
    try {
      const response = await apiClient.get(
        `${API_CONFIG.ENDPOINTS.INSCRIPTIONS.LIST}?page=${page}&size=${size}`
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Récupère une inscription (GET /api/inscriptions/:id)
   */
  static async getInscription(id) {
    try {
      const endpoint = buildUrl(API_CONFIG.ENDPOINTS.INSCRIPTIONS.GET, { id });
      const response = await apiClient.get(endpoint);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Crée une inscription (POST /api/inscriptions)
   */
  static async createInscription(inscriptionData) {
    try {
      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.INSCRIPTIONS.CREATE,
        inscriptionData
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Met à jour une inscription (PUT /api/inscriptions/:id)
   */
  static async updateInscription(id, inscriptionData) {
    try {
      const endpoint = buildUrl(API_CONFIG.ENDPOINTS.INSCRIPTIONS.UPDATE, {
        id,
      });
      const response = await apiClient.put(endpoint, inscriptionData);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Supprime une inscription (DELETE /api/inscriptions/:id)
   */
  static async deleteInscription(id) {
    try {
      const endpoint = buildUrl(API_CONFIG.ENDPOINTS.INSCRIPTIONS.DELETE, {
        id,
      });
      const response = await apiClient.deleteRequest(endpoint);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

export default InscriptionService;
