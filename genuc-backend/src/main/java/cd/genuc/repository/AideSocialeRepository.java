package cd.genuc.repository;

import cd.genuc.model.AideSociale;
import cd.genuc.model.AideSociale.StatutAide;
import cd.genuc.model.AideSociale.TypeAide;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AideSocialeRepository extends JpaRepository<AideSociale, Long> {

    List<AideSociale> findByEtudiantId(Long etudiantId);

    List<AideSociale> findByStatut(StatutAide statut);

    List<AideSociale> findByType(TypeAide type);

    List<AideSociale> findByDossierSocialInscriptionUniversiteId(Long universiteId);

    List<AideSociale> findByDossierSocialInscriptionUniversiteIdAndStatut(Long universiteId, StatutAide statut);

    long countByDossierSocialInscriptionUniversiteIdAndStatut(Long universiteId, StatutAide statut);
}