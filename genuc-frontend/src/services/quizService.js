import api from '../api/axios';

const quizService = {
  // Récupérer tous les quiz d'un cours (publiés)
  getQuizByCours: (coursId) => api.get(`/api/quiz/cours/${coursId}`),

  // Démarrer une tentative
  demarrerTentative: (quizId, inscriptionId) => api.post('/api/quiz/tentative', { quizId, inscriptionId }),

  // Soumettre une tentative (avec les réponses)
  soumettreTentative: (tentativeId, reponses) => api.post(`/api/quiz/tentative/${tentativeId}/soumettre`, { reponses }),

  // Récupérer les résultats d'un étudiant pour un quiz
  getResultats: (inscriptionId, quizId) => api.get(`/api/quiz/resultats/${inscriptionId}/${quizId}`),
};

export default quizService;