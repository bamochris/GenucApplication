package cd.genuc.service;

import cd.genuc.model.Inscription;
import cd.genuc.model.Universite;
import cd.genuc.model.StatutInscription;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RecteurService {

    private final UniversiteRepository universiteRepo;
    private final InscriptionRepository inscriptionRepo;
    private final DepartementRepository departementRepo;
    private final PaiementRepository paiementRepo;
    private final DeliberationRepository deliberationRepo;

    public Map<String, Object> getDashboardExecutif(Long universiteId) {
        Universite universite = universiteRepo.findById(universiteId)
                .orElseThrow(() -> new RuntimeException("Université introuvable"));

        long totalEtudiants = universiteRepo.countEtudiantsValides(universiteId);
        long totalEnseignants = 0; // À implémenter
        long totalDepartements = departementRepo.countByUniversiteIdAndActifTrue(universiteId);

        LocalDate today = LocalDate.now();
        LocalDate debutMois = today.withDayOfMonth(1);
        Double recettesMois = paiementRepo.totalCollecteParPeriode(universiteId, debutMois, today);
        if (recettesMois == null) recettesMois = 0.0;

        String anneeCourante = getCurrentAcademicYear();
        long totalAdmis = deliberationRepo.countAdmis(universiteId, anneeCourante);
        long totalDiplomes = deliberationRepo.countDiplomes(universiteId, anneeCourante);
        long totalDelib = deliberationRepo.findByUniversiteIdAndAnneeAcademique(universiteId, anneeCourante).size();
        double tauxReussite = totalDelib > 0 ? ((double) (totalAdmis + totalDiplomes) / totalDelib) * 100 : 0;

        // ✅ Correction : utilisation de l'enum
        long inscriptionsEnAttente = inscriptionRepo.countByUniversite_IdAndStatut(universiteId, StatutInscription.EN_ATTENTE);

        Map<String, Object> dashboard = new LinkedHashMap<>();
        dashboard.put("universite", universite.getNom());
        dashboard.put("universiteCode", universite.getCode());
        dashboard.put("anneeAcademique", anneeCourante);
        dashboard.put("date", today.toString());

        Map<String, Object> effectifs = new LinkedHashMap<>();
        effectifs.put("totalEtudiants", totalEtudiants);
        effectifs.put("totalEnseignants", totalEnseignants);
        effectifs.put("totalDepartements", totalDepartements);
        effectifs.put("inscriptionsEnAttente", inscriptionsEnAttente);
        dashboard.put("effectifs", effectifs);

        Map<String, Object> finances = new LinkedHashMap<>();
        finances.put("recettesMois", recettesMois);
        finances.put("recettesAnnee", 0);
        dashboard.put("finances", finances);

        Map<String, Object> resultats = new LinkedHashMap<>();
        resultats.put("totalAdmis", totalAdmis);
        resultats.put("totalDiplomes", totalDiplomes);
        resultats.put("tauxReussite", Math.round(tauxReussite * 100.0) / 100.0);
        dashboard.put("resultats", resultats);

        return dashboard;
    }

    public List<Map<String, Object>> getEvolutionEffectifs(Long universiteId) {
        return List.of();
    }

    public List<Map<String, Object>> getReussiteParFaculte(Long universiteId, String annee) {
        return List.of();
    }

    @Transactional
    public Map<String, Object> validerDecision(Long decisionId, String typeDecision, Long recteurId, String commentaire) {
        if (typeDecision == null) {
            throw new RuntimeException("Le type de décision est requis");
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("decisionId", decisionId);
        result.put("type", typeDecision);

        switch (typeDecision.toUpperCase()) {
            case "INSCRIPTION" -> {
                Inscription inscription = inscriptionRepo.findById(decisionId)
                        .orElseThrow(() -> new RuntimeException("Inscription introuvable"));
                if (inscription.getStatut() == StatutInscription.VALIDE) {
                    throw new RuntimeException("Cette inscription est déjà validée");
                }
                inscription.setStatut(StatutInscription.VALIDE);
                if (commentaire != null && !commentaire.isBlank()) {
                    inscription.setCommentaire(commentaire);
                }
                inscriptionRepo.save(inscription);
                result.put("matricule", inscription.getMatricule());
            }
            default -> throw new RuntimeException("Type de décision non supporté : " + typeDecision);
        }

        result.put("validee", true);
        result.put("validePar", recteurId);
        result.put("commentaire", commentaire);
        result.put("dateValidation", LocalDateTime.now());
        return result;
    }

    private String getCurrentAcademicYear() {
        int year = LocalDate.now().getYear();
        return year + "-" + (year + 1);
    }
}