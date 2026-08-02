// cd.genuc.repository.TentativeQuizRepository.java
package cd.genuc.repository;

import cd.genuc.model.TentativeQuiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TentativeQuizRepository extends JpaRepository<TentativeQuiz, Long> {
    List<TentativeQuiz> findByInscriptionIdAndQuizId(Long inscriptionId, Long quizId);
    long countByQuizIdAndInscriptionId(Long quizId, Long inscriptionId);
}