package cd.genuc.controller;

import cd.genuc.dto.CoursVacationDTO;
import cd.genuc.dto.InscriptionVacationDTO;
import cd.genuc.dto.VacationDTO;
import cd.genuc.model.CoursVacation;
import cd.genuc.model.TypeVacation;
import cd.genuc.model.Vacation;
import cd.genuc.service.VacationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vacations")
@RequiredArgsConstructor
public class VacationController {

    private final VacationService vacationService;

    // ══════════════════════════════════════════
    // VACATIONS — CRUD
    // ══════════════════════════════════════════

    @GetMapping("/universite/{universiteId}")
    public ResponseEntity<List<VacationDTO>> listerParUniversite(@PathVariable Long universiteId) {
        return ResponseEntity.ok(vacationService.listerParUniversite(universiteId));
    }

    @GetMapping("/universite/{universiteId}/actives")
    public ResponseEntity<List<VacationDTO>> listerActives(@PathVariable Long universiteId) {
        return ResponseEntity.ok(vacationService.listerActives(universiteId));
    }

    @GetMapping("/universite/{universiteId}/inscriptions-ouvertes")
    public ResponseEntity<List<VacationDTO>> listerInscriptionsOuvertes(@PathVariable Long universiteId) {
        return ResponseEntity.ok(vacationService.listerInscriptionsOuvertes(universiteId));
    }

    @GetMapping("/universite/{universiteId}/type/{type}")
    public ResponseEntity<List<VacationDTO>> listerParType(
            @PathVariable Long universiteId, @PathVariable TypeVacation type) {
        return ResponseEntity.ok(vacationService.listerParType(universiteId, type));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VacationDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(vacationService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<VacationDTO> creer(@RequestBody Vacation vacation,
            @RequestParam Long universiteId,
            @RequestParam Long anneeAcademiqueId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(vacationService.creer(vacation, universiteId, anneeAcademiqueId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<VacationDTO> modifier(@PathVariable Long id, @RequestBody Vacation vacation) {
        return ResponseEntity.ok(vacationService.modifier(id, vacation));
    }

    @PatchMapping("/{id}/ouvrir-inscriptions")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> ouvrirInscriptions(@PathVariable Long id) {
        try {
            vacationService.ouvrirInscriptions(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/fermer-inscriptions")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<Void> fermerInscriptions(@PathVariable Long id) {
        vacationService.fermerInscriptions(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/archiver")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<Void> archiver(@PathVariable Long id) {
        vacationService.archiver(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        vacationService.supprimer(id);
        return ResponseEntity.noContent().build();
    }

    // ══════════════════════════════════════════
    // COURS VACATION
    // ══════════════════════════════════════════

    @GetMapping("/{vacationId}/cours")
    public ResponseEntity<List<CoursVacationDTO>> listerCours(@PathVariable Long vacationId) {
        return ResponseEntity.ok(vacationService.listerCours(vacationId));
    }

    @GetMapping("/{vacationId}/cours/promotion/{promotionId}")
    public ResponseEntity<List<CoursVacationDTO>> listerCoursParPromotion(
            @PathVariable Long vacationId, @PathVariable Long promotionId) {
        return ResponseEntity.ok(vacationService.listerCoursParPromotion(vacationId, promotionId));
    }

    @GetMapping("/professeur/{professeurId}/cours")
    @PreAuthorize("hasAnyRole('PROFESSEUR', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<List<CoursVacationDTO>> listerCoursParProfesseur(@PathVariable Long professeurId) {
        return ResponseEntity.ok(vacationService.listerCoursParProfesseur(professeurId));
    }

    @PostMapping("/{vacationId}/cours")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<CoursVacationDTO> ajouterCours(
            @PathVariable Long vacationId,
            @RequestBody CoursVacation coursVacation,
            @RequestParam Long coursId,
            @RequestParam(required = false) Long professeurId,
            @RequestParam Long promotionId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(vacationService.ajouterCours(coursVacation, vacationId, coursId, professeurId, promotionId));
    }

    @DeleteMapping("/cours/{coursVacationId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<Void> supprimerCours(@PathVariable Long coursVacationId) {
        vacationService.supprimerCours(coursVacationId);
        return ResponseEntity.noContent().build();
    }

    // ══════════════════════════════════════════
    // INSCRIPTIONS VACATION (ÉTUDIANTS)
    // ══════════════════════════════════════════

    @GetMapping("/{vacationId}/inscriptions")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<List<InscriptionVacationDTO>> listerInscriptions(@PathVariable Long vacationId) {
        return ResponseEntity.ok(vacationService.listerInscriptions(vacationId));
    }

    @GetMapping("/etudiant/{etudiantId}/inscriptions")
    public ResponseEntity<List<InscriptionVacationDTO>> listerInscriptionsParEtudiant(@PathVariable Long etudiantId) {
        return ResponseEntity.ok(vacationService.listerInscriptionsParEtudiant(etudiantId));
    }

    @GetMapping("/etudiant/{etudiantId}/inscriptions/annee/{anneeAcademiqueId}")
    public ResponseEntity<List<InscriptionVacationDTO>> listerInscriptionsEtudiantParAnnee(
            @PathVariable Long etudiantId, @PathVariable Long anneeAcademiqueId) {
        return ResponseEntity.ok(vacationService.listerInscriptionsEtudiantParAnnee(etudiantId, anneeAcademiqueId));
    }

    @PostMapping("/{vacationId}/inscriptions")
    public ResponseEntity<InscriptionVacationDTO> inscrireEtudiant(
            @PathVariable Long vacationId,
            @RequestParam Long etudiantId,
            @RequestParam Long promotionId,
            @RequestParam Long anneeAcademiqueId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(vacationService.inscrireEtudiant(vacationId, etudiantId, promotionId, anneeAcademiqueId));
    }

    @PatchMapping("/inscriptions/{inscriptionId}/valider")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<InscriptionVacationDTO> validerInscription(@PathVariable Long inscriptionId) {
        return ResponseEntity.ok(vacationService.validerInscription(inscriptionId));
    }

    @PatchMapping("/inscriptions/{inscriptionId}/rejeter")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<InscriptionVacationDTO> rejeterInscription(
            @PathVariable Long inscriptionId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(vacationService.rejeterInscription(inscriptionId, body.get("motif")));
    }

    @DeleteMapping("/inscriptions/{inscriptionId}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<Void> desinscrireEtudiant(@PathVariable Long inscriptionId) {
        vacationService.desinscrireEtudiant(inscriptionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{vacationId}/inscriptions/count")
    public ResponseEntity<Long> compterInscriptions(@PathVariable Long vacationId) {
        return ResponseEntity.ok(vacationService.compterInscriptions(vacationId));
    }
}
