package cd.genuc.controller;

import cd.genuc.model.*;
import cd.genuc.repository.InscriptionRepository;
import cd.genuc.service.FiliereService;
import cd.genuc.service.InscriptionPubliqueService;
import cd.genuc.service.TachPayCaisseService;
import cd.genuc.service.tachpay.TachPayAdminService;
import cd.genuc.service.tachpay.TachPayPaiementService;
import cd.genuc.service.tachpay.TachPayWebhookService;
import cd.genuc.service.tachpay.WebhookSecurityService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
// L'alias /api/tachfee (ancien nom TachFee) est conservé : webhooks déjà
// configurés chez les opérateurs et liens/QR déjà émis continuent de marcher.
@RequestMapping({"/api/tachpay", "/api/tachfee"})
@RequiredArgsConstructor
@Slf4j
@Tag(name = "TachPay", description = "Service de paiement des frais étudiants")
public class TachPayController {

    private final TachPayAdminService adminService;
    private final TachPayPaiementService paiementService;
    private final TachPayCaisseService caisseService;
    private final FiliereService filiereService;
    private final TachPayWebhookService webhookService;
    private final WebhookSecurityService webhookSecurityService;
    private final ObjectMapper objectMapper;
    private final InscriptionRepository inscriptionRepository;
    private final InscriptionPubliqueService inscriptionPubliqueService;
    private final cd.genuc.security.ResolveurIpClient resolveurIp;

    /** Origine officielle du frontend : seule source des URLs de retour Stripe. */
    @org.springframework.beans.factory.annotation.Value("${app.base-url:http://localhost:3000}")
    private String appBaseUrl;

    /**
     * Reconstruit une URL de retour Stripe à partir de {@code app.base-url}.
     *
     * <p>Une URL de redirection ne doit JAMAIS être décidée par le client : c'est
     * la définition même d'un open redirect. L'ancienne parade — accepter le
     * chemin relatif ou {@code https://genuc.cd} en dur — avait deux défauts :
     * elle rejetait l'origine réelle du SPA hors production (400 « URL de succès
     * invalide », parcours carte public mort en dev), et un chemin relatif accepté
     * tel quel aurait été refusé par Stripe, qui exige une URL ABSOLUE.</p>
     *
     * <p>On ne retient donc que le CHEMIN fourni par le client et on le rattache à
     * l'origine configurée. Tout hôte étranger est ignoré silencieusement.</p>
     */
    private String resoudreUrlRetour(Object urlFournie, String cheminParDefaut) {
        String chemin = cheminParDefaut;
        if (urlFournie != null && !urlFournie.toString().isBlank()) {
            try {
                String p = java.net.URI.create(urlFournie.toString().trim()).getPath();
                if (p != null && p.startsWith("/")) {
                    chemin = p;
                }
            } catch (IllegalArgumentException e) {
                log.warn("URL de retour illisible, valeur par défaut utilisée : {}", urlFournie);
            }
        }
        String base = appBaseUrl.endsWith("/")
                ? appBaseUrl.substring(0, appBaseUrl.length() - 1)
                : appBaseUrl;
        return base + chemin;
    }

    private List<Long> parseAffectationIds(Object rawValue) {
        if (rawValue == null) {
            return List.of();
        }
        if (!(rawValue instanceof List<?> values)) {
            throw new RuntimeException("Le format des affectations sélectionnées est invalide");
        }

        List<Long> affectationIds = new ArrayList<>();
        for (Object value : values) {
            if (value == null) {
                continue;
            }
            if (value instanceof Number number) {
                affectationIds.add(number.longValue());
                continue;
            }
            String text = value.toString().trim();
            if (!text.isEmpty()) {
                affectationIds.add(Long.valueOf(text));
            }
        }
        return affectationIds;
    }

    // ════════════════════════════════════════════════════════════════
    // 1. ADMIN
    // ════════════════════════════════════════════════════════════════

