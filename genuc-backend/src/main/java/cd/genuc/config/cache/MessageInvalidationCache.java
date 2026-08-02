package cd.genuc.config.cache;

/**
 * Message diffusé sur Redis pour invalider le cache local (niveau 1) des autres instances.
 *
 * <p>Le champ {@code noeud} identifie l'émetteur : une instance ignore ses propres messages,
 * elle a déjà vidé son niveau 1 avant de publier.</p>
 *
 * <p>{@code cle} à {@code null} signifie « vide tout le cache nommé ».</p>
 *
 * <p>Le message ne transporte qu'un nom de cache et une clé, jamais de valeur : un lecteur du
 * canal Redis n'apprend donc rien de plus que ce que les clés Redis exposent déjà, et un
 * éventuel message forgé ne peut que provoquer un défaut de cache — jamais une lecture de
 * donnée d'autrui ni une désérialisation d'objet arbitraire (la lecture se fait vers ce type
 * figé, sans typage polymorphique).</p>
 */
public record MessageInvalidationCache(String noeud, String cache, String cle) {

    /** Canal Redis de diffusion. */
    public static final String CANAL = "genuc:cache:invalidation";
}
