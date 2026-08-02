// cd.genuc.repository.ReponseRepository.java
package cd.genuc.repository;

import cd.genuc.model.Reponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReponseRepository extends JpaRepository<Reponse, Long> {

    List<Reponse> findByQuestionId(Long questionId);
    
    List<Reponse> findByQuestionIdAndCorrecteTrue(Long questionId);
    
    long countByQuestionId(Long questionId);
}