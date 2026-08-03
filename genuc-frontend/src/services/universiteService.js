// src/services/universiteService.js
import api from '../api/axios';

const universiteService = {
  // ── PUBLIC ──────────────────────────────────────────────────
  listerToutes: () =>
    api.get('/api/universites/public'),

  listerInscriptionsOuvertes: () =>
    api.get('/api/universites/public/ouvertes'),

  getUniversite: (id) =>
    api.get(`/api/universites/public/${id}`),

  getDepartements: (universiteId) =>
    api.get(`/api/universites/public/${universiteId}/departements`),

  // ── SUPER_ADMIN ─────────────────────────────────────────────
  creer: (data) =>
    api.post('/api/universites', data),

  desactiver: (id) =>
    api.delete(`/api/universites/${id}`),

  getStats: (id) =>
    api.get(`/api/universites/${id}/stats`),

  // Retirés : `getUniversiteComplete` visait GET /api/super-admin/universites/{id}/complet
  // et `getDashboard` visait GET /api/super-admin/dashboard. Aucun de ces deux
  // chemins n'existe côté backend (SuperAdminController n'expose que /stats,
  // /stats/universites, /stats/completes, /stats/paiements-mensuels et
  // POST /universites) : les câbler aurait produit un 404.

  // ── SUPER_ADMIN / ADMIN_UNIVERSITE ──────────────────────────
  modifier: (id, data) =>
    api.put(`/api/universites/${id}`, data),

  toggleInscriptions: (id) =>
    api.patch(`/api/universites/${id}/inscriptions`),
};

export default universiteService;