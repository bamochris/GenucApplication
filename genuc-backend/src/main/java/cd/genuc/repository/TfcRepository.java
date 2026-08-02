package cd.genuc.repository;

import cd.genuc.model.Tfc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TfcRepository extends JpaRepository<Tfc, Long> {

    List<Tfc> findByProfesseurIdOrderByDateCreationDesc(Long professeurId);

    Optional<Tfc> findFirstByInscriptionIdOrderByDateCreationDesc(Long inscriptionId);

    List<Tfc> findByInscriptionId(Long inscriptionId);

    List<Tfc> findByStatutNot(Tfc.StatutTfc statut);
}
