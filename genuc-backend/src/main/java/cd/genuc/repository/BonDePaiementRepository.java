package cd.genuc.repository;

import cd.genuc.model.BonDePaiement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BonDePaiementRepository extends JpaRepository<BonDePaiement, Long> {

    Optional<BonDePaiement> findByNumero(String numero);

    List<BonDePaiement> findByInscriptionId(Long inscriptionId);

    List<BonDePaiement> findByInscriptionIdAndUtiliseFalse(Long inscriptionId);

    List<BonDePaiement> findByDateExpirationBeforeAndUtiliseFalse(LocalDate date);
}