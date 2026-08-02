package cd.genuc.repository;

import cd.genuc.model.MeilleurEtudiant;
import cd.genuc.model.MeilleurEtudiant.StatutPalmares;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MeilleurEtudiantRepository extends JpaRepository<MeilleurEtudiant, Long> {

    // Méthodes existantes
    List<MeilleurEtudiant> findByStatut(StatutPalmares statut);

    Optional<MeilleurEtudiant> findByEmailAndAnneeObtentionAndStatut(
        String email, 
        String annee, 
        StatutPalmares statut
    );

    // ✅ MÉTHODE CORRIGÉE - avec paramètre statut
    List<MeilleurEtudiant> findByPublieTrueAndStatutOrderByAnneeObtentionDescRangAsc(
        StatutPalmares statut
    );

    List<MeilleurEtudiant> findByAnneeObtentionAndStatutOrderByRangAsc(
        String annee, 
        StatutPalmares statut
    );
}