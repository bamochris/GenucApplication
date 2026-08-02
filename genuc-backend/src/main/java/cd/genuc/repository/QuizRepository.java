// cd.genuc.repository.QuizRepository.java
package cd.genuc.repository;

import cd.genuc.model.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByCoursId(Long coursId);
    List<Quiz> findByCoursIdAndStatut(Long coursId, Quiz.StatutQuiz statut);
    List<Quiz> findByDateDebutBeforeAndDateFinAfter(LocalDateTime now, LocalDateTime now2);
}