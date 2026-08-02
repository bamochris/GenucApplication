package cd.genuc.controller;

import cd.genuc.model.*;
import cd.genuc.service.CoursService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * API REST — Cours en ligne GENUC
 */
@RestController
@RequestMapping("/api/cours")
@RequiredArgsConstructor
public class CoursController {

    private final CoursService coursService;

    // ══════════════════════════════════════════
    // VUE PUBLIQUE / ÉTUDIANT
    // ══════════════════════════════════════════

    @GetMapping("/public/{uniId}")
    public ResponseEntity<List<Cours>> coursPublies(@PathVariable Long uniId) {
        return ResponseEntity.ok(coursService.listerPublies(uniId));
    }

    @GetMapping("/public/departement/{departementId}")
    public ResponseEntity<List<Cours>> getCoursByDepartementPublic(@PathVariable Long departementId) {
        return ResponseEntity.ok(coursService.listerPubliesParDepartement(departementId));
    }

    @GetMapping("/public/{uniId}/dept/{deptId}/niveau/{niveau}")
    public ResponseEntity<List<Cours>> parDeptEtNiveau(
            @PathVariable Long uniId,
            @PathVariable Long deptId,
            @PathVariable String niveau) {
        return ResponseEntity.ok(coursService.listerParDeptEtNiveau(deptId, niveau));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> detail(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(coursService.obtenir(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{coursId}/etudiants")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> etudiantsInscrits(@PathVariable Long coursId) {
        try {
            return ResponseEntity.ok(coursService.etudiantsInscrits(coursId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/{id}/lecons")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Lecon>> lecons(@PathVariable Long id) {
        return ResponseEntity.ok(coursService.listerLecons(id));
    }

    @GetMapping("/live/en-cours")
    public ResponseEntity<List<SeanceLive>> seancesEnCours() {
        return ResponseEntity.ok(coursService.seancesEnCours());
    }

    @GetMapping("/{uniId}/live/prochaines")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SeanceLive>> prochainesSeances(@PathVariable Long uniId) {
        return ResponseEntity.ok(coursService.prochainesSeances(uniId));
    }

    // ══════════════════════════════════════════
    // PROGRESSION ÉTUDIANT
    // ══════════════════════════════════════════

    @GetMapping("/etudiant/{inscriptionId}/progressions")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'PROFESSEUR') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<List<ProgressionEtudiant>> mesProgressions(
            @PathVariable Long inscriptionId) {
        return ResponseEntity.ok(coursService.mesProgressions(inscriptionId));
    }

    @PostMapping("/etudiant/{inscriptionId}/cours/{coursId}/lecon/{leconId}")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> marquerLeconCompletee(
            @PathVariable Long inscriptionId,
            @PathVariable Long coursId,
            @PathVariable Long leconId,
            @RequestBody(required = false) Map<String, Object> body) {
        try {
            int temps = (body != null && body.containsKey("tempsMinutes"))
                ? Integer.valueOf(body.get("tempsMinutes").toString()) : 0;
            ProgressionEtudiant prog = coursService.marquerLeconCompletee(
                inscriptionId, coursId, leconId, temps
            );
            return ResponseEntity.ok(Map.of(
                "message",               "Leçon marquée comme complétée",
                "pourcentageCompletion", prog.getPourcentageCompletion(),
                "leconsCompletees",      prog.getLeconsCompletees(),
                "leconsTotal",           prog.getLeconsTotal(),
                "coursComplete",         prog.isCoursComplete()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // GESTION COURS (Professeur / Admin)
    // ══════════════════════════════════════════

    @GetMapping("/admin/{uniId}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<Cours>> tousLesCours(@PathVariable Long uniId) {
        return ResponseEntity.ok(coursService.listerTous(uniId));
    }

    @GetMapping("/professeur/{professeurId}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<Cours>> mesCours(@PathVariable Long professeurId) {
        return ResponseEntity.ok(coursService.mesCours(professeurId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> creer(@RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(coursService.creer(body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> modifier(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(coursService.modifier(id, body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/publier")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> publier(@PathVariable Long id) {
        try {
            Cours cours = coursService.publier(id);
            return ResponseEntity.ok(Map.of(
                "message", "Cours publié avec succès",
                "statut",  cours.getStatut(),
                "titre",   cours.getTitre()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/archiver")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> archiver(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(coursService.archiver(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // LEÇONS
    // ══════════════════════════════════════════

    @PostMapping("/{id}/lecons")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> ajouterLecon(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(coursService.ajouterLecon(id, body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @DeleteMapping("/lecons/{leconId}")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> supprimerLecon(@PathVariable Long leconId) {
        try {
            coursService.supprimerLecon(leconId);
            return ResponseEntity.ok(Map.of("message", "Leçon supprimée"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // SÉANCES LIVE
    // ══════════════════════════════════════════

    @GetMapping("/{id}/live")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SeanceLive>> seancesLive(@PathVariable Long id) {
        return ResponseEntity.ok(coursService.listerSeancesLive(id));
    }

    @PostMapping("/{id}/live")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> planifierSeance(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            SeanceLive seance = coursService.planifierSeance(id, body);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message",      "Séance planifiée",
                "id",           seance.getId(),
                "titre",        seance.getTitre(),
                "dateDebut",    seance.getDateDebut().toString(),
                "lienReunion",  seance.getLienReunion(),
                "plateforme",   seance.getPlateforme()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/live/{seanceId}/demarrer")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> demarrerSeance(@PathVariable Long seanceId) {
        try {
            SeanceLive s = coursService.demarrerSeance(seanceId);
            return ResponseEntity.ok(Map.of(
                "message",     "Séance démarrée — live actif",
                "lienReunion", s.getLienReunion(),
                "statut",      s.getStatut()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/live/{seanceId}/terminer")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> terminerSeance(
            @PathVariable Long seanceId,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String url = (body != null && body.containsKey("urlEnregistrement")) ? body.get("urlEnregistrement") : null;
            SeanceLive s = coursService.terminerSeance(seanceId, url);
            return ResponseEntity.ok(Map.of(
                "message", "Séance terminée",
                "statut",  s.getStatut(),
                "enregistrement", s.getUrlEnregistrement() != null
                    ? s.getUrlEnregistrement() : "Non disponible"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // STATISTIQUES
    // ══════════════════════════════════════════

    @GetMapping("/{id}/stats")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'CHEF_DEPARTEMENT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> stats(@PathVariable Long id) {
        return ResponseEntity.ok(coursService.statsCours(id));
    }
}