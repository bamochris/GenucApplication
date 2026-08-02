package cd.genuc.repository;

import cd.genuc.model.Reservation;
import cd.genuc.model.Reservation.StatutReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByEtudiantId(Long etudiantId);

    List<Reservation> findByLivreId(Long livreId);

    List<Reservation> findByStatut(StatutReservation statut);

    @Query("SELECT r FROM Reservation r WHERE r.livre.id = :livreId AND r.statut = 'ACTIVE' ORDER BY r.dateReservation ASC")
    List<Reservation> findReservationsActivesParLivre(Long livreId);

    @Query("SELECT r FROM Reservation r WHERE r.dateExpiration < :date AND r.statut = 'ACTIVE'")
    List<Reservation> findExpirees(LocalDate date);

    @Query("SELECT r FROM Reservation r WHERE r.livre.universite.id = :universiteId ORDER BY r.dateReservation DESC")
    List<Reservation> findByUniversiteId(@Param("universiteId") Long universiteId);

    // Réservations actives d'une université (vue admin / bibliothécaire)
    @Query("SELECT r FROM Reservation r WHERE r.livre.universite.id = :universiteId AND r.statut = 'ACTIVE' ORDER BY r.dateReservation DESC")
    List<Reservation> findActivesByUniversite(@Param("universiteId") Long universiteId);

    boolean existsByLivreIdAndEtudiantIdAndStatut(Long livreId, Long etudiantId, StatutReservation statut);
}