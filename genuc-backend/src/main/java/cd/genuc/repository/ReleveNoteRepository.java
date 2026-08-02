// cd.genuc.repository.ReleveNoteRepository.java
package cd.genuc.repository;

import cd.genuc.model.ReleveNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReleveNoteRepository extends JpaRepository<ReleveNote, Long> {

    Optional<ReleveNote> findByInscriptionIdAndAnneeAcademique(Long inscriptionId, String anneeAcademique);
    
    List<ReleveNote> findByInscriptionIdOrderByAnneeAcademiqueDesc(Long inscriptionId);
    
    Optional<ReleveNote> findByUuidVerification(String uuid);
    
    Optional<ReleveNote> findByNumeroReleve(String numeroReleve);
    
    boolean existsByInscriptionIdAndAnneeAcademique(Long inscriptionId, String anneeAcademique);
    
    List<ReleveNote> findByPublieTrue();
}