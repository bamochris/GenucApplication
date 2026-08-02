package cd.genuc.config.cache;

import com.github.benmanes.caffeine.cache.Cache;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

import java.util.concurrent.Callable;

/**
 * Cache à deux niveaux : Caffeine en mémoire (L1) devant Redis (L2).
 *
 * <p><b>Pourquoi un L1.</b> Même servie par Redis, une lecture coûte un aller-retour réseau et
 * une désérialisation JSON. Sur les données de référence relues à chaque écran de la SPA
 * (structure d'un établissement, paramètres, horaires), ce trajet se répète des dizaines de
 * fois par seconde et par instance. Le L1 le supprime entièrement — et il continue de servir
 * si Redis tombe, ce qui évite de reporter d'un coup toute la charge sur PostgreSQL.</p>
 *
 * <p><b>Cohérence entre instances.</b> Toute écriture ou éviction est diffusée sur un canal
 * Redis (voir {@link MessageInvalidationCache}) : les autres instances vident l'entrée
 * correspondante de leur L1 immédiatement. Si le message se perd (Redis indisponible), le
 * TTL court du L1 borne la fenêtre d'obsolescence. C'est pour cette raison que seuls les
 * caches marqués {@code cacheLocalAutorise} dans {@link CacheNames} — jamais les données
 * financières ni nominatives — passent par ici.</p>
 *
 * <p><b>Clés.</b> Le L1 est indexé par {@code String.valueOf(cle)}, la même normalisation que
 * celle appliquée par Spring Data Redis pour construire la clé Redis. Les deux niveaux voient
 * donc exactement les mêmes entrées, et un message d'invalidation reçu du réseau (forcément
 * une chaîne) retrouve l'entrée locale sans ambiguïté.</p>
 */
@Slf4j
public class CacheDeuxNiveaux implements org.springframework.cache.Cache {

    /** Marqueur interne : « la méthode cachée a retourné null ». */
    private static final Object NUL = new Object();

    private final String nom;
    private final Cache<String, Object> niveau1;
    private final org.springframework.cache.Cache niveau2;
    private final PublicateurInvalidationCache publicateur;

    public CacheDeuxNiveaux(String nom,
                            Cache<String, Object> niveau1,
                            org.springframework.cache.Cache niveau2,
                            PublicateurInvalidationCache publicateur) {
        this.nom = nom;
        this.niveau1 = niveau1;
        this.niveau2 = niveau2;
        this.publicateur = publicateur;
    }

    @Override
    @NonNull
    public String getName() {
        return nom;
    }

    @Override
    @NonNull
    public Object getNativeCache() {
        return niveau2.getNativeCache();
    }

    /** Vide une entrée du seul niveau 1 — utilisé à la réception d'un message d'invalidation. */
    public void invaliderLocalement(@Nullable String cle) {
        if (cle == null) {
            niveau1.invalidateAll();
        } else {
            niveau1.invalidate(cle);
        }
    }

    /** Nombre d'entrées actuellement gardées en mémoire (pour le suivi). */
    public long tailleNiveau1() {
        return niveau1.estimatedSize();
    }

    public Cache<String, Object> niveau1() {
        return niveau1;
    }

    @Override
    @Nullable
    public ValueWrapper get(@NonNull Object key) {
        String cle = normaliser(key);
        Object local = niveau1.getIfPresent(cle);
        if (local != null) {
            return emballer(local);
        }
        ValueWrapper distant = niveau2.get(key);
        if (distant != null) {
            niveau1.put(cle, distant.get() == null ? NUL : distant.get());
        }
        return distant;
    }

    @Override
    @Nullable
    @SuppressWarnings("unchecked")
    public <T> T get(@NonNull Object key, @Nullable Class<T> type) {
        ValueWrapper wrapper = get(key);
        if (wrapper == null) {
            return null;
        }
        Object valeur = wrapper.get();
        if (valeur != null && type != null && !type.isInstance(valeur)) {
            // Une valeur d'un type inattendu vient forcément d'un format de cache périmé
            // (modèle modifié depuis l'écriture). On la jette au lieu de propager une
            // ClassCastException jusqu'au contrôleur.
            log.warn("Entrée de cache [{}] clé={} de type {} au lieu de {} : entrée écartée",
                    nom, key, valeur.getClass().getName(), type.getName());
            evict(key);
            return null;
        }
        return (T) valeur;
    }

    @Override
    @Nullable
    public <T> T get(@NonNull Object key, @NonNull Callable<T> valueLoader) {
        String cle = normaliser(key);
        Object local = niveau1.getIfPresent(cle);
        if (local != null) {
            return demballer(local);
        }
        // Le chargement (et donc l'appel base de données) reste sous la responsabilité du
        // niveau 2 : c'est lui qui sérialise les chargements concurrents pour une même clé.
        T valeur = niveau2.get(key, valueLoader);
        niveau1.put(cle, valeur == null ? NUL : valeur);
        return valeur;
    }

    @Override
    public void put(@NonNull Object key, @Nullable Object value) {
        niveau2.put(key, value);
        String cle = normaliser(key);
        niveau1.put(cle, value == null ? NUL : value);
        publicateur.diffuser(nom, cle);
    }

    @Override
    @Nullable
    public ValueWrapper putIfAbsent(@NonNull Object key, @Nullable Object value) {
        ValueWrapper existant = niveau2.putIfAbsent(key, value);
        if (existant == null) {
            String cle = normaliser(key);
            niveau1.put(cle, value == null ? NUL : value);
            publicateur.diffuser(nom, cle);
        }
        return existant;
    }

    @Override
    public void evict(@NonNull Object key) {
        String cle = normaliser(key);
        niveau1.invalidate(cle);
        niveau2.evict(key);
        publicateur.diffuser(nom, cle);
    }

    @Override
    public boolean evictIfPresent(@NonNull Object key) {
        String cle = normaliser(key);
        niveau1.invalidate(cle);
        boolean present = niveau2.evictIfPresent(key);
        publicateur.diffuser(nom, cle);
        return present;
    }

    @Override
    public void clear() {
        niveau1.invalidateAll();
        niveau2.clear();
        publicateur.diffuser(nom, null);
    }

    @Override
    public boolean invalidate() {
        niveau1.invalidateAll();
        boolean avaitDesEntrees = niveau2.invalidate();
        publicateur.diffuser(nom, null);
        return avaitDesEntrees;
    }

    private static String normaliser(Object key) {
        return String.valueOf(key);
    }

    @Nullable
    private ValueWrapper emballer(Object local) {
        return () -> local == NUL ? null : local;
    }

    @Nullable
    @SuppressWarnings("unchecked")
    private <T> T demballer(Object local) {
        return local == NUL ? null : (T) local;
    }
}
