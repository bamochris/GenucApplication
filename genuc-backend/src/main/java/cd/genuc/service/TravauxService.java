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
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TravauxService {

    private final TravauxDevoirRepository travauxRepo;
    private final SoumissionTravailRepository soumissionRepo;
    private final CoursRepository coursRepo;
    private final InscriptionRepository inscriptionRepo;
    private final StockageFichierService stockage;

    // ══════════════════════════════════════════
    // Professeur : créer / lister les travaux
    // ══════════════════════════════════════════

    @Transactional
    public TravauxDevoir creerTravail(Map<String, Object> body) {
        Long coursId = Long.valueOf(body.get("coursId").toString());
        Cours cours = coursRepo.findById(coursId)
                .orElseThrow(() -> new RuntimeException("Cours introuvable"));

        Long professeurId = Long.valueOf(body.get("professeurId").toString());
        String titre = (String) body.get("titre");
        String description = (String) body.getOrDefault("description", null);
        String typeStr = (String) body.getOrDefault("type", "DEVOIR");
        String dateEcheanceStr = (String) body.get("dateEcheance");

        TravauxDevoir travail = TravauxDevoir.builder()
                .cours(cours)
                .professeurId(professeurId)
                .professeurNom((String) body.getOrDefault("professeurNom", null))
                .titre(titre)
                .description(description)
                .type(TravauxDevoir.TypeTravail.valueOf(typeStr))
                .dateEcheance(LocalDateTime.parse(dateEcheanceStr.length() == 10 ? dateEcheanceStr + "T23:59:00" : dateEcheanceStr))
                .coefficient(body.get("coefficient") != null ? Double.valueOf(body.get("coefficient").toString()) : null)
                .build();

        return travauxRepo.save(travail);
    }

    public List<TravauxDevoir> travauxDuProfesseur(Long professeurId) {
        return travauxRepo.findByProfesseurIdOrderByCreeLeDesc(professeurId);
    }

    public List<TravauxDevoir> travauxDuCours(Long coursId) {
        return travauxRepo.findByCoursIdOrderByCreeLeDesc(coursId);
    }

    // ══════════════════════════════════════════
    // Étudiant : lister mes travaux (portail)
    // ══════════════════════════════════════════

    public Map<String, Object> mesTravaux(Long inscriptionId) {
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

        List<TravauxDevoir> travaux = new ArrayList<>();
        try {
            if (inscription.getUniversite() != null) {
                travaux = travauxRepo.findByUniversiteId(inscription.getUniversite().getId());
            }
        } catch (Exception e) {
            travaux = new ArrayList<>();
        }

        List<Map<String, Object>> travauxList = new ArrayList<>();
        Map<Long, Map<String, Object>> coursMap = new LinkedHashMap<>();

        for (TravauxDevoir t : travaux) {
            Optional<SoumissionTravail> optSoumission =
                    soumissionRepo.findByTravailIdAndInscriptionId(t.getId(), inscriptionId);

            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", t.getId());
            map.put("titre", t.getTitre());
            map.put("description", t.getDescription());
            map.put("type", t.getType().name());
            map.put("cours", t.getCours().getTitre());
            map.put("coursId", t.getCours().getId());
            map.put("professeur", t.getProfesseurNom());
            map.put("dateEcheance", t.getDateEcheance());
            map.put("coefficient", t.getCoefficient());
            map.put("urlConsignes", t.getUrlConsignes());

            String statut;
            if (optSoumission.isPresent()) {
                SoumissionTravail s = optSoumission.get();
                statut = s.getStatut() == SoumissionTravail.StatutSoumission.CORRIGE ? "CORRIGE" : "SOUMIS";
                map.put("note", s.getNote());
                map.put("urlCorrection", s.getUrlCorrection());
                map.put("commentaireCorrection", s.getCommentaireCorrection());
                map.put("dateSoumission", s.getDateSoumission());
            } else {
                boolean depasse = t.getDateEcheance() != null && t.getDateEcheance().isBefore(LocalDateTime.now());
                statut = depasse ? "EN_RETARD" : "A_SOUMETTRE";
            }
            map.put("statut", statut);
            travauxList.add(map);

            coursMap.putIfAbsent(t.getCours().getId(), Map.of(
                    "id", t.getCours().getId(),
                    "code", t.getCours().getCode(),
                    "titre", t.getCours().getTitre()
            ));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("travaux", travauxList);
        result.put("coursList", new ArrayList<>(coursMap.values()));
        return result;
    }

    // ══════════════════════════════════════════
    // Étudiant : soumettre un travail
    // ══════════════════════════════════════════

    @Transactional
    public SoumissionTravail soumettre(Long travailId, Long inscriptionId, String commentaire, MultipartFile fichier) throws IOException {
        TravauxDevoir travail = travauxRepo.findById(travailId)
                .orElseThrow(() -> new RuntimeException("Travail introuvable"));
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

        // Nom disque généré côté serveur + extension/contenu validés (cf. StockageFichierService).
        var enregistre = stockage.enregistrer(fichier, "travaux", StockageFichierService.Categorie.DOCUMENT);
        String url = enregistre.url();

        SoumissionTravail soumission = soumissionRepo.findByTravailIdAndInscriptionId(travailId, inscriptionId)
                .orElse(SoumissionTravail.builder().travail(travail).inscription(inscription).build());

        soumission.setFichierUrl(url);
        soumission.setNomFichier(enregistre.nomOriginal());
        soumission.setCommentaire(commentaire);
        soumission.setDateSoumission(LocalDateTime.now());
        soumission.setStatut(SoumissionTravail.StatutSoumission.SOUMIS);
        soumission.setNote(null);
        soumission.setCommentaireCorrection(null);

        return soumissionRepo.save(soumission);
    }

    // ══════════════════════════════════════════
    // Professeur : lister / corriger les soumissions
    // ══════════════════════════════════════════

    public List<Map<String, Object>> soumissionsDuTravail(Long travailId) {
        return soumissionRepo.findByTravailId(travailId).stream().map(s -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", s.getId());
            map.put("etudiant", s.getInscription().getNomComplet());
            map.put("matricule", s.getInscription().getMatricule());
            map.put("fichierUrl", s.getFichierUrl());
            map.put("nomFichier", s.getNomFichier());
            map.put("commentaire", s.getCommentaire());
            map.put("dateSoumission", s.getDateSoumission());
            map.put("note", s.getNote());
            map.put("statut", s.getStatut().name());
            return map;
        }).collect(Collectors.toList());
    }

    @Transactional
    public SoumissionTravail noterSoumission(Long soumissionId, Double note, String commentaireCorrection, String urlCorrection) {
        SoumissionTravail soumission = soumissionRepo.findById(soumissionId)
                .orElseThrow(() -> new RuntimeException("Soumission introuvable"));
        soumission.setNote(note);
        soumission.setCommentaireCorrection(commentaireCorrection);
        soumission.setUrlCorrection(urlCorrection);
        soumission.setDateCorrection(LocalDateTime.now());
        soumission.setStatut(SoumissionTravail.StatutSoumission.CORRIGE);
        return soumissionRepo.save(soumission);
    }
}
