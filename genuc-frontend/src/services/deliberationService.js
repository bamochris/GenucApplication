// src/services/deliberationService.js
import api from '../api/axios';

/**
 * Service central pour le module Délibération
 * Tous les appels API vers le backend Spring Boot
 */
const deliberationService = {

  // ─── PARAMÈTRES LMD ──────────────────────────────────────────

  /**
   * Récupère les paramètres LMD d'une université
   * @param {number} universiteId
   * @returns {Promise<Object>} Paramètres LMD
   */
  getParametresLMD: async (universiteId) => {
    const response = await api.get(`/api/deliberation/parametres/${universiteId}`);
    return response.data;
  },

  /**
   * Met à jour les paramètres LMD d'une université
   * @param {number} universiteId
   * @param {Object} params - Nouveaux paramètres
   * @returns {Promise<Object>} Paramètres mis à jour
   */
  updateParametresLMD: async (universiteId, params) => {
    const response = await api.put(`/api/deliberation/parametres/${universiteId}`, params);
    return response.data;
  },

  // ─── PRÉPARATION DES DÉLIBÉRATIONS ───────────────────────────

  /**
   * Prépare une délibération pour un étudiant (inscription)
   * @param {number} inscriptionId
   * @param {string} annee - Année académique (ex: "2025-2026")
   * @returns {Promise<Object>} Délibération créée/mise à jour
   */
  preparer: async (inscriptionId, annee) => {
    const response = await api.post('/api/deliberation/preparer', null, {
      params: { inscriptionId, annee }
    });
    return response.data;
  },

  /**
   * Prépare les délibérations pour un département (batch)
   * @param {number} departementId
   * @param {string} annee
   * @param {string} niveau - Niveau d'études (L1, L2, etc.)
   * @returns {Promise<Object>} Résultat du batch
   */
  preparerParDepartement: async (departementId, annee, niveau) => {
    const response = await api.post('/api/deliberation/preparer/departement', null, {
      params: { departementId, annee, niveau }
    });
    return response.data;
  },

  // ─── CONSOLIDATION ASYNCHRONE ───────────────────────────────

  /**
   * Lance la consolidation asynchrone pour une université
   * @param {number} universiteId
   * @param {string} annee
   * @returns {Promise<{jobId: string}>} Identifiant du job
   */
  lancerConsolidation: async (universiteId, annee) => {
    const response = await api.post('/api/deliberation/consolider', null, {
      params: { universiteId, annee }
    });
    return response.data; // { jobId, status, ... }
  },

  /**
   * Récupère le statut d'un job de consolidation
   * @param {string} jobId
   * @returns {Promise<Object>} Progression (progress, status, result, etc.)
   */
  getConsolidationStatus: async (jobId) => {
    const response = await api.get(`/api/deliberation/consolider/status/${jobId}`);
    return response.data;
  },

  // ─── TENUE DU JURY ───────────────────────────────────────────

  /**
   * Met à jour une délibération (tenue du jury)
   * @param {number} deliberationId
   * @param {Object} data - { decision, commentaireJury, presidentJuryId, presidentJuryNom }
   * @returns {Promise<Object>} Délibération mise à jour
   */
  tenueJury: async (deliberationId, data) => {
    const response = await api.patch(`/api/deliberation/${deliberationId}/tenue`, data);
    return response.data;
  },

  // ─── PUBLICATION ─────────────────────────────────────────────

  /**
   * Publie une délibération (rend les résultats visibles)
   * @param {number} deliberationId
   * @returns {Promise<Object>} Délibération publiée
   */
  publier: async (deliberationId) => {
    const response = await api.post(`/api/deliberation/${deliberationId}/publier`);
    return response.data;
  },

  /**
   * Publie toutes les délibérations d'un département
   * @param {number} departementId
   * @param {string} annee
   * @returns {Promise<{count: number}>} Nombre de publications
   */
  publierDepartement: async (departementId, annee) => {
    const response = await api.post('/api/deliberation/publier/departement', null, {
      params: { departementId, annee }
    });
    return response.data;
  },

  // ─── CONSULTATION ─────────────────────────────────────────────

  /**
   * Récupère une délibération par son ID
   * @param {number} id
   * @returns {Promise<Object>} Délibération
   */
  getById: async (id) => {
    const response = await api.get(`/api/deliberation/${id}`);
    return response.data;
  },

  /**
   * Récupère la délibération d'un étudiant pour une année
   * @param {number} inscriptionId
   * @param {string} annee
   * @returns {Promise<Object>} Délibération ou null
   */
  getByInscription: async (inscriptionId, annee) => {
    const response = await api.get(`/api/deliberation/inscription/${inscriptionId}`, {
      params: { annee }
    });
    return response.data;
  },

  /**
   * Liste les délibérations d'une université (avec pagination)
   * @param {number} universiteId
   * @param {string} annee
   * @param {number} page - Index de page (0-based)
   * @param {number} size - Taille de page
   * @returns {Promise<{content: Array, totalElements: number, totalPages: number}>}
   */
  getListe: async (universiteId, annee, page = 0, size = 50) => {
    const response = await api.get('/api/deliberation/liste', {
      params: { universiteId, annee, page, size }
    });
    return response.data;
  },

  // ─── STATISTIQUES ─────────────────────────────────────────────

  /**
   * Statistiques avancées pour une université
   * @param {number} universiteId
   * @param {string} annee
   * @returns {Promise<Object>} Stats (total, pa, pd, pp, cj, distribution, evolution)
   */
  getStatsAvancees: async (universiteId, annee) => {
    const response = await api.get('/api/deliberation/stats/avancees', {
      params: { universiteId, annee }
    });
    return response.data;
  },

  /**
   * Statistiques basiques pour une université
   * @param {number} universiteId
   * @param {string} annee
   * @returns {Promise<Object>} Stats (total, admis, diplomes, redoublants, taux)
   */
  getStats: async (universiteId, annee) => {
    const response = await api.get('/api/deliberation/stats', {
      params: { universiteId, annee }
    });
    return response.data;
  },

  // ─── RELEVÉ DE NOTES / BULLETINS ─────────────────────────────

  /**
   * Génère le relevé de notes d'un étudiant (données structurées)
   * @param {number} inscriptionId
   * @param {string} annee
   * @returns {Promise<Object>} Relevé complet (notes, moyennes, etc.)
   */
  getReleve: async (inscriptionId, annee) => {
    const response = await api.get(`/api/deliberation/releve/${inscriptionId}`, {
      params: { annee }
    });
    return response.data;
  },

  /**
   * Télécharge le bulletin PDF
   * @param {number} inscriptionId
   * @param {string} annee
   * @param {string} type - 'ANNUEL' ou 'SEMESTRIEL'
   * @returns {Promise<Blob>} Fichier PDF
   */
  telechargerBulletin: async (inscriptionId, annee, type = 'ANNUEL') => {
    const response = await api.get(`/api/deliberation/bulletin/${inscriptionId}`, {
      params: { annee, type },
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Télécharge le relevé de notes PDF
   * @param {number} inscriptionId
   * @param {string} annee
   * @returns {Promise<Blob>} Fichier PDF
   */
  telechargerReleve: async (inscriptionId, annee) => {
    const response = await api.get(`/api/deliberation/releve/telecharger/${inscriptionId}`, {
      params: { annee },
      responseType: 'blob'
    });
    return response.data;
  },

  // ─── AUDIT ─────────────────────────────────────────────────────

  /**
   * Récupère l'historique des actions (audit)
   * @param {number} universiteId
   * @param {Object} filters - { action, utilisateur, dateDebut, dateFin, page, size }
   * @returns {Promise<Object>} Liste paginée des logs
   */
  getAudit: async (universiteId, filters = {}) => {
    const params = { universiteId, ...filters };
    const response = await api.get('/api/deliberation/audit', { params });
    return response.data;
  },

  // ─── VÉRIFICATION DIPLÔME (public) ─────────────────────────

  /**
   * Vérifie l'authenticité d'un diplôme via son UUID
   * @param {string} uuid
   * @returns {Promise<Object>} Informations du diplôme
   */
  verifierDiplome: async (uuid) => {
    const response = await api.get(`/api/deliberation/verifier/${uuid}`);
    return response.data;
  },

  // ─── IMPORT (si besoin) ──────────────────────────────────────

  /**
   * Importe des notes en batch (depuis un fichier déjà analysé)
   * @param {Array} notesData - Liste d'objets { matricule, note }
   * @param {number} coursId
   * @param {string} annee
   * @returns {Promise<Object>} Résultat de l'import
   */
  importerNotesBatch: async (notesData, coursId, annee) => {
    const response = await api.post('/api/deliberation/import/notes', {
      notes: notesData,
      coursId,
      annee
    });
    return response.data;
  },

  // ─── RECOURS (si intégré) ────────────────────────────────────

  /**
   * Liste les recours d'un étudiant
   * @param {number} etudiantId
   * @returns {Promise<Array>} Liste des recours
   */
  getRecoursEtudiant: async (etudiantId) => {
    const response = await api.get(`/api/deliberation/recours/etudiant/${etudiantId}`);
    return response.data;
  },

  /**
   * Soumet un recours
   * @param {Object} recours - { type, description, coursId, annee, pieceJointe (File) }
   * @param {number} etudiantId
   * @returns {Promise<Object>} Recours créé
   */
  soumettreRecours: async (etudiantId, recours) => {
    const formData = new FormData();
    formData.append('type', recours.type);
    formData.append('description', recours.description);
    if (recours.coursId) formData.append('coursId', recours.coursId);
    if (recours.annee) formData.append('annee', recours.annee);
    if (recours.pieceJointe) formData.append('pieceJointe', recours.pieceJointe);

    const response = await api.post(`/api/deliberation/recours/etudiant/${etudiantId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  /**
   * Traite un recours (admin)
   * @param {number} recoursId
   * @param {string} decision - 'ACCEPTE' ou 'REFUSE'
   * @param {string} commentaire
   * @returns {Promise<Object>} Recours mis à jour
   */
  traiterRecours: async (recoursId, decision, commentaire = '') => {
    const response = await api.put(`/api/deliberation/recours/${recoursId}`, {
      decision,
      commentaire
    });
    return response.data;
  },

  /**
   * Liste tous les recours (admin)
   * @param {number} universiteId
   * @param {string} statut - 'TOUS', 'SOUMIS', 'EN_COURS', 'ACCEPTE', 'REFUSE'
   * @returns {Promise<Array>} Liste des recours
   */
  getRecoursAdmin: async (universiteId, statut = 'TOUS') => {
    const response = await api.get('/api/deliberation/recours/admin', {
      params: { universiteId, statut }
    });
    return response.data;
  },
};

export default deliberationService;