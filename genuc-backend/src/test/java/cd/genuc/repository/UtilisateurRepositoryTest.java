// src/test/java/cd/genuc/repository/UtilisateurRepositoryTest.java
package cd.genuc.repository;

import cd.genuc.model.RoleEnum;
import cd.genuc.model.Utilisateur;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class UtilisateurRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Test
    void testFindByEmail_ShouldReturnUser() {
        Utilisateur utilisateur = Utilisateur.builder()
            .nom("TEST")
            .prenom("User")
            .email("test@genuc.cd")
            .motDePasse("encoded")
            .role(RoleEnum.ETUDIANT)
            .compteActive(true)
            .actif(true)
            .build();

        entityManager.persist(utilisateur);
        entityManager.flush();

        var found = utilisateurRepository.findByEmail("test@genuc.cd");

        assertTrue(found.isPresent());
        assertEquals("test@genuc.cd", found.get().getEmail());
    }

    @Test
    void testExistsByEmail_ShouldReturnTrue() {
        Utilisateur utilisateur = Utilisateur.builder()
            .nom("TEST")
            .prenom("User")
            .email("exists@genuc.cd")
            .motDePasse("encoded")
            .role(RoleEnum.ETUDIANT)
            .compteActive(true)
            .actif(true)
            .build();

        entityManager.persist(utilisateur);
        entityManager.flush();

        boolean exists = utilisateurRepository.existsByEmail("exists@genuc.cd");

        assertTrue(exists);
    }
}