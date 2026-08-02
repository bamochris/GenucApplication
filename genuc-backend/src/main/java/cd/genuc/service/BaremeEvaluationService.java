package cd.genuc.service;

import cd.genuc.model.BaremeEvaluation;
import cd.genuc.model.BaremeLigne;
import cd.genuc.model.Cours;
import cd.genuc.repository.BaremeEvaluationRepository;
import cd.genuc.repository.CoursRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Gère les barèmes de notation (pondération TP/Interrogation/Examen + échelle de mentions)
 * définis par un professeur, éventuellement rattachés à un cours précis.
 *
 * Le module Notes (CalculsNotes côté frontend) consomme {@link #obtenirPourCours(Long)} pour
 * remplacer la pondération 30/20/50 codée en dur par la pondération réellement configurée.
 */
@Service
@RequiredArgsConstructor
public class BaremeEvaluationService {

    private final BaremeEvaluationRepository baremeRepo;
    private final CoursRepository coursRepo;

    @Transactional(readOnly = true)
    public List<BaremeEvaluation> listerParProfesseur(Long professeurId) {
        return baremeRepo.findByProfesseurIdOrderByCreeLeDesc(professeurId);
    }

    @Transactional(readOnly = true)
    public Optional<BaremeEvaluation> obtenirPourCours(Long coursId) {
        return baremeRepo.findFirstByCoursIdOrderByModifieLeDesc(coursId);
    }

    @Transactional(readOnly = true)
    public BaremeEvaluation obtenir(Long id) {
        return baremeRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Barème introuvable"));
    }

    @Transactional
    public BaremeEvaluation creer(Map<String, Object> data) {
        if (data.get("nom") == null || data.get("nom").toString().isBlank()) {
            throw new RuntimeException("Le nom du barème est requis");
        }
        if (data.get("professeurId") == null) {
            throw new RuntimeException("professeurId est requis");
        }
        Long professeurId = Long.valueOf(data.get("professeurId").toString());

        Long coursId = data.get("coursId") != null ? Long.valueOf(data.get("coursId").toString()) : null;
        String coursNom = (String) data.getOrDefault("cours", null);
        if (coursId != null) {
            Cours cours = coursRepo.findById(coursId)
                .orElseThrow(() -> new RuntimeException("Cours introuvable"));
            if (cours.getProfesseurId() != null && !cours.getProfesseurId().equals(professeurId)) {
                throw new RuntimeException("Ce cours n'appartient pas à ce professeur");
            }
            coursNom = cours.getCode() + " - " + cours.getTitre();
        }

        BaremeEvaluation bareme = BaremeEvaluation.builder()
            .nom((String) data.get("nom"))
            .coursId(coursId)
            .coursNom(coursNom)
            .professeurId(professeurId)
            .ponderationTP(entier(data.get("ponderationTP"), 30))
            .ponderationInterro(entier(data.get("ponderationInterro"), 20))
            .ponderationExamen(entier(data.get("ponderationExamen"), 50))
            .lignes(construireLignes(data.get("lignes")))
            .build();

        validerPonderation(bareme);
        return baremeRepo.save(bareme);
    }

    @Transactional
    public BaremeEvaluation modifier(Long id, Map<String, Object> data) {
        BaremeEvaluation bareme = obtenir(id);

        if (data.containsKey("nom") && data.get("nom") != null) bareme.setNom((String) data.get("nom"));
        if (data.containsKey("cours") && data.get("cours") != null) bareme.setCoursNom((String) data.get("cours"));
        if (data.containsKey("coursId") && data.get("coursId") != null) {
            bareme.setCoursId(Long.valueOf(data.get("coursId").toString()));
        }
        if (data.containsKey("ponderationTP")) bareme.setPonderationTP(entier(data.get("ponderationTP"), bareme.getPonderationTP()));
        if (data.containsKey("ponderationInterro")) bareme.setPonderationInterro(entier(data.get("ponderationInterro"), bareme.getPonderationInterro()));
        if (data.containsKey("ponderationExamen")) bareme.setPonderationExamen(entier(data.get("ponderationExamen"), bareme.getPonderationExamen()));
        if (data.containsKey("lignes") && data.get("lignes") != null) {
            bareme.getLignes().clear();
            bareme.getLignes().addAll(construireLignes(data.get("lignes")));
        }

        validerPonderation(bareme);
        return baremeRepo.save(bareme);
    }

    @Transactional
    public void supprimer(Long id) {
        if (!baremeRepo.existsById(id)) {
            throw new RuntimeException("Barème introuvable");
        }
        baremeRepo.deleteById(id);
    }

    // ── Utilitaires ──────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private List<BaremeLigne> construireLignes(Object raw) {
        List<BaremeLigne> lignes = new ArrayList<>();
        if (!(raw instanceof List<?> liste)) return lignes;
        for (Object o : liste) {
            if (!(o instanceof Map)) continue;
            Map<String, Object> l = (Map<String, Object>) o;
            lignes.add(BaremeLigne.builder()
                .mention((String) l.get("mention"))
                .min(entier(l.get("min"), null))
                .max(entier(l.get("max"), null))
                .points((String) l.get("points"))
                .description((String) l.get("description"))
                .build());
        }
        return lignes;
    }

    private void validerPonderation(BaremeEvaluation bareme) {
        int somme = safe(bareme.getPonderationTP()) + safe(bareme.getPonderationInterro()) + safe(bareme.getPonderationExamen());
        if (somme != 100) {
            throw new RuntimeException("La somme des pondérations (TP + Interro + Examen) doit être égale à 100 (actuellement " + somme + ")");
        }
    }

    private int safe(Integer v) { return v != null ? v : 0; }

    private Integer entier(Object val, Integer defaut) {
        return val != null ? Integer.parseInt(val.toString()) : defaut;
    }
}
