// src/services/informationBancaireService.js
// Coordonnées bancaires par université — affichées sur les bons de paiement (QR code + PDF)
import api from '../api/axios';

const BASE_URL = '/api/informations-bancaires';

export const informationBancaireService = {
  lister: (universiteId) => api.get(`${BASE_URL}/universite/${universiteId}`),

  // Comptes ACTIFS, mis en forme par le backend ({ nom, compte, devise, intitule }).
  // Accessible à l'étudiant : ces coordonnées figurent déjà sur son bon de caisse.
  listerActifs: (universiteId) => api.get(`${BASE_URL}/universite/${universiteId}/actifs`),

  creer: (payload) => api.post(BASE_URL, payload),

  modifier: (id, payload) => api.put(`${BASE_URL}/${id}`, payload),

  supprimer: (id) => api.delete(`${BASE_URL}/${id}`),
};

export default informationBancaireService;
