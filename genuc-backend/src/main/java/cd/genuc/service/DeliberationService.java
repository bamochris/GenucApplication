package cd.genuc.service;

import cd.genuc.config.cache.CacheNames;
import cd.genuc.model.*;
import cd.genuc.model.Deliberation.DecisionJury;
import cd.genuc.model.Deliberation.StatutDeliberation;
import cd.genuc.model.Note.MentionNote;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeliberationService {

    private final DeliberationRepository deliberationRepo;
    private final NoteRepository noteRepo;
    private final InscriptionRepository inscriptionRepo;
    private final UniversiteRepository universiteRepo;
    private final DepartementRepository departementRepo;
    private final ParametresLMDRepository parametresLMDRepository;
    private final CoursRepository coursRepository;
    private final AuditLogService auditLogService;
    private final AuditLogRepository auditLogRepository;

    private final Map<String, ConsolidationProgress> consolidationJobs = new ConcurrentHashMap<>();

    // @Transactional : comme pour les paramètres d'université, cette lecture crée la ligne
    // par défaut quand elle n'existe pas encore.
    @Transactional
    @Cacheable(value = CacheNames.PARAMETRES_LMD, key = "#universiteId")
    public ParametresLMD getParametresLMD(Long universiteId) {
        return parametresLMDRepository.findByUniversiteId(universiteId)
                .orElseGet(() -> {
                    ParametresLMD defaults = ParametresLMD.builder()
                            .universiteId(universiteId)
                            .seuilReussite(10.0)
                            .creditsParUE(30)
                            .compensationAutorisee(true)
                            .detteMax(2)
                            .creditsAnnuelRequis(60)
                            .build();
                    return parametresLMDRepository.save(defaults);
                });
    }

    @Transactional
    @CacheEvict(value = CacheNames.PARAMETRES_LMD, key = "#universiteId")
    public ParametresLMD updateParametresLMD(Long universiteId, ParametresLMD params) {
        params.setUniversiteId(universiteId);
        ParametresLMD saved = parametresLMDRepository.save(params);
        auditLogService.logAction("UPDATE", "ParametresLMD", saved.getId(),
                "Paramètres LMD mis à jour pour l'université " + universiteId,
                null);
        return saved;
    }

    @Transactional
    public Deliberation preparer(Long inscriptionId, String anneeAcademique) {
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable : id=" + inscriptionId));

        Optional<Deliberation> existante = deliberationRepo
                .findByInscriptionIdAndAnneeAcademique(inscriptionId, anneeAcademique);
        // Une délibération déjà soumise au jury ne se recalcule pas : la
        // décision rendue, ou publiée, prime sur le calcul automatique.
        // En revanche un brouillon (EN_PREPARATION, PRÊTE) doit rester
        // recalculable — c'est le seul moyen de tenir compte d'une note
        // corrigée après coup, et la méthode est écrite pour cela
        // (« existante.orElse(new Deliberation()) » met à jour en place).
        if (existante.isPresent()) {
            StatutDeliberation statut = existante.get().getStatut();
            if (statut == StatutDeliberation.PUBLIEE) {
                throw new RuntimeException("Une deliberation publiee existe deja pour cet etudiant");
            }
            if (statut == StatutDeliberation.TENUE) {
                throw new RuntimeException("Le jury a deja statue pour cet etudiant : deliberation non recalculable");
            }
        }

        List<Note> notes = noteRepo.notesValideesPourDeliberation(inscriptionId, anneeAcademique);
        if (notes.isEmpty()) {
            throw new RuntimeException("Aucune note publiee pour cet etudiant cette annee");
        }

        double totalPondere = 0;
        int totalCredits = 0;
        int creditsValides = 0;
        int coursReussis = 0;

        for (Note note : notes) {
            int credits = note.getCredits() != null ? note.getCredits() : 3;
            Double noteRetenue = note.getNoteRetenue() != null ? note.getNoteRetenue() : note.getNoteFinale();
            if (noteRetenue != null) {
                totalPondere += noteRetenue * credits;
                totalCredits += credits;
                boolean reussi = noteRetenue >= (note.getNoteMax() * 0.5);
                if (reussi) {
                    creditsValides += credits;
                    coursReussis++;
                }
            }
        }

        double moyenne = totalCredits > 0 ? Math.round((totalPondere / totalCredits) * 100.0) / 100.0 : 0;
        // La proposition du jury se base sur les crédits présentés cette année, pas sur un
        // volume annuel fixe : un étudiant qui valide 60 % des crédits qu'il présente est admissible.
        int creditsRequis = totalCredits;
        String niveauActuel = inscription.getNiveau() != null ? inscription.getNiveau() : "—";

        DecisionJury decision = proposerDecision(moyenne, creditsValides, creditsRequis, niveauActuel);
        MentionNote mention = calculerMention(moyenne);
        String niveauSuivant = calculerNiveauSuivant(niveauActuel, decision);

        Deliberation delib = existante.orElse(new Deliberation());
        delib.setAnneeAcademique(anneeAcademique);
        delib.setNiveau(niveauActuel);
        delib.setMoyenneGenerale(moyenne);
        delib.setCreditsValides(creditsValides);
        delib.setCreditsRequis(creditsRequis);
        delib.setCoursReussis(coursReussis);
        delib.setCoursTotaux(notes.size());
        delib.setDecision(decision);
        delib.setMention(mention);
        delib.setNiveauSuivant(niveauSuivant);
        delib.setStatut(StatutDeliberation.PRÊTE);
        delib.setInscription(inscription);
        delib.setUniversite(inscription.getUniversite());
        delib.setDepartement(inscription.getDepartement());

        Deliberation saved = deliberationRepo.save(delib);

        auditLogService.logAction("PREPARE", "Deliberation", saved.getId(),
                String.format("Délibération préparée pour %s %s (mat: %s), moyenne: %.2f, décision: %s",
                        inscription.getPrenom(), inscription.getNom(), inscription.getMatricule(),
                        moyenne, decision.name()),
                null);

        return saved;
    }

    @Transactional
    public Map<String, Object> preparerBatch(List<Long> inscriptionIds, String anneeAcademique) {
        int batchSize = 100;
        int total = inscriptionIds.size();
        int reussis = 0;
        int echecs = 0;
        List<String> erreurs = new ArrayList<>();

        for (int i = 0; i < total; i += batchSize) {
            List<Long> batchIds = inscriptionIds.subList(i, Math.min(i + batchSize, total));
            for (Long id : batchIds) {
                try {
                    preparer(id, anneeAcademique);
                    reussis++;
                } catch (Exception e) {
                    echecs++;
                    erreurs.add("Inscription " + id + " : " + e.getMessage());
                }
            }
        }

        return Map.of(
                "total", total,
                "reussis", reussis,
                "echecs", echecs,
                "erreurs", erreurs
        );
    }

    /**
     * Démarre une consolidation en tâche de fond et retourne immédiatement le jobId
     * (le job lui-même s'exécute de façon asynchrone via consolidAsync — voir plus bas
     * pourquoi le jobId ne peut pas être généré à l'intérieur d'une méthode @Async :
     * le proxy Spring exécute tout le corps de la méthode, y compris la génération du
     * jobId, sur le thread asynchrone, donc l'appelant ne peut pas le récupérer avant
     * la fin du job si on ne le génère pas ici, en amont, de façon synchrone).
     */
    public String demarrerConsolidation(Long universiteId, String annee) {
        String jobId = UUID.randomUUID().toString();
        consolidationJobs.put(jobId, new ConsolidationProgress(jobId, "EN_COURS", 0));
        consolidAsync(jobId, universiteId, annee);
        return jobId;
    }

    @Async
    public CompletableFuture<ConsolidationProgress> consolidAsync(String jobId, Long universiteId, String annee) {
        ConsolidationProgress progress = consolidationJobs.getOrDefault(jobId,
                new ConsolidationProgress(jobId, "EN_COURS", 0));
        consolidationJobs.put(jobId, progress);

        try {
            // ✅ Correction : méthode findByUniversiteIdAndAnneeAcademique (si existe)
            List<Inscription> inscriptions = inscriptionRepo.findByUniversiteIdAndAnnee(universiteId, annee);
            progress.setTotal(inscriptions.size());
            progress.setProgress(10);

            List<Long> ids = inscriptions.stream().map(Inscription::getId).collect(Collectors.toList());
            Map<String, Object> result = preparerBatch(ids, annee);
            progress.setProgress(60);

            progress.setProgress(100);
            progress.setStatus("TERMINE");
            progress.setResult(result);

            auditLogService.logAction("CONSOLIDATION", "Universite", universiteId,
                    "Consolidation terminée pour " + inscriptions.size() + " étudiants, année " + annee,
                    null);

        } catch (Exception e) {
            progress.setStatus("ERREUR");
            progress.setMessage(e.getMessage());
            log.error("Erreur lors de la consolidation", e);
        }

        consolidationJobs.put(jobId, progress);
        return CompletableFuture.completedFuture(progress);
    }

    public ConsolidationProgress getConsolidationStatus(String jobId) {
        return consolidationJobs.getOrDefault(jobId,
                new ConsolidationProgress(jobId, "INCONNU", 0));
    }

    /**
     * Historique d'audit lié aux délibérations (préparation, jury, publication, consolidation).
     * Filtre optionnel par action et par utilisateur, sur une fenêtre de dates (90 jours par défaut).
     */
    public Map<String, Object> getAuditDeliberation(String action, Long utilisateurId,
                                                      LocalDateTime dateDebut, LocalDateTime dateFin,
                                                      int page, int size) {
        LocalDateTime debut = dateDebut != null ? dateDebut : LocalDateTime.now().minusDays(90);
        LocalDateTime fin = dateFin != null ? dateFin : LocalDateTime.now();

        List<AuditLog> logs = auditLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(debut, fin).stream()
                .filter(l -> l.getEntityType() != null && l.getEntityType().equalsIgnoreCase("Deliberation")
                        || l.getEntityType() != null && l.getEntityType().equalsIgnoreCase("ParametresLMD")
                        || l.getEntityType() != null && l.getEntityType().equalsIgnoreCase("Universite"))
                .filter(l -> action == null || action.isBlank() || "TOUS".equalsIgnoreCase(action)
                        || (l.getAction() != null && l.getAction().equalsIgnoreCase(action)))
                .filter(l -> utilisateurId == null
                        || (l.getUserId() != null && l.getUserId().equals(utilisateurId)))
                .toList();

        int total = logs.size();
        int fromIndex = Math.min(page * size, total);
        int toIndex = Math.min(fromIndex + size, total);

        return Map.of(
                "content", logs.subList(fromIndex, toIndex),
                "totalElements", total,
                "page", page,
                "size", size,
                "totalPages", size > 0 ? (int) Math.ceil((double) total / size) : 0
        );
    }

    @Transactional
    public Deliberation tenuePar(Long id, Map<String, Object> data) {
        Deliberation delib = obtenir(id);
        if (delib.getStatut() == StatutDeliberation.PUBLIEE) {
            throw new RuntimeException("Impossible de modifier une deliberation publiee");
        }
        // PRÊTE doit être ACCEPTÉ : c'est le statut que pose preparer(), et
        // cette méthode est justement celle qui fait siéger le jury (statut
        // TENUE, plus bas). La refuser rendait TENUE inatteignable, et avec
        // elle publier() — qui l'exige —, le passage d'année et la délivrance
        // des diplômes, qui exigent tous deux une délibération PUBLIEE.
        // Seule une délibération jamais préparée n'a rien à soumettre au jury.
        if (delib.getStatut() == StatutDeliberation.EN_PREPARATION) {
            throw new RuntimeException(
                    "Deliberation non preparee : lancer la preparation avant de reunir le jury");
        }

        String ancienStatut = delib.getStatut().name();
        String ancienneDecision = delib.getDecision().name();

        if (data.containsKey("decision")) {
            delib.setDecision(DecisionJury.valueOf((String) data.get("decision")));
        }
        if (data.containsKey("commentaireJury")) {
            delib.setCommentaireJury((String) data.get("commentaireJury"));
        }
        if (data.containsKey("presidentJuryId")) {
            delib.setPresidentJuryId(Long.valueOf(data.get("presidentJuryId").toString()));
        }
        if (data.containsKey("presidentJuryNom")) {
            delib.setPresidentJuryNom((String) data.get("presidentJuryNom"));
        }

        delib.setDateDeliberation(LocalDate.now());
        delib.setStatut(StatutDeliberation.TENUE);

        if (delib.getDecision() == DecisionJury.DIPLOME && delib.getCodeDiplome() == null) {
            delib.setCodeDiplome(genererCodeDiplome(delib));
        }

        Deliberation saved = deliberationRepo.save(delib);

        auditLogService.logAction("TENUE_JURY", "Deliberation", saved.getId(),
                String.format("Statut: %s → %s, Décision: %s → %s",
                        ancienStatut, saved.getStatut().name(),
                        ancienneDecision, saved.getDecision().name()),
                null);

        return saved;
    }

    @Transactional
    public Deliberation publier(Long id) {
        Deliberation delib = obtenir(id);
        if (delib.getStatut() != StatutDeliberation.TENUE) {
            throw new RuntimeException("La deliberation doit d'abord etre tenue par le jury");
        }
        delib.setStatut(StatutDeliberation.PUBLIEE);
        delib.setPubliee(true);
        delib.setDatePublication(LocalDate.now());

        Deliberation saved = deliberationRepo.save(delib);

        auditLogService.logAction("PUBLICATION", "Deliberation", saved.getId(),
                "Résultats publiés pour " +
                        saved.getInscription().getPrenom() + " " + saved.getInscription().getNom() +
                        " (mat: " + saved.getInscription().getMatricule() + ")",
                null);

        return saved;
    }

    public Map<String, Object> statsUniversiteAvancees(Long universiteId, String annee) {
        List<Deliberation> toutes = deliberationRepo.findByUniversiteIdAndAnneeAcademique(universiteId, annee);
        long total = toutes.size();

        long pa = toutes.stream().filter(d -> d.getDecision() == DecisionJury.ADMIS || d.getDecision() == DecisionJury.DIPLOME).count();
        long pd = toutes.stream().filter(d -> d.getDecision() == DecisionJury.ADMIS_RATTRAPAGE).count();
        long pp = toutes.stream().filter(d -> d.getDecision() == DecisionJury.REDOUBLE).count();
        long cj = toutes.stream().filter(d -> d.getDecision() == DecisionJury.EXCLU).count();

        Map<String, Long> distribution = new LinkedHashMap<>();
        distribution.put("0-5", toutes.stream().filter(d -> d.getMoyenneGenerale() < 5).count());
        distribution.put("5-10", toutes.stream().filter(d -> d.getMoyenneGenerale() >= 5 && d.getMoyenneGenerale() < 10).count());
        distribution.put("10-15", toutes.stream().filter(d -> d.getMoyenneGenerale() >= 10 && d.getMoyenneGenerale() < 15).count());
        distribution.put("15-20", toutes.stream().filter(d -> d.getMoyenneGenerale() >= 15).count());

        List<String> annees = Arrays.asList("2022-2023", "2023-2024", "2024-2025", "2025-2026");
        List<Map<String, Object>> evolution = new ArrayList<>();
        for (String a : annees) {
            List<Deliberation> delibsAnnee = deliberationRepo.findByUniversiteIdAndAnneeAcademique(universiteId, a);
            long totalAnnee = delibsAnnee.size();
            long reussis = delibsAnnee.stream().filter(d -> d.getDecision() == DecisionJury.ADMIS || d.getDecision() == DecisionJury.DIPLOME).count();
            evolution.add(Map.of(
                    "annee", a,
                    "total", totalAnnee,
                    "tauxReussite", totalAnnee > 0 ? Math.round((double) reussis / totalAnnee * 100) : 0,
                    "tauxEchec", totalAnnee > 0 ? Math.round((double) (totalAnnee - reussis) / totalAnnee * 100) : 0
            ));
        }

        return Map.of(
                "total", total,
                "pa", pa,
                "pd", pd,
                "pp", pp,
                "cj", cj,
                "tauxReussite", total > 0 ? Math.round((double) (pa + pd) / total * 100) : 0,
                "distribution", distribution,
                "evolution", evolution
        );
    }

    public Page<Deliberation> getDeliberationsPaginees(Long universiteId, String annee, Pageable pageable) {
        return deliberationRepo.findByUniversiteIdAndAnneeAcademique(universiteId, annee, pageable);
    }

    @Transactional
    public Map<String, Object> importerNotesBatch(List<Map<String, Object>> notesData, Long coursId, String annee) {
        Cours cours = coursRepository.findById(coursId)
                .orElseThrow(() -> new RuntimeException("Cours introuvable : id=" + coursId));

        int batchSize = 100;
        int total = notesData.size();
        int reussis = 0;
        int echecs = 0;
        List<String> erreurs = new ArrayList<>();

        for (int i = 0; i < total; i += batchSize) {
            List<Map<String, Object>> batch = notesData.subList(i, Math.min(i + batchSize, total));
            for (Map<String, Object> row : batch) {
                try {
                    String matricule = (String) row.get("matricule");
                    Double note = Double.valueOf(row.get("note").toString());

                    Inscription ins = inscriptionRepo.findByMatricule(matricule)
                        .orElseThrow(() -> new RuntimeException("Étudiant non trouvé pour le matricule " + matricule));

                    Note noteEntity = noteRepo.findByInscriptionIdAndCoursIdAndAnneeAcademique(
                            ins.getId(), coursId, annee)
                        .orElse(Note.builder()
                            .inscription(ins)
                            .cours(cours)
                            .anneeAcademique(annee)
                            .build());

                    noteEntity.setNoteFinale(note);
                    noteEntity.setStatut(Note.StatutNote.SOUMISE);
                    noteRepo.save(noteEntity);
                    reussis++;
                } catch (Exception e) {
                    echecs++;
                    erreurs.add("Ligne " + (i + 1) + " : " + e.getMessage());
                }
            }
        }

        auditLogService.logAction("IMPORT_BATCH", "Note", coursId,
                "Importation de " + total + " notes, réussis: " + reussis + ", échecs: " + echecs,
                null);

        return Map.of(
                "total", total,
                "reussis", reussis,
                "echecs", echecs,
                "erreurs", erreurs
        );
    }

    public Map<String, Object> preparerParDepartement(Long departementId, String annee, String niveau) {
        List<Inscription> inscriptions = inscriptionRepo.findByDepartement_Id(departementId).stream()
                .filter(i -> {
                    String niveauLibelle = i.getNiveau() != null ? i.getNiveau() : "";
                    return niveau.equals(niveauLibelle) && i.getStatut() == StatutInscription.VALIDE;
                })
                .toList();

        int ok = 0, erreurs = 0;
        List<String> matriculesErreur = new ArrayList<>();

        for (Inscription ins : inscriptions) {
            try {
                preparer(ins.getId(), annee);
                ok++;
            } catch (Exception e) {
                erreurs++;
                matriculesErreur.add(ins.getMatricule() + " : " + e.getMessage());
            }
        }

        return Map.of(
                "total", inscriptions.size(),
                "preparees", ok,
                "erreurs", erreurs,
                "matriculesErreur", matriculesErreur
        );
    }

    public int publierDepartement(Long departementId, String annee) {
        List<Deliberation> delibs = deliberationRepo.findByDepartementIdAndAnneeAcademique(departementId, annee);
        int count = 0;
        for (Deliberation d : delibs) {
            if (d.getStatut() == StatutDeliberation.TENUE) {
                d.setStatut(StatutDeliberation.PUBLIEE);
                d.setPubliee(true);
                d.setDatePublication(LocalDate.now());
                deliberationRepo.save(d);
                count++;
            }
        }
        return count;
    }

    public Map<String, Object> genererReleveNotes(Long inscriptionId, String annee) {
        Inscription ins = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

        List<Note> notes = noteRepo.notesValideesPourDeliberation(inscriptionId, annee);
        Optional<Deliberation> delib = deliberationRepo.findByInscriptionIdAndAnneeAcademique(inscriptionId, annee);

        List<Map<String, Object>> lignesNotes = new ArrayList<>();
        for (Note n : notes) {
            Map<String, Object> ligne = new LinkedHashMap<>();
            ligne.put("cours", n.getCours().getTitre());
            ligne.put("code", n.getCours().getCode());
            ligne.put("credits", n.getCredits());
            ligne.put("noteTP", n.getNoteTP());
            ligne.put("noteInterro", n.getNoteInterrogation());
            ligne.put("noteExamen", n.getNoteExamen());
            ligne.put("noteFinale", n.getNoteRetenue() != null ? n.getNoteRetenue() : n.getNoteFinale());
            ligne.put("noteMax", n.getNoteMax());
            ligne.put("mention", n.getMention() != null ? n.getMention().name() : "—");
            ligne.put("statut", n.getNoteRetenue() != null && n.getNoteRetenue() >= n.getNoteMax() * 0.5 ? "REUSSI" : "AJOURNE");
            ligne.put("session", n.getSession());
            lignesNotes.add(ligne);
        }

        String nomComplet = ins.getPrenom() + " " + ins.getNom();

        Map<String, Object> releve = new LinkedHashMap<>();
        releve.put("titre", "RELEVE DE NOTES OFFICIEL");
        releve.put("genucLogo", "GENUC — Academie Integrale");
        releve.put("universite", ins.getUniversite().getNom());
        releve.put("universiteCode", ins.getUniversite().getCode());
        releve.put("departement", ins.getDepartement().getNom());
        releve.put("anneeAcademique", annee);
        releve.put("genereA", LocalDateTime.now().toString());
        releve.put("matricule", ins.getMatricule());
        releve.put("nom", ins.getNom());
        releve.put("prenom", ins.getPrenom());
        releve.put("niveau", ins.getNiveau());
        releve.put("notes", lignesNotes);

        delib.ifPresent(d -> {
            releve.put("moyenneGenerale", d.getMoyenneGenerale());
            releve.put("creditsValides", d.getCreditsValides());
            releve.put("creditsRequis", d.getCreditsRequis());
            releve.put("coursReussis", d.getCoursReussis());
            releve.put("coursTotaux", d.getCoursTotaux());
            releve.put("decision", d.getDecision().name());
            releve.put("mention", d.getMention() != null ? d.getMention().name() : "—");
            releve.put("presidentJury", d.getPresidentJuryNom());
            releve.put("dateDeliberation", d.getDateDeliberation());
            releve.put("codeDiplome", d.getCodeDiplome());
            releve.put("uuidVerification", d.getUuidVerification());
            releve.put("urlVerification", "https://genuc.cd/verifier/" + d.getUuidVerification());
        });

        return releve;
    }

    public Map<String, Object> verifierDiplome(String uuid) {
        Deliberation delib = deliberationRepo.findByUuidVerification(uuid)
                .orElseThrow(() -> new RuntimeException("Diplome introuvable ou UUID invalide"));

        if (delib.getDecision() != DecisionJury.DIPLOME) {
            return Map.of("valide", false, "message", "Ce document ne correspond pas a un diplome GENUC");
        }

        Inscription ins = delib.getInscription();
        String nomCompletEtudiant = ins.getPrenom() + " " + ins.getNom();

        Map<String, Object> diplome = new LinkedHashMap<>();
        diplome.put("valide", true);
        diplome.put("codeDiplome", delib.getCodeDiplome());
        diplome.put("titulaire", nomCompletEtudiant);
        diplome.put("universite", ins.getUniversite().getNom());
        diplome.put("departement", ins.getDepartement().getNom());
        diplome.put("niveau", delib.getNiveau());
        diplome.put("mention", delib.getMention() != null ? delib.getMention().name() : "—");
        diplome.put("moyenneGenerale", delib.getMoyenneGenerale());
        diplome.put("dateObtention", delib.getDateDeliberation());
        diplome.put("message", "✓ Diplome GENUC authentique et verifie");
        return diplome;
    }

    public Deliberation obtenir(Long id) {
        return deliberationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Deliberation introuvable : id=" + id));
    }

    public Optional<Deliberation> maDeliberation(Long inscriptionId, String annee) {
        return deliberationRepo.findByInscriptionIdAndAnneeAcademique(inscriptionId, annee);
    }

    public List<Deliberation> parUniversite(Long universiteId, String annee) {
        return deliberationRepo.findByUniversiteIdAndAnneeAcademique(universiteId, annee);
    }

    public Map<String, Object> statsUniversite(Long universiteId, String annee) {
        List<Deliberation> toutes = deliberationRepo.findByUniversiteIdAndAnneeAcademique(universiteId, annee);
        long admis = deliberationRepo.countAdmis(universiteId, annee);
        long diplomes = deliberationRepo.countDiplomes(universiteId, annee);
        long redouble = toutes.stream().filter(d -> d.getDecision() == DecisionJury.REDOUBLE).count();
        long total = toutes.size();

        return Map.of(
                "total", (int) total,
                "admis", (int) admis,
                "diplomes", (int) diplomes,
                "redoublants", (int) redouble,
                "tauxReussite", total > 0 ? (int) Math.round((double) (admis + diplomes) / total * 100) : 0
        );
    }

    private DecisionJury proposerDecision(double moyenne, int creditsValides, int creditsRequis, String niveau) {
        // Règle unique, portée par Promotion : la recopier ici l'avait fait
        // diverger (G3, fin du graduat, manquait des deux côtés).
        boolean derniereAnnee = Promotion.estNiveauDiplomant(niveau);
        boolean admis = moyenne >= 10.0 && creditsValides >= creditsRequis * 0.6;
        if (derniereAnnee && admis) return DecisionJury.DIPLOME;
        if (admis) return DecisionJury.ADMIS;
        if (moyenne >= 8.0 && creditsValides >= creditsRequis * 0.5) return DecisionJury.ADMIS_RATTRAPAGE;
        return DecisionJury.REDOUBLE;
    }

    private MentionNote calculerMention(double moyenne) {
        if (moyenne >= 18) return MentionNote.TRES_GRANDE_DISTINCTION;
        if (moyenne >= 16) return MentionNote.GRANDE_DISTINCTION;
        if (moyenne >= 14) return MentionNote.DISTINCTION;
        if (moyenne >= 12) return MentionNote.SATISFACTION;
        if (moyenne >= 10) return MentionNote.REUSSITE;
        return MentionNote.AJOURNE;
    }

    private String calculerNiveauSuivant(String niveau, DecisionJury decision) {
        if (decision == DecisionJury.DIPLOME || decision == DecisionJury.EXCLU) return null;
        if (decision == DecisionJury.REDOUBLE) return niveau;
        Map<String, String> succession = Map.of(
                "L1", "L2", "L2", "L3", "L3", "M1", "M1", "M2", "M2", "D1", "D1", "D2", "D2", "D3"
        );
        return succession.getOrDefault(niveau, null);
    }

    private String genererCodeDiplome(Deliberation delib) {
        Inscription ins = delib.getInscription();
        String annee = delib.getAnneeAcademique().replace("-", "");
        String uni = ins.getUniversite().getCode();
        String mat = ins.getMatricule().replaceAll("[^0-9]", "");
        mat = mat.length() > 5 ? mat.substring(0, 5) : mat;
        return "DIP-" + uni + "-" + annee + "-" + mat;
    }

    public static class ConsolidationProgress {
        private String jobId;
        private String status;
        private int progress;
        private int total;
        private Map<String, Object> result;
        private String message;

        public ConsolidationProgress() {}

        public ConsolidationProgress(String jobId, String status, int progress) {
            this.jobId = jobId;
            this.status = status;
            this.progress = progress;
        }

        public String getJobId() { return jobId; }
        public void setJobId(String jobId) { this.jobId = jobId; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public int getProgress() { return progress; }
        public void setProgress(int progress) { this.progress = progress; }

        public int getTotal() { return total; }
        public void setTotal(int total) { this.total = total; }

        public Map<String, Object> getResult() { return result; }
        public void setResult(Map<String, Object> result) { this.result = result; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}