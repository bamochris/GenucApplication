// cd.genuc.service.QuizService.java
package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepo;
    private final QuestionRepository questionRepo;
    private final TentativeQuizRepository tentativeRepo;
    private final InscriptionRepository inscriptionRepo;

    // Créer un quiz
    @Transactional
    public Quiz creerQuiz(Quiz quiz) {
        return quizRepo.save(quiz);
    }

    // Ajouter une question
    @Transactional
    public Question ajouterQuestion(Long quizId, Question question) {
        Quiz quiz = quizRepo.findById(quizId)
            .orElseThrow(() -> new RuntimeException("Quiz introuvable"));
        question.setQuiz(quiz);
        return questionRepo.save(question);
    }

    // Publier un quiz
    @Transactional
    public Quiz publierQuiz(Long quizId) {
        Quiz quiz = quizRepo.findById(quizId)
            .orElseThrow(() -> new RuntimeException("Quiz introuvable"));
        
        if (quiz.getQuestions().isEmpty()) {
            throw new RuntimeException("Impossible de publier un quiz sans questions");
        }
        
        quiz.setStatut(Quiz.StatutQuiz.PUBLIE);
        return quizRepo.save(quiz);
    }

    // Démarrer une tentative
    @Transactional
    public TentativeQuiz demarrerTentative(Long quizId, Long inscriptionId) {
        Quiz quiz = quizRepo.findById(quizId)
            .orElseThrow(() -> new RuntimeException("Quiz introuvable"));
        
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
            .orElseThrow(() -> new RuntimeException("Inscription introuvable"));
        
        // Vérifier le nombre de tentatives
        long nbTentatives = tentativeRepo.countByQuizIdAndInscriptionId(quizId, inscriptionId);
        if (nbTentatives >= quiz.getTentativeMax()) {
            throw new RuntimeException("Nombre maximum de tentatives atteint");
        }
        
        TentativeQuiz tentative = TentativeQuiz.builder()
            .quiz(quiz)
            .inscription(inscription)
            .tentativeNumero((int) nbTentatives + 1)
            .statut(TentativeQuiz.StatutTentative.EN_COURS)
            .build();
        
        return tentativeRepo.save(tentative);
    }

    // Soumettre une tentative
    @Transactional
    public TentativeQuiz soumettreTentative(Long tentativeId, Map<Long, String> reponses) {
        TentativeQuiz tentative = tentativeRepo.findById(tentativeId)
            .orElseThrow(() -> new RuntimeException("Tentative introuvable"));
        
        Quiz quiz = tentative.getQuiz();
        double noteTotale = 0;
        double totalPoints = 0;
        
        for (Question question : quiz.getQuestions()) {
            totalPoints += question.getPoints();
            String reponseEtudiant = reponses.get(question.getId());
            tentative.getReponses().put(question.getId(), reponseEtudiant);
            
            double noteQuestion = calculerNoteQuestion(question, reponseEtudiant);
            tentative.getNotesParQuestion().put(question.getId(), noteQuestion);
            noteTotale += noteQuestion;
        }
        
        // Calculer la note sur 20
        double noteSur20 = totalPoints > 0 ? (noteTotale / totalPoints) * quiz.getNoteSur() : 0;
        tentative.setNoteTotale(Math.round(noteSur20 * 100.0) / 100.0);
        tentative.setReussi(noteSur20 >= quiz.getSeuilReussite());
        tentative.setStatut(TentativeQuiz.StatutTentative.TERMINE);
        tentative.setDateFin(LocalDateTime.now());
        
        return tentativeRepo.save(tentative);
    }
    
    private double calculerNoteQuestion(Question question, String reponseEtudiant) {
        if (reponseEtudiant == null) return 0;
        
        switch (question.getType()) {
            case QCM:
            case UNIQUE:
            case VRAI_FAUX:
                boolean correct = question.getReponses().stream()
                    .filter(Reponse::isCorrecte)
                    .anyMatch(r -> r.getTexte().equalsIgnoreCase(reponseEtudiant));
                return correct ? question.getPoints() : 0;
            default:
                return 0; // Réponse à évaluer manuellement
        }
    }
    
    // Obtenir les résultats d'un étudiant
    public List<TentativeQuiz> getResultatsEtudiant(Long inscriptionId, Long quizId) {
        return tentativeRepo.findByInscriptionIdAndQuizId(inscriptionId, quizId);
    }
}