// src/services/deliberationService.js
import api from '../api/axios';

const BASE_URL = '/api/deliberation';

export const deliberationService = {
  // Récupérer les paramètres LMD
  getParametres: () => api.get(`${BASE_URL}/parametres`),
  
  // Mettre à jour les paramètres LMD
  updateParametres: (data) => api.put(`${BASE_URL}/parametres`, data),
  
  // Récupérer la délibération d'un semestre
  getDeliberationSemestre: (semestreId) => api.get(`${BASE_URL}/semestre/${semestreId}`),
  
  // Récupérer la délibération annuelle
  getDeliberationAnnuelle: (anneeAcademique) => api.get(`${BASE_URL}/annuelle/${anneeAcademique}`),
  
  // Mettre à jour le statut d'un étudiant (ex: pour CJ)
  updateStatut: (id, statut) => api.patch(`${BASE_URL}/${id}/statut`, { statut }),
  
  // Valider la délibération (verrouillage)
  validerDeliberation: (semestreId) => api.post(`${BASE_URL}/semestre/${semestreId}/valider`),
  
  // Récupérer les données pour la pré-délibération
  getPreDeliberation: (semestreId) => api.get(`${BASE_URL}/pre-deliberation/${semestreId}`),
  
  // Lancer la consolidation
  consolider: (semestreId) => api.post(`${BASE_URL}/consolider/${semestreId}`),
  
  // Générer les PV (PDF)
  genererPV: (semestreId) => api.get(`${BASE_URL}/pv/${semestreId}`, { responseType: 'blob' }),
  
  // Récupérer les statistiques
  getStats: (semestreId) => api.get(`${BASE_URL}/stats/${semestreId}`),
  
  // Récupérer l'historique d'audit
  getAudit: (semestreId) => api.get(`${BASE_URL}/audit/${semestreId}`),
  
  // Soumettre un recours
  soumettreRecours: (data) => api.post('/api/recours', data),
  
  // Récupérer les recours de l'étudiant
  getRecoursEtudiant: () => api.get('/api/recours/etudiant'),
  
  // Gestion des recours par admin
  traiterRecours: (id, decision, commentaire) => api.put(`/api/recours/${id}`, { decision, commentaire }),
};