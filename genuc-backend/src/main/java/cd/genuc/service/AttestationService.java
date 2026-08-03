package cd.genuc.service;

import cd.genuc.exception.AttestationNotFoundException;
import cd.genuc.exception.BusinessException;
import cd.genuc.exception.InscriptionNotFoundException;
import cd.genuc.model.*;
import cd.genuc.repository.*;
import cd.genuc.util.PdfGenerateur;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttestationService {

    private final AttestationRepository attestationRepo;
    private final InscriptionRepository inscriptionRepo;
    private final UniversiteRepository universiteRepo;
    private final AffectationFraisRepository affectationFraisRepository;
    private final NoteRepository noteRepo;
    private final DeliberationRepository deliberationRepo;
    private final PdfGenerateur pdfGenerateur;
    private final EmailService emailService;
    private final MessagerieService messagerieService;
    private final SignatureElectroniqueService signatureElectroniqueService;

    @Value("${app.base-url:http://localhost:3000}")
    private String baseUrl;

    private TypeDocumentSignable typeSignableDe(Attestation attestation) {
        return attestation.getType() == Attestation.TypeAttestation.DIPLOME
                ? TypeDocumentSignable.DIPLOME
                : TypeDocumentSignable.ATTESTATION;
    }

    @Transactional
    public Attestation demanderAttestation(Long inscriptionId, Attestation.TypeAttestation type, String motif, Long demandeurId, String demandeurNom) {
        return demanderAttestation(inscriptionId, type, motif, demandeurId, demandeurNom, null, null);
        }

        @Transactional
        public Attestation demanderAttestation(Long inscriptionId,
                           Attestation.TypeAttestation type,
                           String motif,
                           Long demandeurId,
                           String demandeurNom,
                           String codeDocument,
                           String libelleDocument) {
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new InscriptionNotFoundException(inscriptionId));

        verifierFraisDocumentaire(inscriptionId, type);

        if (type == Attestation.TypeAttestation.DIPLOME) {
            // Sans année académique, aucune délibération n'est identifiable : le
            // refus métier est la bonne réponse, alors que déréférencer l'année
            // directement produisait un 500 sur les inscriptions incomplètes.
            Deliberation delib = inscription.getAnneeAcademique() == null ? null
                    : deliberationRepo.findByInscriptionIdAndAnneeAcademique(
                            inscriptionId, inscription.getAnneeAcademique().getLibelle())
                    .orElse(null);
            if (delib == null || delib.getDecision() != Deliberation.DecisionJury.DIPLOME || delib.getStatut() != Deliberation.StatutDeliberation.PUBLIEE) {
                throw new BusinessException("DIPLOME_NON_DISPONIBLE",
                        "Le diplôme n'est pas disponible : délibération non publiée ou décision différente de DIPLOME.");
            }
        }

        boolean existeEnAttente = attestationRepo.existsByInscriptionIdAndTypeAndStatut(
                inscriptionId, type, Attestation.StatutAttestation.EN_ATTENTE);
        if (existeEnAttente) {
            throw new BusinessException("ATTESTATION_DEJA_EN_ATTENTE",
                    "Une demande d'attestation de ce type est déjà en attente de validation.");
        }

        Attestation attestation = Attestation.builder()
                .type(type)
                .motif(motif)
            .codeDocument(codeDocument)
            .libelleDocument(libelleDocument)
                .inscription(inscription)
                .universite(inscription.getUniversite())
                .demandeParId(demandeurId)
                .demandeParNom(demandeurNom)
                .statut(Attestation.StatutAttestation.EN_ATTENTE)
                .build();

        return attestationRepo.save(attestation);
    }

    private void verifierFraisDocumentaire(Long inscriptionId, Attestation.TypeAttestation type) {
        if (type != Attestation.TypeAttestation.FREQUENTATION) {
            return;
        }

        boolean paye = affectationFraisRepository.existsByInscriptionIdAndFraisCodesAndStatut(
                inscriptionId,
                List.of("ATTESTATION_FREQUENTATION"),
                StatutAffectation.PAYE
        );

        if (!paye) {
            throw new BusinessException("FRAIS_ATTESTATION_NON_PAYE",
                    "Veuillez d'abord payer le frais 'Attestation de fréquentation' avant de demander ce document.");
        }
    }

    @Transactional
    public Attestation validerAttestation(Long attestationId, Long valideurId, String valideurNom) {
        return validerAttestation(attestationId, valideurId, valideurNom, null);
    }

    @Transactional
    public Attestation validerAttestation(Long attestationId, Long valideurId, String valideurNom, Long signataireIdOverride) {
        Attestation attestation = obtenir(attestationId);

        if (attestation.getStatut() != Attestation.StatutAttestation.EN_ATTENTE) {
            throw new BusinessException("ATTESTATION_PAS_EN_ATTENTE",
                    "Cette attestation n'est plus en attente.");
        }

        attestation.setStatut(Attestation.StatutAttestation.VALIDE);
        attestation.setValideParId(valideurId);
        attestation.setValideParNom(valideurNom);
        attestation.setDateValidation(LocalDate.now());
        attestation.setPubliee(true);

        attestation = attestationRepo.save(attestation);

        // Signature électronique : résout le signataire (choix manuel ou règle par université/type)
        // et signe si un signataire est disponible. Sinon, le document reste émis sans signature
        // (comportement précédent) — la fonctionnalité est donc optionnelle par université.
        SignataireUniversite signataire = signatureElectroniqueService.resoudreSignataire(
                attestation.getUniversite().getId(), typeSignableDe(attestation), signataireIdOverride);
        if (signataire != null) {
            String contenuCanonique = String.join("|",
                    attestation.getNumeroAttestation(),
                    attestation.getType().name(),
                    String.valueOf(attestation.getInscription().getId()),
                    String.valueOf(valideurId),
                    attestation.getDateValidation().toString());
            signatureElectroniqueService.signer(
                    typeSignableDe(attestation), attestation.getId(), signataire,
                    contenuCanonique, attestation.getUuidVerification(), valideurId, valideurNom);
        }

        return attestation;
    }

    @Transactional
    public Attestation rejeterAttestation(Long attestationId, String motifRejet) {
        Attestation attestation = obtenir(attestationId);

        if (attestation.getStatut() != Attestation.StatutAttestation.EN_ATTENTE) {
            throw new BusinessException("ATTESTATION_PAS_EN_ATTENTE",
                    "Cette attestation n'est plus en attente.");
        }

        attestation.setStatut(Attestation.StatutAttestation.REJETE);
        attestation.setMotif(motifRejet);

        return attestationRepo.save(attestation);
    }

    @Transactional
    public Attestation save(Attestation attestation) {
        return attestationRepo.save(attestation);
    }

    @Transactional
    public byte[] genererAttestationPdf(Long attestationId) throws Exception {
        Attestation attestation = obtenir(attestationId);

        if (attestation.getStatut() != Attestation.StatutAttestation.VALIDE &&
            attestation.getStatut() != Attestation.StatutAttestation.EMISE) {
            throw new BusinessException("ATTESTATION_NON_VALIDEE",
                    "L'attestation doit être validée avant de pouvoir être générée.");
        }

        Inscription inscription = attestation.getInscription();
        Etudiant etudiant = inscription.getEtudiant();
        Universite universite = inscription.getUniversite();

        String contenu = genererContenuAttestation(attestation, inscription, etudiant, universite);
        byte[] pdfBytes = genererPdfAttestation(attestation, inscription, etudiant, universite, contenu);

        attestation.setContenu(contenu);
        attestation.setStatut(Attestation.StatutAttestation.EMISE);
        attestation.setDateEmission(LocalDate.now());
        attestationRepo.save(attestation);

        return pdfBytes;
    }

    @Transactional
    public void envoyerAttestationParEmail(Long attestationId, String email) throws Exception {
        Attestation attestation = obtenir(attestationId);

        if (attestation.getStatut() != Attestation.StatutAttestation.EMISE &&
            attestation.getStatut() != Attestation.StatutAttestation.VALIDE) {
            throw new BusinessException("ATTESTATION_NON_VALIDEE_OU_EMISE",
                    "L'attestation doit être validée ou émise avant d'être envoyée par email.");
        }

        byte[] pdfBytes = genererAttestationPdf(attestationId);

        String sujet = "Attestation officielle GENUC - " + attestation.getType().name();
        String libelleDocument = attestation.getLibelleDocument() != null && !attestation.getLibelleDocument().isBlank()
            ? attestation.getLibelleDocument()
            : attestation.getType().name();
        String message = String.format(
                "Bonjour,\n\nVeuillez trouver ci-joint votre attestation de type %s, émise par %s.\n\n" +
                "Numéro : %s\n" +
                "Date d'émission : %s\n\n" +
                "Cordialement,\nL'équipe GENUC",
            libelleDocument,
                attestation.getUniversite().getNom(),
                attestation.getNumeroAttestation(),
                LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
        );

        emailService.envoyerAvecPieceJointe(email, sujet, message, pdfBytes, "attestation_" + attestation.getId() + ".pdf", attestation.getUniversite());

        String urlPdf = baseUrl + "/api/attestations/" + attestation.getId() + "/pdf";
        String messagePortail = String.format(
            "Votre attestation %s est prête.\n\n" +
            "Référence : %s\n" +
            "Université : %s\n" +
            "Date d'émission : %s\n\n" +
            "Le PDF vous a été envoyé par email.\n" +
            "Lien de téléchargement : %s",
            libelleDocument,
            attestation.getNumeroAttestation(),
            attestation.getUniversite().getNom(),
            LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
            urlPdf
        );
        messagerieService.notifierEtudiantDocument(
            attestation.getInscription(),
            sujet,
            messagePortail,
            attestation.getUniversite().getNom(),
            "ADMIN_UNIVERSITE"
        );

        log.info("Attestation {} envoyée par email à {}", attestation.getNumeroAttestation(), email);
    }

    public Map<String, Object> verifierAttestation(String uuid) {
        Attestation attestation = attestationRepo.findByUuidVerification(uuid)
                .orElseThrow(() -> new AttestationNotFoundException(uuid));

        Inscription inscription = attestation.getInscription();

        Map<String, Object> result = new java.util.HashMap<>(Map.of(
                "valide", true,
                "numero", attestation.getNumeroAttestation(),
                "type", attestation.getType().name(),
                "etudiant", inscription.getPrenom() + " " + inscription.getNom(),
                "universite", inscription.getUniversite().getNom(),
                "dateEmission", attestation.getDateEmission() != null ? attestation.getDateEmission().toString() : "Non émise",
                "urlVerification", baseUrl + "/verifier-attestation/" + uuid
        ));

        signatureElectroniqueService.obtenirPourDocument(typeSignableDe(attestation), attestation.getId())
                .ifPresent(sig -> {
                    result.put("signeElectroniquement", !sig.isRevoquee());
                    result.put("signataire", sig.getSignataireNom());
                    result.put("signataireFonction", sig.getSignataireFonction());
                    result.put("dateSignature", sig.getDateSignature() != null ? sig.getDateSignature().toString() : null);
                    if (sig.isRevoquee()) {
                        result.put("signatureRevoquee", true);
                        result.put("motifRevocation", sig.getMotifRevocation());
                    }
                });

        return result;
    }

    public List<Attestation> getAttestationsByInscription(Long inscriptionId) {
        return attestationRepo.findByInscriptionIdOrderByDateDemandeDesc(inscriptionId);
    }

    public List<Attestation> getAttestationsEnAttente(Long universiteId) {
        return attestationRepo.findByUniversiteIdAndStatut(universiteId, Attestation.StatutAttestation.EN_ATTENTE);
    }

    public Attestation obtenir(Long id) {
        return attestationRepo.findById(id)
                .orElseThrow(() -> new AttestationNotFoundException(id));
    }

    // Méthodes privées implémentées
    private String genererContenuAttestation(Attestation attestation, Inscription inscription,
                                             Etudiant etudiant, Universite universite) {
        String type = attestation.getLibelleDocument() != null && !attestation.getLibelleDocument().isBlank()
            ? attestation.getLibelleDocument()
            : attestation.getType().name().replace("_", " ");
        return String.format("""
            ATTESTATION DE %s

            Je soussigné(e), %s, Recteur de l'Université %s,
            certifie que M./Mme %s %s,
            né(e) le %s à %s,
            matricule : %s,
            est régulièrement inscrit(e) en %s à la faculté de %s,
            pour l'année académique %s.

            La présente attestation est délivrée pour servir et valoir ce que de droit.

            Fait à %s, le %s
            """,
            type.toUpperCase(),
            universite.getRecteurNom(),
            universite.getNom(),
            etudiant.getPrenom(), etudiant.getNom(),
            etudiant.getDateNaissance() != null ? etudiant.getDateNaissance().toString() : "—",
            etudiant.getLieuNaissance() != null ? etudiant.getLieuNaissance() : "—",
            inscription.getMatricule(),
            inscription.getNiveau() != null ? inscription.getNiveau() : "—",
            inscription.getDepartement().getNom(),
            inscription.getAnneeAcademique().getLibelle(),
            universite.getVille(),
            LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
        );
    }

    private byte[] genererPdfAttestation(Attestation attestation, Inscription inscription,
                                         Etudiant etudiant, Universite universite,
                                         String contenu) throws Exception {
        Map<String, Object> data = new java.util.HashMap<>(Map.of(
            "titre", "Attestation " + attestation.getType().name(),
            "contenu", contenu,
            "universite", universite.getNom(),
            "date", LocalDate.now().toString(),
            "numero", attestation.getNumeroAttestation()
        ));

        signatureElectroniqueService.obtenirPourDocument(typeSignableDe(attestation), attestation.getId())
                .ifPresent(sig -> {
                    if (sig.isRevoquee()) return;
                    data.put("signataireNom", sig.getSignataireNom());
                    data.put("signataireFonction", sig.getSignataireFonction());
                    data.put("dateSignature", sig.getDateSignature() != null
                            ? sig.getDateSignature().toLocalDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "—");
                    data.put("urlVerification", baseUrl + "/verifier-attestation/" + attestation.getUuidVerification());
                    signatureElectroniqueService.obtenirSignataireEntitePourDocument(typeSignableDe(attestation), attestation.getId())
                            .ifPresent(s -> data.put("signatureImage", s.getSignatureImage()));
                });

        return pdfGenerateur.genererAttestation(data);
    }
}