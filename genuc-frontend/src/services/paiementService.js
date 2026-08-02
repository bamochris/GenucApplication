/**
 * Service Paiements — Appels API paiements
 * ✅ ÉTAPE 5 : CRUD paiements + gestion agent
 * Alligné avec backend GENUC PaiementController
 */

import * as apiClient from '../api/axiosInstance';
import API_CONFIG, { buildUrl } from '../config/apiConfig';
import { handleApiError } from '../utils/errorHandler';

class PaiementService {
  // ═══════════════════════════════════════════
  // ÉTUDIANT ENDPOINTS
  // ═══════════════════════════════════════════

  /**
   * Soumet un paiement (POST /api/paiements/etudiant)
   */
  static async submitPayment(paymentData) {
    try {
      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.PAIEMENTS.SUBMIT,
        paymentData
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Liste les paiements par inscription (GET /api/paiements/etudiant/inscription/:inscriptionId)
   */
  static async getPaymentsByInscription(inscriptionId, page = 0, size = 20) {
    try {
      const endpoint = buildUrl(
        API_CONFIG.ENDPOINTS.PAIEMENTS.LIST_BY_INSCRIPTION,
        { inscriptionId }
      );
      const response = await apiClient.get(
        `${endpoint}?page=${page}&size=${size}`
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Récupère la situation financière (GET /api/paiements/etudiant/situation/:inscriptionId)
   */
  static async getSituationFinanciere(inscriptionId) {
    try {
      const endpoint = buildUrl(
        API_CONFIG.ENDPOINTS.PAIEMENTS.SITUATION_FINANCIERE,
        { inscriptionId }
      );
      const response = await apiClient.get(endpoint);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Récupère un reçu de paiement (GET /api/paiements/etudiant/recu/:paiementId)
   */
  static async getReceipt(paiementId) {
    try {
      const endpoint = buildUrl(
        API_CONFIG.ENDPOINTS.PAIEMENTS.RECEIPT,
        { paiementId }
      );
      const response = await apiClient.get(endpoint, null, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Récupère un paiement par référence (GET /api/paiements/reference/:reference)
   */
  static async getPaymentByReference(reference) {
    try {
      const endpoint = buildUrl(
        API_CONFIG.ENDPOINTS.PAIEMENTS.BY_REFERENCE,
        { reference }
      );
      const response = await apiClient.get(endpoint);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // ═══════════════════════════════════════════
  // AGENT/CAISSE ENDPOINTS
  // ═══════════════════════════════════════════

  /**
   * Liste tous les paiements pour gestion (GET /api/paiements/gestion/universite/:uniId)
   */
  static async getAllPaymentsForManagement(uniId, page = 0, size = 20) {
    try {
      const endpoint = buildUrl(
        API_CONFIG.ENDPOINTS.PAIEMENTS.GESTION_ALL,
        { uniId }
      );
      const response = await apiClient.get(
        `${endpoint}?page=${page}&size=${size}`
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Liste les paiements en attente (?statut=EN_ATTENTE)
   */
  static async getPendingPayments(uniId, page = 0, size = 20) {
    try {
      const endpoint = buildUrl(
        API_CONFIG.ENDPOINTS.PAIEMENTS.GESTION_ALL,
        { uniId }
      );
      const response = await apiClient.get(
        `${endpoint}?statut=EN_ATTENTE&page=${page}&size=${size}`
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Liste les paiements du jour (?dateJour=aujourd_hui)
   */
  static async getTodayPayments(uniId, page = 0, size = 20) {
    try {
      const endpoint = buildUrl(
        API_CONFIG.ENDPOINTS.PAIEMENTS.GESTION_ALL,
        { uniId }
      );
      const response = await apiClient.get(
        `${endpoint}?dateJour=aujourd_hui&page=${page}&size=${size}`
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Valide un paiement (PATCH /api/paiements/gestion/:id/valider)
   */
  static async validatePayment(paiementId) {
    try {
      const endpoint = buildUrl(
        API_CONFIG.ENDPOINTS.PAIEMENTS.VALIDATE,
        { id: paiementId }
      );
      const response = await apiClient.patch(endpoint);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Rejette un paiement (PATCH /api/paiements/gestion/:id/rejeter)
   */
  static async rejectPayment(paiementId, reason = '') {
    try {
      const endpoint = buildUrl(
        API_CONFIG.ENDPOINTS.PAIEMENTS.REJECT,
        { id: paiementId }
      );
      const response = await apiClient.patch(endpoint, { raison: reason });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Rembourse un paiement (PATCH /api/paiements/gestion/:id/rembourser)
   */
  static async refundPayment(paiementId, reason = '') {
    try {
      const endpoint = buildUrl(
        API_CONFIG.ENDPOINTS.PAIEMENTS.REFUND,
        { id: paiementId }
      );
      const response = await apiClient.patch(endpoint, { raison: reason });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // ═══════════════════════════════════════════
  // RAPPORTS
  // ═══════════════════════════════════════════

  /**
   * Rapport journalier (GET /api/paiements/rapports/:uniId/journalier)
   */
  static async getDailyReport(uniId) {
    try {
      const endpoint = buildUrl(
        API_CONFIG.ENDPOINTS.PAIEMENTS.DAILY_REPORT,
        { uniId }
      );
      const response = await apiClient.get(endpoint);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Rapport mensuel (GET /api/paiements/rapports/:uniId/mensuel)
   */
  static async getMonthlyReport(uniId) {
    try {
      const endpoint = buildUrl(
        API_CONFIG.ENDPOINTS.PAIEMENTS.MONTHLY_REPORT,
        { uniId }
      );
      const response = await apiClient.get(endpoint);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

export default PaiementService;
