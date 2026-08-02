// cd.genuc.repository.LigneReleveRepository.java
package cd.genuc.repository;

import cd.genuc.model.LigneReleve;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LigneReleveRepository extends JpaRepository<LigneReleve, Long> {

    List<LigneReleve> findByReleveId(Long releveId);
    
    List<LigneReleve> findByCoursId(Long coursId);
    
    void deleteByReleveId(Long releveId);
}