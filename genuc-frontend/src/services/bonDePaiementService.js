/**
 * 🧾 Service Bons de Paiement — Génération avec QR Code
 * ✅ Aligné avec le backend BonDePaiementController/BonDePaiementService
 * ✅ QR Code contenant : coordonnées bancaires + Mobile Money (M-Pesa, Orange Money, Airtel Money)
 */
import api from '../api/axios';
import API_CONFIG, { buildUrl } from '../config/apiConfig';
import { handleApiError } from '../utils/errorHandler';

class BonDePaiementService {
  // ════════════════════════════════════════════════════════════════
  //  CRUD
  // ════════════════════════════════════════════════════════════════

  /**
   * Générer un bon de paiement (POST /api/bons-paiement)
   */
  static async generer(inscriptionId, montant, observations = '') {
    try {
      const response = await api.post(
        API_CONFIG.ENDPOINTS.BONS_PAIEMENT.GENERER,
        { inscriptionId, montant, observations }
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Lister tous les bons (GET /api/bons-paiement)
   */
  static async listerTous() {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.BONS_PAIEMENT.LIST_ALL);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Obtenir un bon par ID (GET /api/bons-paiement/:id)
   */
  static async getById(id) {
    try {
      const endpoint = buildUrl(API_CONFIG.ENDPOINTS.BONS_PAIEMENT.GET_BY_ID, { id });
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Obtenir un bon par numéro (GET /api/bons-paiement/numero/:numero)
   */
  static async getByNumero(numero) {
    try {
      const endpoint = buildUrl(API_CONFIG.ENDPOINTS.BONS_PAIEMENT.GET_BY_NUMERO, { numero });
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Lister les bons d'une inscription (GET /api/bons-paiement/inscription/:inscriptionId)
   */
  static async getByInscription(inscriptionId) {
    try {
      const endpoint = buildUrl(API_CONFIG.ENDPOINTS.BONS_PAIEMENT.BY_INSCRIPTION, { inscriptionId });
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Lister les bons actifs (non utilisés) d'une inscription (GET /api/bons-paiement/inscription/:inscriptionId/actifs)
   */
  static async getActifsByInscription(inscriptionId) {
    try {
      const endpoint = buildUrl(API_CONFIG.ENDPOINTS.BONS_PAIEMENT.ACTIFS_BY_INSCRIPTION, { inscriptionId });
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // ════════════════════════════════════════════════════════════════
  //  ACTIONS
  // ════════════════════════════════════════════════════════════════

  /**
   * Vérifier la validité d'un bon (GET /api/bons-paiement/:numero/verifier)
   */
  static async verifier(numero) {
    try {
      const endpoint = buildUrl(API_CONFIG.ENDPOINTS.BONS_PAIEMENT.VERIFIER, { numero });
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Annuler un bon de paiement (POST /api/bons-paiement/:id/annuler)
   */
  static async annuler(id, motif = 'Annulation administrative') {
    try {
      const endpoint = buildUrl(API_CONFIG.ENDPOINTS.BONS_PAIEMENT.ANNULER, { id });
      const response = await api.post(endpoint, { motif });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

export default BonDePaiementService;
