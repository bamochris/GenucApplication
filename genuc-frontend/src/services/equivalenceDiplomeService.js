// src/services/equivalenceDiplomeService.js
// Demandes de reconnaissance d'équivalence de diplôme — /api/equivalences
import api from '../api/axios';

const BASE_URL = '/api/equivalences';

export const equivalenceDiplomeService = {
  soumettre: (formData) => api.post(BASE_URL, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  listerParEtudiant: (userId) => api.get(`${BASE_URL}/etudiant/${userId}`),

  getById: (id) => api.get(`${BASE_URL}/${id}`),

  annuler: (id, userId) => api.delete(`${BASE_URL}/${id}`, { params: { userId } }),

  listerPourCommission: (universiteId, statut) =>
    api.get(`${BASE_URL}/universite/${universiteId}`, { params: statut ? { statut } : {} }),

  traiter: (id, payload) => api.patch(`${BASE_URL}/${id}/traiter`, payload),
};

export default equivalenceDiplomeService;
