package cd.genuc.config.cache;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.cache.concurrent.ConcurrentMapCache;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Comportement du cache à deux niveaux, hors Redis.
 *
 * <p>Le niveau 2 est simulé par un {@code ConcurrentMapCache} : ce qui est vérifié ici, c'est
 * l'articulation entre les deux niveaux — pas Redis lui-même.</p>
 */
class CacheDeuxNiveauxTest {

    private ConcurrentMapCache niveau2;
    private CacheDeuxNiveaux cache;
    private List<String> diffusions;

    @BeforeEach
    void setUp() {
        niveau2 = new ConcurrentMapCache("universites");
        diffusions = new ArrayList<>();

        PublicateurInvalidationCache publicateur =
                new PublicateurInvalidationCache(null, new ObjectMapper()) {
                    @Override
                    public void diffuser(String cache, String cle) {
                        diffusions.add(cache + "|" + cle);
                    }
                };

        cache = new CacheDeuxNiveaux(
                "universites",
                Caffeine.newBuilder().maximumSize(10).expireAfterWrite(Duration.ofMinutes(1)).build(),
                niveau2,
                publicateur);
    }

    @Test
    @DisplayName("Une lecture remonte du niveau 2 puis est servie par le niveau 1")
    void remonteeDuNiveau2() {
        niveau2.put(1L, "UNIKIN");

        assertThat(cache.get(1L)).isNotNull();
        assertThat(cache.get(1L).get()).isEqualTo("UNIKIN");
        assertThat(cache.tailleNiveau1()).isEqualTo(1);

        // Le niveau 2 disparaît : la lecture reste servie localement. C'est exactement le
        // comportement voulu en cas de coupure Redis — pas de report brutal sur PostgreSQL.
        niveau2.clear();
        assertThat(cache.get(1L)).isNotNull();
        assertThat(cache.get(1L).get()).isEqualTo("UNIKIN");
    }

    @Test
    @DisplayName("Une écriture alimente les deux niveaux et prévient les autres instances")
    void ecritureDiffusee() {
        cache.put(7L, "UNILU");

        assertThat(niveau2.get(7L)).isNotNull();
        assertThat(cache.get(7L).get()).isEqualTo("UNILU");
        assertThat(diffusions).containsExactly("universites|7");
    }

    @Test
    @DisplayName("Une éviction vide les deux niveaux")
    void evictionDesDeuxNiveaux() {
        cache.put(7L, "UNILU");
        diffusions.clear();

        cache.evict(7L);

        assertThat(niveau2.get(7L)).isNull();
        assertThat(cache.get(7L)).isNull();
        assertThat(cache.tailleNiveau1()).isZero();
        assertThat(diffusions).containsExactly("universites|7");
    }

    @Test
    @DisplayName("Une invalidation reçue du réseau ne touche QUE le niveau 1")
    void invalidationDistanteNeVidePasRedis() {
        cache.put(7L, "UNILU");

        cache.invaliderLocalement("7");

        assertThat(cache.tailleNiveau1()).isZero();
        // La valeur reste dans Redis : l'instance qui a émis l'invalidation l'y a déjà mise
        // à jour, les autres doivent simplement la relire.
        assertThat(niveau2.get(7L)).isNotNull();
    }

    @Test
    @DisplayName("Une entrée d'un type inattendu est écartée au lieu de casser l'appelant")
    void typeInattenduEcarte() {
        cache.put(7L, "UNILU");

        assertThat(cache.get(7L, Integer.class)).isNull();
        assertThat(cache.get(7L, String.class)).isNull(); // l'entrée fautive a été évincée
    }

    @Test
    @DisplayName("Le chargeur n'est appelé qu'une fois, la valeur restant ensuite locale")
    void chargeurAppeleUneSeuleFois() {
        int[] appels = {0};

        String premier = cache.get(42L, () -> {
            appels[0]++;
            return "UPN";
        });
        String second = cache.get(42L, () -> {
            appels[0]++;
            return "UPN";
        });

        assertThat(premier).isEqualTo("UPN");
        assertThat(second).isEqualTo("UPN");
        assertThat(appels[0]).isEqualTo(1);
    }
}
