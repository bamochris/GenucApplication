package cd.genuc.controller;

import cd.genuc.model.AnneeAcademique;
import cd.genuc.model.Universite;
import cd.genuc.model.Utilisateur;
import cd.genuc.repository.AnneeAcademiqueRepository;
import cd.genuc.repository.UniversiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/annees-academiques")
@RequiredArgsConstructor
public class AnneeAcademiqueController {

    private final AnneeAcademiqueRepository anneeRepository;
    private final UniversiteRepository universiteRepository;

    // Tout utilisateur authentifié : les écrans étudiant, professeur et
    // secrétariat ont tous besoin de la liste des années pour filtrer. La
    // restriction aux deux rôles d'administration leur renvoyait 403 — constaté
    // le 03/08/2026 sur le portail étudiant — alors que la MÊME donnée est déjà
    // exposée sans authentification sur /public juste en dessous.
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> lister() {
        return ResponseEntity.ok(anneeRepository.findByActiveTrue());
    }

    // Variante publique : le formulaire d'inscription (candidat anonyme, sans
    // compte) a besoin de choisir son année académique avant même d'exister
    // en tant qu'utilisateur authentifié.
    @GetMapping("/public")
    public ResponseEntity<?> listerPublic() {
        return ResponseEntity.ok(anneeRepository.findByActiveTrue());
    }

    // Liste complète (actives + inactives) pour l'écran de gestion : sans elle
    // une année désactivée disparaîtrait de l'interface sans pouvoir être réactivée.
    @GetMapping("/toutes")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> listerToutes() {
        List<AnneeAcademique> annees = anneeRepository.findAll();
        annees.sort(Comparator.comparing(AnneeAcademique::getLibelle,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return ResponseEntity.ok(annees);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> creer(@RequestBody Map<String, Object> body,
                                   @AuthenticationPrincipal Utilisateur utilisateur) {
        String libelle = body.get("libelle") != null ? body.get("libelle").toString().trim() : "";
        if (libelle.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Le libellé est obligatoire (ex : 2025-2026)."));
        }

        // Une année appartient à un établissement : l'unicité porte sur
        // (libelle, universite_id) et la colonne est NOT NULL. L'année était
        // pourtant construite sans établissement — l'enregistrement violait la
        // contrainte — et le contrôle de doublon, mené sur le seul libellé,
        // interdisait à un établissement d'ouvrir une année déjà ouverte par un
        // autre, en plus d'échouer dès que deux lignes portaient ce libellé.
        Long universiteId = body.get("universiteId") != null
                ? Long.valueOf(body.get("universiteId").toString())
                : (utilisateur != null ? utilisateur.getUniversiteId() : null);
        if (universiteId == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "L'établissement est obligatoire pour créer une année académique."));
        }
        Universite universite = universiteRepository.findById(universiteId).orElse(null);
        if (universite == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Établissement introuvable."));
        }
        if (anneeRepository.findByLibelleAndUniversite(libelle, universite).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Cette année académique existe déjà pour cet établissement."));
        }

        AnneeAcademique annee = new AnneeAcademique(libelle,
                body.get("active") == null || Boolean.parseBoolean(body.get("active").toString()),
                universite);
        return ResponseEntity.status(HttpStatus.CREATED).body(anneeRepository.save(annee));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> modifier(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        return anneeRepository.findById(id).<ResponseEntity<?>>map(annee -> {
            if (body.containsKey("active"))   annee.setActive(Boolean.parseBoolean(body.get("active").toString()));
            if (body.containsKey("cloturee")) annee.setCloturee(Boolean.parseBoolean(body.get("cloturee").toString()));
            if (body.containsKey("libelle") && body.get("libelle") != null && !body.get("libelle").toString().isBlank()) {
                annee.setLibelle(body.get("libelle").toString().trim());
            }
            return ResponseEntity.ok(anneeRepository.save(annee));
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "Année académique introuvable.")));
    }
}