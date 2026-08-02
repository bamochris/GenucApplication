package cd.genuc.service;

import cd.genuc.dto.EvaluationAcademiqueResponse;
import cd.genuc.model.Cours;
import cd.genuc.model.Examen;
import cd.genuc.model.Examen.StatutExamen;
import cd.genuc.model.Examen.TypeExamen;
import cd.genuc.repository.CoursRepository;
import cd.genuc.repository.ExamenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Module Évaluations du professeur : planification des examens, interrogations
 * et travaux pratiques/dirigés. S'appuie sur l'entité {@link Examen}, déjà utilisée
 * pour le calendrier d'examens de l'université (voir {@link NoteService}), afin
 * d'éviter la duplication d'un même concept d'« évaluation planifiée ».
 *
 * Ce service ne gère PAS la saisie des notes — cela reste la responsabilité de
 * {@link NoteService} / {@code NoteController} (module Notes).
 */
@Service
@RequiredArgsConstructor
public class EvaluationAcademiqueService {

    private static final List<TypeExamen> TYPES_EXAMENS =
        List.of(TypeExamen.EXAMEN_SESSION, TypeExamen.RATTRAPAGE, TypeExamen.EXAMEN_DIPLO);

    private final ExamenRepository examenRepo;
    private final CoursRepository coursRepo;

    // ── Lectures ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<EvaluationAcademiqueResponse> listerExamens(Long professeurId) {
        return examenRepo.findByProfesseurIdAndTypeInOrderByDateDesc(professeurId, TYPES_EXAMENS)
            .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<EvaluationAcademiqueResponse> listerInterrogations(Long professeurId) {
        return examenRepo.findByProfesseurIdAndTypeOrderByDateDesc(professeurId, TypeExamen.INTERROGATION)
            .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<EvaluationAcademiqueResponse> listerTp(Long professeurId) {
        return examenRepo.findByProfesseurIdAndTypeOrderByDateDesc(professeurId, TypeExamen.TP_TD)
            .stream().map(this::toResponse).toList();
    }

    // ── Écritures ────────────────────────────────────────────────

    @Transactional
    public EvaluationAcademiqueResponse creerExamen(Map<String, Object> data) {
        TypeExamen type = data.get("type") != null
            ? TypeExamen.valueOf(data.get("type").toString())
            : TypeExamen.EXAMEN_SESSION;
        Examen examen = construireDepuisPayload(data, type);
        examen.setDureeMinutes(entier(data.get("duree"), 120));
        examen.setSalle((String) data.get("salle"));
        return toResponse(examenRepo.save(examen));
    }

    @Transactional
    public EvaluationAcademiqueResponse creerInterrogation(Map<String, Object> data) {
        Examen examen = construireDepuisPayload(data, TypeExamen.INTERROGATION);
        examen.setDureeMinutes(entier(data.get("duree"), 30));
        examen.setNbQuestions(entier(data.get("questions"), null));
        return toResponse(examenRepo.save(examen));
    }

    @Transactional
    public EvaluationAcademiqueResponse creerTp(Map<String, Object> data) {
        Examen examen = construireDepuisPayload(data, TypeExamen.TP_TD);
        examen.setNbGroupes(entier(data.get("nbGroupes"), 1));
        return toResponse(examenRepo.save(examen));
    }

    // ── Utilitaires ──────────────────────────────────────────────

    private Examen construireDepuisPayload(Map<String, Object> data, TypeExamen type) {
        if (data.get("coursId") == null) {
            throw new RuntimeException("coursId est requis");
        }
        Long coursId = Long.valueOf(data.get("coursId").toString());
        Cours cours = coursRepo.findById(coursId)
            .orElseThrow(() -> new RuntimeException("Cours introuvable"));

        Long professeurId = data.get("professeurId") != null
            ? Long.valueOf(data.get("professeurId").toString())
            : cours.getProfesseurId();
        if (cours.getProfesseurId() != null && professeurId != null
            && !cours.getProfesseurId().equals(professeurId)) {
            throw new RuntimeException("Ce cours n'appartient pas à ce professeur");
        }

        if (data.get("titre") == null || data.get("date") == null) {
            throw new RuntimeException("titre et date sont requis");
        }

        return Examen.builder()
            .titre((String) data.get("titre"))
            .date(LocalDate.parse(data.get("date").toString()))
            .type(type)
            .statut(StatutExamen.PLANIFIE)
            .coefficient(decimal(data.get("coefficient"), 1.0))
            .cours(cours)
            .universite(cours.getUniversite())
            .departement(cours.getDepartement())
            .professeurId(professeurId)
            .professeurNom(data.get("professeurNom") != null
                ? (String) data.get("professeurNom") : cours.getProfesseurNom())
            .anneeAcademique(cours.getAnneeAcademique())
            .build();
    }

    private EvaluationAcademiqueResponse toResponse(Examen e) {
        return EvaluationAcademiqueResponse.builder()
            .id(e.getId())
            .titre(e.getTitre())
            .coursId(e.getCours() != null ? e.getCours().getId() : null)
            .coursCode(e.getCours() != null ? e.getCours().getCode() : null)
            .coursTitre(e.getCours() != null ? e.getCours().getTitre() : null)
            .date(e.getDate())
            .duree(e.getDureeMinutes())
            .coefficient(e.getCoefficient())
            .salle(e.getSalle())
            .questions(e.getNbQuestions())
            .nbGroupes(e.getNbGroupes())
            .statut(e.getStatut() != null ? e.getStatut().name() : null)
            .type(e.getType() != null ? e.getType().name() : null)
            .professeurId(e.getProfesseurId())
            .build();
    }

    private Integer entier(Object val, Integer defaut) {
        return val != null ? Integer.parseInt(val.toString()) : defaut;
    }

    private Double decimal(Object val, Double defaut) {
        return val != null ? Double.parseDouble(val.toString()) : defaut;
    }
}
