// src/services/inscriptionStorage.js
const STORAGE_KEY = 'genuc_inscription_draft';

export const inscriptionStorage = {
  save: (data) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Erreur sauvegarde brouillon:', e);
      return false;
    }
  },
  load: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Erreur chargement brouillon:', e);
      return null;
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      console.error('Erreur suppression brouillon:', e);
      return false;
    }
  },
  hasDraft: () => {
    return !!localStorage.getItem(STORAGE_KEY);
  }
};