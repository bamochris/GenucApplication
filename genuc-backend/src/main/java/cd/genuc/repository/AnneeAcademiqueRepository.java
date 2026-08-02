package cd.genuc.repository;

import cd.genuc.model.AnneeAcademique;
import cd.genuc.model.Universite;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnneeAcademiqueRepository extends JpaRepository<AnneeAcademique, Long> {

	Optional<AnneeAcademique> findByLibelle(String libelle);;

    List<AnneeAcademique> findByActiveTrue();
    Optional<AnneeAcademique> findByLibelleAndUniversite(String libelle, Universite universite);
    List<AnneeAcademique> findByUniversiteId(Long universiteId);
}