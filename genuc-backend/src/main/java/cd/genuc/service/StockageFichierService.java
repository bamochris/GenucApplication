package cd.genuc.service;

import cd.genuc.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * Point d'entrée UNIQUE pour écrire un fichier téléversé sur le disque.
 *
 * <p>Chaque service métier réimplémentait son propre enregistrement, toujours sur le
 * même modèle {@code UUID + "_" + file.getOriginalFilename()}. Trois problèmes :</p>
 * <ol>
 *   <li><b>Traversée de chemin</b> — le préfixe UUID ne neutralise pas les segments
 *       {@code ../} : {@code uuid_../../x} se normalise bien un cran plus haut.</li>
 *   <li><b>Aucune validation de type</b> — un {@code .html} ou un {@code .svg} déposé
 *       comme « pièce jointe » était ensuite servi tel quel depuis {@code /uploads/**},
 *       donc exécuté sur l'origine du site : XSS stocké.</li>
 *   <li><b>Confiance au nom client</b> — le nom fourni par le navigateur finissait sur
 *       le disque, avec ses caractères spéciaux et sa vraie extension.</li>
 * </ol>
 *
 * <p>Ici : le nom disque est <b>entièrement généré côté serveur</b> (UUID + extension
 * validée), le nom d'origine n'est renvoyé que comme métadonnée à stocker en base, et
 * le contenu réel est confronté à l'extension annoncée (signature binaire).</p>
 */
@Slf4j
@Service
public class StockageFichierService {

    /** Familles de fichiers acceptées, chacune avec sa liste blanche d'extensions. */
    public enum Categorie {
        /** Pièces jointes administratives : dossiers, recours, TFC, stages, travaux. */
        DOCUMENT(Set.of("pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png")),
        /** Images d'affichage : photos d'identité, logos, sceaux. Pas de SVG (script inline). */
        IMAGE(Set.of("jpg", "jpeg", "png", "webp"));

        private final Set<String> extensions;

        Categorie(Set<String> extensions) {
            this.extensions = extensions;
        }
    }

    /**
     * @param url          URL publique à stocker en base (ex. {@code /uploads/tfc/<uuid>.pdf})
     * @param chemin       chemin absolu du fichier écrit
     * @param nomOriginal  nom fourni par le client, nettoyé — métadonnée d'affichage UNIQUEMENT
     * @param extension    extension retenue, en minuscules, sans point
     * @param taille       taille en octets
     */
    public record FichierEnregistre(String url, Path chemin, String nomOriginal,
                                    String extension, long taille) {
    }

    @Value("${genuc.uploads.racine:uploads}")
    private String racine;

    @Value("${genuc.uploads.taille-max-mo:25}")
    private long tailleMaxMo;

    /**
     * Signatures binaires (magic bytes) par extension. Une extension absente de cette
     * table passe le contrôle de contenu (cas des formats Office anciens trop variables),
     * mais reste soumise à la liste blanche d'extensions.
     */
    private static final List<Signature> SIGNATURES = List.of(
            new Signature("pdf",  "25504446"),                     // %PDF
            new Signature("png",  "89504E47"),                     // ‰PNG
            new Signature("jpg",  "FFD8FF"),
            new Signature("jpeg", "FFD8FF"),
            new Signature("webp", "52494646"),                     // RIFF
            new Signature("docx", "504B0304"),                     // ZIP (OOXML)
            new Signature("xlsx", "504B0304"));

    private record Signature(String extension, String prefixeHex) {
    }

    /**
     * Écrit le fichier et renvoie de quoi renseigner l'entité appelante.
     *
     * @param fichier      fichier reçu du client
     * @param sousDossier  sous-dossier de {@code uploads/} (ex. {@code "tfc"}) — valeur en dur
     *                     côté appelant, jamais une donnée de requête
     * @param categorie    famille de fichiers autorisée pour ce contexte
     * @throws BusinessException si le fichier est vide, trop gros, d'une extension non
     *                           autorisée, ou si son contenu contredit son extension
     */
    public FichierEnregistre enregistrer(MultipartFile fichier, String sousDossier, Categorie categorie) {
        if (fichier == null || fichier.isEmpty()) {
            throw new BusinessException("FICHIER_VIDE", "Aucun fichier fourni.");
        }

        long tailleMaxOctets = tailleMaxMo * 1024 * 1024;
        if (fichier.getSize() > tailleMaxOctets) {
            throw new BusinessException("FICHIER_TROP_VOLUMINEUX",
                    "Fichier trop volumineux : " + (fichier.getSize() / (1024 * 1024))
                            + " Mo (maximum " + tailleMaxMo + " Mo).");
        }

        String nomOriginal = nettoyerNomOriginal(fichier.getOriginalFilename());
        String extension = extensionDe(nomOriginal);

        if (extension.isEmpty() || !categorie.extensions.contains(extension)) {
            throw new BusinessException("EXTENSION_NON_AUTORISEE",
                    "Type de fichier non autorisé. Formats acceptés : "
                            + String.join(", ", categorie.extensions.stream().sorted().toList()) + ".");
        }

        verifierContenu(fichier, extension);

        // Le nom disque ne reprend RIEN du nom client : ni base, ni séparateur, ni casse.
        String nomServeur = UUID.randomUUID() + "." + extension;

        try {
            Path racineNormalisee = Paths.get(racine).toAbsolutePath().normalize();
            Path destination = racineNormalisee.resolve(sousDossier).resolve(nomServeur).normalize();

            // Ceinture et bretelles : même avec un nom généré, on refuse tout chemin
            // qui sortirait de la racine des uploads.
            if (!destination.startsWith(racineNormalisee)) {
                throw new BusinessException("CHEMIN_INVALIDE", "Chemin de destination invalide.");
            }

            Files.createDirectories(destination.getParent());
            try (InputStream in = fichier.getInputStream()) {
                Files.copy(in, destination, StandardCopyOption.REPLACE_EXISTING);
            }

            String url = "/uploads/" + sousDossier + "/" + nomServeur;
            log.debug("Fichier enregistré : {} ({} octets, origine « {} »)",
                    url, fichier.getSize(), nomOriginal);
            return new FichierEnregistre(url, destination, nomOriginal, extension, fichier.getSize());

        } catch (IOException e) {
            log.error("Échec d'écriture du fichier dans {}/{} : {}", racine, sousDossier, e.getMessage());
            throw new BusinessException("ECHEC_ENREGISTREMENT",
                    "Impossible d'enregistrer le fichier. Réessayez.");
        }
    }

    /**
     * Résout une URL {@code /uploads/...} stockée en base vers un chemin disque, en
     * garantissant que le résultat reste sous la racine des uploads. Utilisé par le
     * téléchargement contrôlé.
     *
     * @return le chemin du fichier, ou {@code null} si l'URL est hors périmètre ou absente
     */
    public Path resoudre(String urlStockee) {
        if (urlStockee == null || urlStockee.isBlank()) {
            return null;
        }
        String relatif = urlStockee.startsWith("/uploads/")
                ? urlStockee.substring("/uploads/".length())
                : urlStockee;

        Path racineNormalisee = Paths.get(racine).toAbsolutePath().normalize();
        Path cible = racineNormalisee.resolve(relatif).normalize();
        if (!cible.startsWith(racineNormalisee)) {
            log.warn("Tentative d'accès hors racine des uploads : {}", urlStockee);
            return null;
        }
        return cible;
    }

    // ══════════════════════════════════════════
    // Interne
    // ══════════════════════════════════════════

    /** Le nom d'origine ne sert qu'à l'affichage : on retire tout ce qui ressemble à un chemin. */
    private String nettoyerNomOriginal(String nom) {
        if (nom == null || nom.isBlank()) {
            return "fichier";
        }
        String base = nom.replace('\\', '/');
        int dernierSeparateur = base.lastIndexOf('/');
        if (dernierSeparateur >= 0) {
            base = base.substring(dernierSeparateur + 1);
        }
        base = base.replaceAll("[\\p{Cntrl}<>:\"|?*]", "_").trim();
        if (base.isEmpty() || base.equals(".") || base.equals("..")) {
            return "fichier";
        }
        return base.length() > 150 ? base.substring(0, 150) : base;
    }

    private String extensionDe(String nom) {
        int point = nom.lastIndexOf('.');
        if (point < 0 || point == nom.length() - 1) {
            return "";
        }
        return nom.substring(point + 1).toLowerCase(Locale.ROOT);
    }

    /**
     * Confronte les premiers octets au type annoncé. Bloque le cas classique du fichier
     * HTML/script renommé en {@code .pdf} ou {@code .png} pour être servi depuis l'origine.
     */
    private void verifierContenu(MultipartFile fichier, String extension) {
        byte[] entete = new byte[8];
        int lus;
        try (InputStream in = fichier.getInputStream()) {
            lus = in.readNBytes(entete, 0, entete.length);
        } catch (IOException e) {
            throw new BusinessException("FICHIER_ILLISIBLE", "Fichier illisible.");
        }
        if (lus <= 0) {
            throw new BusinessException("FICHIER_VIDE", "Aucun fichier fourni.");
        }

        String hex = HexFormat.of().formatHex(Arrays.copyOf(entete, lus)).toUpperCase(Locale.ROOT);

        Signature attendue = SIGNATURES.stream()
                .filter(s -> s.extension().equals(extension))
                .findFirst()
                .orElse(null);

        if (attendue == null) {
            // Format sans signature fiable (doc/xls anciens) : on refuse au moins le
            // contenu manifestement textuel/HTML.
            if (hex.startsWith("3C")) { // '<' → HTML, XML, SVG…
                throw new BusinessException("CONTENU_INCOHERENT",
                        "Le contenu du fichier ne correspond pas à son extension.");
            }
            return;
        }

        if (!hex.startsWith(attendue.prefixeHex())) {
            throw new BusinessException("CONTENU_INCOHERENT",
                    "Le contenu du fichier ne correspond pas à son extension « " + extension + " ».");
        }
    }
}
