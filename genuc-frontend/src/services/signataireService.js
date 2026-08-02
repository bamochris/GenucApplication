// src/services/signataireService.js
// Signataires électroniques d'une université + règles de signature par type de document
import api from '../api/axios';

export const signataireService = {
  lister: (universiteId, actifsSeuls = false) =>
    api.get(`/api/universites/${universiteId}/signataires`, { params: { actifsSeuls } }),

  creer: (universiteId, payload) => api.post(`/api/universites/${universiteId}/signataires`, payload),

  modifier: (id, payload) => api.put(`/api/signataires/${id}`, payload),

  supprimer: (id) => api.delete(`/api/signataires/${id}`),

  listerRegles: (universiteId) => api.get(`/api/universites/${universiteId}/regles-signature`),

  definirRegle: (universiteId, typeDocument, signataireId) =>
    api.put(`/api/universites/${universiteId}/regles-signature`, { typeDocument, signataireId }),

  verifier: (code) => api.get(`/api/signatures/verifier/${code}`),

  revoquer: (code, motif) => api.post(`/api/signatures/${code}/revoquer`, { motif }),
};

export default signataireService;
