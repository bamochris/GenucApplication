package cd.genuc.repository;

import cd.genuc.model.Note;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long> {

    // EntityGraph : charge inscription + cours en 1 requête au lieu de N requêtes
    @EntityGraph(attributePaths = {"inscription", "cours"})
    List<Note> findByInscriptionId(Long inscriptionId);

    @EntityGraph(attributePaths = {"inscription", "cours"})
    List<Note> findByInscriptionIdAndAnneeAcademique(Long inscriptionId, String anneeAcademique);

    @EntityGraph(attributePaths = {"inscription"})
    List<Note> findByCoursIdAndAnneeAcademique(Long coursId, String anneeAcademique);

    @EntityGraph(attributePaths = {"inscription", "cours"})
    List<Note> findByUniversiteIdAndStatut(Long universiteId, Note.StatutNote statut);

    @EntityGraph(attributePaths = {"inscription", "cours"})
    List<Note> findByCours_Departement_IdAndStatut(Long departementId, Note.StatutNote statut);
    
    Optional<Note> findByInscriptionIdAndCoursIdAndAnneeAcademique(Long inscriptionId, Long coursId, String anneeAcademique);
    
    Optional<Note> findByInscriptionIdAndCoursIdAndAnneeAcademiqueAndSession(Long inscriptionId, Long coursId, String anneeAcademique, Integer session);
    
    @Query("SELECT n FROM Note n WHERE n.inscription.id = :inscriptionId AND n.anneeAcademique = :annee AND n.statut = 'PUBLIEE'")
    List<Note> notesValideesPourDeliberation(@Param("inscriptionId") Long inscriptionId, @Param("annee") String annee);
    
    // ✅ UNIQUE méthode calculerMoyenneGenerale (l'autre a été supprimée)
    @Query("SELECT AVG(n.noteRetenue) FROM Note n WHERE n.inscription.id = :inscriptionId AND n.anneeAcademique = :annee AND n.statut = 'PUBLIEE'")
    Double calculerMoyenneGenerale(@Param("inscriptionId") Long inscriptionId, @Param("annee") String annee);
    
    @Query("SELECT SUM(n.credits) FROM Note n WHERE n.inscription.id = :inscriptionId AND n.anneeAcademique = :annee AND n.noteRetenue >= 10 AND n.statut = 'PUBLIEE'")
    Integer sumCreditsValides(@Param("inscriptionId") Long inscriptionId, @Param("annee") String annee);
    
    // ═════════════ MÉTHODES POUR STATS ═════════════
    
    @Query("SELECT AVG(n.noteRetenue) FROM Note n WHERE n.cours.id = :coursId AND n.anneeAcademique = :annee AND n.statut = 'PUBLIEE'")
    Double moyenneCours(@Param("coursId") Long coursId, @Param("annee") String annee);
    
    @Query("SELECT COUNT(n) FROM Note n WHERE n.cours.id = :coursId AND n.anneeAcademique = :annee AND n.noteRetenue >= 10 AND n.statut = 'PUBLIEE'")
    long nbReussis(@Param("coursId") Long coursId, @Param("annee") String annee);
    
    @Query("SELECT COUNT(n) FROM Note n WHERE n.cours.id = :coursId AND n.anneeAcademique = :annee AND n.statut = 'PUBLIEE'")
    long nbNotes(@Param("coursId") Long coursId, @Param("annee") String annee);
    
    @Query("SELECT n.inscription.id as inscriptionId, n.inscription.matricule as matricule, " +
           "n.inscription.prenom as prenom, n.inscription.nom as nom, " +
           "AVG(n.noteRetenue) as moyenne " +
           "FROM Note n WHERE n.cours.id = :coursId AND n.anneeAcademique = :annee AND n.statut = 'PUBLIEE' " +
           "GROUP BY n.inscription.id, n.inscription.matricule, n.inscription.prenom, n.inscription.nom " +
           "ORDER BY moyenne DESC")
    List<Map<String, Object>> getClassementCours(@Param("coursId") Long coursId, @Param("annee") String annee);
    
    // ✅ UNIQUE méthode calculerMoyenneGenerale1 supprimée, on garde celle du dessus
    
    @Query("SELECT n FROM Note n WHERE n.inscription.id = :inscriptionId AND n.anneeAcademique = :annee AND n.statut = 'PUBLIEE'")
    List<Note> findNotesPublieesParEtudiant(@Param("inscriptionId") Long inscriptionId, @Param("annee") String annee);

    long countByProfesseurIdAndStatut(Long professeurId, Note.StatutNote statut);

    /** Pour l'IA prédictive : statistiques par étudiant d'une promotion */
    @Query("SELECT n.inscription.etudiant.id, n.inscription.etudiant.prenom, n.inscription.etudiant.nom, " +
           "AVG(n.noteRetenue) " +
           "FROM Note n " +
           "WHERE n.inscription.promotion.id = :promotionId AND n.anneeAcademique = :annee AND n.statut = 'PUBLIEE' " +
           "GROUP BY n.inscription.etudiant.id, n.inscription.etudiant.prenom, n.inscription.etudiant.nom")
    List<Object[]> findStatsByPromotion(@Param("promotionId") Long promotionId, @Param("annee") String annee);
}