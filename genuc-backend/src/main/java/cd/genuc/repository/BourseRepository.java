package cd.genuc.repository;

import cd.genuc.model.Bourse;
import cd.genuc.model.Bourse.StatutBourse;
import cd.genuc.model.Bourse.TypeBourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BourseRepository extends JpaRepository<Bourse, Long> {

    List<Bourse> findByDossierSocialEtudiantId(Long etudiantId);

    List<Bourse> findByStatut(StatutBourse statut);

    List<Bourse> findByType(TypeBourse type);

    Optional<Bourse> findByNumeroBourse(String numeroBourse);

    List<Bourse> findByDossierSocialInscriptionUniversiteIdAndStatut(Long universiteId, StatutBourse statut);

    long countByDossierSocialInscriptionUniversiteIdAndStatut(Long universiteId, StatutBourse statut);

    @org.springframework.data.jpa.repository.Query("SELECT SUM(b.montantTotal) FROM Bourse b WHERE b.dossierSocial.inscription.universite.id = :universiteId AND b.statut = 'ACTIVE'")
    Double sumMontantTotalActifByUniversite(Long universiteId);
}