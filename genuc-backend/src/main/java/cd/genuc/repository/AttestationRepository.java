package cd.genuc.repository;

import cd.genuc.model.Attestation;
import cd.genuc.model.Attestation.StatutAttestation;
import cd.genuc.model.Attestation.TypeAttestation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttestationRepository extends JpaRepository<Attestation, Long> {

    List<Attestation> findByInscriptionIdOrderByDateDemandeDesc(Long inscriptionId);

    List<Attestation> findByUniversiteIdAndStatut(Long universiteId, StatutAttestation statut);

    List<Attestation> findByUniversiteId(Long universiteId);

    Optional<Attestation> findByUuidVerification(String uuid);

    Optional<Attestation> findByNumeroAttestation(String numeroAttestation);

    Optional<Attestation> findFirstByInscriptionIdAndCodeDocumentOrderByDateDemandeDesc(Long inscriptionId, String codeDocument);

    boolean existsByInscriptionIdAndTypeAndStatut(Long inscriptionId, TypeAttestation type, StatutAttestation statut);

    long countByUniversiteIdAndStatut(Long universiteId, StatutAttestation statut);
}