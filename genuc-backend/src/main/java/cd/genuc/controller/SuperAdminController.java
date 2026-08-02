package cd.genuc.controller;

import cd.genuc.model.Paiement;
import cd.genuc.model.StatutInscription;
import cd.genuc.model.Universite;
import cd.genuc.model.Utilisateur;
import cd.genuc.repository.*;
import cd.genuc.service.SuperAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/super-admin")
@RequiredArgsConstructor
public class SuperAdminController {

    private final UniversiteRepository universiteRepository;
    private final InscriptionRepository inscriptionRepository;
    private final DepartementRepository departementRepository;
    private final PaiementRepository paiementRepository;
    private final SuperAdminService superAdminService;

    // ─── Statistiques globales ──────────────────────────────────

    @GetMapping("/stats")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> getStats() {
        // Toutes les universités désactivées/supprimées (ex. universités de
        // démonstration) sont exclues de ces compteurs.
        long totalUniversites = universiteRepository.countByActifTrue();
        long totalDepartements = departementRepository.countActifsUniversiteActive();
        long totalEtudiants = inscriptionRepository.countByStatutAndUniversiteActifTrue(StatutInscription.VALIDE);
        Double totalPaiements = paiementRepository.totalParStatutUniversiteActive(Paiement.StatutPaiement.VALIDE);
        return ResponseEntity.ok(Map.of(
                "totalUniversites", totalUniversites,
                "totalDepartements", totalDepartements,
                "totalEtudiants", totalEtudiants,
                "totalPaiements", totalPaiements
        ));
    }

    // ─── Statistiques par université (adapté pour la requête native) ──

    @GetMapping("/stats/universites")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> getStatsParUniversite() {
        List<Object[]> stats = universiteRepository.getStatsAllUniversites();
        List<Map<String, Object>> result = stats.stream().map(row -> Map.of(
                "id", row[0],
                "nom", row[1],
                "code", row[2],
                "nbDepartements", row[3],
                "nbInscriptions", row[4],
                "nbEtudiants", row[5]
        )).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ─── Statistiques complètes ─────────────────────────────────

    @GetMapping("/stats/completes")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> getStatsCompletes() {
        // Toutes les universités désactivées/supprimées (ex. universités de
        // démonstration) sont exclues de ces compteurs.
        long totalUniversites = universiteRepository.countByActifTrue();
        long totalDepartements = departementRepository.countActifsUniversiteActive();
        long totalEtudiants = inscriptionRepository.countByUniversiteActifTrue();
        long totalEtudiantsValides = inscriptionRepository.countByStatutAndUniversiteActifTrue(StatutInscription.VALIDE);
        long totalInscriptionsEnAttente = inscriptionRepository.countByStatutAndUniversiteActifTrue(StatutInscription.EN_ATTENTE);
        double totalPaiementsValides = paiementRepository.totalParStatutUniversiteActive(Paiement.StatutPaiement.VALIDE);
        double totalPaiementsEnAttente = paiementRepository.totalParStatutUniversiteActive(Paiement.StatutPaiement.EN_ATTENTE);
        return ResponseEntity.ok(Map.of(
                "totalUniversites", totalUniversites,
                "totalDepartements", totalDepartements,
                "totalEtudiants", totalEtudiants,
                "totalEtudiantsValides", totalEtudiantsValides,
                "totalInscriptionsEnAttente", totalInscriptionsEnAttente,
                "totalPaiementsValides", totalPaiementsValides,
                "totalPaiementsEnAttente", totalPaiementsEnAttente
        ));
    }

    // ─── Paiements mensuels ─────────────────────────────────────

    @GetMapping("/stats/paiements-mensuels")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> getPaiementsMensuels(@RequestParam(defaultValue = "2025") int annee) {
        YearMonth current = YearMonth.of(annee, 1);
        Map<String, Double> resultats = new LinkedHashMap<>();
        for (int i = 0; i < 12; i++) {
            YearMonth ym = current.plusMonths(i);
            LocalDate debut = ym.atDay(1);
            LocalDate fin = ym.atEndOfMonth();
            Double total = paiementRepository.totalCollecteParPeriode(null, debut, fin);
            if (total == null) total = 0.0;
            resultats.put(ym.getMonth().name() + " " + annee, total);
        }
        return ResponseEntity.ok(resultats);
    }

    // ─── Création complète d'une université ─────────────────────

    @PostMapping(value = "/universites", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> creerUniversiteAvecAdmin(
            @RequestPart("universite") Universite universite,
            @RequestPart("admin") Utilisateur admin,
            @RequestPart(value = "facultes", required = false) List<String> facultes,
            @RequestPart(value = "departements", required = false) List<String> departements,
            @RequestPart(value = "promotions", required = false) List<String> promotions,
            @RequestPart(value = "logo", required = false) MultipartFile logo,
            @RequestPart(value = "sceau", required = false) MultipartFile sceau) {

        Universite saved = superAdminService.enregistrerUniversiteAvecAdmin(
                universite, admin, facultes, departements, promotions, logo, sceau
        );

        return ResponseEntity.ok(Map.of(
                "message", "Université créée avec succès",
                "id", saved.getId(),
                "code", saved.getCode()
        ));
    }
}