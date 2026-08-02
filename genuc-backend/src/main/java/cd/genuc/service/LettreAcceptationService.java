package cd.genuc.service;

import cd.genuc.dto.LettreAcceptationDTO;
import cd.genuc.model.*;
import cd.genuc.repository.*;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.kernel.pdf.xobject.PdfFormXObject;
import com.itextpdf.barcodes.BarcodeQRCode;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.Cell;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 📄 Service de gestion des Lettres d'Acceptation
 * Génération PDF avec en-tête officiel MINESU (RDC)
 * République Démocratique du Congo — Ministère de l'Enseignement Supérieur et Universitaire
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LettreAcceptationService {

    private final LettreAcceptationRepository lettreRepo;
    private final InscriptionVacationRepository inscriptionVacationRepo;
    private final EmailService emailService;
        private final MessagerieService messagerieService;
    private final SignatureElectroniqueService signatureElectroniqueService;

    @Value("${app.base-url:http://localhost:3000}")
    private String baseUrl;

    // ─── COULEURS OFFICIELLES RDC ──────────────────────────────────────
    private static final DeviceRgb COULEUR_BLEU_RDC = new DeviceRgb(0, 47, 108);    // Bleu officiel
    private static final DeviceRgb COULEUR_OR_RDC = new DeviceRgb(212, 175, 55);    // Or
    private static final DeviceRgb COULEUR_ROUGE_RDC = new DeviceRgb(206, 17, 38);  // Rouge
    private static final DeviceRgb COULEUR_VERT_RDC = new DeviceRgb(0, 154, 68);    // Vert
        private static final DeviceRgb COULEUR_BLEU_CLAIR = new DeviceRgb(238, 244, 255);
        private static final DeviceRgb COULEUR_FOND_QR = new DeviceRgb(247, 249, 252);

    // ─── CONSTANTES TEXTE OFFICIEL ────────────────────────────────────
    private static final String TITRE_REPUBLIQUE = "RÉPUBLIQUE DÉMOCRATIQUE DU CONGO";
    private static final String SOUS_TITRE_MINISTERE = "MINISTÈRE DE L'ENSEIGNEMENT SUPÉRIEUR ET UNIVERSITAIRE";
    private static final String DEVISE_NATIONALE = "Justice — Paix — Travail";

    // ════════════════════════════════════════════════════════════════════
    //  GESTION DES LETTRES
    // ════════════════════════════════════════════════════════════════════

    /**
     * Génère une lettre d'acceptation pour un étudiant inscrit à une vacation
     */
    @Transactional
    public LettreAcceptationDTO genererLettre(Long inscriptionVacationId) throws Exception {
        InscriptionVacation iv = inscriptionVacationRepo.findById(inscriptionVacationId)
                .orElseThrow(() -> new RuntimeException("Inscription vacation introuvable"));

        // Vérifier si l'inscription est validée
        if (iv.getStatut() != StatutInscription.VALIDE) {
            throw new RuntimeException("L'inscription à la vacation doit être validée avant de générer une lettre.");
        }

        // Vérifier si une lettre existe déjà
        if (lettreRepo.existsByInscriptionVacationId(inscriptionVacationId)) {
            throw new RuntimeException("Une lettre d'acceptation existe déjà pour cette inscription vacation.");
        }

        Etudiant etudiant = iv.getEtudiant();
        Vacation vacation = iv.getVacation();
        Universite universite = vacation.getUniversite();

        // Génération du contenu texte
        String contenu = genererContenuLettre(etudiant, vacation, universite, iv);

        // Création de l'entité
        LettreAcceptation lettre = LettreAcceptation.builder()
                .numeroLettre(genererNumeroUnique(universite, vacation))
                .contenu(contenu)
                .emise(false)
                .uuidVerification(UUID.randomUUID().toString())
                .inscriptionVacation(iv)
                .etudiant(etudiant)
                .universite(universite)
                .vacation(vacation)
                .build();

        lettre = lettreRepo.save(lettre);
        log.info("📄 Lettre d'acceptation créée : {} pour étudiant {}", lettre.getNumeroLettre(), etudiant.getMatriculePermanent());

        return LettreAcceptationDTO.fromEntity(lettre);
    }

    /**
     * Génère et émet le PDF de la lettre d'acceptation
     */
    @Transactional
    public byte[] emettreLettrePdf(Long lettreId) throws Exception {
        return emettreLettrePdf(lettreId, null);
    }

    @Transactional
    public byte[] emettreLettrePdf(Long lettreId, Long signataireIdOverride) throws Exception {
        LettreAcceptation lettre = obtenir(lettreId);
        boolean premiereEmission = !lettre.isEmise();

        // Signature électronique : uniquement à la première émission (une lettre déjà émise
        // garde sa signature d'origine, même si son PDF est retéléchargé ensuite).
        if (premiereEmission) {
            SignataireUniversite signataire = signatureElectroniqueService.resoudreSignataire(
                    lettre.getUniversite().getId(), TypeDocumentSignable.LETTRE_ACCEPTATION, signataireIdOverride);
            if (signataire != null) {
                String contenuCanonique = String.join("|",
                        lettre.getNumeroLettre(),
                        String.valueOf(lettre.getEtudiant().getId()),
                        String.valueOf(lettre.getUniversite().getId()),
                        String.valueOf(lettre.getVacation().getId()));
                signatureElectroniqueService.signer(
                        TypeDocumentSignable.LETTRE_ACCEPTATION, lettre.getId(), signataire,
                        contenuCanonique, lettre.getUuidVerification(), null, null);
            }

            lettre.setEmise(true);
            lettre.setDateEmission(LocalDate.now());
            lettreRepo.save(lettre);
        }

        // Génération du PDF (après signature, pour pouvoir l'embarquer dedans)
        byte[] pdfBytes = genererPdfLettreAcceptation(lettre);

        if (premiereEmission) {
            envoyerPdfLettreApresEmission(lettre, pdfBytes);
        }

        log.info("📄 Lettre émise : {}", lettre.getNumeroLettre());
        return pdfBytes;
    }

    /**
     * Envoie la lettre d'acceptation par email à l'étudiant
     */
    @Transactional
    public void envoyerLettreParEmail(Long lettreId) throws Exception {
        LettreAcceptation lettre = obtenir(lettreId);

        byte[] pdfBytes;
        if (!lettre.isEmise()) {
            pdfBytes = emettreLettrePdf(lettreId);
        } else {
            pdfBytes = genererPdfLettreAcceptation(lettre);
        }

        String email = lettre.getEtudiant().getEmail();
        if (email == null || email.isBlank()) {
            throw new RuntimeException("L'étudiant n'a pas d'adresse email renseignée.");
        }

        String sujet = "Lettre d'Acceptation - " + lettre.getVacation().getNom() +
                " (" + getSigleUniversite(lettre.getUniversite()) + ")";
        String message = String.format(
                "Bonjour %s %s,\n\n" +
                "Veuillez trouver ci-joint votre lettre d'acceptation pour la vacation %s.\n\n" +
                "Numéro : %s\n" +
                "Date d'émission : %s\n\n" +
                "Cordialement,\n%s",
                lettre.getEtudiant().getPrenom(), lettre.getEtudiant().getNom(),
                lettre.getVacation().getNom(),
                lettre.getNumeroLettre(),
                LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                lettre.getUniversite().getNom()
        );

        emailService.envoyerAvecPieceJointe(
                email, sujet, message, pdfBytes,
                "lettre_acceptation_" + lettre.getId() + ".pdf"
        );

        log.info("Lettre {} envoyée par email à {}", lettre.getNumeroLettre(), email);
    }

    /**
     * Vérifie une lettre d'acceptation via son UUID
     */
    public LettreAcceptationDTO verifierLettre(String uuid) {
        LettreAcceptation lettre = lettreRepo.findByUuidVerification(uuid)
                .orElseThrow(() -> new RuntimeException("Lettre d'acceptation introuvable ou invalide."));
        LettreAcceptationDTO dto = LettreAcceptationDTO.fromEntity(lettre);

        signatureElectroniqueService.obtenirPourDocument(TypeDocumentSignable.LETTRE_ACCEPTATION, lettre.getId())
                .ifPresent(sig -> {
                    dto.setSigneElectroniquement(true);
                    dto.setSignataire(sig.getSignataireNom());
                    dto.setSignataireFonction(sig.getSignataireFonction());
                    dto.setDateSignature(sig.getDateSignature());
                    dto.setSignatureRevoquee(sig.isRevoquee());
                    dto.setMotifRevocation(sig.getMotifRevocation());
                });

        return dto;
    }

    // ─── LECTURE ───────────────────────────────────────────────────────

    public List<LettreAcceptationDTO> getLettresByEtudiant(Long etudiantId) {
        return lettreRepo.findByEtudiantIdOrderByDateEmissionDesc(etudiantId)
                .stream().map(LettreAcceptationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<LettreAcceptationDTO> getLettresByUniversite(Long universiteId) {
        return lettreRepo.findByUniversiteIdOrderByDateEmissionDesc(universiteId)
                .stream().map(LettreAcceptationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<LettreAcceptationDTO> getLettresByVacation(Long vacationId) {
        return lettreRepo.findByVacationIdOrderByDateEmissionDesc(vacationId)
                .stream().map(LettreAcceptationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public LettreAcceptationDTO getLettreByInscriptionVacation(Long inscriptionVacationId) {
        List<LettreAcceptation> lettres = lettreRepo.findByInscriptionVacationId(inscriptionVacationId);
        if (lettres.isEmpty()) {
            throw new RuntimeException("Aucune lettre d'acceptation trouvée pour cette inscription.");
        }
        return LettreAcceptationDTO.fromEntity(lettres.get(0));
    }

    public LettreAcceptationDTO getLettre(Long id) {
        return LettreAcceptationDTO.fromEntity(obtenir(id));
    }

    public LettreAcceptation obtenir(Long id) {
        return lettreRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Lettre d'acceptation introuvable"));
    }

    // ════════════════════════════════════════════════════════════════════
    //  GÉNÉRATION PDF — Lettre d'Acceptation officielle
    // ════════════════════════════════════════════════════════════════════

    private byte[] genererPdfLettreAcceptation(LettreAcceptation lettre) throws Exception {
        Etudiant etudiant = lettre.getEtudiant();
        Vacation vacation = lettre.getVacation();
        Universite universite = lettre.getUniversite();
        InscriptionVacation iv = lettre.getInscriptionVacation();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdfDoc = new PdfDocument(writer);
        Document document = new Document(pdfDoc, PageSize.A4);
        document.setMargins(50, 50, 50, 50);

        // Polices
        PdfFont bold = PdfFontFactory.createFont(
                com.itextpdf.io.font.constants.StandardFonts.HELVETICA_BOLD);
        PdfFont normal = PdfFontFactory.createFont(
                com.itextpdf.io.font.constants.StandardFonts.HELVETICA);
        PdfFont italic = PdfFontFactory.createFont(
                com.itextpdf.io.font.constants.StandardFonts.HELVETICA_OBLIQUE);

        // ════════════════════════════════════════════════════════════════
        //  EN-TÊTE OFFICIEL — MINESU RDC
        // ════════════════════════════════════════════════════════════════

        // ── Ligne supérieure décorative (Bleu RDC) ──
        Table headerLine = new Table(1)
                .setWidth(UnitValue.createPercentValue(100));
        Cell lineCell = new Cell()
                .setHeight(4)
                .setBackgroundColor(COULEUR_BLEU_RDC)
                .setBorder(Border.NO_BORDER);
        headerLine.addCell(lineCell);
        document.add(headerLine);

        document.add(new Paragraph("\n"));

        // ── République Démocratique du Congo ──
        Paragraph republique = new Paragraph(TITRE_REPUBLIQUE)
                .setFont(bold)
                .setFontSize(14)
                .setFontColor(COULEUR_BLEU_RDC)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedLeading(18);
        document.add(republique);

        // ── Devise nationale ──
        Paragraph devise = new Paragraph(DEVISE_NATIONALE)
                .setFont(italic)
                .setFontSize(9)
                .setFontColor(COULEUR_OR_RDC)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedLeading(14);
        document.add(devise);

        // ── Ligne décorative Or ──
        Table goldLine = new Table(1)
                .setWidth(UnitValue.createPercentValue(60))
                .setHorizontalAlignment(com.itextpdf.layout.properties.HorizontalAlignment.CENTER);
        Cell goldCell = new Cell()
                .setHeight(2)
                .setBackgroundColor(COULEUR_OR_RDC)
                .setBorder(Border.NO_BORDER);
        goldLine.addCell(goldCell);
        document.add(goldLine);

        // ── Ministère ──
        Paragraph ministere = new Paragraph(SOUS_TITRE_MINISTERE)
                .setFont(bold)
                .setFontSize(11)
                .setFontColor(COULEUR_BLEU_RDC)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedLeading(16);
        document.add(ministere);

        document.add(new Paragraph("\n"));

        // ── Informations Université ──
        Paragraph universiteHeader = new Paragraph(universite.getNom().toUpperCase())
                .setFont(bold)
                .setFontSize(13)
                .setFontColor(COULEUR_ROUGE_RDC)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedLeading(18);
        document.add(universiteHeader);

        String sigle = getSigleUniversite(universite);
        if (sigle != null) {
            Paragraph siglePara = new Paragraph("(" + sigle + ")")
                    .setFont(bold)
                    .setFontSize(11)
                    .setFontColor(COULEUR_BLEU_RDC)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFixedLeading(14);
            document.add(siglePara);
        }

        // ── Ligne séparatrice ──
        Table sepLine = new Table(1)
                .setWidth(UnitValue.createPercentValue(100));
        Cell sepCell = new Cell()
                .setHeight(2)
                .setBackgroundColor(COULEUR_BLEU_RDC)
                .setBorder(Border.NO_BORDER);
        sepLine.addCell(sepCell);
        document.add(sepLine);

        document.add(new Paragraph("\n"));

        // ════════════════════════════════════════════════════════════════
        //  TITRE DE LA LETTRE
        // ════════════════════════════════════════════════════════════════

        Table titreTable = new Table(1)
                .setWidth(UnitValue.createPercentValue(100));
        Cell titreCell = new Cell()
                .add(new Paragraph("LETTRE D'ACCEPTATION")
                        .setFont(bold)
                        .setFontSize(16)
                        .setFontColor(COULEUR_BLEU_RDC)
                        .setTextAlignment(TextAlignment.CENTER))
                .setBackgroundColor(COULEUR_BLEU_CLAIR)
                .setBorder(new com.itextpdf.layout.borders.SolidBorder(COULEUR_BLEU_RDC, 1))
                .setPaddingTop(10)
                .setPaddingBottom(10);
        titreTable.addCell(titreCell);
        document.add(titreTable);

        document.add(new Paragraph("\n"));

        // N° de référence
        Table metaTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .setWidth(UnitValue.createPercentValue(100));
        metaTable.addCell(new Cell()
                .add(new Paragraph("N° Réf. : " + lettre.getNumeroLettre()).setFont(bold).setFontSize(10).setFontColor(COULEUR_BLEU_RDC))
                .setBackgroundColor(COULEUR_BLEU_CLAIR)
                .setBorder(Border.NO_BORDER)
                .setPadding(8));
        metaTable.addCell(new Cell()
                .add(new Paragraph("Statut : Document officiel émis").setFont(normal).setFontSize(10).setTextAlignment(TextAlignment.RIGHT))
                .setBackgroundColor(COULEUR_BLEU_CLAIR)
                .setBorder(Border.NO_BORDER)
                .setPadding(8));
        document.add(metaTable);

        document.add(new Paragraph("\n"));

        // ════════════════════════════════════════════════════════════════
        //  OBJET
        // ════════════════════════════════════════════════════════════════

        Paragraph objet = new Paragraph("Objet : Acceptation à la Vacation " +
                getTypeVacationLibelle(vacation.getType()) + " — " + vacation.getNom())
                .setFont(bold)
                .setFontSize(11)
                .setFixedLeading(16);
        document.add(objet);

        document.add(new Paragraph("\n"));

        // ════════════════════════════════════════════════════════════════
        //  CORPS DE LA LETTRE
        // ════════════════════════════════════════════════════════════════

        String ville = universite.getVille() != null ? universite.getVille() : "Kinshasa";
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMMM yyyy"));

        // Corps du texte
        String[] corps = {
            "Monsieur/Madame le Recteur de l'" + universite.getNom() + " a l'honneur d'informer",
            "l'étudiant(e) ci-dessous de son acceptation définitive à la session de",
            "la vacation " + getTypeVacationLibelle(vacation.getType()) + " de l'année académique " +
                    (vacation.getAnneeAcademique() != null ? vacation.getAnneeAcademique().getLibelle() : "en cours") + ".",
        };

        for (String ligne : corps) {
            document.add(new Paragraph(ligne)
                    .setFont(normal)
                    .setFontSize(11)
                    .setFixedLeading(18));
        }

        document.add(new Paragraph("\n"));

        // ════════════════════════════════════════════════════════════════
        //  TABLEAU DES INFORMATIONS ÉTUDIANT
        // ════════════════════════════════════════════════════════════════

        float[] colWidths = {140, 300};
        Table infoTable = new Table(UnitValue.createPercentArray(colWidths))
                .setWidth(UnitValue.createPercentValue(90))
                .setHorizontalAlignment(com.itextpdf.layout.properties.HorizontalAlignment.CENTER);

        // En-tête du tableau
        Cell headerInfo1 = new Cell()
                .add(new Paragraph("Informations").setFont(bold).setFontSize(10))
                .setBackgroundColor(new DeviceRgb(240, 240, 255))
                .setBorder(Border.NO_BORDER)
                .setPadding(6);
        Cell headerInfo2 = new Cell()
                .add(new Paragraph("Détails").setFont(bold).setFontSize(10))
                .setBackgroundColor(new DeviceRgb(240, 240, 255))
                .setBorder(Border.NO_BORDER)
                .setPadding(6);
        infoTable.addCell(headerInfo1);
        infoTable.addCell(headerInfo2);

        addInfoRow(infoTable, "Nom", etudiant.getNom(), normal);
        addInfoRow(infoTable, "Prénom", etudiant.getPrenom(), normal);
        addInfoRow(infoTable, "Matricule", etudiant.getMatriculePermanent(), normal);
        addInfoRow(infoTable, "Sexe", etudiant.getSexe(), normal);
        addInfoRow(infoTable, "Lieu de naissance",
                etudiant.getLieuNaissance() != null ? etudiant.getLieuNaissance() : "—", normal);
        addInfoRow(infoTable, "Date de naissance",
                etudiant.getDateNaissance() != null ?
                        etudiant.getDateNaissance().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "—", normal);

        if (iv.getPromotion() != null) {
            addInfoRow(infoTable, "Promotion", iv.getPromotion().getLibelle(), normal);
            if (iv.getPromotion().getFiliere() != null) {
                addInfoRow(infoTable, "Filière", iv.getPromotion().getFiliere().getNom(), normal);
            }
        }

        addInfoRow(infoTable, "Vacation", vacation.getNom() + " (" + getTypeVacationLibelle(vacation.getType()) + ")", normal);
        addInfoRow(infoTable, "Période",
                vacation.getDateDebut().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) +
                " au " + vacation.getDateFin().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), normal);

        document.add(infoTable);

        document.add(new Paragraph("\n"));

        // ── Texte de confirmation ──
        Paragraph confirmation = new Paragraph(
                "L'étudiant(e) est prié(e) de se présenter au secrétariat de l'université pour " +
                "compléter son dossier d'inscription et procéder au paiement des frais académiques " +
                "selon le barème en vigueur.")
                .setFont(normal)
                .setFontSize(10)
                .setFixedLeading(16);
        document.add(confirmation);

        document.add(new Paragraph("\n"));

        // ════════════════════════════════════════════════════════════════
        //  SIGNATURE
        // ════════════════════════════════════════════════════════════════

        Paragraph faitA = new Paragraph("Fait à " + ville + ", le " + dateStr)
                .setFont(normal)
                .setFontSize(10)
                .setTextAlignment(TextAlignment.RIGHT)
                .setFixedLeading(14);
        document.add(faitA);

        document.add(new Paragraph("\n"));

        // Signataire — image de signature électronique si un signataire a été désigné pour
        // cette lettre, sinon repli sur le nom du recteur en texte seul (comportement précédent).
        java.util.Optional<SignataireUniversite> signataireOpt =
                signatureElectroniqueService.obtenirSignataireEntitePourDocument(TypeDocumentSignable.LETTRE_ACCEPTATION, lettre.getId());

        if (signataireOpt.isPresent()) {
            SignataireUniversite signataire = signataireOpt.get();
            Paragraph fonctionLabel = new Paragraph(signataire.getFonction() + ",")
                    .setFont(italic).setFontSize(10)
                    .setTextAlignment(TextAlignment.RIGHT).setFixedLeading(14);
            document.add(fonctionLabel);

            if (signataire.getSignatureImage() != null && !signataire.getSignatureImage().isBlank()) {
                try {
                    String base64 = signataire.getSignatureImage().contains(",")
                            ? signataire.getSignatureImage().substring(signataire.getSignatureImage().indexOf(',') + 1)
                            : signataire.getSignatureImage();
                    byte[] sigBytes = java.util.Base64.getDecoder().decode(base64);
                    Image sigImage = new Image(com.itextpdf.io.image.ImageDataFactory.create(sigBytes));
                    sigImage.setMaxHeight(50);
                    sigImage.setHorizontalAlignment(com.itextpdf.layout.properties.HorizontalAlignment.RIGHT);
                    document.add(sigImage);
                } catch (Exception e) {
                    log.warn("Image de signature invalide pour la lettre {} : {}", lettre.getNumeroLettre(), e.getMessage());
                }
            }

            Paragraph signataireNom = new Paragraph(signataire.getNomComplet().toUpperCase())
                    .setFont(bold).setFontSize(11)
                    .setTextAlignment(TextAlignment.RIGHT).setFixedLeading(16);
            document.add(signataireNom);

            Paragraph signeMention = new Paragraph("Signé électroniquement")
                    .setFont(normal).setFontSize(7)
                    .setFontColor(COULEUR_BLEU_RDC)
                    .setTextAlignment(TextAlignment.RIGHT).setFixedLeading(10);
            document.add(signeMention);
        } else if (universite.getRecteurNom() != null) {
            Paragraph recteurLabel = new Paragraph("Le Recteur,")
                    .setFont(italic)
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setFixedLeading(14);
            document.add(recteurLabel);

            document.add(new Paragraph("\n"));

            Paragraph recteurNom = new Paragraph(universite.getRecteurNom().toUpperCase())
                    .setFont(bold)
                    .setFontSize(11)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setFixedLeading(16);
            document.add(recteurNom);
        }

        document.add(new Paragraph("\n\n"));

        String verificationUrl = baseUrl + "/verifier-lettre/" + lettre.getUuidVerification();

        BarcodeQRCode qrCode = new BarcodeQRCode(verificationUrl);
        PdfFormXObject qrObject = qrCode.createFormXObject(pdfDoc);
        Image qrImage = new Image(qrObject).scaleAbsolute(92, 92);

        Table qrBlock = new Table(UnitValue.createPercentArray(new float[]{110, 370}))
                .setWidth(UnitValue.createPercentValue(100));
        qrBlock.addCell(new Cell()
                .add(qrImage)
                .setBackgroundColor(COULEUR_FOND_QR)
                .setBorder(new com.itextpdf.layout.borders.SolidBorder(COULEUR_BLEU_RDC, 1))
                .setPadding(10));
        qrBlock.addCell(new Cell()
                .add(new Paragraph("Vérification électronique").setFont(bold).setFontSize(11).setFontColor(COULEUR_BLEU_RDC))
                .add(new Paragraph("Scannez le QR code ou utilisez le lien ci-dessous pour vérifier l’authenticité de cette lettre.").setFont(normal).setFontSize(9))
                .add(new Paragraph("Code : " + lettre.getUuidVerification()).setFont(normal).setFontSize(8))
                .add(new Paragraph(verificationUrl).setFont(normal).setFontSize(8).setFontColor(COULEUR_BLEU_RDC))
                .setBackgroundColor(COULEUR_FOND_QR)
                .setBorder(new com.itextpdf.layout.borders.SolidBorder(COULEUR_BLEU_RDC, 1))
                .setPadding(10));
        document.add(qrBlock);

        document.add(new Paragraph("\n"));

        // ════════════════════════════════════════════════════════════════
        //  PIED DE PAGE
        // ════════════════════════════════════════════════════════════════

        // Ligne décorative inférieure
        Table footerLine = new Table(1)
                .setWidth(UnitValue.createPercentValue(100))
                .setFixedPosition(
                        document.getLeftMargin(),
                        20,
                        PageSize.A4.getWidth() - document.getLeftMargin() - document.getRightMargin()
                );
        Cell footerCell = new Cell()
                .setHeight(2)
                .setBackgroundColor(COULEUR_BLEU_RDC)
                .setBorder(Border.NO_BORDER);
        footerLine.addCell(footerCell);
        document.add(footerLine);

        // Texte du pied de page
        Paragraph footerText = new Paragraph(
                universite.getNom() + " — " + (universite.getVille() != null ? universite.getVille() : "RDC") +
                " | " + baseUrl)
                .setFont(normal)
                .setFontSize(7)
                .setFontColor(COULEUR_BLEU_RDC)
                .setTextAlignment(TextAlignment.CENTER)
                .setFixedPosition(
                        document.getLeftMargin(),
                        5,
                        PageSize.A4.getWidth() - document.getLeftMargin() - document.getRightMargin()
                )
                .setFixedLeading(10);
        document.add(footerText);

        // Fermeture
        document.close();

        log.info("PDF généré pour la lettre {} ({} bytes)", lettre.getNumeroLettre(), baos.size());
        return baos.toByteArray();
    }

    /**
     * Génère le contenu texte de la lettre
     */
    private String genererContenuLettre(Etudiant etudiant, Vacation vacation,
                                         Universite universite, InscriptionVacation iv) {
        String dateNaissance = etudiant.getDateNaissance() != null
                ? etudiant.getDateNaissance().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : "—";
        String promotion = iv.getPromotion() != null ? iv.getPromotion().getLibelle() : "—";
        String filiere = (iv.getPromotion() != null && iv.getPromotion().getFiliere() != null)
                ? iv.getPromotion().getFiliere().getNom() : "—";

        return String.format("""
            LETTRE D'ACCEPTATION
            N° Réf. : %s

            République Démocratique du Congo
            %s
            %s

            Objet : Acceptation à la Vacation %s

            Monsieur/Madame le Recteur de l'%s a l'honneur d'informer
            l'étudiant(e) ci-dessous de son acceptation définitive à la session de
            la vacation %s.

            INFORMATIONS ÉTUDIANT :
            Nom : %s
            Prénom : %s
            Matricule : %s
            Date de naissance : %s
            Promotion : %s
            Filière : %s
            Vacation : %s (%s)
            Période : %s au %s

            Fait à %s, le %s

            Le Recteur,
            %s
            """,
            getTypeVacationLibelle(vacation.getType()),
            TITRE_REPUBLIQUE,
            universite.getNom(),
            universite.getRecteurNom() != null ? universite.getRecteurNom() : "—",
            getTypeVacationLibelle(vacation.getType()),
            universite.getNom(),
            getTypeVacationLibelle(vacation.getType()),
            etudiant.getNom(),
            etudiant.getPrenom(),
            etudiant.getMatriculePermanent(),
            dateNaissance,
            promotion,
            filiere,
            vacation.getNom(),
            getTypeVacationLibelle(vacation.getType()),
            vacation.getDateDebut().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
            vacation.getDateFin().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
            universite.getVille() != null ? universite.getVille() : "Kinshasa",
            LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMMM yyyy")),
            universite.getRecteurNom() != null ? universite.getRecteurNom().toUpperCase() : "—"
        );
    }

    /**
     * Génère un numéro unique pour la lettre
     */
    private String genererNumeroUnique(Universite universite, Vacation vacation) {
        String sigle = getSigleUniversite(universite);
        String annee = String.valueOf(LocalDate.now().getYear());
        String type = vacation.getType() == TypeVacation.JOUR ? "J" : "S";
        long count = lettreRepo.count() + 1;
        return String.format("LA-%s-%s-%s-%04d", sigle, annee, type, count);
    }

    /**
     * Ajoute une ligne au tableau d'informations
     */
    private void addInfoRow(Table table, String label, String value, PdfFont font) {
        Cell labelCell = new Cell()
                .add(new Paragraph(label).setFont(font).setFontSize(10))
                .setBorder(Border.NO_BORDER)
                .setPadding(4);
        Cell valueCell = new Cell()
                .add(new Paragraph(value != null ? value : "—").setFont(font).setFontSize(10))
                .setBorder(Border.NO_BORDER)
                .setPadding(4);
        table.addCell(labelCell);
        table.addCell(valueCell);
    }

    // ════════════════════════════════════════════════════════════════════
    //  MÉTHODES UTILITAIRES
    // ════════════════════════════════════════════════════════════════════

    /**
     * Obtient le libellé du type de vacation (JOUR → "Jour", SOIR → "Soir")
     */
    private String getTypeVacationLibelle(TypeVacation type) {
        if (type == null) return "—";
        switch (type) {
            case JOUR: return "Jour";
            case SOIR: return "Soir";
            default: return type.name();
        }
    }

    /**
     * Obtient le sigle de l'université (soit depuis le code, soit depuis nom abrégé)
     */
    private String getSigleUniversite(Universite universite) {
        if (universite == null) return "UNIV";
        if (universite.getCode() != null) return universite.getCode();
        // Fallback: prendre les premières lettres du nom
        String nom = universite.getNom();
        if (nom != null && !nom.isBlank()) {
            String[] mots = nom.split("\\s+");
            StringBuilder sigle = new StringBuilder();
            for (String mot : mots) {
                if (!mot.isEmpty()) {
                    sigle.append(Character.toUpperCase(mot.charAt(0)));
                }
            }
            return sigle.length() > 0 ? sigle.toString() : "UNIV";
        }
        return "UNIV";
    }

    private void envoyerPdfLettreApresEmission(LettreAcceptation lettre, byte[] pdfBytes) {
        String email = lettre.getEtudiant() != null ? lettre.getEtudiant().getEmail() : null;
        if (email == null || email.isBlank()) {
            log.warn("Lettre {} émise sans email étudiant disponible", lettre.getNumeroLettre());
            return;
        }

        String sujet = "Votre lettre d'acceptation - " + lettre.getUniversite().getNom();
        String message = String.format(
                "Bonjour %s %s,\n\nVotre lettre d'acceptation officielle est prête. Le PDF est joint à cet email.\n\n" +
                "Référence : %s\nUniversité : %s\nVacation : %s\n\nCordialement,\nGENUC",
                lettre.getEtudiant().getPrenom(),
                lettre.getEtudiant().getNom(),
                lettre.getNumeroLettre(),
                lettre.getUniversite().getNom(),
                lettre.getVacation().getNom()
        );

        emailService.envoyerAvecPieceJointe(
                email,
                sujet,
                message,
                pdfBytes,
                "lettre_acceptation_" + lettre.getNumeroLettre() + ".pdf"
        );

        Inscription inscription = lettre.getInscriptionVacation() != null
                ? lettre.getInscriptionVacation().getInscription()
                : null;
        if (inscription != null) {
            String messagePortail = String.format(
                    "Votre lettre d'acceptation est disponible.\n\n" +
                    "Référence : %s\n" +
                    "Université : %s\n" +
                    "Vacation : %s\n\n" +
                    "Le PDF vous a été envoyé par email.\n" +
                    "Lien de téléchargement : %s/api/lettres-acceptation/telecharger/%d",
                    lettre.getNumeroLettre(),
                    lettre.getUniversite().getNom(),
                    lettre.getVacation().getNom(),
                    baseUrl,
                    lettre.getId()
            );
            messagerieService.notifierEtudiantDocument(
                    inscription,
                    sujet,
                    messagePortail,
                    lettre.getUniversite().getNom(),
                    "ADMIN_UNIVERSITE"
            );
        }
    }
}
