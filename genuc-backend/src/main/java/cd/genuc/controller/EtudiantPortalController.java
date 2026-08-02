package cd.genuc.controller;

import cd.genuc.model.Etudiant;
import cd.genuc.model.Inscription;
import cd.genuc.model.Utilisateur;
import cd.genuc.repository.EtudiantRepository;
import cd.genuc.repository.InscriptionRepository;
import cd.genuc.security.SecurityService;
import cd.genuc.service.EtudiantPortalService;
import cd.genuc.service.ImportExportService;
import cd.genuc.service.DocumentsOfficielsService;
import cd.genuc.service.RelevePdfService;
import cd.genuc.service.StageService;
import cd.genuc.service.TfcService;
import cd.genuc.service.TravauxService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/etudiant/portal")
@RequiredArgsConstructor
public class EtudiantPortalController {

    private final EtudiantPortalService portalService;
    private final DocumentsOfficielsService documentsOfficielsService;
    private final RelevePdfService relevePdfService;
    private final ImportExportService importExportService;
    private final InscriptionRepository inscriptionRepository;
    private final EtudiantRepository etudiantRepository;
    private final TravauxService travauxService;
    private final TfcService tfcService;
    private final StageService stageService;
    private final SecurityService securityService;

    // ══════════════════════════════════════════
    // Dashboard principal
    // ══════════════════════════════════════════

