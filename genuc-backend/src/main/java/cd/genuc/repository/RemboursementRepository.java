// cd.genuc.repository.RemboursementRepository.java
package cd.genuc.repository;

import cd.genuc.model.Remboursement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RemboursementRepository extends JpaRepository<Remboursement, Long> {

    List<Remboursement> findByEtudiantId(Long etudiantId);
    
    List<Remboursement> findByStatut(Remboursement.StatutRemboursement statut);
    
    Optional<Remboursement> findByReferenceRemboursement(String reference);
    
    List<Remboursement> findByVerificateurId(Long verificateurId);
    
    List<Remboursement> findByValidateurMotifId(Long validateurMotifId);
    
    List<Remboursement> findByAutorisateurId(Long autorisateurId);
}