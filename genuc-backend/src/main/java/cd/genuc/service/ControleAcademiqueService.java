package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.model.ControleCours.StatutControle;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Contrôle académique : tableau de bord du chef de département / doyen sur la remise des
 * notes, le taux de présence et la progression des cours. Agrège les données existantes
 * (Cours, Note, Presence, Inscription) sans les modifier ; l'état de validation propre au
 * contrôle (reçu / validé / retourné) est stocké dans ControleCours.
 */
@Service
@RequiredArgsConstructor
public class ControleAcademiqueService {

    private final CoursRepository coursRepo;
    private final NoteRepository noteRepo;
    private final PresenceRepository presenceRepo;
    private final InscriptionRepository inscriptionRepo;
    private final ControleCoursRepository controleRepo;

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listerCoursParDepartement(Long departementId) {
        List<Cours> coursList = coursRepo.findByDepartementId(departementId);
        return coursList.stream().map(this::toDto).collect(Collectors.toList());
    }

    private Map<String, Object> toDto(Cours cours) {
        String annee = cours.getAnneeAcademique();

        List<Note> notes = annee != null
                ? noteRepo.findByCoursIdAndAnneeAcademique(cours.getId(), annee)
                : List.of();

        Promotion promotion = cours.getPromotion();
        long effectifPromotion = promotion != null ? inscriptionRepo.findByPromotionId(promotion.getId()).size() : 0;
        long effectif = effectifPromotion > 0 ? effectifPromotion : notes.size();

        java.util.OptionalDouble moyenneOpt = notes.stream()
                .map(Note::getNoteRetenue)
                .filter(v -> v != null)
                .mapToDouble(Double::doubleValue)
                .average();
        Double moyenneGenerale = moyenneOpt.isPresent() ? moyenneOpt.getAsDouble() : null;

        List<Presence> presences = presenceRepo.findByCoursId(cours.getId());
        Double tauxPresence = null;
        if (!presences.isEmpty()) {
            long presents = presences.stream().filter(Presence::isPresent).count();
            tauxPresence = (presents * 100.0) / presences.size();
        }

        List<String> anomalies = new ArrayList<>();
        if (effectif > 0 && notes.isEmpty()) {
            anomalies.add("Aucune note saisie");
        } else if (effectif > 0 && notes.size() < effectif) {
            long manquantes = effectif - notes.size();
            anomalies.add(manquantes + " note(s) manquante(s) sur " + effectif + " étudiant(s)");
        }
        if (moyenneGenerale != null && (moyenneGenerale < 5 || moyenneGenerale > 18)) {
            anomalies.add("Moyenne anormale (" + String.format("%.2f", moyenneGenerale) + "/20)");
        }
        if (tauxPresence != null && tauxPresence < 50) {
            anomalies.add("Taux de présence très faible (" + String.format("%.0f", tauxPresence) + "%)");
        }

        String statut = determinerStatut(cours.getId(), notes.isEmpty());

        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("id", cours.getId());
        dto.put("code", cours.getCode());
        dto.put("nom", cours.getTitre());
        dto.put("professeur", cours.getProfesseurNom());
        dto.put("promotion", promotion != null ? promotion.getLibelle() : null);
        dto.put("effectif", effectif);
        dto.put("statut", statut);
        dto.put("moyenneGenerale", moyenneGenerale);
        dto.put("tauxPresence", tauxPresence);
        dto.put("anomalies", anomalies);
        return dto;
    }

    private String determinerStatut(Long coursId, boolean aucuneNote) {
        return controleRepo.findByCoursId(coursId)
                .map(c -> c.getStatut().name())
                .orElse(aucuneNote ? StatutControle.EN_ATTENTE.name() : StatutControle.RECU.name());
    }

    @Transactional
    public void valider(Long coursId, Long valideurId) {
        ControleCours controle = obtenirOuCreer(coursId);
        controle.setStatut(StatutControle.VALIDE);
        controle.setValideParId(valideurId);
        controle.setDateValidation(LocalDateTime.now());
        controleRepo.save(controle);
    }

    @Transactional
    public void retourner(Long coursId, String motif) {
        ControleCours controle = obtenirOuCreer(coursId);
        controle.setStatut(StatutControle.RETOURNE);
        controle.setMotifRetour(motif);
        controle.setDateRetour(LocalDateTime.now());
        controleRepo.save(controle);
    }

    @Transactional
    public void demanderCorrection(Long coursId, String commentaire) {
        ControleCours controle = obtenirOuCreer(coursId);
        controle.setStatut(StatutControle.RETOURNE);
        controle.setCommentaireCorrection(commentaire);
        controle.setDateRetour(LocalDateTime.now());
        controleRepo.save(controle);
    }

    private ControleCours obtenirOuCreer(Long coursId) {
        return controleRepo.findByCoursId(coursId).orElseGet(() -> {
            Cours cours = coursRepo.findById(coursId)
                    .orElseThrow(() -> new RuntimeException("Cours introuvable"));
            return ControleCours.builder().cours(cours).build();
        });
    }
}