    @GetMapping("/dashboard/{inscriptionId}")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> dashboard(@PathVariable Long inscriptionId) {
        try {
            return ResponseEntity.ok(portalService.getDashboard(inscriptionId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // Mes cours
    // ══════════════════════════════════════════

    @GetMapping("/{inscriptionId}/cours")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> mesCours(@PathVariable Long inscriptionId) {
        try {
            return ResponseEntity.ok(portalService.mesCoursAvecProgression(inscriptionId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/{inscriptionId}/cours/{coursId}")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> detailCours(
            @PathVariable Long inscriptionId,
            @PathVariable Long coursId) {
        try {
            return ResponseEntity.ok(portalService.detailCours(inscriptionId, coursId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/{inscriptionId}/cours/{coursId}/lecon/{leconId}/complete")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> marquerLeconCompletee(
            @PathVariable Long inscriptionId,
            @PathVariable Long coursId,
            @PathVariable Long leconId,
            @RequestBody(required = false) Map<String, Integer> body) {
        try {
            Integer temps = (body != null && body.containsKey("tempsMinutes")) ? body.get("tempsMinutes") : 0;
            return ResponseEntity.ok(portalService.marquerLeconCompletee(
                inscriptionId, coursId, leconId, temps));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // Mes notes
    // ══════════════════════════════════════════

    @GetMapping("/{inscriptionId}/notes")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> mesNotes(
            @PathVariable Long inscriptionId,
            @RequestParam(required = false) String annee) {
        try {
            return ResponseEntity.ok(portalService.mesNotes(inscriptionId, annee));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/{inscriptionId}/notes/export")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> exporterMesNotes(
            @PathVariable Long inscriptionId,
            @RequestParam String annee) {
        try {
            byte[] data = importExportService.exporterNotesEtudiant(inscriptionId, annee);
            String nomFichier = "notes_" + inscriptionId + "_" + annee + ".xlsx";
            return ResponseEntity.ok()
                .header("Content-Type", "application/octet-stream")
                .header("Content-Disposition", "attachment; filename=\"" + nomFichier + "\"")
                .body(data);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/{inscriptionId}/releve")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> releveNotes(
            @PathVariable Long inscriptionId,
            @RequestParam(required = false) String annee) {
        try {
            return ResponseEntity.ok(portalService.releveNotes(inscriptionId, annee));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 📄 RELEVÉ DE NOTES OFFICIEL - GESTION COMPLÈTE
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/{inscriptionId}/releve/disponibilite")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> getDisponibiliteReleve(
            @PathVariable Long inscriptionId,
            @RequestParam(required = false) String annee) {
        try {
            if (annee == null || annee.isEmpty()) {
                annee = getCurrentAcademicYear();
            }
            return ResponseEntity.ok(relevePdfService.getDisponibiliteReleve(inscriptionId, annee));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/{inscriptionId}/releve/telecharger")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> telechargerReleve(
            @PathVariable Long inscriptionId,
            @RequestParam(required = false) String annee) {
        try {
            if (annee == null || annee.isEmpty()) {
                annee = getCurrentAcademicYear();
            }
            
            byte[] pdf = relevePdfService.genererRelevePdf(inscriptionId, annee);
            
            String nomFichier = "releve_notes_" + inscriptionId + "_" + annee + ".pdf";
            
            return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=\"" + nomFichier + "\"")
                .body(pdf);
                
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/{inscriptionId}/releve/statut")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> getStatutPaiementReleve(
            @PathVariable Long inscriptionId,
            @RequestParam(required = false) String annee) {
        try {
            if (annee == null || annee.isEmpty()) {
                annee = getCurrentAcademicYear();
            }
            return ResponseEntity.ok(relevePdfService.getStatutPaiementReleve(inscriptionId, annee));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/{inscriptionId}/releve/renvoyer-email")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> renvoyerReleveParEmail(
            @PathVariable Long inscriptionId,
            @RequestParam(required = false) String annee) {
        try {
            if (annee == null || annee.isEmpty()) {
                annee = getCurrentAcademicYear();
            }
            
            if (!relevePdfService.aPayeReleve(inscriptionId, annee)) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Vous devez d'abord payer pour le relevé"));
            }
            
            relevePdfService.envoyerReleveParEmailApresPaiement(inscriptionId, annee);
            
            return ResponseEntity.ok(Map.of(
                "message", "✅ Relevé envoyé par email avec succès !",
                "email", getEmailEtudiant(inscriptionId)
            ));
            
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/{inscriptionId}/releve/a-paye")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> aPayeReleve(
            @PathVariable Long inscriptionId,
            @RequestParam(required = false) String annee) {
        try {
            if (annee == null || annee.isEmpty()) {
                annee = getCurrentAcademicYear();
            }
            boolean paye = relevePdfService.aPayeReleve(inscriptionId, annee);
            return ResponseEntity.ok(Map.of(
                "paye", paye,
                "prix", relevePdfService.getPrixReleve(),
                "devise", "USD"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/{inscriptionId}/documents-officiels")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> getDocumentsOfficiels(@PathVariable Long inscriptionId) {
        try {
            return ResponseEntity.ok(documentsOfficielsService.listerDocumentsPourEtudiant(inscriptionId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/{inscriptionId}/documents/demander")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> demanderDocument(@PathVariable Long inscriptionId,
                                              @AuthenticationPrincipal Utilisateur user,
                                              @RequestBody Map<String, Object> body) {
        try {
            String codeDocument = body.get("type") != null ? body.get("type").toString() : null;
            if (codeDocument == null || codeDocument.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "type est requis"));
            }
            documentsOfficielsService.demanderDocument(
                    inscriptionId,
                    codeDocument,
                    user != null ? user.getId() : null,
                    user != null ? user.getNomComplet() : null
            );
            return ResponseEntity.ok(Map.of("message", "Demande enregistrée avec succès"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/{inscriptionId}/documents/generer")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> genererDocument(@PathVariable Long inscriptionId,
                                             @RequestBody Map<String, Object> body) {
        try {
            String codeDocument = body.get("type") != null ? body.get("type").toString() : null;
            if (codeDocument == null || codeDocument.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "type est requis"));
            }
            DocumentsOfficielsService.DocumentGenere document = documentsOfficielsService.genererDocument(inscriptionId, codeDocument);
            ByteArrayResource resource = new ByteArrayResource(document.contenu());
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + document.nomFichier() + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(document.contenu().length)
                    .body(resource);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("erreur", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 👤 PROFIL ÉTUDIANT
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/profil/{inscriptionId}")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> getProfil(@PathVariable Long inscriptionId) {
        try {
            Inscription inscription = inscriptionRepository.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));
            
            Etudiant etudiant = inscription.getEtudiant();
            
            Map<String, Object> profil = new LinkedHashMap<>();
            profil.put("id", inscription.getId());
            profil.put("matricule", inscription.getMatricule());
            profil.put("nom", inscription.getNom() != null ? inscription.getNom() : (etudiant != null ? etudiant.getNom() : ""));
            profil.put("prenom", inscription.getPrenom() != null ? inscription.getPrenom() : (etudiant != null ? etudiant.getPrenom() : ""));
            profil.put("email", inscription.getEmail() != null ? inscription.getEmail() : (etudiant != null ? etudiant.getEmail() : ""));
            profil.put("telephone", inscription.getTelephone() != null ? inscription.getTelephone() : (etudiant != null ? etudiant.getTelephone() : ""));
            profil.put("dateNaissance", inscription.getDateNaissance());
            profil.put("lieuNaissance", inscription.getLieuNaissance());
            profil.put("sexe", inscription.getSexe());
            profil.put("adresse", inscription.getAdresse());
            profil.put("universite", inscription.getUniversite() != null ? inscription.getUniversite().getNom() : null);
            profil.put("departement", inscription.getDepartement() != null ? inscription.getDepartement().getNom() : null);
            profil.put("filiere", inscription.getFiliere() != null ? inscription.getFiliere().getNom() : null);
            profil.put("promotion", inscription.getPromotion() != null ? inscription.getPromotion().getLibelle() : null);
            profil.put("anneeAcademique", inscription.getAnneeAcademique() != null ? inscription.getAnneeAcademique().getLibelle() : null);
            profil.put("bulletin", inscription.isBulletin());
            profil.put("photo", inscription.isPhoto());
            profil.put("acte", inscription.isActe());
            
            return ResponseEntity.ok(profil);
            
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PutMapping("/profil/{inscriptionId}")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> updateProfil(
            @PathVariable Long inscriptionId,
            @RequestBody Map<String, Object> data) {
        try {
            Inscription inscription = inscriptionRepository.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));
            
            if (data.containsKey("telephone")) inscription.setTelephone((String) data.get("telephone"));
            if (data.containsKey("adresse")) inscription.setAdresse((String) data.get("adresse"));
            if (data.containsKey("dateNaissance") && data.get("dateNaissance") != null) {
                inscription.setDateNaissance(LocalDate.parse((String) data.get("dateNaissance")));
            }
            if (data.containsKey("lieuNaissance")) inscription.setLieuNaissance((String) data.get("lieuNaissance"));
            if (data.containsKey("email")) inscription.setEmail((String) data.get("email"));
            
            inscriptionRepository.save(inscription);
            
            Etudiant etudiant = inscription.getEtudiant();
            if (etudiant != null) {
                if (data.containsKey("telephone")) etudiant.setTelephone((String) data.get("telephone"));
                if (data.containsKey("adresse")) etudiant.setAdresse((String) data.get("adresse"));
                if (data.containsKey("dateNaissance") && data.get("dateNaissance") != null) {
                    etudiant.setDateNaissance(LocalDate.parse((String) data.get("dateNaissance")));
                }
                if (data.containsKey("lieuNaissance")) etudiant.setLieuNaissance((String) data.get("lieuNaissance"));
                if (data.containsKey("email")) etudiant.setEmail((String) data.get("email"));
                if (data.containsKey("nom")) etudiant.setNom((String) data.get("nom"));
                if (data.containsKey("prenom")) etudiant.setPrenom((String) data.get("prenom"));
                
                etudiantRepository.save(etudiant);
            }
            
            return ResponseEntity.ok(Map.of("message", "Profil mis à jour avec succès"));
            
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 📥 TRAVAUX / DEVOIRS
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/{inscriptionId}/travaux")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> mesTravaux(@PathVariable Long inscriptionId) {
        try {
            return ResponseEntity.ok(travauxService.mesTravaux(inscriptionId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎓 TFC / MÉMOIRE
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/{inscriptionId}/tfc")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> monTfc(@PathVariable Long inscriptionId) {
        try {
            return ResponseEntity.ok(tfcService.monTfc(inscriptionId));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/{inscriptionId}/tfc/depot")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> deposerChapitreTfc(
            @PathVariable Long inscriptionId,
            @RequestParam Long chapitreId,
            @RequestParam(required = false) String titre,
            @RequestParam(required = false) String description,
            @RequestParam MultipartFile fichier) {
        try {
            tfcService.deposerChapitre(inscriptionId, chapitreId, titre, description, fichier);
            return ResponseEntity.ok(Map.of("message", "Chapitre déposé avec succès"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 🏢 STAGES
    // ═══════════════════════════════════════════════════════════════

    @GetMapping("/{inscriptionId}/stage")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> monStage(@PathVariable Long inscriptionId) {
        try {
            return ResponseEntity.ok(stageService.monStage(inscriptionId));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("erreur", e.getMessage()));
        }
    }

    // Liste d'offres non nominative : aucune inscription visée, donc pas de garde de propriété.
    @GetMapping("/stages/offres")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> offresStages() {
        return ResponseEntity.ok(stageService.offresDisponibles());
    }

    // L'inscriptionId arrive ici dans le CORPS, pas dans l'URL : le SpEL ne peut pas
    // le lire, la vérification de propriété se fait donc explicitement dans la méthode.
    @PostMapping("/stages/postuler/{offreId}")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> postulerOffre(@PathVariable Long offreId, @RequestBody Map<String, Object> body) {
        try {
            Object brut = body.get("inscriptionId");
            if (brut == null) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "inscriptionId est requis"));
            }
            Long inscriptionId = Long.valueOf(brut.toString());
            if (!securityService.peutAccederInscription(inscriptionId)) {
                return ResponseEntity.status(403)
                        .body(Map.of("erreur", "Accès refusé : droits insuffisants."));
            }
            stageService.postuler(offreId, inscriptionId);
            return ResponseEntity.ok(Map.of("message", "Candidature envoyée avec succès"));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "inscriptionId invalide"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/{inscriptionId}/stage")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> declarerStage(
            @PathVariable Long inscriptionId,
            @RequestParam String entreprise,
            @RequestParam(required = false) String adresse,
            @RequestParam(required = false) String telephone,
            @RequestParam(required = false) String responsable,
            @RequestParam(required = false) String emailResponsable,
            @RequestParam String dateDebut,
            @RequestParam String dateFin,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) MultipartFile convention) {
        try {
            Map<String, String> form = new HashMap<>();
            form.put("entreprise", entreprise);
            form.put("adresse", adresse);
            form.put("telephone", telephone);
            form.put("responsable", responsable);
            form.put("emailResponsable", emailResponsable);
            form.put("dateDebut", dateDebut);
            form.put("dateFin", dateFin);
            form.put("description", description);
            stageService.declarerStage(inscriptionId, form, convention);
            return ResponseEntity.ok(Map.of("message", "Stage enregistré avec succès"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/{inscriptionId}/stage/rapport")
    @PreAuthorize("hasAnyRole('ETUDIANT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN') "
                + "and @securityService.peutAccederInscription(#inscriptionId, authentication)")
    public ResponseEntity<?> deposerRapportStage(
            @PathVariable Long inscriptionId,
            @RequestParam Long stageId,
            @RequestParam MultipartFile rapport) {
        try {
            stageService.deposerRapport(inscriptionId, stageId, rapport);
            return ResponseEntity.ok(Map.of("message", "Rapport de stage uploadé avec succès"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════
    // Méthodes utilitaires privées
    // ══════════════════════════════════════════

    private String getCurrentAcademicYear() {
        int year = LocalDate.now().getYear();
        return year + "-" + (year + 1);
    }

    private String getEmailEtudiant(Long inscriptionId) {
        return inscriptionRepository.findById(inscriptionId)
            .map(Inscription::getEmail)
            .orElse("etudiant@example.com");
    }
}