package cd.genuc.util;

import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.geom.Rectangle;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.draw.DashedLine;
import com.itextpdf.kernel.pdf.canvas.draw.SolidLine;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.layout.LayoutArea;
import com.itextpdf.layout.layout.LayoutContext;
import com.itextpdf.layout.layout.LayoutResult;
import com.itextpdf.layout.properties.BorderRadius;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class PdfGenerateur {

    private static final DeviceRgb BLEU_GENUC  = new DeviceRgb(11,  31,  74);
    private static final DeviceRgb VERT_GENUC  = new DeviceRgb(29,  158, 117);
    private static final DeviceRgb GRIS_CLAIR  = new DeviceRgb(245, 246, 248);
    private static final DeviceRgb GRIS_TEXTE  = new DeviceRgb(80,  80,  80);

    // ─── Bon de caisse (ticket 80 mm) ─────────────────────────────
    /** 80 mm en points PostScript — largeur des rouleaux de caisse standard. */
    private static final float LARGEUR_TICKET = 226.77f;
    private static final float MARGE_TICKET   = 12f;
    private static final DeviceRgb BLEU_TACHPAY = new DeviceRgb(30,  58,  138);
    private static final DeviceRgb VERT_FOND    = new DeviceRgb(209, 250, 229);
    private static final DeviceRgb VERT_TEXTE   = new DeviceRgb(6,   95,  70);
    /** Logo officiel embarqué dans le JAR : le backend ne dépend pas des assets du frontend. */
    private static final String CHEMIN_LOGO_TACHPAY = "branding/tachpay-logo.png";
    private volatile byte[] logoTachPay;
    /** Au-delà, le ticket s'allonge sans profit : la liste complète reste dans le QR. */
    private static final int MAX_BANQUES_TICKET = 4;

    // ═══════════════════════════════════════════════════════════════
    // 1. RELEVÉ DE NOTES
    // ═══════════════════════════════════════════════════════════════

    public byte[] genererReleveNotes(Map<String, Object> data) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
             Document doc = new Document(pdf, PageSize.A4)) {
            doc.setMargins(36, 36, 36, 36);
            PdfFont bold    = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);

            ajouterEnTete(doc, bold, regular, data);
            ajouterInfosEtudiant(doc, bold, regular, data);
            ajouterTableauNotes(doc, bold, regular, data);
            ajouterResultats(doc, bold, regular, data);
            ajouterPiedDePage(doc, bold, regular, data);
        } catch (Exception e) {
            log.error("Erreur génération PDF relevé : {}", e.getMessage(), e);
            throw new IOException("Impossible de générer le relevé PDF : " + e.getMessage());
        }
        return baos.toByteArray();
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. REÇU DE PAIEMENT AVEC QR CODE
    // ═══════════════════════════════════════════════════════════════

    public byte[] genererRecuPaiement(Map<String, Object> data) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
             Document doc = new Document(pdf, PageSize.A4)) {
            doc.setMargins(36, 36, 36, 36);
            PdfFont bold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);

            // ─── En-tête ──────────────────────────────────────────────────
            Table header = new Table(UnitValue.createPercentArray(new float[]{1, 2, 1}))
                    .setWidth(UnitValue.createPercentValue(100))
                    .setBackgroundColor(BLEU_GENUC)
                    .setPadding(12);
            header.addCell(cellule("GENUC", bold, 18, ColorConstants.WHITE).setBorder(Border.NO_BORDER));
            header.addCell(cellule("REÇU DE PAIEMENT", bold, 14, ColorConstants.WHITE)
                    .setTextAlignment(TextAlignment.CENTER).setBorder(Border.NO_BORDER));
            header.addCell(cellule(str(data, "universite"), bold, 10, ColorConstants.WHITE)
                    .setTextAlignment(TextAlignment.RIGHT).setBorder(Border.NO_BORDER));
            doc.add(header);

            // ─── Référence ──────────────────────────────────────────────────
            Paragraph ref = new Paragraph("N° " + str(data, "reference"))
                    .setFont(bold).setFontSize(14).setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(8).setMarginBottom(16);
            doc.add(ref);

            // ─── Informations ─────────────────────────────────────────────
            Table infoTable = new Table(UnitValue.createPercentArray(new float[]{30, 70}))
                    .setWidth(UnitValue.createPercentValue(100))
                    .setBackgroundColor(GRIS_CLAIR)
                    .setPadding(10)
                    .setMarginBottom(12);

            infoTable.addCell(ligneInfo("Étudiant", str(data, "etudiant"), bold, regular));
            infoTable.addCell(ligneInfo("Matricule", str(data, "matricule"), bold, regular));
            infoTable.addCell(ligneInfo("Date", str(data, "date"), bold, regular));
            infoTable.addCell(ligneInfo("Montant", str(data, "montant") + " " + str(data, "devise"), bold, regular));
            infoTable.addCell(ligneInfo("Mode de paiement", str(data, "modePaiement"), bold, regular));
            infoTable.addCell(ligneInfo("Type", str(data, "typePaiement"), bold, regular));

            String operateur = str(data, "operateur");
            if (!"N/A".equals(operateur) && !"-".equals(operateur) && !operateur.isEmpty()) {
                infoTable.addCell(ligneInfo("Opérateur", operateur, bold, regular));
            } else {
                infoTable.addCell(ligneInfo("Opérateur", "-", bold, regular));
            }

            String transaction = str(data, "numeroTransaction");
            if (!"N/A".equals(transaction) && !"-".equals(transaction) && !transaction.isEmpty()) {
                infoTable.addCell(ligneInfo("N° transaction", transaction, bold, regular));
            } else {
                infoTable.addCell(ligneInfo("N° transaction", "-", bold, regular));
            }

            doc.add(infoTable);

            // ─── Détail des frais ──────────────────────────────────────────
            if (data.containsKey("detailsFrais")) {
                @SuppressWarnings("unchecked")
                List<String> details = (List<String>) data.get("detailsFrais");
                doc.add(new Paragraph("Détail des frais :").setFont(bold).setFontSize(11).setMarginTop(8).setMarginBottom(4));
                for (String detail : details) {
                    doc.add(new Paragraph("• " + detail).setFont(regular).setFontSize(10).setMarginLeft(12));
                }
                doc.add(new Paragraph("\n").setFontSize(4));
            }

            // ─── Signature et cachet ──────────────────────────────────────
            Table signatureTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                    .setWidth(UnitValue.createPercentValue(100))
                    .setMarginTop(12);
            signatureTable.addCell(
                    new Cell().setBorder(Border.NO_BORDER)
                            .add(new Paragraph("Le Caissier").setFont(regular).setFontSize(10))
                            .add(new Paragraph("___________________").setFont(regular).setFontSize(10))
                            .add(new Paragraph(str(data, "agentId")).setFont(regular).setFontSize(9))
            );
            signatureTable.addCell(
                    new Cell().setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.RIGHT)
                            .add(new Paragraph("Cachet de l'université").setFont(regular).setFontSize(10))
                            .add(new Paragraph("___________________").setFont(regular).setFontSize(10))
            );
            doc.add(signatureTable);

            // ─── QR Code ────────────────────────────────────────────────────
            if (data.containsKey("qrContent")) {
                try {
                    byte[] qrBytes = genererQrCode(str(data, "qrContent"), 100);
                    Image qrImage = new Image(ImageDataFactory.create(qrBytes));
                    qrImage.setWidth(80).setHeight(80);
                    qrImage.setHorizontalAlignment(HorizontalAlignment.CENTER);
                    doc.add(qrImage);

                    doc.add(new Paragraph("Scannez pour vérifier l'authenticité du reçu")
                            .setFont(regular).setFontSize(8).setFontColor(ColorConstants.GRAY)
                            .setTextAlignment(TextAlignment.CENTER));
                } catch (Exception e) {
                    log.warn("Impossible de générer le QR code : {}", e.getMessage());
                }
            }

            // ─── Pied de page ──────────────────────────────────────────────
            Paragraph footer = new Paragraph("Document officiel - Toute falsification est punie par la loi")
                    .setFont(regular).setFontSize(8).setFontColor(ColorConstants.GRAY)
                    .setTextAlignment(TextAlignment.CENTER).setMarginTop(16);
            doc.add(footer);

            Paragraph genereLe = new Paragraph("Généré le " + str(data, "genereA"))
                    .setFont(regular).setFontSize(7).setFontColor(ColorConstants.GRAY)
                    .setTextAlignment(TextAlignment.CENTER);
            doc.add(genereLe);

        } catch (Exception e) {
            log.error("Erreur génération reçu paiement : {}", e.getMessage(), e);
            throw new IOException("Impossible de générer le reçu PDF : " + e.getMessage());
        }
        return baos.toByteArray();
    }

    /**
     * Bon de caisse, au format ticket étroit (80 mm) — celui qu'on présente au caissier.
     *
     * <p>Remplace l'ancien rendu A4 : un bon de caisse se manipule, se plie et se tamponne,
     * une pleine page était disproportionnée pour dix lignes d'information.</p>
     *
     * <p>La hauteur de page est <b>calculée</b> à partir du contenu réellement mis en page
     * (première passe de mesure dans un document jetable), ce qui garantit un ticket
     * d'une seule page quelles que soient la longueur du nom de l'établissement ou de la
     * promotion — un débordement enverrait le pied de page, donc les instructions, sur une
     * seconde feuille.</p>
     *
     * <p>Clés attendues dans {@code data} : {@code numero}, {@code etudiant},
     * {@code matricule}, {@code universite}, {@code montant}, {@code devise},
     * {@code dateEmission}, {@code dateExpiration}, {@code qrCode}. Optionnelles :
     * {@code promotion}, {@code faculte}, {@code typeFrais}, {@code mode}, {@code pays},
     * {@code siteWeb}, {@code marque}. Toute clé absente affiche « — » plutôt que de
     * casser la génération.</p>
     */
    public byte[] genererBonPaiement(Map<String, Object> data) throws IOException {
        try {
            float hauteurContenu = mesurerHauteurTicket(data);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            float hauteurPage = hauteurContenu + (2 * MARGE_TICKET) + 2f;

            try (PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
                 Document doc = new Document(pdf, new PageSize(LARGEUR_TICKET, hauteurPage))) {

                doc.setMargins(MARGE_TICKET, MARGE_TICKET, MARGE_TICKET, MARGE_TICKET);
                // Les PdfFont sont liées à leur document : elles ne peuvent pas être
                // partagées avec la passe de mesure, d'où une nouvelle création ici.
                doc.add(construireTicketBon(data,
                        PdfFontFactory.createFont(StandardFonts.COURIER_BOLD),
                        PdfFontFactory.createFont(StandardFonts.COURIER)));
            }
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Erreur génération bon de caisse : {}", e.getMessage(), e);
            throw new IOException("Impossible de générer le bon PDF : " + e.getMessage());
        }
    }

    /**
     * Première passe : met en page le ticket dans un document jetable très haut pour
     * connaître la hauteur réellement occupée, sans rien écrire sur disque.
     */
    private float mesurerHauteurTicket(Map<String, Object> data) throws IOException {
        final float hauteurSonde = 5000f;
        try (PdfDocument sondePdf = new PdfDocument(new PdfWriter(new ByteArrayOutputStream()));
             Document sondeDoc = new Document(sondePdf, new PageSize(LARGEUR_TICKET, hauteurSonde))) {

            sondeDoc.setMargins(MARGE_TICKET, MARGE_TICKET, MARGE_TICKET, MARGE_TICKET);
            Div contenu = construireTicketBon(data,
                    PdfFontFactory.createFont(StandardFonts.COURIER_BOLD),
                    PdfFontFactory.createFont(StandardFonts.COURIER));

            LayoutResult resultat = contenu.createRendererSubTree()
                    .setParent(sondeDoc.getRenderer())
                    .layout(new LayoutContext(new LayoutArea(1, new Rectangle(
                            LARGEUR_TICKET - (2 * MARGE_TICKET),
                            hauteurSonde - (2 * MARGE_TICKET)))));

            float mesure = resultat.getOccupiedArea() != null
                    ? resultat.getOccupiedArea().getBBox().getHeight()
                    : 0f;
            // Filet de sécurité : si la mesure échoue (contenu inattendu), on retombe sur
            // une hauteur généreuse plutôt que de produire un ticket tronqué.
            return (mesure > 20f && mesure < hauteurSonde) ? mesure : 620f;
        }
    }

    /** Assemble le ticket complet. Appelé deux fois : une fois pour mesurer, une fois pour écrire. */
    private Div construireTicketBon(Map<String, Object> data, PdfFont bold, PdfFont regular) {
        Div ticket = new Div();

        String marque = data.get("marque") != null ? data.get("marque").toString() : "TachPay";

        // ─── Marque + nature du document ───
        ticket.add(blocLogo(marque, bold));

        ticket.add(new Paragraph("BON DE CAISSE OFFICIEL")
                .setFont(regular).setFontSize(9).setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(6).setMarginBottom(4));

        // Validité DÉDUITE des dates du bon : afficher une durée figée mentirait au
        // caissier le jour où la durée d'émission change.
        ticket.add(new Div()
                .setBackgroundColor(VERT_FOND)
                .setBorderRadius(new BorderRadius(3))
                .setWidth(UnitValue.createPointValue(126))
                .setHorizontalAlignment(HorizontalAlignment.CENTER)
                .setPaddingTop(3).setPaddingBottom(3)
                .add(new Paragraph(libelleValidite(data))
                        .setFont(bold).setFontSize(7.5f).setFontColor(VERT_TEXTE)
                        .setTextAlignment(TextAlignment.CENTER).setMargin(0)));

        ticket.add(separateur(true));

        // ─── Établissement ───
        ticket.add(new Paragraph(str(data, "universite"))
                .setFont(bold).setFontSize(8.5f).setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(2).setMarginBottom(1));
        ticket.add(new Paragraph(data.get("pays") != null
                        ? data.get("pays").toString() : "République Démocratique du Congo")
                .setFont(regular).setFontSize(7.5f).setTextAlignment(TextAlignment.CENTER).setMargin(0));
        ticket.add(new Paragraph("Plateforme GENUC")
                .setFont(regular).setFontSize(6.5f).setFontColor(GRIS_TEXTE)
                .setTextAlignment(TextAlignment.CENTER).setMarginTop(1));

        ticket.add(separateur(false));

        // ─── Date / référence ───
        Table entete = tableauTicket();
        ajouterLigneTicket(entete, "Date :", formatDateFr(data.get("dateEmission")), regular, bold);
        ajouterLigneTicket(entete, "Réf :", str(data, "numero"), regular, bold);
        ajouterLigneTicket(entete, "Expire le :", formatDateFr(data.get("dateExpiration")), regular, bold);
        ticket.add(entete);

        // ─── Étudiant ───
        ticket.add(titreSection("INFORMATIONS ETUDIANT", bold));
        Table etudiant = tableauTicket();
        ajouterLigneTicket(etudiant, "Nom :", str(data, "etudiant"), regular, bold);
        ajouterLigneTicket(etudiant, "Matricule :", str(data, "matricule"), regular, bold);
        ajouterLigneTicket(etudiant, "Promotion :", premierRenseigne(data, "promotion", "niveau"), regular, bold);
        ajouterLigneTicket(etudiant, "Faculté :", premierRenseigne(data, "faculte", "departement"), regular, bold);
        ticket.add(etudiant);

        // ─── Paiement ───
        ticket.add(titreSection("DETAILS DU PAIEMENT", bold));
        Table paiement = tableauTicket();
        ajouterLigneTicket(paiement, "Type :", data.get("typeFrais") != null
                ? data.get("typeFrais").toString() : "Frais académiques", regular, bold);
        // Le mode annoncé doit refléter les canaux réellement ouverts : afficher
        // « Espèces / Caissier » alors que des banques sont configurées enverrait
        // inutilement l'étudiant à la caisse.
        ajouterLigneTicket(paiement, "Mode :", data.get("mode") != null
                ? data.get("mode").toString()
                : (aDesBanques(data) ? "Espèces : caisse ou banque" : "Espèces / Caissier"), regular, bold);
        ticket.add(paiement);

        // ─── Montant ───
        ticket.add(new LineSeparator(new SolidLine(1.2f)).setMarginTop(8).setMarginBottom(5));
        Table montant = new Table(UnitValue.createPercentArray(new float[]{50, 50}))
                .setWidth(UnitValue.createPercentValue(100)).setBorder(Border.NO_BORDER);
        montant.addCell(new Cell().add(new Paragraph("NET A PAYER :")
                        .setFont(bold).setFontSize(10).setMargin(0))
                .setBorder(Border.NO_BORDER).setPadding(0));
        montant.addCell(new Cell().add(new Paragraph(
                        formatMontant(data.get("montant")) + " " + str(data, "devise"))
                        .setFont(bold).setFontSize(10).setTextAlignment(TextAlignment.RIGHT).setMargin(0))
                .setBorder(Border.NO_BORDER).setPadding(0));
        ticket.add(montant);
        ticket.add(new LineSeparator(new SolidLine(1.2f)).setMarginTop(5).setMarginBottom(8));

        // ─── Où payer ───
        ajouterBanquesTicket(ticket, data, bold, regular);

        // ─── QR ───
        ajouterQrTicket(ticket, data, regular);

        ticket.add(separateur(false));

        // ─── Instructions ───
        ticket.add(new Paragraph("INSTRUCTIONS :")
                .setFont(bold).setFontSize(7).setMarginTop(2).setMarginBottom(2));
        List<String> instructions = aDesBanques(data)
                ? List.of("1. Payer à la caisse de l'université",
                          "   ou déposer en espèces en banque",
                          "2. Régler le montant exact",
                          "3. Exiger le cachet ou le bordereau",
                          "4. Conserver la preuve de paiement")
                : List.of("1. Présenter ce bon au caissier",
                          "2. Régler le montant exact",
                          "3. Exiger le cachet officiel");
        for (String instruction : instructions) {
            ticket.add(new Paragraph(instruction)
                    .setFont(regular).setFontSize(7).setMargin(0).setMarginBottom(1));
        }

        ticket.add(separateur(false));

        // ─── Pied ───
        ticket.add(new Paragraph("Émis par GENUC / " + marque)
                .setFont(regular).setFontSize(6.5f).setFontColor(GRIS_TEXTE)
                .setTextAlignment(TextAlignment.CENTER).setMargin(0));
        ticket.add(new Paragraph(formatDateFr(data.get("dateEmission")) + "  -  "
                        + (data.get("siteWeb") != null ? data.get("siteWeb").toString() : "www.genuc.cd"))
                .setFont(regular).setFontSize(6.5f).setFontColor(GRIS_TEXTE)
                .setTextAlignment(TextAlignment.CENTER).setMarginTop(1));

        return ticket;
    }

    /**
     * Banques partenaires où le bon peut être réglé, en dehors de la caisse et de TachPay.
     *
     * <p>Les coordonnées n'étaient jusqu'ici présentes que dans le contenu du QR code :
     * un étudiant sans lecteur ne savait pas qu'il pouvait payer à sa banque. Elles sont
     * désormais imprimées en clair.</p>
     *
     * <p>Affichage limité à {@value #MAX_BANQUES_TICKET} banques : au-delà, le ticket
     * s'allongerait sans profit, la liste complète restant dans le QR.</p>
     */
    @SuppressWarnings("unchecked")
    private void ajouterBanquesTicket(Div ticket, Map<String, Object> data,
                                      PdfFont bold, PdfFont regular) {
        Object brut = data.get("banques");
        if (!(brut instanceof List<?> liste) || liste.isEmpty()) {
            return; // pas de section vide : un établissement peut n'encaisser qu'en caisse
        }

        // Une seule banque désignée = une instruction, pas un choix : le nom du guichet
        // doit sauter aux yeux, c'est là et nulle part ailleurs que le dépôt est accepté.
        boolean guichetImpose = liste.size() == 1;

        ticket.add(titreSection(guichetImpose ? "DÉPÔT À EFFECTUER À" : "PAYER EN BANQUE", bold));

        if (guichetImpose && liste.get(0) instanceof Map<?, ?> unique) {
            @SuppressWarnings("unchecked")
            Map<String, String> banque = (Map<String, String>) unique;
            ticket.add(new Paragraph(banque.getOrDefault("nom", ""))
                    .setFont(bold).setFontSize(11).setTextAlignment(TextAlignment.CENTER)
                    .setMarginTop(2).setMarginBottom(2));
            String compte = banque.getOrDefault("compte", "");
            if (!compte.isBlank()) {
                ticket.add(new Paragraph("Compte " + compte
                                + (banque.getOrDefault("devise", "").isBlank()
                                    ? "" : "  (" + banque.get("devise") + ")"))
                        .setFont(regular).setFontSize(7.5f)
                        .setTextAlignment(TextAlignment.CENTER).setMargin(0));
            }
            String intitule = banque.getOrDefault("intitule", "");
            if (!intitule.isBlank()) {
                ticket.add(new Paragraph(intitule)
                        .setFont(regular).setFontSize(6.5f).setFontColor(GRIS_TEXTE)
                        .setTextAlignment(TextAlignment.CENTER).setMargin(0));
            }
            ticket.add(new Paragraph("Dépôt d'espèces uniquement")
                    .setFont(regular).setFontSize(6.8f)
                    .setTextAlignment(TextAlignment.CENTER).setMarginTop(3).setMargin(0));
            ticket.add(new Paragraph("au guichet, chez un caissier")
                    .setFont(regular).setFontSize(6.5f).setFontColor(GRIS_TEXTE)
                    .setTextAlignment(TextAlignment.CENTER).setMarginBottom(2));
            ajouterRappelReference(ticket, data, bold, regular);
            return;
        }

        // Le bon de caisse ne se règle QUE par dépôt d'espèces, au guichet d'une
        // succursale et chez un caissier — jamais par virement. L'annoncer évite
        // qu'un étudiant tente un transfert que le rapprochement n'attend pas.
        // Textes volontairement courts : au-delà d'environ 48 caractères, la ligne se
        // coupe et laisse un « : » orphelin sur la suivante.
        ticket.add(new Paragraph("Dépôt d'espèces au guichet, chez un")
                .setFont(regular).setFontSize(6.8f).setMargin(0));
        ticket.add(new Paragraph("caissier de l'un de ces établissements :")
                .setFont(regular).setFontSize(6.8f).setMargin(0).setMarginBottom(3));

        int affichees = 0;
        for (Object element : liste) {
            if (affichees >= MAX_BANQUES_TICKET) {
                break;
            }
            if (!(element instanceof Map<?, ?> map)) {
                continue;
            }
            Map<String, String> banque = (Map<String, String>) map;
            String nom = banque.getOrDefault("nom", "");
            if (nom.isBlank()) {
                continue;
            }

            Table ligne = new Table(UnitValue.createPercentArray(new float[]{72, 28}))
                    .setWidth(UnitValue.createPercentValue(100)).setBorder(Border.NO_BORDER);
            ligne.addCell(new Cell()
                    .add(new Paragraph(nom).setFont(bold).setFontSize(7).setMargin(0))
                    .setBorder(Border.NO_BORDER).setPadding(0));
            ligne.addCell(new Cell()
                    .add(new Paragraph(banque.getOrDefault("devise", ""))
                            .setFont(bold).setFontSize(7)
                            .setTextAlignment(TextAlignment.RIGHT).setMargin(0))
                    .setBorder(Border.NO_BORDER).setPadding(0));
            ticket.add(ligne);

            String compte = banque.getOrDefault("compte", "");
            if (!compte.isBlank()) {
                ticket.add(new Paragraph("Cpte : " + compte)
                        .setFont(regular).setFontSize(7).setMargin(0).setMarginBottom(3));
            }
            affichees++;
        }

        if (liste.size() > affichees) {
            ticket.add(new Paragraph("+ " + (liste.size() - affichees)
                            + " autre(s) banque(s) — voir le QR code")
                    .setFont(regular).setFontSize(6.5f).setFontColor(GRIS_TEXTE)
                    .setMargin(0).setMarginBottom(2));
        }

        ajouterRappelReference(ticket, data, bold, regular);
    }

    /**
     * Rappel de la référence à porter sur le bordereau de dépôt.
     *
     * <p>Sans elle, un versement arrive sur le compte de l'établissement sans pouvoir
     * être rattaché à l'étudiant : première cause d'écart en rapprochement.</p>
     *
     * <p>Isolée sur sa propre ligne : mélangée à la phrase, elle se coupait en fin de
     * ligne (« BP-2026- » / « 482913 »), au risque d'être recopiée de travers.</p>
     */
    private void ajouterRappelReference(Div ticket, Map<String, Object> data,
                                       PdfFont bold, PdfFont regular) {
        ticket.add(new Paragraph("IMPORTANT — à mentionner sur le bordereau :")
                .setFont(regular).setFontSize(6.8f).setMarginTop(3).setMargin(0));
        ticket.add(new Paragraph(str(data, "numero"))
                .setFont(bold).setFontSize(8).setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(1).setMarginBottom(6));
    }

    private void ajouterQrTicket(Div ticket, Map<String, Object> data, PdfFont regular) {
        Object brut = data.get("qrCode");
        // NB : appelé APRÈS ajouterBanquesTicket, qui met déjà la référence en évidence.
        if (brut == null) {
            return;
        }
        String base64 = normaliserImageBase64(brut.toString());
        if (base64.isEmpty()) {
            return;
        }
        try {
            byte[] octets = java.util.Base64.getDecoder().decode(base64);
            Image image = new Image(ImageDataFactory.create(octets));
            image.setWidth(108).setHeight(108);
            image.setHorizontalAlignment(HorizontalAlignment.CENTER);
            ticket.add(new Div().setTextAlignment(TextAlignment.CENTER).add(image));
            // Rappel de la référence sous le QR — utile si le code est illisible — mais
            // uniquement quand le bloc bancaire ne l'a pas déjà mise en avant juste
            // au-dessus : trois occurrences sur le même ticket font désordre.
            if (!aDesBanques(data)) {
                ticket.add(new Paragraph(str(data, "numero"))
                        .setFont(regular).setFontSize(7).setFontColor(GRIS_TEXTE)
                        .setTextAlignment(TextAlignment.CENTER).setMarginTop(3));
            }
        } catch (Exception e) {
            log.warn("QR code non ajouté au bon {} : {}", str(data, "numero"), e.getMessage());
        }
    }

    /**
     * Ramène au base64 nu une image fournie sous n'importe laquelle des formes qui
     * circulent dans le code : base64 nu, data URI, ou <b>data URI préfixée deux fois</b>.
     *
     * <p>Ce dernier cas n'est pas théorique : {@code TachPayPaiementService} enregistrait
     * le champ {@code codeQR} <i>avec</i> le préfixe {@code data:image/png;base64,} et
     * l'ajoutait de nouveau à l'impression. L'ancien découpage ne retirait qu'un préfixe,
     * laissait « data:image/png;base64,iVBOR… », que le décodeur rejetait
     * (« Illegal base64 character 3a ») — et <b>le bon sortait sans QR code</b>, sans
     * autre trace qu'un avertissement dans les logs. La source est corrigée, mais les bons
     * déjà émis portent encore l'ancienne valeur : on continue donc de l'accepter.</p>
     *
     * @return le base64 exploitable, ou une chaîne vide si la valeur ne porte aucune image
     *         (sentinelles « — » et « QR non disponible » des anciennes générations).
     */
    private String normaliserImageBase64(String valeur) {
        String nettoye = valeur.trim();
        while (nettoye.startsWith("data:")) {
            int virgule = nettoye.indexOf(',');
            if (virgule < 0) {
                return "";
            }
            nettoye = nettoye.substring(virgule + 1).trim();
        }
        if (nettoye.isBlank() || "—".equals(nettoye) || nettoye.contains(" ")) {
            return "";
        }
        return nettoye;
    }

    // ─── Briques du ticket ────────────────────────────────────────

    /**
     * En-tête de marque : le vrai logo TachPay, embarqué dans les ressources du backend
     * (et non lu depuis le frontend, qui n'est pas déployé avec l'API).
     *
     * <p>Si l'image est introuvable ou illisible, on retombe sur un cartouche textuel :
     * un bon de caisse sans logo reste exploitable, un bon qui échoue à se générer non.</p>
     */
    private Div blocLogo(String marque, PdfFont bold) {
        byte[] logo = chargerLogoTachPay();
        if (logo != null) {
            try {
                com.itextpdf.io.image.ImageData source = ImageDataFactory.create(logo);
                float largeur = 132f;
                // Hauteur calculée explicitement : garantit le respect du ratio du logo.
                float hauteur = largeur * source.getHeight() / source.getWidth();
                Image image = new Image(source).setWidth(largeur).setHeight(hauteur);
                image.setHorizontalAlignment(HorizontalAlignment.CENTER);
                return new Div().setTextAlignment(TextAlignment.CENTER).add(image);
            } catch (Exception e) {
                log.warn("Logo TachPay illisible, repli sur le cartouche texte : {}", e.getMessage());
            }
        }
        return new Div()
                .setBackgroundColor(BLEU_TACHPAY)
                .setBorderRadius(new BorderRadius(5))
                .setWidth(UnitValue.createPointValue(104))
                .setHorizontalAlignment(HorizontalAlignment.CENTER)
                .setPaddingTop(6).setPaddingBottom(6)
                .add(new Paragraph(marque)
                        .setFont(bold).setFontSize(15).setFontColor(ColorConstants.WHITE)
                        .setTextAlignment(TextAlignment.CENTER).setMargin(0));
    }

    /** Lecture unique du logo depuis le classpath, puis mise en cache (un bon par étudiant). */
    private byte[] chargerLogoTachPay() {
        byte[] cache = logoTachPay;
        if (cache == null) {
            synchronized (this) {
                if (logoTachPay == null) {
                    try (java.io.InputStream in =
                                 new org.springframework.core.io.ClassPathResource(CHEMIN_LOGO_TACHPAY)
                                         .getInputStream()) {
                        logoTachPay = in.readAllBytes();
                    } catch (Exception e) {
                        log.warn("Logo TachPay absent du classpath ({}) : {}",
                                CHEMIN_LOGO_TACHPAY, e.getMessage());
                        logoTachPay = new byte[0];
                    }
                }
                cache = logoTachPay;
            }
        }
        return cache.length > 0 ? cache : null;
    }

    private LineSeparator separateur(boolean marque) {
        return new LineSeparator(new DashedLine(marque ? 1.1f : 0.5f))
                .setMarginTop(marque ? 8 : 6)
                .setMarginBottom(marque ? 6 : 5);
    }

    private Div titreSection(String titre, PdfFont bold) {
        return new Div()
                .setBackgroundColor(GRIS_CLAIR)
                .setBorderLeft(new SolidBorder(BLEU_TACHPAY, 2.5f))
                .setPaddingLeft(5).setPaddingTop(3).setPaddingBottom(3)
                .setMarginTop(8).setMarginBottom(3)
                .add(new Paragraph(titre).setFont(bold).setFontSize(7.5f).setMargin(0));
    }

    private Table tableauTicket() {
        return new Table(UnitValue.createPercentArray(new float[]{38, 62}))
                .setWidth(UnitValue.createPercentValue(100))
                .setBorder(Border.NO_BORDER);
    }

    private void ajouterLigneTicket(Table table, String label, String valeur,
                                    PdfFont regular, PdfFont bold) {
        table.addCell(new Cell()
                .add(new Paragraph(label).setFont(regular).setFontSize(7.5f).setMargin(0))
                .setBorder(Border.NO_BORDER).setPaddingTop(1.5f).setPaddingBottom(1.5f).setPaddingLeft(0));
        table.addCell(new Cell()
                .add(new Paragraph(valeur).setFont(bold).setFontSize(7.5f)
                        .setTextAlignment(TextAlignment.RIGHT).setMargin(0))
                .setBorder(Border.NO_BORDER).setPaddingTop(1.5f).setPaddingBottom(1.5f).setPaddingRight(0));
    }

    private boolean aDesBanques(Map<String, Object> data) {
        return data.get("banques") instanceof List<?> liste && !liste.isEmpty();
    }

    /** Renvoie la première clé renseignée, pour dégrader proprement quand l'appelant est ancien. */
    private String premierRenseigne(Map<String, Object> data, String cleAttendue, String cleSecours) {
        Object v = data.get(cleAttendue);
        if (v != null && !v.toString().isBlank() && !"—".equals(v.toString())) {
            return v.toString();
        }
        return str(data, cleSecours);
    }

    /** « VALABLE 7 JOURS » / « VALABLE 72 HEURES », calculé depuis les dates réelles du bon. */
    private String libelleValidite(Map<String, Object> data) {
        java.time.LocalDate emission = versDate(data.get("dateEmission"));
        java.time.LocalDate expiration = versDate(data.get("dateExpiration"));
        if (emission == null || expiration == null) {
            return "BON DE CAISSE";
        }
        long jours = java.time.temporal.ChronoUnit.DAYS.between(emission, expiration);
        if (jours <= 0) {
            return "EXPIRE CE JOUR";
        }
        if (jours <= 3) {
            return "VALABLE " + (jours * 24) + " HEURES";
        }
        return "VALABLE " + jours + " JOURS";
    }

    private java.time.LocalDate versDate(Object valeur) {
        if (valeur instanceof java.time.LocalDate d) {
            return d;
        }
        if (valeur == null) {
            return null;
        }
        try {
            return java.time.LocalDate.parse(valeur.toString());
        } catch (Exception e) {
            return null;
        }
    }

    /** Les appelants passent tantôt une LocalDate, tantôt sa forme ISO : on absorbe les deux. */
    private String formatDateFr(Object valeur) {
        java.time.LocalDate date = versDate(valeur);
        return date != null
                ? date.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                : (valeur != null ? valeur.toString() : "—");
    }

    /** Montant à la française (virgule décimale), que l'appelant fournisse un Double ou une chaîne. */
    private String formatMontant(Object valeur) {
        if (valeur == null) {
            return "—";
        }
        try {
            double montant = Double.parseDouble(valeur.toString().replace(',', '.'));
            return String.format(java.util.Locale.FRANCE, "%,.2f", montant);
        } catch (NumberFormatException e) {
            return valeur.toString();
        }
    }

    public byte[] genererAttestation(Map<String, Object> data) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
             Document doc = new Document(pdf, PageSize.A4)) {
            doc.setMargins(36, 36, 36, 36);
            PdfFont bold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);

            doc.add(new Paragraph(str(data, "titre"))
                    .setFont(bold).setFontSize(16).setTextAlignment(TextAlignment.CENTER).setMarginBottom(20));
            doc.add(new Paragraph(str(data, "universite"))
                    .setFont(regular).setFontSize(11).setTextAlignment(TextAlignment.CENTER));
            doc.add(new Paragraph("\n").setFontSize(8));
            doc.add(new Paragraph(str(data, "contenu"))
                    .setFont(regular).setFontSize(12).setTextAlignment(TextAlignment.JUSTIFIED));
            doc.add(new Paragraph("\n").setFontSize(12));
            doc.add(new Paragraph("N° " + str(data, "numero"))
                    .setFont(bold).setFontSize(10));
            doc.add(new Paragraph("Date : " + str(data, "date"))
                    .setFont(regular).setFontSize(10));

            if (data.get("signataireNom") != null) {
                try {
                    ajouterBlocSignatureElectronique(doc, bold, regular,
                            str(data, "signataireNom"), str(data, "signataireFonction"),
                            (String) data.get("signatureImage"), str(data, "dateSignature"),
                            (String) data.get("urlVerification"));
                } catch (Exception e) {
                    log.warn("Bloc de signature électronique non ajouté à l'attestation : {}", e.getMessage());
                }
            }
        }
        return baos.toByteArray();
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. QR CODE (ZXing)
    // ═══════════════════════════════════════════════════════════════

    public byte[] genererQrCode(String contenu, int taille) throws WriterException, IOException {
        QRCodeWriter qrWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrWriter.encode(contenu, BarcodeFormat.QR_CODE, taille, taille);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", baos);
        return baos.toByteArray();
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. SIGNATURE ÉLECTRONIQUE — bloc réutilisable (image + mentions légales + QR)
    // ═══════════════════════════════════════════════════════════════

    /**
     * Décode l'image de signature d'un {@code SignataireUniversite} (base64, avec ou sans
     * préfixe {@code data:image/...;base64,}). Retourne {@code null} si absente/invalide —
     * le bloc signature s'affiche alors en texte seul (nom + fonction), sans se casser.
     */
    public Image decoderImageSignature(String signatureImageBase64) {
        if (signatureImageBase64 == null || signatureImageBase64.isBlank()) return null;
        try {
            String pureBase64 = signatureImageBase64.contains(",")
                    ? signatureImageBase64.substring(signatureImageBase64.indexOf(',') + 1)
                    : signatureImageBase64;
            byte[] bytes = java.util.Base64.getDecoder().decode(pureBase64);
            Image image = new Image(ImageDataFactory.create(bytes));
            image.setMaxHeight(60);
            return image;
        } catch (Exception e) {
            log.warn("Image de signature invalide, affichage en texte seul : {}", e.getMessage());
            return null;
        }
    }

    /**
     * Bloc de signature électronique standard (API {@code Document}) : image de signature
     * (si disponible), nom et fonction du signataire, mention "Signé électroniquement le ...",
     * et QR code de vérification. Utilisé par les attestations/diplômes.
     */
    public void ajouterBlocSignatureElectronique(Document doc, PdfFont bold, PdfFont regular,
                                                  String signataireNom, String signataireFonction,
                                                  String signatureImageBase64, String dateSignatureFormatee,
                                                  String urlVerification) throws IOException {
        doc.add(new Paragraph("\n").setFontSize(8));

        Table bloc = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .setWidth(UnitValue.createPercentValue(100));

        Cell gauche = new Cell().setBorder(Border.NO_BORDER);
        gauche.add(new Paragraph("Document signé électroniquement").setFont(regular).setFontSize(8).setFontColor(ColorConstants.GRAY));
        gauche.add(new Paragraph("Le " + dateSignatureFormatee).setFont(regular).setFontSize(8).setFontColor(ColorConstants.GRAY));
        if (urlVerification != null) {
            try {
                byte[] qrBytes = genererQrCode(urlVerification, 100);
                Image qrImage = new Image(ImageDataFactory.create(qrBytes));
                qrImage.setWidth(70).setHeight(70);
                gauche.add(qrImage);
                gauche.add(new Paragraph("Vérifier l'authenticité").setFont(regular).setFontSize(7).setFontColor(ColorConstants.GRAY));
            } catch (WriterException e) {
                log.warn("QR de vérification de signature non généré : {}", e.getMessage());
            }
        }
        bloc.addCell(gauche);

        Cell droite = new Cell().setBorder(Border.NO_BORDER).setTextAlignment(TextAlignment.CENTER);
        Image signatureImage = decoderImageSignature(signatureImageBase64);
        if (signatureImage != null) {
            signatureImage.setHorizontalAlignment(HorizontalAlignment.CENTER);
            droite.add(signatureImage);
        }
        droite.add(new Paragraph("_________________________").setFont(regular).setFontSize(10).setTextAlignment(TextAlignment.CENTER));
        droite.add(new Paragraph(signataireNom != null ? signataireNom : "—").setFont(bold).setFontSize(11).setTextAlignment(TextAlignment.CENTER));
        droite.add(new Paragraph(signataireFonction != null ? signataireFonction : "—").setFont(regular).setFontSize(9).setTextAlignment(TextAlignment.CENTER));
        bloc.addCell(droite);

        doc.add(bloc);
    }

    // ─── Méthodes privées ───────────────────────────────────────────

    private void ajouterEnTete(Document doc, PdfFont bold, PdfFont regular, Map<String, Object> data) throws IOException {
        Table header = new Table(UnitValue.createPercentArray(new float[]{1, 2, 1}))
                .setWidth(UnitValue.createPercentValue(100))
                .setBackgroundColor(BLEU_GENUC)
                .setPadding(12);
        header.addCell(cellule("GENUC", bold, 18, ColorConstants.WHITE).setBorder(Border.NO_BORDER));
        header.addCell(cellule("RELEVÉ DE NOTES OFFICIEL", bold, 14, ColorConstants.WHITE)
                .setTextAlignment(TextAlignment.CENTER).setBorder(Border.NO_BORDER));
        header.addCell(cellule("Académie Intégrale\nRépublique Démocratique du Congo",
                regular, 8, ColorConstants.WHITE).setTextAlignment(TextAlignment.RIGHT).setBorder(Border.NO_BORDER));
        doc.add(header);

        Table sousTitre = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .setWidth(UnitValue.createPercentValue(100))
                .setBackgroundColor(VERT_GENUC)
                .setPadding(6);
        sousTitre.addCell(cellule(str(data, "universite"), bold, 10, ColorConstants.WHITE).setBorder(Border.NO_BORDER));
        sousTitre.addCell(cellule("Année académique : " + str(data, "anneeAcademique"),
                regular, 10, ColorConstants.WHITE).setTextAlignment(TextAlignment.RIGHT).setBorder(Border.NO_BORDER));
        doc.add(sousTitre);
        doc.add(new Paragraph("\n").setFontSize(4));
    }

    private void ajouterInfosEtudiant(Document doc, PdfFont bold, PdfFont regular, Map<String, Object> data) {
        Table info = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .setWidth(UnitValue.createPercentValue(100))
                .setBackgroundColor(GRIS_CLAIR)
                .setPadding(10)
                .setMarginBottom(10);
        info.addCell(ligneInfo("Matricule", str(data, "matricule"), bold, regular));
        info.addCell(ligneInfo("Département", str(data, "departement"), bold, regular));
        info.addCell(ligneInfo("Nom", str(data, "nom") + " " + str(data, "prenom"), bold, regular));
        info.addCell(ligneInfo("Niveau", str(data, "niveau"), bold, regular));
        info.addCell(ligneInfo("Vacation", str(data, "typeVacation"), bold, regular));
        info.addCell(ligneInfo("Généré le",
                data.get("genereA") != null ? data.get("genereA").toString().substring(0, 10) : "—",
                bold, regular));
        doc.add(info);
    }

    @SuppressWarnings("unchecked")
    private void ajouterTableauNotes(Document doc, PdfFont bold, PdfFont regular, Map<String, Object> data) {
        List<Map<String, Object>> notes = (List<Map<String, Object>>) data.get("notes");
        if (notes == null || notes.isEmpty()) {
            doc.add(new Paragraph("Aucune note disponible.").setFont(regular).setFontSize(10));
            return;
        }
        doc.add(new Paragraph("Détail des notes").setFont(bold).setFontSize(12)
                .setFontColor(BLEU_GENUC).setMarginBottom(6));

        Table table = new Table(UnitValue.createPercentArray(
                new float[]{3.5f, 0.8f, 1f, 1f, 1f, 1.2f, 1f, 1.2f}))
                .setWidth(UnitValue.createPercentValue(100))
                .setFontSize(9);

        String[] entetes = {"Cours", "Crédits", "TP/Continu", "Interro", "Examen", "Note/20", "Mention", "Statut"};
        for (String e : entetes) {
            table.addHeaderCell(new Cell()
                    .setBackgroundColor(BLEU_GENUC)
                    .add(new Paragraph(e).setFont(bold).setFontColor(ColorConstants.WHITE).setFontSize(8))
                    .setTextAlignment(TextAlignment.CENTER)
                    .setPadding(5));
        }

        boolean altRow = false;
        for (Map<String, Object> note : notes) {
            DeviceRgb bg = altRow ? GRIS_CLAIR : new DeviceRgb(255, 255, 255);
            altRow = !altRow;
            boolean reussi = "REUSSI".equals(note.get("statut"));
            DeviceRgb statutCouleur = reussi ? VERT_GENUC : new DeviceRgb(200, 50, 50);

            table.addCell(celluleTable(str(note, "cours"), regular, bg, TextAlignment.LEFT));
            table.addCell(celluleTable(str(note, "credits"), regular, bg, TextAlignment.CENTER));
            table.addCell(celluleTable(formatNote(note.get("noteTP")), regular, bg, TextAlignment.CENTER));
            table.addCell(celluleTable(formatNote(note.get("noteInterro")), regular, bg, TextAlignment.CENTER));
            table.addCell(celluleTable(formatNote(note.get("noteExamen")), regular, bg, TextAlignment.CENTER));
            table.addCell(celluleTable(formatNote(note.get("noteFinale")), bold, bg, TextAlignment.CENTER));
            table.addCell(celluleTable(str(note, "mention"), regular, bg, TextAlignment.CENTER));
            table.addCell(new Cell()
                    .setBackgroundColor(bg)
                    .add(new Paragraph(str(note, "statut"))
                            .setFont(bold).setFontSize(8).setFontColor(statutCouleur))
                    .setTextAlignment(TextAlignment.CENTER)
                    .setPadding(4)
                    .setBorder(Border.NO_BORDER));
        }
        doc.add(table);
        doc.add(new Paragraph("\n").setFontSize(4));
    }

    private void ajouterResultats(Document doc, PdfFont bold, PdfFont regular, Map<String, Object> data) {
        if (data.get("moyenneGenerale") == null) return;
        doc.add(new Paragraph("Résultats de délibération").setFont(bold).setFontSize(12)
                .setFontColor(BLEU_GENUC).setMarginTop(10).setMarginBottom(6));

        Table res = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1, 1}))
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginBottom(12);
        res.addCell(boiteResultat("Moyenne générale",
                data.get("moyenneGenerale") + " / 20", bold, regular, BLEU_GENUC));
        res.addCell(boiteResultat("Crédits validés",
                data.get("creditsValides") + " / " + data.get("creditsRequis"), bold, regular, VERT_GENUC));
        res.addCell(boiteResultat("Cours réussis",
                data.get("coursReussis") + " / " + data.get("coursTotaux"), bold, regular, BLEU_GENUC));
        res.addCell(boiteResultat("Mention",
                str(data, "mention").replace("_", " "), bold, regular, VERT_GENUC));
        doc.add(res);

        String decision = str(data, "decision");
        DeviceRgb decCouleur = decision.contains("ADMIS") || decision.contains("DIPLOME")
                ? VERT_GENUC : new DeviceRgb(180, 50, 50);
        Paragraph decPara = new Paragraph("DÉCISION DU JURY : " + decision.replace("_", " "))
                .setFont(bold).setFontSize(13).setFontColor(decCouleur)
                .setTextAlignment(TextAlignment.CENTER)
                .setPadding(10)
                .setBorder(new SolidBorder(decCouleur, 1.5f))
                .setMarginBottom(8);
        doc.add(decPara);

        if (data.get("presidentJury") != null) {
            Table sig = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                    .setWidth(UnitValue.createPercentValue(100));
            sig.addCell(ligneInfo("Président du jury", str(data, "presidentJury"), bold, regular));
            sig.addCell(ligneInfo("Date délibération", str(data, "dateDeliberation"), bold, regular));
            doc.add(sig);
        }
    }

    private void ajouterPiedDePage(Document doc, PdfFont bold, PdfFont regular, Map<String, Object> data) throws IOException {
        doc.add(new LineSeparator(new SolidLine()).setMarginTop(10).setMarginBottom(8));
        String urlVerif = (String) data.get("urlVerification");
        String uuid = (String) data.get("uuidVerification");

        Table pied = new Table(UnitValue.createPercentArray(new float[]{3, 1}))
                .setWidth(UnitValue.createPercentValue(100));
        Cell texteLegal = new Cell()
                .setBorder(Border.NO_BORDER)
                .add(new Paragraph("Ce document est officiel et délivré par GENUC — Académie Intégrale.")
                        .setFont(bold).setFontSize(9).setFontColor(BLEU_GENUC))
                .add(new Paragraph("Toute falsification est passible de poursuites judiciaires.")
                        .setFont(regular).setFontSize(8).setFontColor(GRIS_TEXTE))
                .add(new Paragraph("Vérification en ligne : " + (urlVerif != null ? urlVerif : "N/A"))
                        .setFont(regular).setFontSize(8).setFontColor(GRIS_TEXTE))
                .add(new Paragraph("Code : " + (uuid != null ? uuid.toUpperCase().substring(0, 8) + "..." : "N/A"))
                        .setFont(bold).setFontSize(8).setFontColor(BLEU_GENUC));
        pied.addCell(texteLegal);

        if (urlVerif != null && uuid != null) {
            try {
                byte[] qrBytes = genererQrCode(urlVerif, 100);
                Image qrImage = new Image(ImageDataFactory.create(qrBytes))
                        .setWidth(70).setHeight(70)
                        .setHorizontalAlignment(HorizontalAlignment.RIGHT);
                pied.addCell(new Cell().setBorder(Border.NO_BORDER).add(qrImage));
            } catch (WriterException e) {
                log.warn("Impossible de générer le QR code : {}", e.getMessage());
                pied.addCell(new Cell().setBorder(Border.NO_BORDER)
                        .add(new Paragraph("QR Code\nnon disponible").setFont(regular).setFontSize(7)));
            }
        } else {
            pied.addCell(new Cell().setBorder(Border.NO_BORDER));
        }
        doc.add(pied);
    }

    // ─── UTILITAIRES ──────────────────────────────────────────────

    private Cell cellule(String texte, PdfFont font, float size, com.itextpdf.kernel.colors.Color color) {
        return new Cell().add(new Paragraph(texte).setFont(font).setFontSize(size).setFontColor(color))
                .setBorder(Border.NO_BORDER).setPadding(4);
    }

    private Cell ligneInfo(String label, String valeur, PdfFont bold, PdfFont regular) {
        return new Cell()
                .add(new Paragraph(label + " : ").setFont(bold).setFontSize(9).setFontColor(BLEU_GENUC)
                        .add(new Text(valeur).setFont(regular).setFontColor(ColorConstants.BLACK)))
                .setBorder(Border.NO_BORDER).setPadding(4);
    }

    private Cell celluleTable(String texte, PdfFont font, DeviceRgb bg, TextAlignment align) {
        return new Cell()
                .setBackgroundColor(bg)
                .add(new Paragraph(texte).setFont(font).setFontSize(8))
                .setTextAlignment(align)
                .setPadding(4)
                .setBorder(Border.NO_BORDER);
    }

    private Cell boiteResultat(String label, String valeur, PdfFont bold, PdfFont regular, DeviceRgb couleur) {
        return new Cell()
                .setBackgroundColor(couleur)
                .add(new Paragraph(label).setFont(regular).setFontSize(8).setFontColor(ColorConstants.WHITE))
                .add(new Paragraph(valeur).setFont(bold).setFontSize(14).setFontColor(ColorConstants.WHITE))
                .setTextAlignment(TextAlignment.CENTER)
                .setPadding(8)
                .setBorder(Border.NO_BORDER);
    }

    private String str(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v != null ? v.toString() : "—";
    }

    private String formatNote(Object val) {
        if (val == null) return "—";
        try {
            double d = Double.parseDouble(val.toString());
            return String.format("%.2f", d);
        } catch (NumberFormatException e) {
            return val.toString();
        }
    }
}