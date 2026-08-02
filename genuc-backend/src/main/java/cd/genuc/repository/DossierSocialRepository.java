package cd.genuc.repository;

import cd.genuc.model.DossierSocial;
import cd.genuc.model.DossierSocial.StatutDossierSocial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DossierSocialRepository extends JpaRepository<DossierSocial, Long> {

    Optional<DossierSocial> findByEtudiantId(Long etudiantId);

    Optional<DossierSocial> findByInscriptionId(Long inscriptionId);

    List<DossierSocial> findByStatut(StatutDossierSocial statut);

    List<DossierSocial> findByStatutAndInscriptionUniversiteId(StatutDossierSocial statut, Long universiteId);

    boolean existsByEtudiantId(Long etudiantId);
}