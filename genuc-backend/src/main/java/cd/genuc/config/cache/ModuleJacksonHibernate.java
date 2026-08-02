package cd.genuc.config.cache;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.jsontype.TypeSerializer;
import com.fasterxml.jackson.databind.module.SimpleModule;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.collection.spi.PersistentCollection;
import org.hibernate.proxy.HibernateProxy;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.SortedMap;
import java.util.SortedSet;
import java.util.TreeMap;
import java.util.TreeSet;

/**
 * Rend les entités JPA sérialisables vers Redis <b>et relisibles</b>.
 *
 * <p><b>Le bug corrigé.</b> Le sérialiseur du cache active le typage polymorphique
 * ({@code @class}) : sans lui, une valeur relue depuis Redis revient en {@code LinkedHashMap}
 * et casse à la première affectation. Mais l'identifiant de type écrit par Jackson est la
 * <i>classe d'exécution</i> de la valeur. Or les collections d'une entité JPA ne sont pas des
 * {@code ArrayList} : ce sont des {@code org.hibernate.collection.spi.PersistentBag}, et les
 * associations {@code LAZY} sont des proxies {@code Universite$HibernateProxy$a1b2}. Le cache
 * écrivait donc dans Redis des {@code @class} pointant vers des classes internes d'Hibernate,
 * voire vers des classes générées à l'exécution qui n'existent plus au redémarrage suivant.
 * À la relecture, Jackson ne pouvait pas les instancier : le GET échouait, le
 * {@code CacheErrorHandler} logguait un avertissement, et la requête repartait en base.
 * Résultat concret : les caches d'entités ({@code universites}, {@code parametres},
 * {@code horaires}, {@code notes}…) n'ont jamais servi <i>aucune</i> lecture — chaque appel
 * touchait PostgreSQL, exactement ce que le cache devait éviter.</p>
 *
 * <p><b>La correction.</b> Toute collection Hibernate est recopiée dans son équivalent
 * {@code java.util} avant sérialisation, et tout proxy paresseux est remplacé par l'entité
 * qu'il enveloppe. Le {@code @class} écrit dans Redis est alors une classe stable
 * ({@code java.util.ArrayList}, {@code cd.genuc.model.Universite}…), qui traverse un
 * redémarrage sans problème et que la liste blanche de
 * {@link cd.genuc.config.CacheConfig} accepte.</p>
 *
 * <p><b>Association non initialisée.</b> Elle est chargée au moment de l'écriture en cache.
 * C'est volontaire : les seules associations concernées sont celles que Jackson traverse,
 * donc celles que le contrôleur va de toute façon sérialiser dans la réponse HTTP quelques
 * microsecondes plus tard (les autres portent {@code @JsonIgnore} et ne sont jamais
 * atteintes). Écrire {@code null} à la place produirait une entrée de cache appauvrie : par
 * exemple un {@code Frais} dont {@code modesPaiementAutorises} — un {@code @ElementCollection}
 * paresseux exposé au front — reviendrait vide une fois relu. Si la session est déjà fermée,
 * le chargement échoue proprement et la valeur est écrite à {@code null} : mieux vaut un
 * champ absent qu'une requête HTTP en erreur.</p>
 */
@Slf4j
public class ModuleJacksonHibernate extends SimpleModule {

    private static final long serialVersionUID = 1L;

    public ModuleJacksonHibernate() {
        super("genuc-hibernate-cache");
        addSerializer(PersistentCollection.class, new SerialiseurCollectionHibernate());
        addSerializer(HibernateProxy.class, new SerialiseurProxyHibernate());
    }

    /** Recopie une collection Hibernate vers son équivalent {@code java.util}. */
    static Object versionJava(PersistentCollection<?> collection) {
        if (collection == null) {
            return null;
        }
        try {
            // La recopie déclenche l'initialisation si la collection ne l'est pas encore.
            if (collection instanceof SortedMap<?, ?> sorted) {
                return new TreeMap<>(sorted);
            }
            if (collection instanceof Map<?, ?> map) {
                return new LinkedHashMap<>(map);
            }
            if (collection instanceof SortedSet<?> sorted) {
                return new TreeSet<>(sorted);
            }
            if (collection instanceof java.util.Set<?> set) {
                return new LinkedHashSet<>(set);
            }
            if (collection instanceof Collection<?> col) {
                return new ArrayList<>(col);
            }
            // Type de collection Hibernate inattendu : mieux vaut ne rien cacher que d'écrire
            // un @class impossible à relire.
            log.debug("Collection Hibernate non convertible ignorée : {}", collection.getClass());
            return null;
        } catch (RuntimeException e) {
            // Session déjà fermée : on n'échoue pas la mise en cache pour autant.
            log.debug("Collection Hibernate non chargeable, mise en cache à null : {}", e.getMessage());
            return null;
        }
    }

    /** Déballe un proxy paresseux vers l'entité réelle, ou {@code null} si le chargement échoue. */
    static Object versionJava(HibernateProxy proxy) {
        if (proxy == null) {
            return null;
        }
        try {
            return proxy.getHibernateLazyInitializer().getImplementation();
        } catch (RuntimeException e) {
            log.debug("Proxy Hibernate non chargeable, mis en cache à null : {}", e.getMessage());
            return null;
        }
    }

    private static class SerialiseurCollectionHibernate extends JsonSerializer<PersistentCollection> {

        @Override
        @SuppressWarnings("rawtypes")
        public void serialize(PersistentCollection value, JsonGenerator gen, SerializerProvider provider)
                throws IOException {
            Object java = versionJava(value);
            if (java == null) {
                gen.writeNull();
            } else {
                provider.defaultSerializeValue(java, gen);
            }
        }

        @Override
        @SuppressWarnings("rawtypes")
        public void serializeWithType(PersistentCollection value, JsonGenerator gen,
                                      SerializerProvider provider, TypeSerializer typeSer) throws IOException {
            Object java = versionJava(value);
            if (java == null) {
                gen.writeNull();
                return;
            }
            // On délègue au sérialiseur du type CIBLE : c'est lui qui écrira
            // "java.util.ArrayList" comme identifiant de type, et non "PersistentBag".
            provider.findValueSerializer(java.getClass()).serializeWithType(java, gen, provider, typeSer);
        }
    }

    private static class SerialiseurProxyHibernate extends JsonSerializer<HibernateProxy> {

        @Override
        public void serialize(HibernateProxy value, JsonGenerator gen, SerializerProvider provider)
                throws IOException {
            Object java = versionJava(value);
            if (java == null) {
                gen.writeNull();
            } else {
                provider.defaultSerializeValue(java, gen);
            }
        }

        @Override
        public void serializeWithType(HibernateProxy value, JsonGenerator gen,
                                      SerializerProvider provider, TypeSerializer typeSer) throws IOException {
            Object java = versionJava(value);
            if (java == null) {
                gen.writeNull();
                return;
            }
            provider.findValueSerializer(java.getClass()).serializeWithType(java, gen, provider, typeSer);
        }
    }
}
