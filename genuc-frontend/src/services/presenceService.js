// src/services/presenceService.js
import api from '../api/axios';

const presenceService = {
  genererQR: (coursId, seanceId) =>
    api.get(`/api/presences/generer-qr?coursId=${coursId}&seanceId=${seanceId || ''}`, {
      responseType: 'blob'
    }),
  scanner: (qrData) =>
    api.post('/api/presences/scanner', { payload: qrData }),
  justifier: (presenceId, motif) =>
    api.patch(`/api/presences/${presenceId}/justifier`, { motif }),
  getPresencesCours: (coursId, date) =>
    api.get(`/api/presences/cours/${coursId}?date=${date}`),
  getTableau: (coursId, date) =>
    api.get(`/api/presences/cours/${coursId}/tableau?date=${date}`),
};

export default presenceService;