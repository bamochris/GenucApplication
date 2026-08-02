package cd.genuc.controller;

import cd.genuc.dto.EmpruntResponseDto;
import cd.genuc.dto.ReservationResponseDto;
import cd.genuc.model.*;
import cd.genuc.service.BibliothequeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bibliotheque")
@RequiredArgsConstructor
public class BibliothequeController {

    private final BibliothequeService bibliothequeService;

    // ═══════════════════════════════════════════════════════════════
    // 1. ENDPOINTS EXISTANTS (inchangés pour rétrocompatibilité)
    // ═══════════════════════════════════════════════════════════════

    // --- Public / Étudiant : consulter les livres d'une université
    @GetMapping("/livres/{universiteId}")
    public ResponseEntity<List<Livre>> listerLivres(@PathVariable Long universiteId) {
        return ResponseEntity.ok(bibliothequeService.listerLivresParUniversite(universiteId));
    }

    @GetMapping("/livres/detail/{id}")
    public ResponseEntity<Livre> detailLivre(@PathVariable Long id) {
        return ResponseEntity.ok(bibliothequeService.obtenirLivre(id));
    }

    // --- Étudiant / Bibliothécaire (prêt au comptoir) : emprunter, retourner, prolonger, consulter ses emprunts
    @PostMapping("/emprunter")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'BIBLIOTHECAIRE')")
    public ResponseEntity<?> emprunter(@RequestBody Map<String, Long> body) {
        try {
            if (!body.containsKey("livreId") || !body.containsKey("etudiantId")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "livreId et etudiantId sont requis"));
            }
            Long livreId = body.get("livreId");
            Long etudiantId = body.get("etudiantId");
            Emprunt emprunt = bibliothequeService.emprunterLivre(livreId, etudiantId);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Livre emprunté avec succès. Retour prévu le " + emprunt.getDateRetourPrevue(),
                    "id", emprunt.getId()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PutMapping("/retourner/{empruntId}")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'BIBLIOTHECAIRE')")
    public ResponseEntity<?> retourner(@PathVariable Long empruntId) {
        try {
            Emprunt emprunt = bibliothequeService.retournerLivre(empruntId);
            return ResponseEntity.ok(Map.of(
                    "message", "Livre retourné. Pénalité : " + emprunt.getPenalite() + " FC",
                    "penalite", emprunt.getPenalite()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/prolonger/{empruntId}")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<?> prolonger(@PathVariable Long empruntId, @RequestParam int jours) {
        try {
            Emprunt emprunt = bibliothequeService.prolongerEmprunt(empruntId, jours);
            return ResponseEntity.ok(Map.of(
                    "message", "Emprunt prolongé jusqu'au " + emprunt.getDateRetourPrevue(),
                    "nouvelleDate", emprunt.getDateRetourPrevue()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/mes-emprunts/{etudiantId}")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<List<Emprunt>> mesEmprunts(@PathVariable Long etudiantId) {
        return ResponseEntity.ok(bibliothequeService.getEmpruntsEtudiant(etudiantId));
    }

    // --- Admin : CRUD livres (inchangé)
    @PostMapping("/admin/livres")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE', 'BIBLIOTHECAIRE')")
    public ResponseEntity<?> creerLivre(@RequestBody Livre livre) {
        try {
            Livre saved = bibliothequeService.creerLivre(livre);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PutMapping("/admin/livres/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE', 'BIBLIOTHECAIRE')")
    public ResponseEntity<?> modifierLivre(@PathVariable Long id, @RequestBody Livre livre) {
        try {
            return ResponseEntity.ok(bibliothequeService.modifierLivre(id, livre));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @DeleteMapping("/admin/livres/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE', 'BIBLIOTHECAIRE')")
    public ResponseEntity<?> supprimerLivre(@PathVariable Long id) {
        try {
            bibliothequeService.desactiverLivre(id);
            return ResponseEntity.ok(Map.of("message", "Livre désactivé"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. NOUVEAUX ENDPOINTS (bibliothèque avancée)
    // ═══════════════════════════════════════════════════════════════

    // ─── Catégories ─────────────────────────────────────────────

    @GetMapping("/categories/{universiteId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<CategorieOuvrage>> getCategories(@PathVariable Long universiteId) {
        return ResponseEntity.ok(bibliothequeService.getCategories(universiteId));
    }

    @PostMapping("/categories")
    @PreAuthorize("hasAnyRole('BIBLIOTHECAIRE', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> creerCategorie(@RequestBody CategorieOuvrage categorie) {
        try {
            return ResponseEntity.ok(bibliothequeService.creerCategorie(categorie));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @DeleteMapping("/categories/{id}")
    @PreAuthorize("hasAnyRole('BIBLIOTHECAIRE', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> desactiverCategorie(@PathVariable Long id) {
        bibliothequeService.desactiverCategorie(id);
        return ResponseEntity.ok(Map.of("message", "Catégorie désactivée"));
    }

    // ─── Ouvrages (avec types) ──────────────────────────────────

    @GetMapping("/ouvrages/{universiteId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Ouvrage>> listerOuvrages(@PathVariable Long universiteId) {
        return ResponseEntity.ok(bibliothequeService.listerOuvragesParUniversite(universiteId));
    }

    @GetMapping("/ouvrages/{universiteId}/type/{type}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Ouvrage>> listerOuvragesParType(
            @PathVariable Long universiteId,
            @PathVariable String type) {
        try {
            Ouvrage.TypeOuvrage typeEnum = Ouvrage.TypeOuvrage.valueOf(type);
            return ResponseEntity.ok(bibliothequeService.listerOuvragesParType(universiteId, typeEnum));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/ouvrages/detail/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Ouvrage> detailOuvrage(@PathVariable Long id) {
        return ResponseEntity.ok(bibliothequeService.obtenirOuvrage(id));
    }

    @PostMapping("/admin/ouvrages")
    @PreAuthorize("hasAnyRole('BIBLIOTHECAIRE', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> creerOuvrage(@RequestBody Ouvrage ouvrage) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(bibliothequeService.creerOuvrage(ouvrage));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PutMapping("/admin/ouvrages/{id}")
    @PreAuthorize("hasAnyRole('BIBLIOTHECAIRE', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> modifierOuvrage(@PathVariable Long id, @RequestBody Ouvrage ouvrage) {
        try {
            return ResponseEntity.ok(bibliothequeService.modifierOuvrage(id, ouvrage));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @DeleteMapping("/admin/ouvrages/{id}")
    @PreAuthorize("hasAnyRole('BIBLIOTHECAIRE', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> supprimerOuvrage(@PathVariable Long id) {
        bibliothequeService.supprimerOuvrage(id);
        return ResponseEntity.ok(Map.of("message", "Ouvrage supprimé"));
    }

    // ─── Recherche avancée ──────────────────────────────────────

    @GetMapping("/recherche")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Ouvrage>> rechercherOuvrages(
            @RequestParam String motCle,
            @RequestParam(required = false) String categorie,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Long universiteId) {
        return ResponseEntity.ok(bibliothequeService.rechercherOuvrages(motCle, categorie, type, universiteId));
    }

    // ─── Réservations ───────────────────────────────────────────

    @PostMapping("/reserver")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'BIBLIOTHECAIRE')")
    public ResponseEntity<?> reserverLivre(@RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("livreId") || !body.containsKey("etudiantId")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "livreId et etudiantId sont requis"));
            }
            Long livreId = Long.valueOf(body.get("livreId").toString());
            Long etudiantId = Long.valueOf(body.get("etudiantId").toString());
            Reservation reservation = bibliothequeService.reserverLivre(livreId, etudiantId);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "message", "Livre réservé avec succès",
                    "id", reservation.getId(),
                    "dateExpiration", reservation.getDateExpiration().toString()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @DeleteMapping("/reserver/{id}")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'BIBLIOTHECAIRE')")
    public ResponseEntity<?> annulerReservation(@PathVariable Long id) {
        bibliothequeService.annulerReservation(id);
        return ResponseEntity.ok(Map.of("message", "Réservation annulée"));
    }

    @PostMapping("/reserver/{id}/emprunter")
    @PreAuthorize("hasAnyRole('BIBLIOTHECAIRE')")
    public ResponseEntity<?> transformerReservationEnEmprunt(@PathVariable Long id) {
        try {
            Emprunt emprunt = bibliothequeService.transformerReservationEnEmprunt(id);
            return ResponseEntity.ok(Map.of(
                    "message", "Réservation transformée en emprunt",
                    "empruntId", emprunt.getId(),
                    "dateRetourPrevue", emprunt.getDateRetourPrevue().toString()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/mes-reservations/{etudiantId}")
    @PreAuthorize("hasRole('ETUDIANT')")
    public ResponseEntity<List<Reservation>> mesReservations(@PathVariable Long etudiantId) {
        return ResponseEntity.ok(bibliothequeService.getReservationsEtudiant(etudiantId));
    }

    // ─── Statistiques ───────────────────────────────────────────

    @GetMapping("/stats/{universiteId}")
    @PreAuthorize("hasAnyRole('BIBLIOTHECAIRE', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> getStatistiques(@PathVariable Long universiteId) {
        return ResponseEntity.ok(bibliothequeService.getStatistiquesBibliotheque(universiteId));
    }

    // ─── Gestion des retards ────────────────────────────────────

    @PostMapping("/admin/gerer-retards")
    @PreAuthorize("hasAnyRole('BIBLIOTHECAIRE', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> gererRetards() {
        bibliothequeService.gererRetards();
        return ResponseEntity.ok(Map.of("message", "Gestion des retards effectuée"));
    }

    @GetMapping("/echeances/{universiteId}")
    @PreAuthorize("hasAnyRole('BIBLIOTHECAIRE', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<EmpruntResponseDto>> getEcheancesProches(
            @PathVariable Long universiteId,
            @RequestParam(defaultValue = "3") int jours) {
        List<EmpruntResponseDto> dtos = bibliothequeService.getEmpruntsEcheanceProche(universiteId, jours)
                .stream().map(EmpruntResponseDto::fromEntity).toList();
        return ResponseEntity.ok(dtos);
    }

    // Emprunts en cours d'une université (dashboard admin / bibliothécaire)
    @GetMapping("/emprunts/actifs/{universiteId}")
    @PreAuthorize("hasAnyRole('BIBLIOTHECAIRE', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<EmpruntResponseDto>> getEmpruntsActifs(@PathVariable Long universiteId) {
        List<EmpruntResponseDto> dtos = bibliothequeService.getEmpruntsActifsParUniversite(universiteId)
                .stream().map(EmpruntResponseDto::fromEntity).toList();
        return ResponseEntity.ok(dtos);
    }

    // ─── Réservations (vue bibliothécaire / admin) ──────────────

    @GetMapping("/admin/reservations/{universiteId}")
    @PreAuthorize("hasAnyRole('BIBLIOTHECAIRE', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<ReservationResponseDto>> getReservationsUniversite(@PathVariable Long universiteId) {
        List<ReservationResponseDto> dtos = bibliothequeService.getReservationsParUniversite(universiteId)
                .stream().map(ReservationResponseDto::fromEntity).toList();
        return ResponseEntity.ok(dtos);
    }

    // Réservations actives uniquement (dashboard admin / bibliothécaire)
    @GetMapping("/reservations/actives/{universiteId}")
    @PreAuthorize("hasAnyRole('BIBLIOTHECAIRE', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<ReservationResponseDto>> getReservationsActives(@PathVariable Long universiteId) {
        List<ReservationResponseDto> dtos = bibliothequeService.getReservationsActivesParUniversite(universiteId)
                .stream().map(ReservationResponseDto::fromEntity).toList();
        return ResponseEntity.ok(dtos);
    }
}