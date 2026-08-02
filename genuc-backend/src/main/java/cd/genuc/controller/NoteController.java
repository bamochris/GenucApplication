package cd.genuc.controller;

import cd.genuc.model.Examen;
import cd.genuc.model.Note;
import cd.genuc.service.NoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * API REST — Notes et Examens GENUC
 */
@RestController
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    // ══════════════════════════════════════════
    // VUE ÉTUDIANT
    // ══════════════════════════════════════════

    @GetMapping("/api/notes/etudiant/{inscriptionId}/{annee}")
    @PreAuthorize("hasAnyRole('ETUDIANT','AGENT','ADMIN_UNIVERSITE','CHEF_DEPARTEMENT','SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<List<Note>> mesNotes(
            @PathVariable Long inscriptionId,
            @PathVariable String annee) {
        return ResponseEntity.ok(noteService.mesNotes(inscriptionId, annee));
    }

    // ══════════════════════════════════════════
    // SAISIE (Professeur)
    // ══════════════════════════════════════════

    @PostMapping("/api/notes")
    @PreAuthorize("hasAnyRole('PROFESSEUR','CHEF_DEPARTEMENT','ADMIN_UNIVERSITE','SUPER_ADMIN')")
    public ResponseEntity<?> saisir(@RequestBody Map<String, Object> body) {
        try {
            // Vérification des champs requis
            String[] required = {"inscriptionId", "coursId", "anneeAcademique"};
            for (String key : required) {
                if (!body.containsKey(key)) {
                    return ResponseEntity.badRequest().body(Map.of("erreur", key + " est requis"));
                }
            }
            Note note = noteService.saisir(body);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message",     "Note saisie avec succès",
                "id",          note.getId(),
                "noteFinale",  note.getNoteFinale(),
                "mention",     note.getMention() != null ? note.getMention().name() : "—",
                "statut",      note.getStatut()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/api/notes/lot/{coursId}/{annee}")
    @PreAuthorize("hasAnyRole('PROFESSEUR','CHEF_DEPARTEMENT','ADMIN_UNIVERSITE','SUPER_ADMIN')")
    public ResponseEntity<?> saisirEnLot(
            @PathVariable Long coursId,
            @PathVariable String annee,
            @RequestBody List<Map<String, Object>> notes) {
        try {
            if (notes == null || notes.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "La liste des notes est vide"));
            }
            List<Note> resultats = noteService.saisirEnLot(coursId, annee, notes);
            return ResponseEntity.ok(Map.of(
                "message", resultats.size() + " notes saisies",
                "notes",   resultats
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/api/notes/{id}/rattrapage")
    @PreAuthorize("hasAnyRole('PROFESSEUR','CHEF_DEPARTEMENT','ADMIN_UNIVERSITE','SUPER_ADMIN')")
    public ResponseEntity<?> saisirRattrapage(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("noteRattrapage")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "noteRattrapage est requis"));
            }
            double noteRattrapage = Double.parseDouble(body.get("noteRattrapage").toString());
            Long professeurId = body.containsKey("professeurId")
                ? Long.valueOf(body.get("professeurId").toString()) : null;
            Note note = noteService.saisirRattrapage(id, noteRattrapage, professeurId);
            return ResponseEntity.ok(Map.of(
                "message",       "Note de rattrapage saisie",
                "noteRetenue",   note.getNoteRetenue(),
                "mention",       note.getMention() != null ? note.getMention().name() : "—"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // VUE PROFESSEUR
    // ══════════════════════════════════════════

    @GetMapping("/api/notes/cours/{coursId}/{annee}")
    @PreAuthorize("hasAnyRole('PROFESSEUR','CHEF_DEPARTEMENT','ADMIN_UNIVERSITE','SUPER_ADMIN')")
    public ResponseEntity<List<Note>> notesDuCours(
            @PathVariable Long coursId,
            @PathVariable String annee) {
        return ResponseEntity.ok(noteService.notesDuCours(coursId, annee));
    }

    @GetMapping("/api/notes/cours/{coursId}/{annee}/stats")
    @PreAuthorize("hasAnyRole('PROFESSEUR','CHEF_DEPARTEMENT','ADMIN_UNIVERSITE','SUPER_ADMIN')")
    public ResponseEntity<?> statsCours(
            @PathVariable Long coursId,
            @PathVariable String annee) {
        return ResponseEntity.ok(noteService.statsCours(coursId, annee));
    }

    // ══════════════════════════════════════════
    // VALIDATION (Chef de département)
    // ══════════════════════════════════════════

    @PatchMapping("/api/notes/{id}/valider")
    @PreAuthorize("hasAnyRole('CHEF_DEPARTEMENT','ADMIN_UNIVERSITE','SUPER_ADMIN')")
    public ResponseEntity<?> valider(@PathVariable Long id) {
        try {
            Note note = noteService.valider(id);
            return ResponseEntity.ok(Map.of("message", "Note validée", "statut", note.getStatut()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/api/notes/cours/{coursId}/{annee}/valider-tout")
    @PreAuthorize("hasAnyRole('CHEF_DEPARTEMENT','ADMIN_UNIVERSITE','SUPER_ADMIN')")
    public ResponseEntity<?> validerTout(
            @PathVariable Long coursId,
            @PathVariable String annee) {
        try {
            List<Note> notes = noteService.validerToutesLesCours(coursId, annee);
            return ResponseEntity.ok(Map.of("message", notes.size() + " notes validées"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // PUBLICATION (Admin)
    // ══════════════════════════════════════════

    @PatchMapping("/api/notes/{id}/publier")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE','SUPER_ADMIN')")
    public ResponseEntity<?> publier(@PathVariable Long id) {
        try {
            Note note = noteService.publier(id);
            return ResponseEntity.ok(Map.of("message", "Note publiée", "statut", note.getStatut()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/api/notes/cours/{coursId}/{annee}/publier-tout")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE','SUPER_ADMIN')")
    public ResponseEntity<?> publierTout(
            @PathVariable Long coursId,
            @PathVariable String annee) {
        try {
            int count = noteService.publierParCours(coursId, annee);
            return ResponseEntity.ok(Map.of("message", count + " notes publiées"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/api/notes/cours/{coursId}/calcul")
    @PreAuthorize("hasAnyRole('PROFESSEUR','CHEF_DEPARTEMENT','ADMIN_UNIVERSITE','SUPER_ADMIN')")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> calculerEtEnregistrer(
            @PathVariable Long coursId,
            @RequestBody Map<String, Object> body) {
        try {
            String annee = (String) body.get("anneeAcademique");
            if (annee == null || annee.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "anneeAcademique est requis"));
            }
            List<Map<String, Object>> lignes = (List<Map<String, Object>>) body.get("notes");
            List<Note> resultats = noteService.calculerEtEnregistrer(coursId, annee, lignes);
            return ResponseEntity.ok(Map.of(
                "message", "Notes calculées et enregistrées avec succès",
                "nbEnregistrees", resultats.size()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/api/notes/universite/{uniId}/a-valider")
    @PreAuthorize("hasAnyRole('CHEF_DEPARTEMENT','ADMIN_UNIVERSITE','SUPER_ADMIN')")
    public ResponseEntity<List<Note>> notesAValider(@PathVariable Long uniId) {
        return ResponseEntity.ok(noteService.notesASoumettre(uniId));
    }

    @GetMapping("/api/notes/departement/{departementId}/a-valider")
    @PreAuthorize("hasAnyRole('CHEF_DEPARTEMENT','ADMIN_UNIVERSITE','SUPER_ADMIN')")
    public ResponseEntity<List<Note>> notesAValiderParDepartement(@PathVariable Long departementId) {
        return ResponseEntity.ok(noteService.notesASoumettreParDepartement(departementId));
    }

    // ══════════════════════════════════════════
    // EXAMENS
    // ══════════════════════════════════════════

    @PostMapping("/api/examens")
    @PreAuthorize("hasAnyRole('PROFESSEUR','CHEF_DEPARTEMENT','ADMIN_UNIVERSITE','SUPER_ADMIN')")
    public ResponseEntity<?> planifierExamen(@RequestBody Map<String, Object> body) {
        try {
            Examen e = noteService.planifierExamen(body);
            return ResponseEntity.status(HttpStatus.CREATED).body(e);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/api/examens/universite/{uniId}/prochains")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Examen>> prochains(@PathVariable Long uniId) {
        return ResponseEntity.ok(noteService.prochains(uniId));
    }

    @GetMapping("/api/examens/aujourd-hui")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Examen>> examensAujourdhui() {
        return ResponseEntity.ok(noteService.examensAujourdhui());
    }

    @PatchMapping("/api/examens/{id}/statut")
    @PreAuthorize("hasAnyRole('PROFESSEUR','CHEF_DEPARTEMENT','ADMIN_UNIVERSITE','SUPER_ADMIN')")
    public ResponseEntity<?> changerStatut(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            if (!body.containsKey("statut")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "statut est requis"));
            }
            Examen.StatutExamen statut = Examen.StatutExamen.valueOf(body.get("statut"));
            Examen e = noteService.changerStatutExamen(id, statut);
            return ResponseEntity.ok(Map.of("message", "Statut mis à jour", "statut", e.getStatut()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }
}