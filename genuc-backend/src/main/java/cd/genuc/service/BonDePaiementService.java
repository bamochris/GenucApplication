package cd.genuc.service;

import cd.genuc.dto.BonDePaiementDTO;
import cd.genuc.model.BonDePaiement;
import cd.genuc.model.InformationBancaire;
import cd.genuc.model.Inscription;
import cd.genuc.repository.BonDePaiementRepository;
import cd.genuc.repository.InformationBancaireRepository;
import cd.genuc.repository.InscriptionRepository;
import cd.genuc.util.PdfGenerateur;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 🧾 Service de gestion des Bons de Paiement
 * Génération avec QR Code contenant les infos bancaires et Mobile Money
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BonDePaiementService {

    private final BonDePaiementRepository bonRepository;
    private final InscriptionRepository inscriptionRepository;
    private final InformationBancaireRepository informationBancaireRepository;
    private final CoordonneesBancairesService coordonneesBancairesService;
    private final PdfGenerateur pdfGenerateur;

    @org.springframework.beans.factory.annotation.Value("${app.base-url:http://localhost:3000}")
    private String appBaseUrl;

    private static final int TAILLE_QR = 300;

    // ════════════════════════════════════════════════════════════════
    //  CRUD
    // ════════════════════════════════════════════════════════════════

    @Transactional
    public BonDePaiementDTO genererBon(Long inscriptionId, Double montant, String observations) {
        Inscription inscription = inscriptionRepository.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable avec l'ID: " + inscriptionId));

        BonDePaiement bon = BonDePaiement.builder()
                .inscription(inscription)
                .montant(montant)
                .dateEmission(LocalDate.now())
                .dateExpiration(LocalDate.now().plusDays(7))
                .observations(observations)
                .build();

        // Générer le contenu textuel puis la vraie image QR (PNG) à partir de ce contenu
        String qrData = genererContenuQR(bon);
        bon.setContenuTexte(qrData);
        try {
            byte[] qrPng = pdfGenerateur.genererQrCode(qrData, TAILLE_QR);
            bon.setCodeQR(Base64.getEncoder().encodeToString(qrPng));
        } catch (Exception e) {
            log.error("Échec de la génération de l'image QR pour le bon de paiement", e);
        }

        bon = bonRepository.save(bon);
        log.info("🧾 Bon de paiement généré: {} pour inscription {}", bon.getNumero(), inscriptionId);

        return BonDePaiementDTO.fromEntity(bon);
    }

    public BonDePaiementDTO getBon(Long id) {
        BonDePaiement bon = bonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bon de paiement introuvable avec l'ID: " + id));
        return BonDePaiementDTO.fromEntity(bon);
    }

    public BonDePaiementDTO getBonByNumero(String numero) {
        BonDePaiement bon = bonRepository.findByNumero(numero)
                .orElseThrow(() -> new RuntimeException("Bon de paiement introuvable: " + numero));
        return BonDePaiementDTO.fromEntity(bon);
    }

    public List<BonDePaiementDTO> getBonsByInscription(Long inscriptionId) {
        return bonRepository.findByInscriptionId(inscriptionId).stream()
                .map(BonDePaiementDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<BonDePaiementDTO> getBonsActifsByInscription(Long inscriptionId) {
        return bonRepository.findByInscriptionIdAndUtiliseFalse(inscriptionId).stream()
                .map(BonDePaiementDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<BonDePaiementDTO> getAllBons() {
        return bonRepository.findAll().stream()
                .map(BonDePaiementDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public byte[] genererBonPdf(Long id) throws Exception {
        BonDePaiement bon = bonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bon de paiement introuvable avec l'ID: " + id));
        Inscription ins = bon.getInscription();

        java.util.Map<String, Object> data = new java.util.HashMap<>();
        data.put("universite", ins.getUniversite() != null ? ins.getUniversite().getNom() : "—");
        data.put("numero", bon.getNumero());
        data.put("etudiant", ins.getPrenom() + " " + ins.getNom());
        data.put("matricule", ins.getMatricule());
        data.put("departement", ins.getDepartement() != null ? ins.getDepartement().getNom() : "—");
        data.put("filiere", ins.getFiliere() != null ? ins.getFiliere().getNom() : "—");
        data.put("niveau", ins.getNiveau());
        data.put("anneeAcademique", ins.getAnneeAcademique() != null ? ins.getAnneeAcademique().getLibelle() : "—");
        data.put("montant", String.format("%.2f", bon.getMontant()));
        data.put("devise", "USD");
        data.put("dateEmission", bon.getDateEmission());
        data.put("dateExpiration", bon.getDateExpiration());
        data.put("qrCode", bon.getCodeQR() != null ? "data:image/png;base64," + bon.getCodeQR() : "—");
        // Champs du ticket de caisse : la promotion et la faculté parlent davantage au
        // caissier que le couple filière/niveau, qu'on garde en repli.
        data.put("promotion", ins.getPromotion() != null ? ins.getPromotion().getLibelle() : null);
        data.put("faculte", ins.getDepartement() != null && ins.getDepartement().getFaculte() != null
                ? ins.getDepartement().getFaculte().getNom() : null);
        data.put("typeFrais", bon.getObservations() != null && !bon.getObservations().isBlank()
                ? bon.getObservations() : "Frais académiques");
        // Banques partenaires : l'étudiant n'est pas tenu de passer par la caisse ni par
        // TachPay, il peut régler au guichet d'une banque configurée par l'établissement.
        data.put("banques", coordonneesBancairesService.pourAffichage(
                ins.getUniversite() != null ? ins.getUniversite().getId() : null));

        return pdfGenerateur.genererBonPaiement(data);
    }

    @Transactional
    public BonDePaiementDTO annulerBon(Long id, String motif) {
        BonDePaiement bon = bonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bon de paiement introuvable avec l'ID: " + id));

        if (bon.isUtilise()) {
            throw new RuntimeException("Impossible d'annuler un bon déjà utilisé");
        }

        bon.setDateExpiration(LocalDate.now().minusDays(1));
        bon.setObservations((bon.getObservations() != null ? bon.getObservations() + " | " : "") + "Annulé: " + motif);
        bon = bonRepository.save(bon);

        log.info("🧾 Bon de paiement annulé: {}", bon.getNumero());
        return BonDePaiementDTO.fromEntity(bon);
    }

    // ════════════════════════════════════════════════════════════════
    //  QR CODE — Contenu enrichi
    // ════════════════════════════════════════════════════════════════

    /**
     * Génère le contenu textuel du QR Code contenant :
     * - Les informations du bon
     * - Les coordonnées bancaires
     * - Les options Mobile Money (M-Pesa, Orange Money, Airtel Money)
     */
    private String genererContenuQR(BonDePaiement bon) {
        Inscription ins = bon.getInscription();
        StringBuilder sb = new StringBuilder();

        sb.append("BON DE PAIEMENT - GENUC\n");
        sb.append("================================\n");
        sb.append("N°: ").append(bon.getNumero()).append("\n");
        sb.append("Étudiant: ").append(ins.getPrenom()).append(" ").append(ins.getNom()).append("\n");
        sb.append("Matricule: ").append(ins.getMatricule()).append("\n");
        if (ins.getFiliere() != null) {
            sb.append("Filière: ").append(ins.getFiliere().getNom()).append("\n");
        }
        sb.append("Montant: ").append(String.format("%.2f", bon.getMontant())).append(" USD\n");
        sb.append("Émis le: ").append(bon.getDateEmission()).append("\n");
        sb.append("Expire le: ").append(bon.getDateExpiration()).append("\n");
        sb.append("\n");

        // ─── Coordonnées Bancaires (configurées par université) ────
        sb.append("--- COORDONNÉES BANCAIRES ---\n");
        Long universiteId = ins.getUniversite() != null ? ins.getUniversite().getId() : null;
        List<InformationBancaire> comptes = universiteId != null
                ? informationBancaireRepository.findByUniversiteIdAndActifTrue(universiteId)
                : List.of();
        if (comptes.isEmpty()) {
            sb.append("Coordonnées bancaires non configurées pour cette université.\n");
            sb.append("Veuillez contacter le service financier.\n");
        } else {
            for (InformationBancaire compte : comptes) {
                sb.append("Banque: ").append(compte.getNomBanque()).append("\n");
                sb.append("Titulaire: ").append(compte.getIntituleCompte()).append("\n");
                sb.append(compte.getDevise()).append(": ").append(compte.getNumeroCompte()).append("\n");
                if (compte.getSwiftCode() != null && !compte.getSwiftCode().isBlank()) {
                    sb.append("SWIFT/BIC: ").append(compte.getSwiftCode()).append("\n");
                }
                if (compte.getIban() != null && !compte.getIban().isBlank()) {
                    sb.append("IBAN: ").append(compte.getIban()).append("\n");
                }
            }
        }
        sb.append("\n");

        // ─── Mobile Money ──────────────────────────────────────────
        // Pas de numéro marchand générique ici : afficher un faux numéro sur un document
        // de paiement officiel serait risqué (fraude). Le paiement Mobile Money réel se fait
        // via le flux de paiement en ligne de la plateforme (M-Pesa/Orange/Airtel déjà intégrés).
        sb.append("--- MOBILE MONEY (M-Pesa, Orange Money, Airtel Money) ---\n");
        sb.append("Payer en ligne avec la référence : ").append(bon.getNumero()).append("\n");
        sb.append(appBaseUrl).append("/paiement-tachpay?ref=").append(bon.getNumero()).append("\n");
        sb.append("\n");

        sb.append("--- VÉRIFICATION DU BON ---\n");
        sb.append(appBaseUrl).append("/suivi-dossier?bon=").append(bon.getNumero()).append("\n");

        return sb.toString();
    }
}
