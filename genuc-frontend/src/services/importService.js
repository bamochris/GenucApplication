// src/services/importService.js
import api from '../api/axios';

export const importService = {
  /**
   * Analyse un fichier d'import (Excel, CSV, PDF) sans l'enregistrer.
   * Retourne le rapport d'analyse avec les anomalies détectées.
   */
  analyserFichier: async (file, coursId, anneeAcademique) => {
    const formData = new FormData();
    formData.append('fichier', file);
    formData.append('coursId', coursId);
    formData.append('anneeAcademique', anneeAcademique);

    const response = await api.post('/api/notes/import/analyser', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /**
   * Valide et enregistre l'import après correction éventuelle.
   * Envoie la liste des notes à enregistrer (éventuellement modifiées).
   */
  validerImport: async (coursId, notes, anneeAcademique) => {
    const response = await api.post(`/api/notes/import/valider/${coursId}`, {
      notes,
      anneeAcademique,
    });
    return response.data;
  },

  /**
   * Récupère les modèles de fichiers d'import.
   */
  telechargerModele: async (format = 'xlsx') => {
    const response = await api.get(`/api/notes/import/modele?format=${format}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `modele_import_notes.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};