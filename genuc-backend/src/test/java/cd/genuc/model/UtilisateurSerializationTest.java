package cd.genuc.model;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Garde-fou anti-fuite : l'entité Utilisateur est renvoyée telle quelle par
 * plusieurs endpoints (UtilisateurController, professeur d'un Cours, etc.).
 * Sa sérialisation JSON ne doit JAMAIS contenir le hash du mot de passe, le
 * token d'activation ni le secret 2FA.
 */
class UtilisateurSerializationTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void serialisation_neFuitAucunSecret() throws Exception {
        Utilisateur u = Utilisateur.builder()
                .id(1L)
                .nom("Kabila").prenom("Jean").email("jean@unikin.cd")
                .motDePasse("$2a$10$hashBcryptTresSecret")
                .role(RoleEnum.ETUDIANT)
                .tokenActivation("token-activation-secret")
                .twoFactorSecret("JBSWY3DPEHPK3PXP")
                .build();

        String json = mapper.writeValueAsString(u);

        // Les secrets sont absents…
        assertThat(json).doesNotContain("hashBcryptTresSecret");
        assertThat(json).doesNotContain("token-activation-secret");
        assertThat(json).doesNotContain("JBSWY3DPEHPK3PXP");
        assertThat(json).doesNotContain("\"password\"");
        assertThat(json).doesNotContain("\"motDePasse\"");
        assertThat(json).doesNotContain("twoFactorSecret");
        assertThat(json).doesNotContain("tokenActivation");

        // …mais les champs légitimes restent présents (contrat inchangé).
        assertThat(json).contains("jean@unikin.cd");
        assertThat(json).contains("Kabila");
        assertThat(json).contains("nomComplet");
    }

    @Test
    void deserialisation_accepteEncoreLeMotDePasse() throws Exception {
        // WRITE_ONLY : le mot de passe reste lisible en ENTRÉE (@RequestBody).
        String json = "{\"email\":\"a@b.cd\",\"nom\":\"X\",\"prenom\":\"Y\",\"role\":\"ETUDIANT\",\"motDePasse\":\"secret123\"}";
        Utilisateur u = mapper.readValue(json, Utilisateur.class);
        assertThat(u.getMotDePasse()).isEqualTo("secret123");
    }
}
