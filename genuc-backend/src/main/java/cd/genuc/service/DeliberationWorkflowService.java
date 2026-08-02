package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeliberationWorkflowService {

    private final InscriptionRepository inscriptionRepo;
    private final NoteRepository noteRepo;
    private final DeliberationRepository deliberationRepo;
    private final AnneeAcademiqueRepository anneeRepo;
    private final PromotionRepository promotionRepo;

    // ─────────────────────────────────────────────────────────────────
    // 1. PREMIÈRE DÉLIBÉRATION (session 1)
    // ─────────────────────────────────────────────────────────────────
    @Transactional
    public List<Map<String, Object>> premiereDeliberation(Long promotionId, String anneeLibelle) {
        AnneeAcademique annee = anneeRepo.findByLibelle(anneeLibelle)
                .orElseThrow(() -> new RuntimeException("Année académique introuvable"));
        if (annee.isCloturee()) throw new RuntimeException("Cette année est clôturée – aucune modification possible");

        List<Inscription> inscriptions = inscriptionRepo.findByPromotionId(promotionId);
        List<Map<String, Object>> resultats = new ArrayList<>();

        for (Inscription ins : inscriptions) {
            List<Note> notes = noteRepo.findByInscriptionIdAndAnneeAcademique(ins.getId(), anneeLibelle)
                    .stream()
                    .filter(n -> n.getSession() == 1 && n.getStatut() == Note.StatutNote.PUBLIEE)
                    .collect(Collectors.toList());

            ResultatDelib res = calculer(notes, ins.getPromotion().isDerniereAnnee());
            sauvegarderDelib(ins, anneeLibelle, res, Deliberation.PhaseDeliberation.PREMIERE);
            resultats.add(mapResultat(ins, res));
        }
        return resultats;
    }

    // ─────────────────────────────────────────────────────────────────
    // 2. RATTRAPAGE (session 2) – uniquement pour les étudiants "ADMIS_RATTRAPAGE"
    // ─────────────────────────────────────────────────────────────────
    @Transactional
    public List<Map<String, Object>> rattrapageDeliberation(Long promotionId, String anneeLibelle) {
        AnneeAcademique annee = anneeRepo.findByLibelle(anneeLibelle)
                .orElseThrow(() -> new RuntimeException("Année académique introuvable"));
        if (annee.isCloturee()) throw new RuntimeException("Année clôturée");

        List<Inscription> inscriptions = inscriptionRepo.findByPromotionId(promotionId);
        List<Map<String, Object>> resultats = new ArrayList<>();

        for (Inscription ins : inscriptions) {
            Deliberation old = deliberationRepo.findByInscriptionIdAndAnneeAcademique(ins.getId(), anneeLibelle)
                    .orElse(null);
            if (old == null || old.getDecision() != Deliberation.DecisionJury.ADMIS_RATTRAPAGE) continue;

            // Récupérer toutes les notes (session 1 + rattrapage)
            List<Note> notes = noteRepo.findByInscriptionIdAndAnneeAcademique(ins.getId(), anneeLibelle)
                    .stream()
                    .filter(n -> n.getStatut() == Note.StatutNote.PUBLIEE)
                    .collect(Collectors.toList());

            ResultatDelib res = calculer(notes, ins.getPromotion().isDerniereAnnee());
            sauvegarderDelib(ins, anneeLibelle, res, Deliberation.PhaseDeliberation.RATTRAPAGE);
            resultats.add(mapResultat(ins, res));
        }
        return resultats;
    }

    // ─────────────────────────────────────────────────────────────────
    // 3. CLÔTURE DE L'ANNÉE
    // ─────────────────────────────────────────────────────────────────
    @Transactional
    public Map<String, Object> cloturerAnnee(String anneeLibelle) {
        AnneeAcademique annee = anneeRepo.findByLibelle(anneeLibelle)
                .orElseThrow(() -> new RuntimeException("Année académique introuvable"));
        annee.setCloturee(true);
        anneeRepo.save(annee);

        // Marquer toutes les délibérations comme "PUBLIEE"
        List<Deliberation> delibs = deliberationRepo.findByAnneeAcademique(anneeLibelle);
        delibs.forEach(d -> d.setPhase(Deliberation.PhaseDeliberation.PUBLIEE));
        deliberationRepo.saveAll(delibs);

        return Map.of("message", "Année " + anneeLibelle + " clôturée – résultats définitifs.");
    }

    // ─────────────────────────────────────────────────────────────────
    // 4. CONSULTATION ÉTUDIANT
    // ─────────────────────────────────────────────────────────────────
    public Map<String, Object> getResultatsEtudiant(Long inscriptionId, String anneeLibelle) {
        Deliberation delib = deliberationRepo.findByInscriptionIdAndAnneeAcademique(inscriptionId, anneeLibelle)
                .orElseThrow(() -> new RuntimeException("Aucune délibération trouvée pour cette année"));

        // Notes manquantes (cours sans note finale)
        List<Note> notes = noteRepo.findByInscriptionIdAndAnneeAcademique(inscriptionId, anneeLibelle);
        List<Map<String, String>> manquants = notes.stream()
                .filter(n -> n.getNoteRetenue() == null && n.getNoteExamen() == null)
                .map(n -> Map.of("cours", n.getCours().getTitre(), "code", n.getCours().getCode()))
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("phase", delib.getPhase().name());
        result.put("moyenneGenerale", delib.getMoyenneGenerale());
        result.put("creditsValides", delib.getCreditsValides());
        result.put("mention", delib.getMention() != null ? delib.getMention().name() : "—");
        result.put("decision", delib.getDecision().name());
        result.put("notesManquantes", manquants);
        result.put("pdfDisponible", true);
        return result;
    }

    // ─────────────────────────────────────────────────────────────────
    // MÉTHODES PRIVÉES
    // ─────────────────────────────────────────────────────────────────
    private ResultatDelib calculer(List<Note> notes, boolean derniereAnnee) {
        double totalPondere = 0;
        int totalCredits = 0;
        int creditsValides = 0;
        for (Note note : notes) {
            int credits = note.getCredits() != null ? note.getCredits() : 3;
            double noteRetenue = note.getNoteRetenue() != null ? note.getNoteRetenue() : note.getNoteFinale();
            if (noteRetenue >= 10) creditsValides += credits;
            totalPondere += noteRetenue * credits;
            totalCredits += credits;
        }
        double moyenne = totalCredits > 0 ? Math.round((totalPondere / totalCredits) * 100.0) / 100.0 : 0;
        String mention = getMention(moyenne);
        String decision = getDecision(moyenne, creditsValides, totalCredits, derniereAnnee);
        return new ResultatDelib(moyenne, creditsValides, totalCredits, mention, decision);
    }

    private void sauvegarderDelib(Inscription ins, String annee, ResultatDelib res, Deliberation.PhaseDeliberation phase) {
        Deliberation delib = deliberationRepo.findByInscriptionIdAndAnneeAcademique(ins.getId(), annee)
                .orElse(new Deliberation());
        delib.setInscription(ins);
        delib.setAnneeAcademique(annee);
        delib.setMoyenneGenerale(res.moyenne);
        delib.setCreditsValides(res.creditsValides);
        delib.setDecision(Deliberation.DecisionJury.valueOf(res.decision));
        delib.setMention(Note.MentionNote.valueOf(res.mention));
        delib.setPhase(phase);
        deliberationRepo.save(delib);
    }

    private Map<String, Object> mapResultat(Inscription ins, ResultatDelib res) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("inscriptionId", ins.getId());
        map.put("etudiant", ins.getPrenom() + " " + ins.getNom());
        map.put("matricule", ins.getMatricule());
        map.put("moyenne", res.moyenne);
        map.put("credits", res.creditsValides + "/" + res.creditsTotaux);
        map.put("mention", res.mention);
        map.put("decision", res.decision);
        return map;
    }

    private String getMention(double moyenne) {
        if (moyenne >= 18) return "TRES_GRANDE_DISTINCTION";
        if (moyenne >= 16) return "GRANDE_DISTINCTION";
        if (moyenne >= 14) return "DISTINCTION";
        if (moyenne >= 12) return "SATISFACTION";
        if (moyenne >= 10) return "REUSSITE";
        return "AJOURNE";
    }

    private String getDecision(double moyenne, int creditsValides, int totalCredits, boolean derniereAnnee) {
        if (derniereAnnee && moyenne >= 10) return "DIPLOME";
        if (moyenne >= 10 && creditsValides >= totalCredits * 0.6) return "ADMIS";
        if (moyenne >= 8) return "ADMIS_RATTRAPAGE";
        return "REDOUBLE";
    }

    private static class ResultatDelib {
        double moyenne; int creditsValides; int creditsTotaux; String mention; String decision;
        ResultatDelib(double m, int cv, int ct, String men, String dec) {
            this.moyenne = m; this.creditsValides = cv; this.creditsTotaux = ct;
            this.mention = men; this.decision = dec;
        }
    }
}