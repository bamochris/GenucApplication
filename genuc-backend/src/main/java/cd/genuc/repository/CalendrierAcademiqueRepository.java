package cd.genuc.repository;

import cd.genuc.model.CalendrierAcademique;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface CalendrierAcademiqueRepository extends JpaRepository<CalendrierAcademique, Long> {

    List<CalendrierAcademique> findByUniversiteId(Long universiteId);

    List<CalendrierAcademique> findByUniversiteIdAndActifTrue(Long universiteId);

    @Query("SELECT c FROM CalendrierAcademique c WHERE c.universite.id = :uniId AND c.dateDebut <= :date AND c.dateFin >= :date")
    List<CalendrierAcademique> findEvenementsActifsParDate(Long uniId, LocalDate date);

    List<CalendrierAcademique> findByUniversiteIdOrderByDateDebutAsc(Long universiteId);
}