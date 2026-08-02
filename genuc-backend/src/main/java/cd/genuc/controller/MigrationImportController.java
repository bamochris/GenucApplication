// src/main/java/cd/genuc/controller/MigrationImportController.java
package cd.genuc.controller;

import cd.genuc.model.MigrationImport;
import cd.genuc.model.MigrationLigne;
import cd.genuc.model.RoleEnum;
import cd.genuc.model.Utilisateur;
import cd.genuc.repository.MigrationImportRepository;
import cd.genuc.repository.MigrationLigneRepository;
import cd.genuc.service.MigrationImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Migration assistée intelligente — intégration d'universités disposant déjà
 * d'étudiants (historique, promotions, facultés, matricules, situation
 * financière). Assistant en 8 étapes avec reprise, pause et annulation.
 */
@RestController
@RequestMapping("/api/migrations")
@RequiredArgsConstructor
public class MigrationImportController {

    private final MigrationImportService migrationService;
    private final MigrationImportRepository migrationRepo;
    private final MigrationLigneRepository ligneRepo;

    // Un ADMIN_UNIVERSITE ne voit et ne manipule que les migrations de sa
    // propre université ; le SUPER_ADMIN n'a aucune restriction.
    private ResponseEntity<?> verifierAcces(Utilisateur user, Long universiteId) {
        if (user.getRole() == RoleEnum.ADMIN_UNIVERSITE && !universiteId.equals(user.getUniversiteId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("erreur", "Cette migration appartient à une autre université."));
        }
        return null;
    }

