// src/services/financeService.js
import api from '../api/axios';

export const financeService = {
  /**
   * Récupère le solde (dette éventuelle) d'un étudiant
   * @param {string|number} etudiantId - ID de l'étudiant
   * @returns {Promise<{montantRestant: number, devise: string, statut: string}>}
   */
  getSolde: async () => {
    const response = await api.get('/api/etudiant/frais/situation');
    return {
      montantRestant: response.data.totalReste,
      devise: 'USD',
      statut: response.data.estSolde ? 'A_JOUR' : 'EN_RETARD'
    };
  },

  /**
   * Vérifie si l'étudiant est à jour de ses paiements
   * @param {string|number} etudiantId
   * @returns {Promise<boolean>}
   */
  estAJour: async (etudiantId) => {
    const solde = await financeService.getSolde(etudiantId);
    return solde.montantRestant <= 0;
  }
};