package cd.genuc.repository;

import cd.genuc.model.ValidationPaie;
import cd.genuc.model.ValidationPaie.StatutValidation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ValidationPaieRepository extends JpaRepository<ValidationPaie, Long> {

    Optional<ValidationPaie> findByPaieId(Long paieId);

    List<ValidationPaie> findByStatut(StatutValidation statut);

    List<ValidationPaie> findByValideParId(Long valideParId);

    List<ValidationPaie> findByCreeParId(Long creeParId);
}