package cd.genuc.repository;

import cd.genuc.model.RefreshToken;
import cd.genuc.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    @Modifying
    @Query("UPDATE RefreshToken r SET r.revoque = true WHERE r.utilisateur = :utilisateur")
    void revoquerTousParUtilisateur(@Param("utilisateur") Utilisateur utilisateur);

    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.expireLe < :maintenant OR r.revoque = true")
    int supprimerExpiresEtRevoques(@Param("maintenant") Instant maintenant);
}
