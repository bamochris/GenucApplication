package cd.genuc.service;

import cd.genuc.model.Attestation;
import cd.genuc.model.DocumentOfficielConfig;
import cd.genuc.model.Inscription;
import cd.genuc.model.StatutAffectation;
import cd.genuc.model.Universite;
import cd.genuc.repository.AffectationFraisRepository;
import cd.genuc.repository.AttestationRepository;
import cd.genuc.repository.DocumentOfficielConfigRepository;
import cd.genuc.repository.InscriptionRepository;
import cd.genuc.repository.UniversiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DocumentsOfficielsService {

    private final DocumentOfficielConfigRepository configRepository;
    private final UniversiteRepository universiteRepository;
    private final InscriptionRepository inscriptionRepository;
    private final AttestationRepository attestationRepository;
    private final AffectationFraisRepository affectationFraisRepository;
    private final AttestationService attestationService;
    private final RelevePdfService relevePdfService;

    public List<DocumentOfficielConfig> getConfigurationsAdmin(Long universiteId) {
        return configRepository.findByUniversiteIdOrderByOrdreAffichageAscLibelleAsc(universiteId);
    }

    @Transactional
    public DocumentOfficielConfig saveConfiguration(Long universiteId, Long configId, Map<String, Object> body) {
        DocumentOfficielConfig config = configId == null
                ? new DocumentOfficielConfig()
                : configRepository.findById(configId)
                .filter(existing -> existing.getUniversite() != null && existing.getUniversite().getId().equals(universiteId))
                .orElseThrow(() -> new RuntimeException("Configuration introuvable"));

        Universite universite = universiteRepository.findById(universiteId)
                .orElseThrow(() -> new RuntimeException("Université introuvable"));

        String code = value(body.get("code"));
        String libelle = value(body.get("libelle"));
        String typeSourceValue = value(body.get("typeSource"));
        if (code.isBlank() || libelle.isBlank() || typeSourceValue.isBlank()) {
            throw new RuntimeException("code, libelle et typeSource sont requis");
        }

        DocumentOfficielConfig.TypeSource typeSource;
        try {
            typeSource = DocumentOfficielConfig.TypeSource.valueOf(typeSourceValue.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new RuntimeException("typeSource invalide");
        }

        Attestation.TypeAttestation attestationType = null;
        String attestationTypeValue = value(body.get("attestationType"));
        if (!attestationTypeValue.isBlank()) {
            try {
                attestationType = Attestation.TypeAttestation.valueOf(attestationTypeValue.toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException ex) {
                throw new RuntimeException("attestationType invalide");
            }
        }
        if (typeSource == DocumentOfficielConfig.TypeSource.ATTESTATION && attestationType == null) {
            throw new RuntimeException("attestationType est requis pour un document de type attestation");
        }

        configRepository.findByUniversiteIdAndCodeIgnoreCase(universiteId, code)
                .filter(existing -> configId == null || !existing.getId().equals(configId))
                .ifPresent(existing -> {
                    throw new RuntimeException("Un document utilise déjà ce code pour cette université");
                });

        config.setUniversite(universite);
        config.setCode(code.trim().toUpperCase(Locale.ROOT));
        config.setLibelle(libelle.trim());
        config.setDescription(value(body.get("description")));
        config.setTypeSource(typeSource);
        config.setAttestationType(attestationType);
        config.setFraisCodeRequis(value(body.get("fraisCodeRequis")).trim().toUpperCase(Locale.ROOT));
        config.setModeleContenu(value(body.get("modeleContenu")));
        config.setActif(booleanValue(body.get("actif"), true));
        config.setOrdreAffichage(intValue(body.get("ordreAffichage"), 0));

        return configRepository.save(config);
    }

    @Transactional
    public DocumentOfficielConfig changerStatut(Long universiteId, Long configId, boolean actif) {
        DocumentOfficielConfig config = configRepository.findById(configId)
                .filter(existing -> existing.getUniversite() != null && existing.getUniversite().getId().equals(universiteId))
                .orElseThrow(() -> new RuntimeException("Configuration introuvable"));
        config.setActif(actif);
        return configRepository.save(config);
    }

    public List<Map<String, Object>> listerDocumentsPourEtudiant(Long inscriptionId) {
        Inscription inscription = inscriptionRepository.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

        List<DocumentOfficielConfig> configs = configRepository
                .findByUniversiteIdAndActifTrueOrderByOrdreAffichageAscLibelleAsc(inscription.getUniversite().getId());

        return configs.stream()
                .map(config -> mapperDocument(config, inscription))
                .toList();
    }

    @Transactional
    public Attestation demanderDocument(Long inscriptionId, String codeDocument, Long demandeurId, String demandeurNom) {
        Inscription inscription = inscriptionRepository.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));
        DocumentOfficielConfig config = trouverConfigurationActive(inscription.getUniversite().getId(), codeDocument);

        if (config.getTypeSource() != DocumentOfficielConfig.TypeSource.ATTESTATION) {
            throw new RuntimeException("Ce document n'est pas une demande à soumettre. Il devient disponible après paiement.");
        }
        if (!estPaiementSatisfait(inscriptionId, config)) {
            throw new RuntimeException("Veuillez d'abord payer le frais requis avant de demander ce document.");
        }

        Optional<Attestation> existante = attestationRepository
                .findFirstByInscriptionIdAndCodeDocumentOrderByDateDemandeDesc(inscriptionId, config.getCode());
        if (existante.isPresent() && existante.get().getStatut() == Attestation.StatutAttestation.EN_ATTENTE) {
            throw new RuntimeException("Une demande est déjà en cours pour ce document.");
        }

        Attestation attestation = attestationService.demanderAttestation(
                inscriptionId,
                config.getAttestationType(),
                config.getLibelle(),
                demandeurId,
                demandeurNom,
                config.getCode(),
                config.getLibelle()
        );

        if (config.getModeleContenu() != null && !config.getModeleContenu().isBlank()) {
            attestation.setContenu(config.getModeleContenu());
            attestation = attestationService.save(attestation);
        }

        return attestation;
    }

    public DocumentGenere genererDocument(Long inscriptionId, String codeDocument) throws Exception {
        Inscription inscription = inscriptionRepository.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));
        DocumentOfficielConfig config = trouverConfigurationActive(inscription.getUniversite().getId(), codeDocument);

        if (config.getTypeSource() == DocumentOfficielConfig.TypeSource.RELEVE) {
            if (!estPaiementSatisfait(inscriptionId, config)) {
                throw new RuntimeException("Le paiement est requis avant téléchargement.");
            }
            byte[] pdf = relevePdfService.genererRelevePdf(inscriptionId, getCurrentAcademicYear());
            return new DocumentGenere(pdf, nomFichier(config.getLibelle(), inscriptionId));
        }

        Attestation attestation = attestationRepository
                .findFirstByInscriptionIdAndCodeDocumentOrderByDateDemandeDesc(inscriptionId, config.getCode())
                .orElseThrow(() -> new RuntimeException("Aucun document prêt pour ce type."));

        if (attestation.getStatut() != Attestation.StatutAttestation.VALIDE
                && attestation.getStatut() != Attestation.StatutAttestation.EMISE) {
            throw new RuntimeException("Le document n'est pas encore validé par l'administration.");
        }

        byte[] pdf = attestationService.genererAttestationPdf(attestation.getId());
        return new DocumentGenere(pdf, nomFichier(config.getLibelle(), inscriptionId));
    }

    private Map<String, Object> mapperDocument(DocumentOfficielConfig config, Inscription inscription) {
        Long inscriptionId = inscription.getId();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("type", config.getCode());
        result.put("label", config.getLibelle());
        result.put("description", config.getDescription());
        result.put("typeSource", config.getTypeSource().name());
        result.put("fraisCodeRequis", config.getFraisCodeRequis());

        if (config.getTypeSource() == DocumentOfficielConfig.TypeSource.RELEVE) {
            boolean paye = estPaiementSatisfait(inscriptionId, config);
            result.put("statut", paye ? "DISPONIBLE" : "PAIEMENT_REQUIS");
            result.put("canDownload", paye);
            result.put("canRequest", false);
            result.put("motif", paye ? null : "Paiement du frais documentaire requis avant téléchargement.");
            return result;
        }

        Optional<Attestation> optAttestation = attestationRepository
                .findFirstByInscriptionIdAndCodeDocumentOrderByDateDemandeDesc(inscriptionId, config.getCode());
        boolean paiementOk = estPaiementSatisfait(inscriptionId, config);

        if (optAttestation.isPresent()) {
            Attestation attestation = optAttestation.get();
            result.put("documentId", attestation.getId());
            result.put("dateGeneration", attestation.getDateEmission());
            result.put("libelleDocument", attestation.getLibelleDocument());
            switch (attestation.getStatut()) {
                case EMISE, VALIDE -> {
                    result.put("statut", "DISPONIBLE");
                    result.put("canDownload", true);
                    result.put("canRequest", false);
                    result.put("motif", null);
                }
                case EN_ATTENTE -> {
                    result.put("statut", "DEMANDE_EN_COURS");
                    result.put("canDownload", false);
                    result.put("canRequest", false);
                    result.put("motif", "Votre demande est en cours de traitement par l'administration.");
                }
                case REJETE -> {
                    result.put("statut", paiementOk ? "A_DEMANDER" : "PAIEMENT_REQUIS");
                    result.put("canDownload", false);
                    result.put("canRequest", paiementOk);
                    result.put("motif", attestation.getMotif() != null && !attestation.getMotif().isBlank()
                            ? attestation.getMotif()
                            : (paiementOk ? "Vous pouvez soumettre une nouvelle demande." : "Paiement requis avant une nouvelle demande."));
                }
            }
            return result;
        }

        result.put("statut", paiementOk ? "A_DEMANDER" : "PAIEMENT_REQUIS");
        result.put("canDownload", false);
        result.put("canRequest", paiementOk);
        result.put("motif", paiementOk ? null : "Paiement du frais documentaire requis avant la demande.");
        return result;
    }

    private DocumentOfficielConfig trouverConfigurationActive(Long universiteId, String codeDocument) {
        DocumentOfficielConfig config = configRepository.findByUniversiteIdAndCodeIgnoreCase(universiteId, codeDocument)
                .orElseThrow(() -> new RuntimeException("Document officiel introuvable"));
        if (!config.isActif()) {
            throw new RuntimeException("Ce document n'est pas actif actuellement");
        }
        return config;
    }

    private boolean estPaiementSatisfait(Long inscriptionId, DocumentOfficielConfig config) {
        String fraisCode = config.getFraisCodeRequis();
        if (fraisCode == null || fraisCode.isBlank()) {
            return config.getTypeSource() == DocumentOfficielConfig.TypeSource.RELEVE
                    ? relevePdfService.aPayeReleve(inscriptionId, getCurrentAcademicYear())
                    : true;
        }
        return affectationFraisRepository.existsByInscriptionIdAndFraisCodesAndStatut(
                inscriptionId,
                List.of(fraisCode),
                StatutAffectation.PAYE
        );
    }

    private String getCurrentAcademicYear() {
        int year = LocalDate.now().getYear();
        return year + "-" + (year + 1);
    }

    private String nomFichier(String libelle, Long inscriptionId) {
        String base = Normalizer.normalize(libelle == null ? "document" : libelle, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^a-zA-Z0-9]+", "_")
                .replaceAll("_+", "_")
                .replaceAll("^_|_$", "")
                .toLowerCase(Locale.ROOT);
        if (base.isBlank()) {
            base = "document";
        }
        return base + "_" + inscriptionId + ".pdf";
    }

    private String value(Object raw) {
        return raw == null ? "" : raw.toString();
    }

    private boolean booleanValue(Object raw, boolean defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        if (raw instanceof Boolean bool) {
            return bool;
        }
        return Boolean.parseBoolean(raw.toString());
    }

    private int intValue(Object raw, int defaultValue) {
        if (raw == null || raw.toString().isBlank()) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(raw.toString());
        } catch (NumberFormatException ex) {
            return defaultValue;
        }
    }

    public record DocumentGenere(byte[] contenu, String nomFichier) {}
}