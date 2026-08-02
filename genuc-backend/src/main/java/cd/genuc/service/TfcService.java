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
public class TfcService {

    private final SujetTfcRepository sujetRepo;
    private final TfcRepository tfcRepo;
    private final ChapitreTfcRepository chapitreRepo;
    private final CommentaireTfcRepository commentaireRepo;
    private final InscriptionRepository inscriptionRepo;
    private final StockageFichierService stockage;

    private static final String[] CHAPITRES_DEFAUT = {
            "Introduction générale",
            "Revue de la littérature",
            "Méthodologie",
            "Résultats et discussion",
            "Conclusion et recommandations"
    };

    // ══════════════════════════════════════════
    // Sujets (propositions du professeur)
    // ══════════════════════════════════════════

    @Transactional
    public SujetTfc proposerSujet(Map<String, Object> body) {
        SujetTfc sujet = SujetTfc.builder()
                .titre((String) body.get("titre"))
                .description((String) body.get("description"))
                .domaine((String) body.get("domaine"))
                .niveau((String) body.getOrDefault("niveau", "L3"))
                .professeurId(Long.valueOf(body.get("professeurId").toString()))
                .professeurNom((String) body.get("professeurNom"))
                .build();
        return sujetRepo.save(sujet);
    }

    public List<SujetTfc> sujetsDuProfesseur(Long professeurId) {
        return sujetRepo.findByProfesseurIdOrderByDateCreationDesc(professeurId);
    }

    @Transactional
    public SujetTfc validerSujet(Long id) {
        SujetTfc sujet = sujetRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Sujet introuvable"));
        sujet.setStatut(SujetTfc.StatutSujet.VALIDE);
        return sujetRepo.save(sujet);
    }

    // ══════════════════════════════════════════
    // Encadrements (attribution étudiant / sujet)
    // ══════════════════════════════════════════

    @Transactional
    public Tfc creerEncadrement(Map<String, Object> body) {
        Long etudiantId = Long.valueOf(body.get("etudiantId").toString());
        Inscription inscription = inscriptionRepo.findById(etudiantId)
                .orElseThrow(() -> new RuntimeException("Étudiant introuvable"));

        Tfc tfc = Tfc.builder()
                .inscription(inscription)
                .sujet((String) body.get("sujet"))
                .type(Tfc.TypeTfc.valueOf((String) body.getOrDefault("type", "MEMOIRE")))
                .anneeAcademique((String) body.get("annee"))
                .professeurId(Long.valueOf(body.get("professeurId").toString()))
                .professeurNom((String) body.get("professeurNom"))
                .build();
        tfc = tfcRepo.save(tfc);

        int ordre = 1;
        for (String titreChapitre : CHAPITRES_DEFAUT) {
            chapitreRepo.save(ChapitreTfc.builder()
                    .tfc(tfc)
                    .titre(titreChapitre)
                    .ordre(ordre++)
                    .build());
        }

        return tfc;
    }

    public List<Map<String, Object>> encadrementsDuProfesseur(Long professeurId) {
        return tfcRepo.findByProfesseurIdOrderByDateCreationDesc(professeurId).stream()
                .map(this::toEncadrementMap)
                .collect(Collectors.toList());
    }

    @Transactional
    public Tfc mettreAJourStatut(Long id, String statut) {
        Tfc tfc = tfcRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Encadrement introuvable"));
        tfc.setStatut(Tfc.StatutTfc.valueOf(statut));
        if (tfc.getStatut() == Tfc.StatutTfc.SOUTENU) {
            tfc.setDateSoutenance(LocalDateTime.now());
        }
        return tfcRepo.save(tfc);
    }

    // ══════════════════════════════════════════
    // Suivi mémoire (progression + commentaires)
    // ══════════════════════════════════════════

    public List<Map<String, Object>> memoiresSuivi(Long professeurId) {
        return tfcRepo.findByProfesseurIdOrderByDateCreationDesc(professeurId).stream()
                .map(tfc -> {
                    Map<String, Object> map = toEncadrementMap(tfc);
                    map.put("progression", tfc.getProgression());
                    map.put("commentaires", commentaireRepo.findByTfcIdOrderByDateAsc(tfc.getId()).stream()
                            .map(c -> Map.<String, Object>of(
                                    "texte", c.getTexte(),
                                    "auteurNom", c.getAuteurNom() != null ? c.getAuteurNom() : "",
                                    "date", c.getDate()
                            )).collect(Collectors.toList()));
                    return map;
                }).collect(Collectors.toList());
    }

    @Transactional
    public CommentaireTfc ajouterCommentaire(Long tfcId, Map<String, Object> body) {
        Tfc tfc = tfcRepo.findById(tfcId)
                .orElseThrow(() -> new RuntimeException("Encadrement introuvable"));
        CommentaireTfc commentaire = CommentaireTfc.builder()
                .tfc(tfc)
                .texte((String) body.get("commentaire"))
                .auteurId(body.get("auteurId") != null ? Long.valueOf(body.get("auteurId").toString()) : null)
                .auteurNom((String) body.get("auteurNom"))
                .build();
        return commentaireRepo.save(commentaire);
    }

