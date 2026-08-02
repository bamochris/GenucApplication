import api from '../api/axios';

const bibliothequeService = {
  // Livres
  listerLivres: (universiteId) => api.get(`/api/bibliotheque/livres/${universiteId}`),
  detailLivre: (id) => api.get(`/api/bibliotheque/livres/detail/${id}`),
  creerLivre: (data) => api.post('/api/bibliotheque/admin/livres', data),
  modifierLivre: (id, data) => api.put(`/api/bibliotheque/admin/livres/${id}`, data),
  supprimerLivre: (id) => api.delete(`/api/bibliotheque/admin/livres/${id}`),

  // Emprunts
  emprunter: (livreId, etudiantId) => api.post('/api/bibliotheque/emprunter', { livreId, etudiantId }),
  retourner: (empruntId) => api.put(`/api/bibliotheque/retourner/${empruntId}`),
  prolonger: (empruntId, jours) => api.patch(`/api/bibliotheque/prolonger/${empruntId}?jours=${jours}`),
  mesEmprunts: (etudiantId) => api.get(`/api/bibliotheque/mes-emprunts/${etudiantId}`),
};

export default bibliothequeService;