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

  getUniversiteComplete: (id) =>
    api.get(`/api/super-admin/universites/${id}/complet`),

  getDashboard: () =>
    api.get('/api/super-admin/dashboard'),

  // ── SUPER_ADMIN / ADMIN_UNIVERSITE ──────────────────────────
  modifier: (id, data) =>
    api.put(`/api/universites/${id}`, data),

  toggleInscriptions: (id) =>
    api.patch(`/api/universites/${id}/inscriptions`),
};

export default universiteService;