    @Transactional
    public Tfc mettreAJourProgression(Long tfcId, Integer progression) {
        Tfc tfc = tfcRepo.findById(tfcId)
                .orElseThrow(() -> new RuntimeException("Encadrement introuvable"));
        tfc.setProgression(progression);
        return tfcRepo.save(tfc);
    }

    // ══════════════════════════════════════════
    // Étudiants disponibles pour encadrement
    // ══════════════════════════════════════════

    public List<Map<String, Object>> etudiantsDisponibles(Long professeurId) {
        Set<Long> dejaEncadres = tfcRepo.findByStatutNot(Tfc.StatutTfc.REJETE).stream()
                .map(t -> t.getInscription().getId())
                .collect(Collectors.toSet());

        return inscriptionRepo.findByStatut(StatutInscription.VALIDE).stream()
                .filter(i -> !dejaEncadres.contains(i.getId()))
                .map(i -> Map.<String, Object>of(
                        "id", i.getId(),
                        "matricule", i.getMatricule() != null ? i.getMatricule() : "",
                        "prenom", i.getPrenom() != null ? i.getPrenom() : "",
                        "nom", i.getNom() != null ? i.getNom() : ""
                ))
                .collect(Collectors.toList());
    }

    // ══════════════════════════════════════════
    // Portail étudiant
    // ══════════════════════════════════════════

    public Map<String, Object> monTfc(Long inscriptionId) {
        Tfc tfc = tfcRepo.findFirstByInscriptionIdOrderByDateCreationDesc(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Aucun TFC/Mémoire attribué"));

        Inscription inscription = tfc.getInscription();

        Map<String, Object> tfcMap = new LinkedHashMap<>();
        tfcMap.put("id", tfc.getId());
        tfcMap.put("sujet", tfc.getSujet());
        tfcMap.put("type", tfc.getType().name());
        tfcMap.put("statut", tfc.getStatut().name());
        tfcMap.put("anneeAcademique", tfc.getAnneeAcademique());
        tfcMap.put("encadreur", tfc.getProfesseurNom());
        tfcMap.put("departement", inscription.getDepartement() != null ? inscription.getDepartement().getNom() : null);
        tfcMap.put("dateLimite", tfc.getDateLimite());
        tfcMap.put("progression", tfc.getProgression());
        tfcMap.put("dateCreation", tfc.getDateCreation());
        tfcMap.put("dateSoutenance", tfc.getDateSoutenance());

        List<Map<String, Object>> chapitres = chapitreRepo.findByTfcIdOrderByOrdreAsc(tfc.getId()).stream()
                .map(c -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", c.getId());
                    m.put("titre", c.getTitre());
                    m.put("description", c.getDescription());
                    m.put("statut", c.getStatut().name());
                    m.put("dateDepot", c.getDateDepot());
                    m.put("url", c.getUrl());
                    m.put("retour", c.getRetour());
                    return m;
                }).collect(Collectors.toList());

        List<Map<String, Object>> commentaires = commentaireRepo.findByTfcIdOrderByDateAsc(tfc.getId()).stream()
                .map(c -> Map.<String, Object>of(
                        "auteur", c.getAuteurNom() != null ? c.getAuteurNom() : "Encadreur",
                        "message", c.getTexte(),
                        "type", c.getType().name(),
                        "date", c.getDate()
                )).collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("tfc", tfcMap);
        result.put("chapitres", chapitres);
        result.put("commentaires", commentaires);
        return result;
    }

    @Transactional
    public ChapitreTfc deposerChapitre(Long inscriptionId, Long chapitreId, String titre, String description, MultipartFile fichier) throws IOException {
        ChapitreTfc chapitre = chapitreRepo.findById(chapitreId)
                .orElseThrow(() -> new RuntimeException("Chapitre introuvable"));

        if (!chapitre.getTfc().getInscription().getId().equals(inscriptionId)) {
            throw new RuntimeException("Ce chapitre n'appartient pas à cet étudiant");
        }

        var enregistre = stockage.enregistrer(fichier, "tfc", StockageFichierService.Categorie.DOCUMENT);

        if (titre != null && !titre.isBlank()) {
            chapitre.setTitre(titre);
        }
        if (description != null && !description.isBlank()) {
            chapitre.setDescription(description);
        }
        chapitre.setUrl(enregistre.url());
        chapitre.setNomFichier(enregistre.nomOriginal());
        chapitre.setDateDepot(LocalDateTime.now());
        chapitre.setStatut(ChapitreTfc.StatutChapitre.DEPOSE);
        chapitre.setRetour(null);

        return chapitreRepo.save(chapitre);
    }

    // ══════════════════════════════════════════
    // Utilitaires
    // ══════════════════════════════════════════

    private Map<String, Object> toEncadrementMap(Tfc tfc) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", tfc.getId());
        map.put("etudiant", tfc.getInscription().getNomComplet());
        map.put("sujet", tfc.getSujet());
        map.put("type", tfc.getType().name());
        map.put("annee", tfc.getAnneeAcademique());
        map.put("statut", tfc.getStatut().name());
        return map;
    }
}
