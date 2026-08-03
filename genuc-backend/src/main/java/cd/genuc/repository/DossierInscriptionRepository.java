package cd.genuc.repository;

import cd.genuc.model.DossierInscription;
import cd.genuc.model.DossierInscription.StatutDossier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DossierInscriptionRepository extends JpaRepository<DossierInscription, Long> {

    Optional<DossierInscription> findByNumeroDossier(String numeroDossier);

    List<DossierInscription> findByUniversiteIdAndStatutOrderByCreeLeDesc(Long universiteId, StatutDossier statut);

    List<DossierInscription> findByUniversiteIdOrderByCreeLeDesc(Long universiteId);

    boolean existsByEmail(String email);

    boolean existsByTelephoneAndUniversiteId(String telephone, Long universiteId);

    // Pas de existsByMatricule ici : un dossier est déposé par un candidat qui
    // n'a pas encore de matricule — celui-ci n'est attribué qu'à la validation,
    // sur l'Inscription. DossierInscription ne porte donc aucun champ matricule
    // et une telle requête dérivée fait échouer le démarrage du contexte Spring
    // (« No property 'matricule' found »), sans que la compilation ne bronche.

    long countByUniversiteId(Long universiteId);

    // Attribution des dossiers à un agent d'admissions (round-robin par charge).
    long countByAgentAdmissionId(Long agentAdmissionId);

    List<DossierInscription> findByAgentAdmissionIdOrderByCreeLeDesc(Long agentAdmissionId);

	Optional<DossierInscription> findByEmail(String email);


    // ─── Contrôle d'accès aux pièces jointes (FichierAccesService) ───
    // Retrouve le dossier propriétaire d'un fichier à partir de l'URL stockée.
    // Liste (et non Optional) : deux colonnes peuvent théoriquement porter la
    // même URL, on ne veut pas d'exception sur un contrôle de sécurité.
    @org.springframework.data.jpa.repository.Query("""
           SELECT d FROM DossierInscription d WHERE
                 d.urlPhoto = :url OR d.urlPhotoPasseport = :url
              OR d.urlDiplomeEtat = :url OR d.urlAttestationReussite = :url
              OR d.urlReleveNotes = :url OR d.urlActeNaissance = :url
              OR d.urlAttestationNationalite = :url OR d.urlCarteIdentite = :url
              OR d.urlLettreRecommandation = :url OR d.urlAttestationPhysique = :url
              OR d.urlAttestationConduite = :url
           """)
    List<DossierInscription> findByUrlPiece(@org.springframework.data.repository.query.Param("url") String url);
}