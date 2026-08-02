package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.model.Recours.StatutRecours;
import cd.genuc.model.Recours.TypeRecours;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Recours académiques : soumission par l'étudiant (via son Utilisateur/Inscription) et
 * traitement par l'administration / le chef de département.
 */
@Service
@RequiredArgsConstructor
public class RecoursService {

    private final RecoursRepository recoursRepo;
    private final UtilisateurRepository utilisateurRepo;
    private final InscriptionRepository inscriptionRepo;
    private final CoursRepository coursRepo;
    private final NoteRepository noteRepo;

    private final StockageFichierService stockage;

    // ─── Résolution utilisateur → inscription ─────────────────────

    private Inscription resoudreInscription(Long userId) {
        Utilisateur utilisateur = utilisateurRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable"));
        Long inscriptionId = utilisateur.getInscriptionId();
        if (inscriptionId == null) {
            // Fallback : l'id transmis est peut-être déjà celui d'une inscription
            return inscriptionRepo.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Aucune inscription associée à cet utilisateur"));
        }
        return inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));
    }

    // ─── Étudiant ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listerCoursEtudiant(Long userId) {
        Inscription inscription = resoudreInscription(userId);
        List<Note> notes = noteRepo.findByInscriptionId(inscription.getId());
        Map<Long, Map<String, Object>> parCours = new LinkedHashMap<>();
        for (Note n : notes) {
            Cours c = n.getCours();
            if (c == null || parCours.containsKey(c.getId())) continue;
            Map<String, Object> dto = new LinkedHashMap<>();
            dto.put("id", c.getId());
            dto.put("nom", c.getTitre());
            dto.put("code", c.getCode());
            parCours.put(c.getId(), dto);
        }
        return List.copyOf(parCours.values());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listerRecoursEtudiant(Long userId) {
        Inscription inscription = resoudreInscription(userId);
        return recoursRepo.findByInscriptionIdOrderByDateSoumissionDesc(inscription.getId())
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public Recours soumettre(Long userId, String type, String description, Long coursId,
                              String anneeAcademique, MultipartFile pieceJointe) {
        Inscription inscription = resoudreInscription(userId);

        if (description == null || description.trim().length() < 10) {
            throw new RuntimeException("La description doit contenir au moins 10 caractères");
        }

        Cours cours = null;
        if (coursId != null) {
            cours = coursRepo.findById(coursId).orElse(null);
        }

        String pieceJointeUrl = null;
        if (pieceJointe != null && !pieceJointe.isEmpty()) {
            pieceJointeUrl = enregistrerFichier(pieceJointe);
        }

        Recours recours = Recours.builder()
                .inscription(inscription)
                .cours(cours)
                .type(TypeRecours.valueOf(type))
                .description(description.trim())
                .anneeAcademique(anneeAcademique)
                .pieceJointeUrl(pieceJointeUrl)
                .statut(StatutRecours.SOUMIS)
                .build();

        return recoursRepo.save(recours);
    }

    private String enregistrerFichier(MultipartFile file) {
        return stockage.enregistrer(file, "recours", StockageFichierService.Categorie.DOCUMENT).url();
    }

    // ─── Administration / chef de département ─────────────────────

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listerPourAdmin(Long universiteId, Long departementId, String statutFiltre) {
        List<Recours> recoursList;
        StatutRecours statut = parseStatut(statutFiltre);

        if (departementId != null) {
            recoursList = statut != null
                    ? recoursRepo.findByDepartementIdAndStatut(departementId, statut)
                    : recoursRepo.findByDepartementId(departementId);
        } else if (universiteId != null) {
            recoursList = statut != null
                    ? recoursRepo.findByUniversiteIdAndStatut(universiteId, statut)
                    : recoursRepo.findByUniversiteId(universiteId);
        } else {
            recoursList = recoursRepo.findAll();
        }

        return recoursList.stream().map(this::toDto).collect(Collectors.toList());
    }

    private StatutRecours parseStatut(String statut) {
        if (statut == null || statut.isBlank() || "TOUS".equalsIgnoreCase(statut)) return null;
        try {
            return StatutRecours.valueOf(statut);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @Transactional
    public Recours traiter(Long recoursId, String statut, String commentaire, Long traiteParId) {
        Recours recours = recoursRepo.findById(recoursId)
                .orElseThrow(() -> new RuntimeException("Recours introuvable"));

        StatutRecours nouveauStatut;
        try {
            nouveauStatut = StatutRecours.valueOf(statut);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Statut de recours invalide : " + statut);
        }

        recours.setStatut(nouveauStatut);
        if (commentaire != null && !commentaire.isBlank()) {
            recours.setReponse(commentaire);
        }
        recours.setTraiteParId(traiteParId);
        recours.setDateReponse(LocalDateTime.now());

        return recoursRepo.save(recours);
    }

    // ─── Mapping DTO ────────────────────────────────────────────

    private Map<String, Object> toDto(Recours r) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", r.getId());
        dto.put("type", r.getType() != null ? r.getType().name() : null);
        dto.put("description", r.getDescription());
        dto.put("anneeAcademique", r.getAnneeAcademique());
        dto.put("pieceJointe", r.getPieceJointeUrl());
        dto.put("statut", r.getStatut() != null ? r.getStatut().name() : null);
        dto.put("reponse", r.getReponse());
        dto.put("dateSoumission", r.getDateSoumission());
        dto.put("dateReponse", r.getDateReponse());

        Inscription inscription = r.getInscription();
        if (inscription != null) {
            Map<String, Object> etudiant = new LinkedHashMap<>();
            etudiant.put("id", inscription.getId());
            etudiant.put("nom", inscription.getNom());
            etudiant.put("prenom", inscription.getPrenom());
            etudiant.put("matricule", inscription.getMatricule());
            dto.put("etudiant", etudiant);
        }

        Cours cours = r.getCours();
        if (cours != null) {
            Map<String, Object> coursDto = new LinkedHashMap<>();
            coursDto.put("id", cours.getId());
            coursDto.put("nom", cours.getTitre());
            dto.put("cours", coursDto);
        }

        return dto;
    }
}