    @PostMapping("/admin/frais")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    @Operation(summary = "Créer un nouveau frais")
    public ResponseEntity<?> creerFrais(@RequestBody Map<String, Object> body,
                                        @AuthenticationPrincipal Utilisateur user) {
        try {
            Frais frais = adminService.creerFrais(body, user.getUniversiteId());
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Frais créé avec succès",
                "id", frais.getId(),
                "code", frais.getCode()
            ));
        } catch (Exception e) {
            log.error("Erreur création frais : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PutMapping("/admin/frais/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    @Operation(summary = "Modifier un frais existant")
    public ResponseEntity<?> modifierFrais(@PathVariable Long id,
                                           @RequestBody Map<String, Object> body,
                                           @AuthenticationPrincipal Utilisateur user) {
        try {
            Frais frais = adminService.modifierFrais(id, body, user.getUniversiteId());
            return ResponseEntity.ok(Map.of(
                "message", "Frais modifié avec succès",
                "id", frais.getId()
            ));
        } catch (Exception e) {
            log.error("Erreur modification frais : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PatchMapping("/admin/frais/{id}/statut")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    @Operation(summary = "Changer le statut d'un frais")
    public ResponseEntity<?> changerStatutFrais(@PathVariable Long id,
                                                @RequestBody Map<String, String> body,
                                                @AuthenticationPrincipal Utilisateur user) {
        try {
            String statut = body.get("statut");
            Frais frais = adminService.changerStatutFrais(id, statut, user.getUniversiteId());
            return ResponseEntity.ok(Map.of(
                "message", "Statut mis à jour",
                "statut", frais.getStatut().name()
            ));
        } catch (Exception e) {
            log.error("Erreur changement statut frais : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/admin/frais")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    @Operation(summary = "Lister tous les frais de l'université")
    public ResponseEntity<?> listerFrais(@AuthenticationPrincipal Utilisateur user,
                                         @RequestParam(required = false) String annee) {
        try {
            List<Frais> frais = adminService.listerFrais(user.getUniversiteId(), annee);
            return ResponseEntity.ok(Map.of(
                "total", frais.size(),
                "frais", frais
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/admin/frais/{id}")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    @Operation(summary = "Détail d'un frais")
    public ResponseEntity<?> getFrais(@PathVariable Long id,
                                      @AuthenticationPrincipal Utilisateur user) {
        try {
            Frais frais = adminService.getFrais(id, user.getUniversiteId());
            return ResponseEntity.ok(frais);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/admin/frais/{id}/affecter")
    @PreAuthorize("hasAnyRole('ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    @Operation(summary = "Réaffecter un frais à une promotion")
    public ResponseEntity<?> reaffecterFrais(@PathVariable Long id,
                                             @AuthenticationPrincipal Utilisateur user) {
        try {
            int nbAffectations = adminService.reaffecterFrais(id, user.getUniversiteId());
            return ResponseEntity.ok(Map.of(
                "message", nbAffectations + " nouvelles affectations créées",
                "nbAffectations", nbAffectations
            ));
        } catch (Exception e) {
            log.error("Erreur réaffectation frais : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ════════════════════════════════════════════════════════════════
    // 2. ÉTUDIANT
    // ════════════════════════════════════════════════════════════════

    @GetMapping("/etudiant/frais-a-payer")
    @PreAuthorize("hasRole('ETUDIANT')")
    @Operation(summary = "Lister les frais à payer pour l'étudiant connecté")
    public ResponseEntity<?> getFraisAPayer(@AuthenticationPrincipal Utilisateur user) {
        try {
            Long inscriptionId = user.getInscriptionId();
            if (inscriptionId == null) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Aucune inscription associée"));
            }
            Map<String, Object> result = paiementService.getFraisAPayer(inscriptionId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur récupération frais à payer : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/etudiant/situation")
    @PreAuthorize("hasRole('ETUDIANT')")
    @Operation(summary = "Situation financière complète de l'étudiant")
    public ResponseEntity<?> getSituationFinanciere(@AuthenticationPrincipal Utilisateur user) {
        try {
            Long inscriptionId = user.getInscriptionId();
            if (inscriptionId == null) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Aucune inscription associée"));
            }
            Map<String, Object> situation = paiementService.getSituationFinanciere(inscriptionId);
            return ResponseEntity.ok(situation);
        } catch (Exception e) {
            log.error("Erreur récupération situation financière : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/etudiant/checkout-context")
    @PreAuthorize("hasRole('ETUDIANT')")
    @Operation(summary = "Contexte complet de paiement pour l'étudiant connecté")
    public ResponseEntity<?> getCheckoutContextEtudiant(@AuthenticationPrincipal Utilisateur user) {
        try {
            Long inscriptionId = user.getInscriptionId();
            if (inscriptionId == null) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Aucune inscription associée"));
            }

            Inscription inscription = inscriptionRepository.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

            return ResponseEntity.ok(construireCheckoutContext(inscription));
        } catch (Exception e) {
            log.error("Erreur contexte checkout étudiant : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/etudiant/historique")
    @PreAuthorize("hasRole('ETUDIANT')")
    @Operation(summary = "Historique des paiements de l'étudiant")
    public ResponseEntity<?> getHistoriquePaiements(@AuthenticationPrincipal Utilisateur user,
                                                    @RequestParam(defaultValue = "0") int page,
                                                    @RequestParam(defaultValue = "20") int size) {
        try {
            Long inscriptionId = user.getInscriptionId();
            if (inscriptionId == null) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Aucune inscription associée"));
            }
            Map<String, Object> historique = paiementService.getHistoriquePaiements(inscriptionId, page, size);
            return ResponseEntity.ok(historique);
        } catch (Exception e) {
            log.error("Erreur récupération historique : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/etudiant/bon-paiement")
    @PreAuthorize("hasRole('ETUDIANT')")
    @Operation(summary = "Générer un bon de paiement")
    public ResponseEntity<?> genererBonDePaiement(@AuthenticationPrincipal Utilisateur user,
                                                  @RequestBody List<Long> affectationIds) {
        try {
            Long inscriptionId = user.getInscriptionId();
            if (inscriptionId == null) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Aucune inscription associée"));
            }
            // Un bon PAR BANQUE de règlement : des frais dirigés par l'admin vers des
            // guichets différents ne peuvent pas tenir sur un seul bon, sinon le montant
            // « NET A PAYER » ne correspondrait à aucun versement réel.
            List<BonDePaiement> bons = paiementService.genererBonsDePaiement(inscriptionId, affectationIds);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(reponseBons(bons, "/etudiant/bon-paiement/"));
        } catch (Exception e) {
            log.error("Erreur génération bon : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/etudiant/bon-paiement/{numero}/pdf")
    @PreAuthorize("hasRole('ETUDIANT')")
    @Operation(summary = "Télécharger le bon de paiement en PDF")
    public ResponseEntity<?> telechargerBonPdf(@PathVariable String numero) {
        try {
            byte[] pdf = paiementService.genererPdfBon(numero);
            return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=bon_paiement_" + numero + ".pdf")
                .body(pdf);
        } catch (Exception e) {
            log.error("Erreur téléchargement bon PDF : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/etudiant/payer-carte")
    @PreAuthorize("hasRole('ETUDIANT')")
    @Operation(summary = "Initier un paiement par carte bancaire")
    public ResponseEntity<?> payerParCarte(@AuthenticationPrincipal Utilisateur user,
                                           @RequestBody Map<String, Object> body) {
        try {
            Long inscriptionId = user.getInscriptionId();
            if (inscriptionId == null) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Aucune inscription associée"));
            }
            List<Long> affectationIds = parseAffectationIds(body.get("affectationIds"));
            if (affectationIds == null || affectationIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Aucune affectation sélectionnée"));
            }
            Map<String, Object> result = paiementService.initierPaiementCarte(
                inscriptionId, affectationIds,
                resoudreUrlRetour(body.get("successUrl"), "/paiement/succes"),
                resoudreUrlRetour(body.get("cancelUrl"), "/paiement/annule"));
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur paiement carte : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/etudiant/payer-mobile")
    @PreAuthorize("hasRole('ETUDIANT')")
    @Operation(summary = "Initier un paiement par Mobile Money")
    public ResponseEntity<?> payerParMobile(@AuthenticationPrincipal Utilisateur user,
                                            @RequestBody Map<String, Object> body) {
        try {
            Long inscriptionId = user.getInscriptionId();
            if (inscriptionId == null) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Aucune inscription associée"));
            }
            List<Long> affectationIds = parseAffectationIds(body.get("affectationIds"));
            String telephone = (String) body.get("telephone");
            String operateur = (String) body.get("operateur");
            if (affectationIds == null || affectationIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Aucune affectation sélectionnée"));
            }
            if (telephone == null || telephone.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Le numéro de téléphone est obligatoire"));
            }
            if (operateur == null || operateur.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "L'opérateur est obligatoire"));
            }
            Map<String, Object> result = paiementService.initierPaiementMobileMoney(
                inscriptionId, affectationIds, telephone, operateur);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur paiement mobile : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/etudiant/paiement/{reference}/statut")
    @PreAuthorize("hasAnyRole('ETUDIANT','AGENT','CAISSIER','ADMIN_UNIVERSITE','SUPER_ADMIN')")
    @Operation(summary = "Consulter le statut d'un paiement (polling)")
    public ResponseEntity<?> getStatutPaiement(@PathVariable String reference) {
        try {
            return ResponseEntity.ok(paiementService.getStatutPaiement(reference));
        } catch (Exception e) {
            log.error("Erreur statut paiement {} : {}", reference, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ════════════════════════════════════════════════════════════════
    // 3. CAISSE (avec rôles AGENT et CAISSIER)
    // ════════════════════════════════════════════════════════════════

    @GetMapping("/caisse/etudiant/{matricule}/frais")
    @PreAuthorize("hasAnyRole('AGENT', 'CAISSIER', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    @Operation(summary = "Récupérer les frais à payer d'un étudiant (caissier)")
    public ResponseEntity<?> getFraisEtudiant(@PathVariable String matricule,
                                              @AuthenticationPrincipal Utilisateur user) {
        try {
            Long universiteId = user.getUniversiteId();
            Inscription inscription = inscriptionRepository
                .findByMatriculeAndUniversiteId(matricule, universiteId)
                .orElseThrow(() -> new RuntimeException("Étudiant non trouvé pour cette université"));
            Map<String, Object> result = paiementService.getFraisAPayer(inscription.getId());
            result.put("inscriptionId", inscription.getId());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur récupération frais étudiant : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ════════════════════════════════════════════════════════════════
    // 4. PUBLIC SELF-SERVICE
    // ════════════════════════════════════════════════════════════════

    @GetMapping("/public/etudiant/{matricule}/checkout-context")
    @Operation(summary = "Contexte complet de paiement public par matricule")
    public ResponseEntity<?> getCheckoutContextPublic(@PathVariable String matricule) {
        try {
            String matriculeNettoye = matricule == null ? "" : matricule.trim();
            if (matriculeNettoye.length() < 3 || matriculeNettoye.length() > 50) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Matricule invalide"));
            }
            if (!matriculeNettoye.matches("[A-Za-z0-9\\-_]+")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Matricule invalide"));
            }

            Inscription inscription = inscriptionRepository.findByMatricule(matriculeNettoye)
                .orElseThrow(() -> new RuntimeException("Étudiant introuvable"));

            return ResponseEntity.ok(construireCheckoutContext(inscription));
        } catch (Exception e) {
            log.error("Erreur contexte checkout public : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", "Erreur lors du traitement de la requête"));
        }
    }

    @GetMapping("/public/dossier/{numeroDossier}/checkout-context")
    @Operation(summary = "Contexte complet de paiement public par numero de dossier")
    public ResponseEntity<?> getCheckoutContextPublicDossier(@PathVariable String numeroDossier) {
        try {
            String numeroNettoye = numeroDossier == null ? "" : numeroDossier.trim();
            if (numeroNettoye.length() < 3 || numeroNettoye.length() > 50) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Numéro de dossier invalide"));
            }
            if (!numeroNettoye.matches("[A-Za-z0-9\\-_]+")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Numéro de dossier invalide"));
            }
            return ResponseEntity.ok(inscriptionPubliqueService.getTachPayCheckoutContext(numeroNettoye));
        } catch (Exception e) {
            log.error("Erreur contexte checkout public dossier : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", "Erreur lors du traitement de la requête"));
        }
    }

    @PostMapping("/public/payer-carte")
    @Operation(summary = "Initier un paiement carte en libre-service")
    public ResponseEntity<?> payerParCartePublic(@RequestBody Map<String, Object> body) {
        try {
            Object inscriptionIdRaw = body.get("inscriptionId");
            if (inscriptionIdRaw == null) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "inscriptionId est requis"));
            }
            Long inscriptionId;
            try {
                inscriptionId = Long.valueOf(inscriptionIdRaw.toString());
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "inscriptionId invalide"));
            }
            List<Long> affectationIds = parseAffectationIds(body.get("affectationIds"));

            if (affectationIds == null || affectationIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Aucun frais sélectionné"));
            }

            // Open redirect neutralisé à la source : seul le CHEMIN du client est
            // retenu, l'origine vient de app.base-url (cf. resoudreUrlRetour).
            Map<String, Object> result = paiementService.initierPaiementCarte(
                inscriptionId, affectationIds,
                resoudreUrlRetour(body.get("successUrl"), "/paiement/succes"),
                resoudreUrlRetour(body.get("cancelUrl"), "/paiement/annule"));
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur paiement carte public : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", "Erreur lors du traitement de la requête"));
        }
    }

    @PostMapping("/public/payer-mobile")
    @Operation(summary = "Initier un paiement Mobile Money en libre-service")
    public ResponseEntity<?> payerParMobilePublic(@RequestBody Map<String, Object> body) {
        try {
            Object inscriptionIdRaw = body.get("inscriptionId");
            if (inscriptionIdRaw == null) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "inscriptionId est requis"));
            }
            Long inscriptionId;
            try {
                inscriptionId = Long.valueOf(inscriptionIdRaw.toString());
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "inscriptionId invalide"));
            }
            List<Long> affectationIds = parseAffectationIds(body.get("affectationIds"));
            String telephone = (String) body.get("telephone");
            String operateur = (String) body.get("operateur");

            if (affectationIds == null || affectationIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Aucun frais sélectionné"));
            }
            if (telephone == null || telephone.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Le numéro de téléphone est obligatoire"));
            }
            if (operateur == null || operateur.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "L'opérateur est obligatoire"));
            }
            // Validation du numéro de téléphone : format international RDC
            if (!telephone.matches("^\\+?[0-9]{8,15}$")) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Format de numéro invalide"));
            }

            Map<String, Object> result = paiementService.initierPaiementMobileMoney(
                inscriptionId, affectationIds, telephone, operateur);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur paiement mobile public : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", "Erreur lors du traitement de la requête"));
        }
    }

    @PostMapping("/public/dossier/payer-mobile")
    @Operation(summary = "Initier un paiement Mobile Money public par numero de dossier")
    public ResponseEntity<?> payerParMobilePublicDossier(@RequestBody Map<String, Object> body) {
        try {
            String numeroDossier = body.get("numeroDossier") != null ? body.get("numeroDossier").toString() : null;
            String telephone = (String) body.get("telephone");
            String operateur = (String) body.get("operateur");
            if (numeroDossier == null || numeroDossier.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Le numero de dossier est obligatoire"));
            }
            if (telephone == null || telephone.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Le numero de telephone est obligatoire"));
            }
            if (operateur == null || operateur.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "L'operateur est obligatoire"));
            }
            // Vrai flux : transaction PENDING + appel opérateur ; le dossier
            // n'est marqué payé que par le webhook signé.
            return ResponseEntity.ok(
                inscriptionPubliqueService.initierPaiementFraisInscription(numeroDossier, operateur, telephone));
        } catch (Exception e) {
            log.error("Erreur paiement mobile public dossier : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/public/dossier/payer-carte")
    @Operation(summary = "Initier un paiement carte public par numero de dossier")
    public ResponseEntity<?> payerParCartePublicDossier(@RequestBody Map<String, Object> body) {
        try {
            String numeroDossier = body.get("numeroDossier") != null ? body.get("numeroDossier").toString() : null;
            if (numeroDossier == null || numeroDossier.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Le numero de dossier est obligatoire"));
            }
            // Vrai flux : session Stripe + transaction PENDING ; le dossier
            // n'est marqué payé que par le webhook Stripe signé.
            return ResponseEntity.ok(
                inscriptionPubliqueService.initierPaiementFraisInscriptionParCarte(
                    numeroDossier,
                    resoudreUrlRetour(body.get("successUrl"), "/paiement/succes"),
                    resoudreUrlRetour(body.get("cancelUrl"), "/paiement/annule")));
        } catch (Exception e) {
            log.error("Erreur paiement carte public dossier : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/caisse/payer-carte")
    @PreAuthorize("hasAnyRole('AGENT', 'CAISSIER', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    @Operation(summary = "Initier un paiement par carte bancaire (caissier)")
    public ResponseEntity<?> payerCarteParCaissier(@RequestBody Map<String, Object> body,
                                                   @AuthenticationPrincipal Utilisateur user) {
        try {
            Long inscriptionId = Long.valueOf(body.get("inscriptionId").toString());
            List<Long> affectationIds = parseAffectationIds(body.get("affectationIds"));
            if (inscriptionId == null || affectationIds == null || affectationIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Données invalides"));
            }
            Map<String, Object> result = paiementService.initierPaiementCarte(
                inscriptionId, affectationIds,
                resoudreUrlRetour(body.get("successUrl"), "/paiement/succes"),
                resoudreUrlRetour(body.get("cancelUrl"), "/paiement/annule"));
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur paiement carte (caissier) : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/caisse/payer-mobile")
    @PreAuthorize("hasAnyRole('AGENT', 'CAISSIER', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    @Operation(summary = "Initier un paiement Mobile Money (caissier)")
    public ResponseEntity<?> payerMobileParCaissier(@RequestBody Map<String, Object> body,
                                                    @AuthenticationPrincipal Utilisateur user) {
        try {
            Long inscriptionId = Long.valueOf(body.get("inscriptionId").toString());
            List<Long> affectationIds = parseAffectationIds(body.get("affectationIds"));
            String telephone = (String) body.get("telephone");
            String operateur = (String) body.get("operateur");
            if (inscriptionId == null || affectationIds == null || affectationIds.isEmpty()
                    || telephone == null || operateur == null) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Données invalides"));
            }
            Map<String, Object> result = paiementService.initierPaiementMobileMoney(
                inscriptionId, affectationIds, telephone, operateur);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur paiement mobile (caissier) : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @PostMapping("/caisse/generer-bon")
    @PreAuthorize("hasAnyRole('AGENT', 'CAISSIER', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    @Operation(summary = "Générer un bon de paiement (caissier)")
    public ResponseEntity<?> genererBonParCaissier(@RequestBody Map<String, Object> body,
                                                   @AuthenticationPrincipal Utilisateur user) {
        try {
            Long inscriptionId = Long.valueOf(body.get("inscriptionId").toString());
            List<Long> affectationIds = parseAffectationIds(body.get("affectationIds"));
            if (inscriptionId == null || affectationIds == null || affectationIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Données invalides"));
            }
            // Même contrat que /etudiant/bon-paiement : UN BON PAR BANQUE.
            // L'ancienne version appelait genererBonDePaiement() (singulier), qui ne
            // renvoie que le PREMIER bon du regroupement : dès que les frais choisis
            // se réglaient dans deux banques différentes, le caissier remettait un
            // seul bon et l'étudiant ne payait qu'une partie de sa dette.
            List<BonDePaiement> bons = paiementService.genererBonsDePaiement(inscriptionId, affectationIds);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(reponseBons(bons, "/caisse/bon-paiement/"));
        } catch (Exception e) {
            log.error("Erreur génération bon (caissier) : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/caisse/bon-paiement/{numero}/pdf")
    @PreAuthorize("hasAnyRole('AGENT', 'CAISSIER', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    @Operation(summary = "Télécharger le bon de paiement en PDF (caissier)")
    public ResponseEntity<?> telechargerBonPdfCaisse(@PathVariable String numero) {
        try {
            byte[] pdf = paiementService.genererPdfBon(numero);
            return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition", "attachment; filename=bon_paiement_" + numero + ".pdf")
                .body(pdf);
        } catch (Exception e) {
            log.error("Erreur téléchargement bon PDF (caissier) {} : {}", numero, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    /**
     * Corps de réponse commun aux deux guichets d'émission de bons (étudiant et
     * caisse) : la liste complète des bons — un par banque de règlement — plus les
     * champs à plat du premier, conservés pour les clients écrits avant le
     * multi-bons. {@code prefixePdf} diffère car les deux routes PDF n'ouvrent pas
     * les mêmes rôles.
     */
    private Map<String, Object> reponseBons(List<BonDePaiement> bons, String prefixePdf) {
        List<Map<String, Object>> details = bons.stream().map(bon -> {
            Map<String, Object> d = new LinkedHashMap<>();
            d.put("numero", bon.getNumero());
            d.put("montant", bon.getMontant());
            d.put("dateEmission", bon.getDateEmission());
            d.put("dateExpiration", bon.getDateExpiration());
            d.put("banques", paiementService.banquesDuBon(bon));
            d.put("pdfUrl", "/api/tachpay" + prefixePdf + bon.getNumero() + "/pdf");
            return d;
        }).toList();

        Map<String, Object> reponse = new LinkedHashMap<>();
        reponse.put("message", bons.size() == 1
                ? "Bon de paiement généré avec succès"
                : bons.size() + " bons générés : vos frais se règlent dans des banques différentes.");
        reponse.put("bons", details);
        reponse.put("numero", bons.get(0).getNumero());
        reponse.put("montant", bons.get(0).getMontant());
        reponse.put("dateEmission", bons.get(0).getDateEmission());
        reponse.put("dateExpiration", bons.get(0).getDateExpiration());
        reponse.put("pdfUrl", "/api/tachpay" + prefixePdf + bons.get(0).getNumero() + "/pdf");
        return reponse;
    }

    // ─── Endpoints de caisse existants ─────────────────────────────

    @PostMapping("/caisse/valider-bon")
    @PreAuthorize("hasAnyRole('AGENT', 'CAISSIER', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    @Operation(summary = "Valider un bon de paiement (scanner QR)")
    public ResponseEntity<?> validerBonDePaiement(@RequestBody Map<String, String> body,
                                                  @AuthenticationPrincipal Utilisateur user) {
        try {
            String numeroBon = body.get("numeroBon");
            if (numeroBon == null || numeroBon.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Le numéro du bon est obligatoire"));
            }
            Map<String, Object> result = caisseService.validerBonDePaiement(numeroBon, user.getId());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur validation bon : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    private Map<String, Object> construireCheckoutContext(Inscription inscription) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("data", versCheckoutDetail(inscription));

        Map<String, Object> frais = paiementService.getFraisAPayer(inscription.getId());
        result.put("frais", frais.getOrDefault("frais", List.of()));
        result.put("inscriptionId", inscription.getId());

        Object total = frais.get("total");
        if (total != null) {
            result.put("total", total);
        }

        return result;
    }

    private Map<String, Object> versCheckoutDetail(Inscription inscription) {
        Map<String, Object> detail = new LinkedHashMap<>();
        detail.put("inscriptionId", inscription.getId());
        detail.put("matricule", inscription.getMatricule());
        detail.put("nom", inscription.getNom());
        detail.put("prenom", inscription.getPrenom());
        detail.put("email", inscription.getEmail());
        detail.put("telephone", inscription.getTelephone());
        detail.put("niveau", inscription.getNiveau());

        if (inscription.getUniversite() != null) {
            detail.put("universiteId", inscription.getUniversite().getId());
            detail.put("universiteNom", inscription.getUniversite().getNom());
        }
        if (inscription.getDepartement() != null) {
            detail.put("departementId", inscription.getDepartement().getId());
            detail.put("faculteNom", inscription.getDepartement().getFaculte() != null
                ? inscription.getDepartement().getFaculte().getNom()
                : inscription.getDepartement().getNom());
        }
        if (inscription.getFiliere() != null) {
            detail.put("filiereId", inscription.getFiliere().getId());
            detail.put("filiereNom", inscription.getFiliere().getNom());
        }
        if (inscription.getPromotion() != null) {
            detail.put("promotionLibelle", inscription.getPromotion().getLibelle());
        }
        if (inscription.getAnneeAcademique() != null) {
            detail.put("anneeScolaire", inscription.getAnneeAcademique().getLibelle());
        }

        return detail;
    }

    @PostMapping("/caisse/paiement-especes")
    @PreAuthorize("hasAnyRole('AGENT', 'CAISSIER', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    @Operation(summary = "Enregistrer un paiement en espèces")
    public ResponseEntity<?> paiementEspeces(@RequestBody Map<String, Object> body,
                                             @AuthenticationPrincipal Utilisateur user) {
        try {
            Long inscriptionId = Long.valueOf(body.get("inscriptionId").toString());
            @SuppressWarnings("unchecked")
            List<Long> affectationIds = (List<Long>) body.get("affectationIds");
            Double montant = Double.valueOf(body.get("montant").toString());
            if (inscriptionId == null || affectationIds == null || affectationIds.isEmpty() || montant <= 0) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Données invalides"));
            }
            Map<String, Object> result = caisseService.enregistrerPaiementEspeces(
                inscriptionId, affectationIds, montant, user.getId());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur paiement espèces : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/caisse/operations")
    @PreAuthorize("hasAnyRole('AGENT', 'CAISSIER', 'ADMIN_UNIVERSITE', 'SUPER_ADMIN')")
    @Operation(summary = "Lister les opérations de caisse du jour")
    public ResponseEntity<?> getOperationsCaisse(@AuthenticationPrincipal Utilisateur user) {
        try {
            Long universiteId = user.getUniversiteId();
            if (universiteId == null) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Aucune université associée"));
            }
            Map<String, Object> result = caisseService.getOperationsDuJour(universiteId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur récupération opérations : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    @GetMapping("/caisse/rapport/journalier")
    @PreAuthorize("hasAnyRole('AGENT','CAISSIER','ADMIN_UNIVERSITE','SUPER_ADMIN','COMPTABLE')")
    @Operation(summary = "Rapport TachPay du jour")
    public ResponseEntity<?> getRapportJournalier(@AuthenticationPrincipal Utilisateur user) {
        try {
            Long universiteId = user.getUniversiteId();
            if (universiteId == null) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Aucune université associée"));
            }
            return ResponseEntity.ok(paiementService.getRapportTachPayJournalier(universiteId));
        } catch (Exception e) {
            log.error("Erreur rapport journalier : {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("erreur", e.getMessage()));
        }
    }

    // ════════════════════════════════════════════════════════════════
    // 4. WEBHOOKS
    // Endpoints publics : chaque appel DOIT être signé par l'opérateur
    // (HMAC-SHA256 du corps brut, en-tête X-Webhook-Signature). Sans
    // signature valide → 401, jamais de validation de paiement.
    // ════════════════════════════════════════════════════════════════

    @PostMapping("/webhook/vodacom")
    @Operation(summary = "Webhook Vodacom M-Pesa")
    public ResponseEntity<?> webhookVodacom(
            @RequestBody String payload,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature,
            jakarta.servlet.http.HttpServletRequest request) {
        return traiterWebhookMobile("VODACOM", payload, signature, webhookService::traiterWebhookVodacom, request);
    }

    @PostMapping("/webhook/airtel")
    @Operation(summary = "Webhook Airtel Money")
    public ResponseEntity<?> webhookAirtel(
            @RequestBody String payload,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature,
            jakarta.servlet.http.HttpServletRequest request) {
        return traiterWebhookMobile("AIRTEL", payload, signature, webhookService::traiterWebhookAirtel, request);
    }

    @PostMapping("/webhook/orange")
    @Operation(summary = "Webhook Orange Money")
    public ResponseEntity<?> webhookOrange(
            @RequestBody String payload,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature,
            jakarta.servlet.http.HttpServletRequest request) {
        return traiterWebhookMobile("ORANGE", payload, signature, webhookService::traiterWebhookOrange, request);
    }

    @PostMapping("/webhook/afrimoney")
    @Operation(summary = "Webhook AfriMoney")
    public ResponseEntity<?> webhookAfriMoney(
            @RequestBody String payload,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String signature,
            jakarta.servlet.http.HttpServletRequest request) {
        return traiterWebhookMobile("AFRIMONEY", payload, signature, webhookService::traiterWebhookAfriMoney, request);
    }

    /**
     * Vérifie la signature du webhook, parse le corps brut puis délègue au
     * traitement métier. Le corps brut (non re-sérialisé) est indispensable :
     * le HMAC doit porter sur les octets exacts envoyés par l'opérateur.
     * 
     * Depuis l'ajout de la sécurité renforcée, vérifie également l'adresse IP
     * source via la whitelist configurée.
     */
    private ResponseEntity<?> traiterWebhookMobile(
            String provider, String payload, String signature,
            java.util.function.Function<Map<String, Object>, Map<String, Object>> handler,
            jakarta.servlet.http.HttpServletRequest request) {
        
        // Extraire l'adresse IP source
        String ipAdresse = extraireIpSource(request);
        
        // Validation complète : signature + IP
        if (!webhookSecurityService.requeteValide(provider, payload, signature, ipAdresse)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Webhook non autorisé : signature invalide ou IP non autorisée"));
        }
        
        try {
            Map<String, Object> parsed = objectMapper.readValue(payload, new TypeReference<>() {});
            log.info("Webhook {} vérifié et reçu (IP: {}) : {}", provider, ipAdresse, parsed);
            return ResponseEntity.ok(handler.apply(parsed));
        } catch (Exception e) {
            log.error("Erreur webhook {} : {}", provider, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Extrait l'adresse IP source de la requête HTTP.
     *
     * <p>Les en-têtes X-Forwarded-For / X-Real-IP étaient lus sans condition : un
     * appelant atteignant directement le backend pouvait donc se présenter avec l'IP
     * d'un opérateur mobile money et satisfaire la whitelist. La résolution passe
     * maintenant par {@link ResolveurIpClient}, qui n'honore ces en-têtes que si la
     * connexion vient d'un proxy déclaré de confiance ({@code genuc.proxy.trusted}).</p>
     *
     * <p>La whitelist IP reste une défense en profondeur : la signature HMAC du corps
     * ({@code WebhookSecurityService}) demeure le contrôle déterminant.</p>
     */
    private String extraireIpSource(jakarta.servlet.http.HttpServletRequest request) {
        return resolveurIp.resoudre(request);
    }

    @PostMapping("/webhook/stripe")
    @Operation(summary = "Webhook Stripe")
    public ResponseEntity<?> webhookStripe(@RequestBody String payload,
                                           @RequestHeader(value = "Stripe-Signature", required = false) String signature) {
        try {
            log.info("Webhook Stripe reçu");
            Map<String, Object> result = webhookService.traiterWebhookStripe(payload, signature);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Erreur webhook Stripe : {}", e.getMessage());
            HttpStatus status = e.getMessage() != null && e.getMessage().contains("Signature")
                ? HttpStatus.UNAUTHORIZED
                : HttpStatus.BAD_REQUEST;
            return ResponseEntity.status(status)
                .body(Map.of("error", e.getMessage()));
        }
    }
}