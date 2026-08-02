// src/services/vacationService.js
// Wrapper autour des 21 endpoints REST de /api/vacations (système "Vacation Jour / Vacation Soir")
import api from '../api/axios';

const BASE_URL = '/api/vacations';

export const vacationService = {
  // ══════════════════════════════════════════
  // VACATIONS — CRUD
  // ══════════════════════════════════════════

  listerParUniversite: (universiteId) => api.get(`${BASE_URL}/universite/${universiteId}`),

  listerActives: (universiteId) => api.get(`${BASE_URL}/universite/${universiteId}/actives`),

  listerInscriptionsOuvertes: (universiteId) => api.get(`${BASE_URL}/universite/${universiteId}/inscriptions-ouvertes`),

  listerParType: (universiteId, type) => api.get(`${BASE_URL}/universite/${universiteId}/type/${type}`),

  getById: (id) => api.get(`${BASE_URL}/${id}`),

  creer: (vacation, universiteId, anneeAcademiqueId) =>
    api.post(BASE_URL, vacation, { params: { universiteId, anneeAcademiqueId } }),

  modifier: (id, vacation) => api.put(`${BASE_URL}/${id}`, vacation),

  ouvrirInscriptions: (id) => api.patch(`${BASE_URL}/${id}/ouvrir-inscriptions`),

  fermerInscriptions: (id) => api.patch(`${BASE_URL}/${id}/fermer-inscriptions`),

  archiver: (id) => api.patch(`${BASE_URL}/${id}/archiver`),

  supprimer: (id) => api.delete(`${BASE_URL}/${id}`),

  // ══════════════════════════════════════════
  // COURS VACATION
  // ══════════════════════════════════════════

  listerCours: (vacationId) => api.get(`${BASE_URL}/${vacationId}/cours`),

  listerCoursParPromotion: (vacationId, promotionId) =>
    api.get(`${BASE_URL}/${vacationId}/cours/promotion/${promotionId}`),

  listerCoursParProfesseur: (professeurId) => api.get(`${BASE_URL}/professeur/${professeurId}/cours`),

  ajouterCours: (vacationId, coursVacation, coursId, professeurId, promotionId) =>
    api.post(`${BASE_URL}/${vacationId}/cours`, coursVacation, {
      params: { coursId, professeurId: professeurId || undefined, promotionId },
    }),

  supprimerCours: (coursVacationId) => api.delete(`${BASE_URL}/cours/${coursVacationId}`),

  // ══════════════════════════════════════════
  // INSCRIPTIONS VACATION (ÉTUDIANTS)
  // ══════════════════════════════════════════

  listerInscriptions: (vacationId) => api.get(`${BASE_URL}/${vacationId}/inscriptions`),

  listerInscriptionsParEtudiant: (etudiantId) => api.get(`${BASE_URL}/etudiant/${etudiantId}/inscriptions`),

  listerInscriptionsEtudiantParAnnee: (etudiantId, anneeAcademiqueId) =>
    api.get(`${BASE_URL}/etudiant/${etudiantId}/inscriptions/annee/${anneeAcademiqueId}`),

  inscrireEtudiant: (vacationId, etudiantId, promotionId, anneeAcademiqueId) =>
    api.post(`${BASE_URL}/${vacationId}/inscriptions`, null, {
      params: { etudiantId, promotionId, anneeAcademiqueId },
    }),

  validerInscription: (inscriptionId) => api.patch(`${BASE_URL}/inscriptions/${inscriptionId}/valider`),

  rejeterInscription: (inscriptionId, motif) =>
    api.patch(`${BASE_URL}/inscriptions/${inscriptionId}/rejeter`, { motif }),

  desinscrireEtudiant: (inscriptionId) => api.delete(`${BASE_URL}/inscriptions/${inscriptionId}`),

  compterInscriptions: (vacationId) => api.get(`${BASE_URL}/${vacationId}/inscriptions/count`),
};

export default vacationService;
