package cd.genuc.repository;

import cd.genuc.model.DocumentEtudiant;
import cd.genuc.model.DocumentEtudiant.TypeDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentEtudiantRepository extends JpaRepository<DocumentEtudiant, Long> {

    List<DocumentEtudiant> findByEtudiantId(Long etudiantId);

    List<DocumentEtudiant> findByEtudiantIdAndType(Long etudiantId, TypeDocument type);

    boolean existsByEtudiantIdAndType(Long etudiantId, TypeDocument type);

    /** Contrôle d'accès : retrouve le document propriétaire d'un fichier. */
    List<DocumentEtudiant> findByUrl(String url);
}