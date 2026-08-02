package cd.genuc.controller;

import cd.genuc.model.Utilisateur;
import cd.genuc.service.FichierAccesService;
import cd.genuc.service.StockageFichierService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Map;

/**
 * Téléchargement contrôlé des fichiers privés.
 *
 * <p>{@code /uploads/**} ne sert plus que l'identité visuelle publique (logos, sceaux,
 * certificats de palmarès). Tous les autres fichiers — pièces de dossier, photos
 * d'identité, TFC, rapports de stage, recours — passent par ici : authentification
 * obligatoire, puis vérification de propriété par {@link FichierAccesService}.</p>
 *
 * <p>Côté client, un {@code <img src>} ou un {@code <a href>} ne transmet pas le jeton
 * JWT : il faut récupérer la ressource via l'instance Axios (qui pose l'en-tête
 * {@code Authorization}) puis créer une URL d'objet. C'est déjà le motif utilisé pour
 * la lettre d'admission dans {@code AdminDossiers.jsx}.</p>
 */
@Slf4j
@RestController
@RequestMapping("/api/fichiers")
@RequiredArgsConstructor
public class FichierController {

    private final StockageFichierService stockage;
    private final FichierAccesService acces;

    @GetMapping("/{sousDossier}/{nomFichier}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> telecharger(@PathVariable String sousDossier,
                                         @PathVariable String nomFichier,
                                         @AuthenticationPrincipal Utilisateur demandeur) {

        // Les fichiers publics restent servis en statique : rien à faire ici, et surtout
        // pas de porte dérobée qui contournerait le contrôle de propriété.
        if (FichierAccesService.DOSSIERS_PUBLICS.contains(sousDossier.toLowerCase(Locale.ROOT))) {
            return ResponseEntity.status(404).body(Map.of(
                    "erreur", "Ce fichier est servi directement sous /uploads/" + sousDossier + "/."));
        }

        String url = "/uploads/" + sousDossier + "/" + nomFichier;

        if (!acces.peutTelecharger(sousDossier, url, demandeur)) {
            // Même réponse que pour un fichier inexistant : sinon l'écart entre 403 et 404
            // indiquerait quelles URLs correspondent à un document réel.
            log.warn("Téléchargement refusé : {} demandé par {}", url,
                    demandeur == null ? "anonyme" : demandeur.getEmail());
            return ResponseEntity.status(404).body(Map.of("erreur", "Fichier introuvable."));
        }

        Path chemin = stockage.resoudre(url);
        if (chemin == null || !Files.isRegularFile(chemin)) {
            return ResponseEntity.status(404).body(Map.of("erreur", "Fichier introuvable."));
        }

        try {
            byte[] contenu = Files.readAllBytes(chemin);
            return ResponseEntity.ok()
                    .contentType(typeMime(nomFichier))
                    // "inline" pour permettre l'affichage direct (aperçu d'une pièce),
                    // sans jamais laisser le navigateur deviner le type (nosniff global).
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + nomFichier + "\"")
                    .header(HttpHeaders.CACHE_CONTROL, "private, max-age=0, no-store")
                    .body(new ByteArrayResource(contenu));
        } catch (IOException e) {
            log.error("Lecture impossible du fichier {} : {}", url, e.getMessage());
            return ResponseEntity.status(500).body(Map.of("erreur", "Lecture du fichier impossible."));
        }
    }

    private MediaType typeMime(String nomFichier) {
        String nom = nomFichier.toLowerCase(Locale.ROOT);
        if (nom.endsWith(".pdf"))  return MediaType.APPLICATION_PDF;
        if (nom.endsWith(".png"))  return MediaType.IMAGE_PNG;
        if (nom.endsWith(".jpg") || nom.endsWith(".jpeg")) return MediaType.IMAGE_JPEG;
        if (nom.endsWith(".webp")) return MediaType.parseMediaType("image/webp");
        // Tout le reste est renvoyé en flux binaire : jamais en text/html, qui
        // s'exécuterait sur l'origine de l'API.
        return MediaType.APPLICATION_OCTET_STREAM;
    }
}
