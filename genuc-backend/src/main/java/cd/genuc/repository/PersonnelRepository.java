package cd.genuc.repository;

import cd.genuc.model.Personnel;
import cd.genuc.model.Personnel.StatutPersonnel;
import cd.genuc.model.Personnel.TypePersonnel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PersonnelRepository extends JpaRepository<Personnel, Long> {

    List<Personnel> findByUniversiteId(Long universiteId);

    List<Personnel> findByDepartementId(Long departementId);

    List<Personnel> findByUniversiteIdAndStatut(Long universiteId, StatutPersonnel statut);

    List<Personnel> findByUniversiteIdAndType(Long universiteId, TypePersonnel type);

    Optional<Personnel> findByMatriculePersonnel(String matricule);

    boolean existsByEmail(String email);

    long countByUniversiteId(Long universiteId);

    long countByUniversiteIdAndType(Long universiteId, TypePersonnel type);

    long countByUniversiteIdAndStatut(Long universiteId, StatutPersonnel statut);
}