    // ─── Historique ──────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> historique(@AuthenticationPrincipal Utilisateur user,
                                        @RequestParam(required = false) Long universiteId) {
        List<MigrationImport> migrations;
        if (user.getRole() == RoleEnum.ADMIN_UNIVERSITE) {
            migrations = migrationRepo.findByUniversiteIdOrderByCreeLeDesc(user.getUniversiteId());
        } else if (universiteId != null) {
            migrations = migrationRepo.findByUniversiteIdOrderByCreeLeDesc(universiteId);
        } else {
            migrations = migrationRepo.findAllByOrderByCreeLeDesc();
        }
        return ResponseEntity.ok(migrations.stream().map(m -> {
            Map<String, Object> resume = new LinkedHashMap<>();
            resume.put("id", m.getId());
            resume.put("nom", m.getNom());
            resume.put("universiteNom", m.getUniversite().getNom());
            resume.put("statut", m.getStatut());
            resume.put("etape", m.getEtape());
            resume.put("progression", m.getProgression());
            resume.put("totalLignes", m.getTotalLignes());
            resume.put("lignesImportees", m.getLignesImportees());
            resume.put("lignesErreur", m.getLignesErreur());
            resume.put("creeLe", m.getCreeLe());
            return resume;
        }).collect(Collectors.toList()));
    }

    // ─── Étape 1 : création + analyse automatique ────────────────

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> creer(@AuthenticationPrincipal Utilisateur user,
                                   @RequestParam String nom,
                                   @RequestParam Long universiteId,
                                   @RequestParam(required = false) String anneeAcademique,
                                   @RequestPart("fichier") MultipartFile fichier) {
        ResponseEntity<?> refus = verifierAcces(user, universiteId);
        if (refus != null) return refus;
        try {
            MigrationImport migration = migrationService.creer(nom, universiteId, anneeAcademique, fichier, user.getEmail());
            return ResponseEntity.status(HttpStatus.CREATED).body(migrationService.detail(migration.getId()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> detail(@AuthenticationPrincipal Utilisateur user, @PathVariable Long id) {
        MigrationImport migration = migrationService.obtenir(id);
        ResponseEntity<?> refus = verifierAcces(user, migration.getUniversite().getId());
        if (refus != null) return refus;
        return ResponseEntity.ok(migrationService.detail(id));
    }

    // ─── Étape 3 : mapping ───────────────────────────────────────

    @PutMapping("/{id}/mapping")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> confirmerMapping(@AuthenticationPrincipal Utilisateur user,
                                              @PathVariable Long id,
                                              @RequestBody Map<String, String> mapping) {
        MigrationImport migration = migrationService.obtenir(id);
        ResponseEntity<?> refus = verifierAcces(user, migration.getUniversite().getId());
        if (refus != null) return refus;
        try {
            migrationService.confirmerMapping(id, mapping);
            return ResponseEntity.ok(migrationService.detail(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PutMapping("/{id}/options")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> options(@AuthenticationPrincipal Utilisateur user,
                                     @PathVariable Long id,
                                     @RequestBody Map<String, Object> options) {
        MigrationImport migration = migrationService.obtenir(id);
        ResponseEntity<?> refus = verifierAcces(user, migration.getUniversite().getId());
        if (refus != null) return refus;
        try {
            migrationService.confirmerOptions(id, options);
            return ResponseEntity.ok(migrationService.detail(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ─── Étape 4 : vérification ──────────────────────────────────

    @PostMapping("/{id}/verifier")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> verifier(@AuthenticationPrincipal Utilisateur user, @PathVariable Long id) {
        MigrationImport migration = migrationService.obtenir(id);
        ResponseEntity<?> refus = verifierAcces(user, migration.getUniversite().getId());
        if (refus != null) return refus;
        try {
            migrationService.verifier(id);
            return ResponseEntity.ok(migrationService.detail(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ─── Lignes (vérification, correction, centre des erreurs) ──

    @GetMapping("/{id}/lignes")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> lignes(@AuthenticationPrincipal Utilisateur user,
                                    @PathVariable Long id,
                                    @RequestParam(required = false) String statut,
                                    @RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "50") int taille) {
        MigrationImport migration = migrationService.obtenir(id);
        ResponseEntity<?> refus = verifierAcces(user, migration.getUniversite().getId());
        if (refus != null) return refus;
        Page<MigrationLigne> resultat = (statut == null || statut.isBlank())
            ? ligneRepo.findByMigrationIdOrderByNumeroLigne(id, PageRequest.of(page, Math.min(taille, 200)))
            : ligneRepo.findByMigrationIdAndStatutOrderByNumeroLigne(id,
                MigrationLigne.StatutLigne.valueOf(statut), PageRequest.of(page, Math.min(taille, 200)));
        return ResponseEntity.ok(Map.of(
            "contenu", resultat.getContent(),
            "page", resultat.getNumber(),
            "totalPages", resultat.getTotalPages(),
            "totalElements", resultat.getTotalElements()
        ));
    }

    @PutMapping("/{id}/lignes/{ligneId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> corrigerLigne(@AuthenticationPrincipal Utilisateur user,
                                           @PathVariable Long id,
                                           @PathVariable Long ligneId,
                                           @RequestBody Map<String, Object> body) {
        MigrationImport migration = migrationService.obtenir(id);
        ResponseEntity<?> refus = verifierAcces(user, migration.getUniversite().getId());
        if (refus != null) return refus;
        try {
            @SuppressWarnings("unchecked")
            Map<String, String> donnees = body.get("donnees") instanceof Map
                ? ((Map<Object, Object>) body.get("donnees")).entrySet().stream()
                    .collect(Collectors.toMap(e -> String.valueOf(e.getKey()),
                                              e -> e.getValue() == null ? "" : String.valueOf(e.getValue())))
                : null;
            String action = body.get("action") != null ? body.get("action").toString() : null;
            return ResponseEntity.ok(migrationService.corrigerLigne(id, ligneId, donnees, action));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/lignes/{ligneId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> ignorerLigne(@AuthenticationPrincipal Utilisateur user,
                                          @PathVariable Long id, @PathVariable Long ligneId) {
        MigrationImport migration = migrationService.obtenir(id);
        ResponseEntity<?> refus = verifierAcces(user, migration.getUniversite().getId());
        if (refus != null) return refus;
        return ligneRepo.findById(ligneId).<ResponseEntity<?>>map(ligne -> {
            ligne.setStatut(MigrationLigne.StatutLigne.IGNOREE);
            ligneRepo.save(ligne);
            return ResponseEntity.ok(Map.of("message", "Ligne ignorée"));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ─── Étape 6 : simulation ────────────────────────────────────

    @PostMapping("/{id}/simuler")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> simuler(@AuthenticationPrincipal Utilisateur user, @PathVariable Long id) {
        MigrationImport migration = migrationService.obtenir(id);
        ResponseEntity<?> refus = verifierAcces(user, migration.getUniversite().getId());
        if (refus != null) return refus;
        try {
            return ResponseEntity.ok(migrationService.simuler(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ─── Étape 7 : import / pause / reprise / annulation ─────────

    @PostMapping("/{id}/importer")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> importer(@AuthenticationPrincipal Utilisateur user, @PathVariable Long id) {
        MigrationImport migration = migrationService.obtenir(id);
        ResponseEntity<?> refus = verifierAcces(user, migration.getUniversite().getId());
        if (refus != null) return refus;
        try {
            migrationService.demarrerImport(id);
            return ResponseEntity.accepted().body(Map.of("message", "Import démarré — suivez la progression."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/{id}/pause")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> pause(@AuthenticationPrincipal Utilisateur user, @PathVariable Long id) {
        MigrationImport migration = migrationService.obtenir(id);
        ResponseEntity<?> refus = verifierAcces(user, migration.getUniversite().getId());
        if (refus != null) return refus;
        try {
            migrationService.pauser(id);
            return ResponseEntity.ok(Map.of("message", "Import mis en pause — il s'arrêtera à la fin du lot en cours."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reprendre")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> reprendre(@AuthenticationPrincipal Utilisateur user, @PathVariable Long id) {
        MigrationImport migration = migrationService.obtenir(id);
        ResponseEntity<?> refus = verifierAcces(user, migration.getUniversite().getId());
        if (refus != null) return refus;
        try {
            migrationService.reprendre(id);
            return ResponseEntity.accepted().body(Map.of("message", "Import repris là où il s'était arrêté."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/{id}/annuler")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> annuler(@AuthenticationPrincipal Utilisateur user, @PathVariable Long id) {
        MigrationImport migration = migrationService.obtenir(id);
        ResponseEntity<?> refus = verifierAcces(user, migration.getUniversite().getId());
        if (refus != null) return refus;
        try {
            migrationService.annuler(id);
            return ResponseEntity.ok(Map.of("message",
                "Migration annulée : les étudiants et paiements créés par cette migration ont été retirés."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ─── Modèle de fichier téléchargeable ────────────────────────
    // Excel par défaut (feuille d'exemples stylée + feuille Instructions) ;
    // ?format=csv reste disponible pour les outils qui préfèrent le texte.

    @GetMapping("/modele")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<byte[]> modele(@RequestParam(defaultValue = "excel") String format) {
        if ("csv".equalsIgnoreCase(format)) {
            String csv = "Matricule;Nom;Postnom;Prenom;Sexe;Date de naissance;Email;Telephone;"
                + "Faculte;Departement;Filiere;Promotion;Montant paye;Devise;Date paiement\n"
                + "HEC-2024-001;KABONGO;MWAMBA;Jean;M;12/05/2001;jean.kabongo@exemple.cd;+243810000001;"
                + "Sciences Commerciales;Commerce;Comptabilite;L2;450;USD;15/01/2026\n";
            return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"modele_migration_genuc.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv.getBytes(StandardCharsets.UTF_8));
        }
        try {
            byte[] xlsx = migrationService.genererModeleExcel();
            return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"modele_migration_genuc.xlsx\"")
                .contentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(xlsx);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
