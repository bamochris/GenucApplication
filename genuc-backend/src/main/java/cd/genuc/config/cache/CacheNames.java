package cd.genuc.config.cache;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Registre unique des caches GENUC.
 *
 * <p><b>Pourquoi centraliser ?</b> Les noms de cache étaient jusqu'ici des chaînes libres
 * dans les {@code @Cacheable} des services, et la table des TTL de {@code CacheConfig} n'en
 * couvrait qu'une partie : {@code parametres}, {@code parametresLMD}, {@code filiereDetails}
 * et {@code frais} étaient créés à la volée avec le TTL par défaut (10 min), sans que
 * personne ne puisse le voir. Toute nouvelle entrée doit désormais être déclarée ici —
 * {@link cd.genuc.config.CacheConfig} refuse de créer un cache inconnu au démarrage, donc
 * une faute de frappe dans un {@code @Cacheable} se voit immédiatement au lieu de créer
 * silencieusement un cache fantôme.</p>
 *
 * <p><b>{@code cacheLocalAutorise}</b> décide si le cache bénéficie du niveau 1 en mémoire
 * (Caffeine) devant Redis. La règle est volontairement conservatrice :</p>
 * <ul>
 *   <li><b>oui</b> — données de référence non nominatives (structure d'un établissement,
 *       paramètres académiques, horaires) : lues en boucle par toute la SPA, modifiées
 *       quelques fois par an ;</li>
 *   <li><b>non</b> — tout ce qui est nominatif (profils, notes) ou financier
 *       (situation financière, statut de paiement) : la fraîcheur prime, et une copie
 *       en tas de plus par instance n'apporte rien de bon sur ces données-là.</li>
 * </ul>
 */
public final class CacheNames {

    private CacheNames() {
    }

    // ─── Données de référence (structure académique, paramétrage) ───────────
    public static final String UNIVERSITES            = "universites";
    public static final String UNIVERSITES_PUBLIQUES  = "universites-publiques";
    public static final String PARAMETRES             = "parametres";
    public static final String PARAMETRES_LMD         = "parametresLMD";
    public static final String FILIERE_DETAILS        = "filiereDetails";
    public static final String HORAIRES               = "horaires";
    public static final String COURS                  = "cours";
    public static final String OFFRES_EMPLOI          = "offres-emploi";

    // ─── Données académiques nominatives ────────────────────────────────────
    public static final String NOTES                  = "notes";
    public static final String EXAMENS                = "examens";
    public static final String PROFIL_UTILISATEUR     = "profil-utilisateur";

    // ─── Données financières ────────────────────────────────────────────────
    public static final String FRAIS                  = "frais";
    public static final String FRAIS_ETUDIANT         = "frais-etudiant";
    public static final String SITUATION_FINANCIERE   = "situation-financiere";
    public static final String STATUT_PAIEMENT        = "statut-paiement";

    /**
     * @param nom                 nom utilisé dans les {@code @Cacheable}
     * @param ttl                 durée de vie de l'entrée dans Redis (niveau 2)
     * @param cacheLocalAutorise  active le niveau 1 Caffeine devant Redis
     * @param tailleMaxLocale     nombre maximum d'entrées gardées en mémoire par instance
     */
    public record Definition(String nom, Duration ttl, boolean cacheLocalAutorise, int tailleMaxLocale) {
    }

    public static final List<Definition> DEFINITIONS = List.of(
        // nom                     TTL Redis                    L1    taille L1
        new Definition(UNIVERSITES,           Duration.ofHours(6),      true,  500),
        new Definition(UNIVERSITES_PUBLIQUES, Duration.ofMinutes(15),   true,   50),
        new Definition(PARAMETRES,            Duration.ofHours(6),      true,  500),
        new Definition(PARAMETRES_LMD,        Duration.ofHours(6),      true,  500),
        new Definition(FILIERE_DETAILS,       Duration.ofHours(2),      true, 2000),
        new Definition(HORAIRES,              Duration.ofHours(1),      true, 2000),
        new Definition(COURS,                 Duration.ofMinutes(30),   true, 2000),
        new Definition(OFFRES_EMPLOI,         Duration.ofMinutes(10),   true,  200),

        new Definition(NOTES,                 Duration.ofMinutes(30),   false,   0),
        new Definition(EXAMENS,               Duration.ofMinutes(15),   false,   0),
        new Definition(PROFIL_UTILISATEUR,    Duration.ofMinutes(30),   false,   0),

        new Definition(FRAIS,                 Duration.ofMinutes(30),   false,   0),
        new Definition(FRAIS_ETUDIANT,        Duration.ofMinutes(5),    false,   0),
        new Definition(SITUATION_FINANCIERE,  Duration.ofMinutes(1),    false,   0),
        new Definition(STATUT_PAIEMENT,       Duration.ofSeconds(30),   false,   0)
    );

    public static final Map<String, Definition> PAR_NOM = DEFINITIONS.stream()
            .collect(Collectors.toUnmodifiableMap(Definition::nom, Function.identity()));

    public static List<String> tousLesNoms() {
        return DEFINITIONS.stream().map(Definition::nom).toList();
    }
}
