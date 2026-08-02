package cd.genuc.controller;

import cd.genuc.dto.InscriptionRequest;
import cd.genuc.dto.InscriptionRechercheDto;
import cd.genuc.model.*;
import cd.genuc.repository.*;
import cd.genuc.service.InscriptionService;
import cd.genuc.service.SmsService;
import cd.genuc.service.WhatsAppService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/inscriptions")
@RequiredArgsConstructor
public class InscriptionController {

    private final InscriptionService inscriptionService;
    private final InscriptionRepository inscriptionRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final AnneeAcademiqueRepository anneeAcademiqueRepository;
    private final PromotionRepository promotionRepository;
    private final PasswordEncoder passwordEncoder;
    private final SmsService smsService;
    private final WhatsAppService whatsAppService;

    // ─────────────────────────────────────────
    // POST /api/inscriptions — PUBLIC (sans connexion)
    // ─────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> soumettre(@Valid @RequestBody InscriptionRequest request) {
        try {
            Inscription inscription = inscriptionService.soumettre(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Dossier soumis avec succès. En cours de traitement.",
                "id", inscription.getId(),
                "matricule", inscription.getMatricule() != null ? inscription.getMatricule() : "",
                "statut", inscription.getStatut().name()
            ));
        } catch (Exception e) {
            log.error("Erreur lors de la soumission d'inscription", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────
    // GET /api/inscriptions — Liste tous les dossiers (admin)
    // ─────────────────────────────────────────
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<List<Inscription>> lister() {
        return ResponseEntity.ok(inscriptionRepository.findAll());
    }

    // ─────────────────────────────────────────
    // GET /api/inscriptions/en-attente (admin)
    // ─────────────────────────────────────────
    @GetMapping("/en-attente")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> enAttente() {
        List<Inscription> inscriptionsEnAttente = inscriptionRepository.findByStatut(StatutInscription.EN_ATTENTE);
        return ResponseEntity.ok(inscriptionsEnAttente);
    }

    // ─────────────────────────────────────────
    // GET /api/inscriptions/{id}
    // ─────────────────────────────────────────
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE', 'CHEF_DEPARTEMENT', 'ETUDIANT')")
    public ResponseEntity<?> obtenir(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(inscriptionService.obtenir(id));
        } catch (RuntimeException e) {
            log.warn("Inscription non trouvée : {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────
    // GET /api/inscriptions/recherche?q= — recherche floue (caisse / affectation de frais)
    // ─────────────────────────────────────────
    @GetMapping("/recherche")
    @PreAuthorize("hasAnyRole('CAISSIER', 'AGENT', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    public ResponseEntity<?> rechercher(@RequestParam String q) {
        if (q == null || q.trim().length() < 3) {
            return ResponseEntity.badRequest().body(Map.of("message", "Veuillez saisir au moins 3 caractères"));
        }
        List<InscriptionRechercheDto> resultats = inscriptionRepository
                .rechercher(q.trim(), PageRequest.of(0, 20))
                .stream().map(InscriptionRechercheDto::fromEntity).toList();
        return ResponseEntity.ok(resultats);
    }

    // ─────────────────────────────────────────
    // GET /api/inscriptions/matricule/{matricule}
    // ─────────────────────────────────────────
    @GetMapping("/matricule/{matricule}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> parMatricule(@PathVariable String matricule) {
        return inscriptionRepository.findByMatricule(matricule)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Aucune inscription pour le matricule " + matricule)));
    }

    // ─────────────────────────────────────────
    // GET /api/inscriptions/etudiant/{etudiantId}
    // ─────────────────────────────────────────
    @GetMapping("/etudiant/{etudiantId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE', 'CHEF_DEPARTEMENT', 'ETUDIANT')")
    public ResponseEntity<List<Inscription>> parEtudiant(@PathVariable Long etudiantId) {
        return ResponseEntity.ok(inscriptionService.inscriptionsParEtudiant(etudiantId));
    }

    // ─────────────────────────────────────────
    // GET /api/inscriptions/universite/{universiteId}
    // ─────────────────────────────────────────
    @GetMapping("/universite/{universiteId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<List<Inscription>> parUniversite(@PathVariable Long universiteId) {
        return ResponseEntity.ok(inscriptionService.inscriptionsParUniversite(universiteId));
    }

    // ─────────────────────────────────────────
    // GET /api/inscriptions/universite/{universiteId}/en-attente
    // ─────────────────────────────────────────
    @GetMapping("/universite/{universiteId}/en-attente")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE', 'SECRETAIRE_ACADEMIQUE')")
    public ResponseEntity<?> enAttenteParUniversite(@PathVariable Long universiteId) {
        List<Inscription> inscriptionsEnAttente = inscriptionRepository.findByUniversiteIdAndStatut(universiteId, StatutInscription.EN_ATTENTE);
        return ResponseEntity.ok(inscriptionsEnAttente);
    }

    // ─────────────────────────────────────────
    // PATCH /api/inscriptions/{id}/valider
    // Valide le dossier ET crée le compte Utilisateur avec le mot de passe choisi
    // ─────────────────────────────────────────
    @PatchMapping("/{id}/valider")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> valider(@PathVariable Long id,
                                     @RequestBody(required = false) Map<String, String> body) {
        try {
            Inscription inscription = inscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

            if (inscription.getStatut() == StatutInscription.VALIDE) {
                return ResponseEntity.badRequest().body(Map.of("message", "Ce dossier est déjà validé."));
            }

            // 1. Mettre à jour le statut
            inscription.setStatut(StatutInscription.VALIDE);
            if (body != null && body.containsKey("commentaire") && body.get("commentaire") != null) {
                inscription.setCommentaire(body.get("commentaire"));
            }
            inscriptionRepository.save(inscription);

            // 2. Créer le compte Utilisateur si pas encore existant
            String email = inscription.getEtudiant().getEmail();
            boolean compteNouveau = false;

            if (!utilisateurRepository.existsByEmail(email)) {
                // motDePasseTemporaire contient un hash BCrypt (haché dès la collecte dans
                // EtudiantController) : on le reprend tel quel, sans double encodage.
                // À défaut, mot de passe de secours (date de naissance) haché ici.
                String hashMotDePasse;
                if (inscription.getEtudiant().getMotDePasseTemporaire() != null) {
                    hashMotDePasse = inscription.getEtudiant().getMotDePasseTemporaire();
                } else {
                    String secours = inscription.getEtudiant().getDateNaissance() != null
                        ? inscription.getEtudiant().getDateNaissance().toString().replace("-", "")
                        : "Genuc2024!";
                    hashMotDePasse = passwordEncoder.encode(secours);
                }

                Utilisateur compte = Utilisateur.builder()
                    .nom(inscription.getEtudiant().getNom())
                    .prenom(inscription.getEtudiant().getPrenom())
                    .email(email)
                    .motDePasse(hashMotDePasse)
                    .telephone(inscription.getEtudiant().getTelephone())
                    .role(RoleEnum.ETUDIANT)
                    .universiteId(inscription.getUniversite().getId())
                    .departementId(inscription.getDepartement().getId())
                    .actif(true)
                    .compteActive(true)
                    .build();

                utilisateurRepository.save(compte);
                compteNouveau = true;
            }

            // 3. Envoyer un SMS + WhatsApp de confirmation (si numéro de téléphone présent)
            String telephone = inscription.getTelephone();
            if (telephone != null && !telephone.isBlank()) {
                String messageSms = "GENUC: Votre inscription a été validée. Connectez-vous sur https://genuc.cd";
                try {
                    smsService.envoyerSms(telephone, messageSms);
                } catch (Exception e) {
                    log.warn("Erreur envoi SMS à {} : {}", telephone, e.getMessage());
                }
                try {
                    whatsAppService.envoyerMessage(telephone, messageSms);
                } catch (Exception e) {
                    log.warn("Erreur envoi WhatsApp à {} : {}", telephone, e.getMessage());
                }
            }

            return ResponseEntity.ok(Map.of(
                "message", compteNouveau
                    ? "Dossier validé. Compte étudiant créé avec succès."
                    : "Dossier validé. Le compte existait déjà.",
                "email", email,
                "compteNouveau", compteNouveau,
                "matricule", inscription.getMatricule(),
                "statut", inscription.getStatut().name()
            ));

        } catch (Exception e) {
            log.error("Erreur lors de la validation de l'inscription {}", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────
    // PATCH /api/inscriptions/{id}/rejeter
    // ─────────────────────────────────────────
    @PatchMapping("/{id}/rejeter")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> rejeter(@PathVariable Long id,
                                     @RequestBody Map<String, String> body) {
        try {
            Inscription inscription = inscriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

            inscription.setStatut(StatutInscription.REJETE);
            String motif = (body != null && body.containsKey("motif")) ? body.get("motif") : "Dossier incomplet";
            inscription.setMotifRejet(motif);
            inscriptionRepository.save(inscription);

            return ResponseEntity.ok(Map.of(
                "message", "Dossier rejeté.",
                "motif", inscription.getMotifRejet(),
                "statut", inscription.getStatut().name()
            ));
        } catch (Exception e) {
            log.error("Erreur lors du rejet de l'inscription {}", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────
    // POST /api/inscriptions/{id}/reinscrire
    // Passage en classe supérieure avec report des dettes
    // ─────────────────────────────────────────
    @PostMapping("/{ancienneId}/reinscrire")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> reinscrire(@PathVariable Long ancienneId,
                                        @RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("anneeAcademiqueId") || !body.containsKey("promotionId")) {
                return ResponseEntity.badRequest().body(Map.of("message", "anneeAcademiqueId et promotionId sont requis"));
            }

            Long nouvelleAnneeId;
            Long nouvellePromotionId;
            try {
                nouvelleAnneeId = Long.valueOf(body.get("anneeAcademiqueId").toString());
                nouvellePromotionId = Long.valueOf(body.get("promotionId").toString());
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of("message", "IDs invalides"));
            }

            boolean avecDette = body.containsKey("avecDette") && Boolean.TRUE.equals(body.get("avecDette"));

            AnneeAcademique nouvelleAnnee = anneeAcademiqueRepository.findById(nouvelleAnneeId)
                .orElseThrow(() -> new RuntimeException("Année académique introuvable"));
            Promotion nouvellePromotion = promotionRepository.findById(nouvellePromotionId)
                .orElseThrow(() -> new RuntimeException("Promotion introuvable"));

            Inscription nouvelle = inscriptionService.reinscrire(ancienneId, nouvelleAnnee, nouvellePromotion, avecDette);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Réinscription effectuée avec succès.",
                "id", nouvelle.getId(),
                "matricule", nouvelle.getMatricule(),
                "statut", nouvelle.getStatut().name()
            ));
        } catch (Exception e) {
            log.error("Erreur lors de la réinscription depuis l'inscription {}", ancienneId, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ─────────────────────────────────────────
    // GET /api/inscriptions/statistiques/{universiteId}
    // ─────────────────────────────────────────
    @GetMapping("/statistiques/{universiteId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN_UNIVERSITE')")
    public ResponseEntity<?> statistiques(@PathVariable Long universiteId,
                                          @RequestParam String annee) {
        try {
            if (annee == null || annee.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "L'année académique est requise"));
            }
            return ResponseEntity.ok(inscriptionService.statistiquesParUniversite(universiteId, annee));
        } catch (Exception e) {
            log.error("Erreur lors du calcul des statistiques pour l'université {}", universiteId, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}