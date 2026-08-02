package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StageService {

    private final StageRepository stageRepo;
    private final OffreStageRepository offreRepo;
    private final CandidatureStageRepository candidatureRepo;
    private final InscriptionRepository inscriptionRepo;
    private final StockageFichierService stockage;

    // ══════════════════════════════════════════
    // Portail étudiant
    // ══════════════════════════════════════════

    public Map<String, Object> monStage(Long inscriptionId) {
        Stage stage = stageRepo.findFirstByInscriptionIdOrderByDateCreationDesc(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Aucun stage déclaré"));
        return toStageMap(stage);
    }

    public List<Map<String, Object>> offresDisponibles() {
        return offreRepo.findByStatutOrderByDatePublicationDesc(OffreStage.StatutOffre.OUVERTE).stream()
                .map(o -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", o.getId());
                    m.put("titre", o.getTitre());
                    m.put("entreprise", o.getEntreprise());
                    m.put("localisation", o.getLocalisation());
                    m.put("dureeSemaines", o.getDureeSemaines());
                    m.put("remuneration", o.getRemuneration());
                    m.put("description", o.getDescription());
                    m.put("postule", false);
                    return m;
                }).collect(Collectors.toList());
    }

    @Transactional
    public CandidatureStage postuler(Long offreId, Long inscriptionId) {
        OffreStage offre = offreRepo.findById(offreId)
                .orElseThrow(() -> new RuntimeException("Offre introuvable"));
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

        if (candidatureRepo.existsByOffreIdAndInscriptionId(offreId, inscriptionId)) {
            throw new RuntimeException("Vous avez déjà postulé à cette offre");
        }

        CandidatureStage candidature = CandidatureStage.builder()
                .offre(offre)
                .inscription(inscription)
                .build();
        return candidatureRepo.save(candidature);
    }

    @Transactional
    public Stage declarerStage(Long inscriptionId, Map<String, String> form, MultipartFile convention) throws IOException {
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

        Stage.StageBuilder builder = Stage.builder()
                .inscription(inscription)
                .entreprise(form.get("entreprise"))
                .adresse(form.get("adresse"))
                .telephone(form.get("telephone"))
                .responsable(form.get("responsable"))
                .emailResponsable(form.get("emailResponsable"))
                .description(form.get("description"))
                .dateDebut(LocalDate.parse(form.get("dateDebut")))
                .dateFin(LocalDate.parse(form.get("dateFin")));

        Stage stage = builder.build();

        if (convention != null && !convention.isEmpty()) {
            var enregistre = stockage.enregistrer(convention, "stages", StockageFichierService.Categorie.DOCUMENT);
            stage.setConventionUrl(enregistre.url());
            stage.setConventionNomFichier(enregistre.nomOriginal());
        }

        return stageRepo.save(stage);
    }

    @Transactional
    public Stage deposerRapport(Long inscriptionId, Long stageId, MultipartFile rapport) throws IOException {
        Stage stage = stageRepo.findById(stageId)
                .orElseThrow(() -> new RuntimeException("Stage introuvable"));
        if (!stage.getInscription().getId().equals(inscriptionId)) {
            throw new RuntimeException("Ce stage n'appartient pas à cet étudiant");
        }

        var enregistre = stockage.enregistrer(rapport, "stages", StockageFichierService.Categorie.DOCUMENT);

        stage.setRapportUrl(enregistre.url());
        stage.setRapportNomFichier(enregistre.nomOriginal());
        stage.setRapportTitre("Rapport de stage - " + stage.getEntreprise());
        stage.setRapportDate(LocalDateTime.now());
        stage.setRapportStatut(Stage.StatutRapport.EN_ATTENTE);

        return stageRepo.save(stage);
    }

    // ══════════════════════════════════════════
    // Professeur : validation des stages
    // ══════════════════════════════════════════

    public List<Map<String, Object>> stagesPourValidation(Long professeurId) {
        return stageRepo.findAllByOrderByDateCreationDesc().stream()
                .map(this::toValidationMap)
                .collect(Collectors.toList());
    }

    @Transactional
    public Stage validerStage(Long id, Long valideParId) {
        Stage stage = stageRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Stage introuvable"));
        stage.setStatut(Stage.StatutStage.EN_COURS);
        stage.setValideParId(valideParId);
        stage.setTuteurId(valideParId);
        return stageRepo.save(stage);
    }

    @Transactional
    public Stage rejeterStage(Long id, String motif, Long valideParId) {
        Stage stage = stageRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Stage introuvable"));
        stage.setStatut(Stage.StatutStage.REJETE);
        stage.setMotifRejet(motif);
        stage.setValideParId(valideParId);
        return stageRepo.save(stage);
    }

    // ══════════════════════════════════════════
    // Professeur : suivi des stages en cours
    // ══════════════════════════════════════════

    public List<Map<String, Object>> stagesEnSuivi(Long professeurId) {
        return stageRepo.findByStatutInOrderByDateCreationDesc(
                        List.of(Stage.StatutStage.EN_COURS, Stage.StatutStage.TERMINE)).stream()
                .map(s -> {
                    Map<String, Object> m = toValidationMap(s);
                    m.put("progression", s.getProgression());
                    m.put("tuteur", s.getTuteurNom());
                    return m;
                }).collect(Collectors.toList());
    }

    public Map<String, Object> rapportDuStage(Long stageId) {
        Stage stage = stageRepo.findById(stageId)
                .orElseThrow(() -> new RuntimeException("Stage introuvable"));
        if (stage.getRapportUrl() == null) {
            throw new RuntimeException("Aucun rapport soumis");
        }
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("titre", stage.getRapportTitre());
        m.put("resume", stage.getRapportResume());
        m.put("dateSoumission", stage.getRapportDate());
        m.put("url", stage.getRapportUrl());
        m.put("statut", stage.getRapportStatut().name());
        m.put("avis", stage.getAvis());
        return m;
    }

    @Transactional
    public Stage validerRapport(Long stageId, String avis, Long valideParId) {
        Stage stage = stageRepo.findById(stageId)
                .orElseThrow(() -> new RuntimeException("Stage introuvable"));
        stage.setRapportStatut(Stage.StatutRapport.VALIDE);
        if (avis != null && !avis.isBlank()) {
            stage.setAvis(avis);
        }
        stage.setAvisDate(LocalDateTime.now());
        stage.setValideParId(valideParId);
        stage.setStatut(Stage.StatutStage.TERMINE);
        return stageRepo.save(stage);
    }

    // ══════════════════════════════════════════
    // Professeur : rapports de stage
    // ══════════════════════════════════════════

    public List<Map<String, Object>> rapportsDisponibles(Long professeurId) {
        return stageRepo.findByRapportUrlIsNotNullOrderByRapportDateDesc().stream()
                .map(s -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", s.getId());
                    m.put("etudiant", s.getInscription().getNomComplet());
                    m.put("entreprise", s.getEntreprise());
                    m.put("promotion", s.getInscription().getPromotion() != null ? s.getInscription().getPromotion().getLibelle() : null);
                    m.put("dateSoumission", s.getRapportDate());
                    m.put("statut", s.getRapportStatut().name());
                    m.put("url", s.getRapportUrl());
                    return m;
                }).collect(Collectors.toList());
    }

    // ══════════════════════════════════════════
    // Offres de stage (gestion)
    // ══════════════════════════════════════════

    @Transactional
    public OffreStage creerOffre(Map<String, Object> body) {
        OffreStage offre = OffreStage.builder()
                .titre((String) body.get("titre"))
                .entreprise((String) body.get("entreprise"))
                .localisation((String) body.get("localisation"))
                .dureeSemaines(body.get("dureeSemaines") != null ? Integer.valueOf(body.get("dureeSemaines").toString()) : null)
                .remuneration(body.get("remuneration") != null ? Double.valueOf(body.get("remuneration").toString()) : null)
                .description((String) body.get("description"))
                .publieParId(body.get("publieParId") != null ? Long.valueOf(body.get("publieParId").toString()) : null)
                .build();
        return offreRepo.save(offre);
    }

    // ══════════════════════════════════════════
    // Utilitaires
    // ══════════════════════════════════════════

    private Map<String, Object> toStageMap(Stage stage) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", stage.getId());
        m.put("entreprise", stage.getEntreprise());
        m.put("adresse", stage.getAdresse());
        m.put("telephone", stage.getTelephone());
        m.put("responsable", stage.getResponsable());
        m.put("emailResponsable", stage.getEmailResponsable());
        m.put("dateDebut", stage.getDateDebut());
        m.put("dateFin", stage.getDateFin());
        m.put("dureeSemaines", stage.getDureeSemaines());
        m.put("description", stage.getDescription());
        m.put("conventionUrl", stage.getConventionUrl());
        m.put("statut", stage.getStatut().name());
        m.put("motifRejet", stage.getMotifRejet());
        m.put("tuteur", stage.getTuteurNom());
        m.put("rapportUrl", stage.getRapportUrl());
        m.put("rapportDate", stage.getRapportDate());
        m.put("avis", stage.getAvis());
        m.put("avisDate", stage.getAvisDate());
        m.put("dateCreation", stage.getDateCreation());
        return m;
    }

    private Map<String, Object> toValidationMap(Stage s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", s.getId());
        m.put("etudiant", s.getInscription().getNomComplet());
        m.put("entreprise", s.getEntreprise());
        m.put("dateDebut", s.getDateDebut());
        m.put("dateFin", s.getDateFin());
        m.put("dureeSemaines", s.getDureeSemaines());
        m.put("statut", s.getStatut().name());
        m.put("motifRejet", s.getMotifRejet());
        return m;
    }
}
