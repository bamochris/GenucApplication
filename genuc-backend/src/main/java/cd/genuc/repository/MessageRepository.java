// cd.genuc.repository.MessageRepository.java
package cd.genuc.repository;

import cd.genuc.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    // Messages reçus par un étudiant (via inscriptionId)
    List<Message> findByInscriptionIdOrderByDateEnvoiDesc(Long inscriptionId);
    
    // Messages reçus par un destinataire spécifique (admin, professeur)
    List<Message> findByDestinataireIdOrderByDateEnvoiDesc(Long destinataireId);
    
    // Messages envoyés par un expéditeur
    List<Message> findByExpediteurIdOrderByDateEnvoiDesc(Long expediteurId);
    
    // Messages non lus d'un destinataire
    List<Message> findByDestinataireIdAndLuFalseOrderByDateEnvoiDesc(Long destinataireId);
    
    // Messages par université
    List<Message> findByUniversiteIdOrderByDateEnvoiDesc(Long universiteId);
    
    // Compter les messages non lus
    @Query("SELECT COUNT(m) FROM Message m WHERE m.destinataireId = :destinataireId AND m.lu = false")
    long countNonLus(@Param("destinataireId") Long destinataireId);
    
    // Messages d'un étudiant (envoyés et reçus)
    @Query("SELECT m FROM Message m WHERE m.inscriptionId = :inscriptionId OR m.expediteurId = :etudiantId ORDER BY m.dateEnvoi DESC")
    List<Message> findConversationsEtudiant(@Param("inscriptionId") Long inscriptionId, @Param("etudiantId") Long etudiantId);
}