package cd.genuc.service;

import cd.genuc.model.Etudiant;
import cd.genuc.model.Inscription;
import cd.genuc.model.Universite;
import cd.genuc.repository.InscriptionRepository;
import cd.genuc.util.PdfGenerateur;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfPage;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.canvas.PdfCanvas;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Text;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CarteEtudiantService {

        private static final DeviceRgb BLEU_OFFICIEL = new DeviceRgb(10, 36, 90);
        private static final DeviceRgb BLEU_RDC = new DeviceRgb(0, 127, 196);
        private static final DeviceRgb BLEU_TEXTE = new DeviceRgb(21, 51, 109);
        private static final DeviceRgb OR_CARTE = new DeviceRgb(207, 166, 77);
        private static final DeviceRgb OR_CLAIR = new DeviceRgb(238, 218, 156);
        private static final DeviceRgb ROUGE_RDC = new DeviceRgb(206, 17, 38);
        private static final DeviceRgb JAUNE_RDC = new DeviceRgb(247, 214, 50);
        private static final DeviceRgb GRIS_TEXTE = new DeviceRgb(47, 47, 47);
        private static final DeviceRgb FOND_CARTE = new DeviceRgb(248, 250, 253);

    private final InscriptionRepository inscriptionRepo;
    private final PdfGenerateur pdfGenerateur; // ✅ Injection correcte

    @Value("${app.base-url:http://localhost:3000}")
    private String baseUrl;

    /**
     * Génère la carte d'étudiant au format PDF (format carte bancaire 85.6x54mm)
     */
        @Transactional(readOnly = true)
    public byte[] genererCarteEtudiant(Long inscriptionId) throws IOException {
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

        Etudiant etudiant = inscription.getEtudiant();
        Universite universite = inscription.getUniversite();
                String nomComplet = nomComplet(inscription, etudiant);
                String matricule = premierNonVide(inscription.getMatricule(), etudiant.getMatriculePermanent(), "NON ATTRIBUE");
                String verificationUrl = baseUrl + "/verifier/" + matricule;

        ByteArrayOutputStream baos = new ByteArrayOutputStream();

        // Format carte bancaire : 85.6mm x 54mm
        PageSize carteSize = new PageSize(242, 153); // points (~85.6 x 54 mm)
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdfDoc = new PdfDocument(writer);
        pdfDoc.setDefaultPageSize(carteSize);
                PdfPage page = pdfDoc.addNewPage(carteSize);
                dessinerFondCarte(new PdfCanvas(page));

                Document document = new Document(pdfDoc, carteSize);
                document.setMargins(5, 7, 4, 7);

                Table headerTable = new Table(UnitValue.createPercentArray(new float[]{82, 18}))
                .setWidth(UnitValue.createPercentValue(100))
                                .setHeight(36)
                                .setMarginBottom(3);

                Cell titreCell = celluleSansBord()
                                .setPaddingLeft(5)
                                .setPaddingTop(3);
                titreCell.add(texte("REPUBLIQUE DEMOCRATIQUE DU CONGO", 6.8f, true, ColorConstants.WHITE));
                titreCell.add(texte("MINISTERE DE L'ENSEIGNEMENT SUPERIEUR ET UNIVERSITAIRE", 4.7f, false, OR_CLAIR));
                titreCell.add(texte(texteMajuscule(premierNonVide(universite.getNom(), "UNIVERSITE GENUC")), 8.3f, true, OR_CLAIR));
                headerTable.addCell(titreCell);

                Cell esuCell = celluleSansBord()
                                .setPaddingTop(4)
                                .setTextAlignment(TextAlignment.CENTER)
                                .setVerticalAlignment(VerticalAlignment.MIDDLE);
                esuCell.add(new Paragraph("ESU")
                                .setFontSize(6.3f)
                                .setBold()
                                .setFontColor(BLEU_OFFICIEL)
                                .setTextAlignment(TextAlignment.CENTER)
                                .setMargin(0)
                                .setPadding(2)
                                .setBorder(new SolidBorder(OR_CARTE, 0.6f))
                                .setBackgroundColor(ColorConstants.WHITE));
                esuCell.add(new Paragraph("RDC")
                                .setFontSize(4.2f)
                                .setFontColor(ColorConstants.WHITE)
                                .setTextAlignment(TextAlignment.CENTER)
                                .setMarginTop(1)
                                .setMarginBottom(0));
                headerTable.addCell(esuCell);

        document.add(headerTable);

                Table bodyTable = new Table(UnitValue.createPercentArray(new float[]{36, 64}))
                .setWidth(UnitValue.createPercentValue(100))
                                .setHeight(76)
                                .setMarginTop(1)
                                .setMarginBottom(1);

                Cell photoCell = new Cell()
                                .setWidth(76)
                                .setHeight(76)
                                .setPadding(2)
                                .setBorder(new SolidBorder(OR_CARTE, 1.1f))
                                .setBackgroundColor(ColorConstants.WHITE)
                                .setVerticalAlignment(VerticalAlignment.MIDDLE)
                                .setTextAlignment(TextAlignment.CENTER);
                Image photo = chargerImage(etudiant.getPhotoUrl(), 67, 70);
                if (photo != null) {
                        photo.setHorizontalAlignment(HorizontalAlignment.CENTER);
                        photoCell.add(photo);
                } else {
                        photoCell.add(new Paragraph(initiales(nomComplet))
                                        .setFontSize(18)
                                        .setBold()
                                        .setFontColor(BLEU_OFFICIEL)
                                        .setTextAlignment(TextAlignment.CENTER)
                                        .setMarginTop(20)
                                        .setMarginBottom(0));
                        photoCell.add(new Paragraph("PHOTO")
                                        .setFontSize(4.5f)
                                        .setFontColor(ColorConstants.GRAY)
                                        .setTextAlignment(TextAlignment.CENTER)
                                        .setMargin(0));
                }
        bodyTable.addCell(photoCell);

                Cell infoCell = celluleSansBord()
                                .setPaddingLeft(6)
                                .setPaddingTop(1)
                                .setPaddingBottom(0)
                                .setVerticalAlignment(VerticalAlignment.MIDDLE);

                infoCell.add(new Paragraph("STUDENT NAME: ")
                                .add(new Text(texteMajuscule(nomComplet)).setFontColor(BLEU_TEXTE))
                                .setFontSize(8.6f)
                .setBold()
                                .setFontColor(ColorConstants.BLACK)
                                .setFixedLeading(9.5f)
                                .setMarginBottom(1));
                ajouterLigneInfo(infoCell, "MATRICULE", matricule, 6.3f);
                ajouterLigneInfo(infoCell, "CYCLE", libelleCycle(inscription), 6.3f);
                ajouterLigneInfo(infoCell, "PROMOTION", libellePromotion(inscription), 6.3f);
                ajouterLigneInfo(infoCell, "FILIERE", libelleFiliere(inscription), 5.8f);
                ajouterLigneInfo(infoCell, "DEPARTEMENT", libelleDepartement(inscription), 5.4f);
                ajouterLigneInfo(infoCell, "CAMPUS", libelleCampus(universite), 5.4f);
                ajouterLigneInfo(infoCell, "CONTACT", contactEtudiant(inscription, etudiant), 4.8f);

        bodyTable.addCell(infoCell);
        document.add(bodyTable);

                Table verificationTable = new Table(UnitValue.createPercentArray(new float[]{22, 46, 32}))
                .setWidth(UnitValue.createPercentValue(100))
                                .setHeight(22)
                                .setMarginTop(0)
                                .setMarginBottom(0);

                Cell qrCell = celluleSansBord()
                                .setTextAlignment(TextAlignment.CENTER)
                                .setVerticalAlignment(VerticalAlignment.MIDDLE)
                                .setPadding(0);
                try {
                        byte[] qrBytes = pdfGenerateur.genererQrCode(verificationUrl, 58);
                        Image qrImage = new Image(ImageDataFactory.create(qrBytes));
                        qrImage.scaleToFit(23, 23);
                        qrImage.setHorizontalAlignment(HorizontalAlignment.CENTER);
                        qrCell.add(qrImage);
                } catch (Exception e) {
                        log.warn("Impossible de générer le QR code : {}", e.getMessage());
                        qrCell.add(new Paragraph("QR").setFontSize(8).setTextAlignment(TextAlignment.CENTER));
                }
                verificationTable.addCell(qrCell);

                Cell scanCell = celluleSansBord()
                                .setVerticalAlignment(VerticalAlignment.MIDDLE)
                                .setPaddingLeft(3);
                scanCell.add(texte("SCAN TO VERIFY", 6.5f, true, ColorConstants.BLACK));
                scanCell.add(texte("Document officiel GENUC", 4.3f, false, GRIS_TEXTE));
                verificationTable.addCell(scanCell);

                Cell sceauCell = celluleSansBord()
                                .setTextAlignment(TextAlignment.RIGHT)
                                .setVerticalAlignment(VerticalAlignment.MIDDLE)
                                .setPadding(0);
                Image sceau = chargerImage(premierNonVide(universite.getSceau(), universite.getLogo(), null), 26, 21);
                if (sceau != null) {
                        sceau.setHorizontalAlignment(HorizontalAlignment.RIGHT);
                        sceauCell.add(sceau);
                } else {
                        sceauCell.add(new Paragraph(premierNonVide(universite.getCode(), "GENUC"))
                                        .setFontSize(5.2f)
                                        .setBold()
                                        .setFontColor(BLEU_TEXTE)
                                        .setTextAlignment(TextAlignment.RIGHT)
                                        .setMargin(0));
        }
                verificationTable.addCell(sceauCell);

                document.add(verificationTable);

                Table anneeTable = new Table(UnitValue.createPercentArray(new float[]{67, 33}))
                                .setWidth(UnitValue.createPercentValue(100))
                                .setHeight(13)
                                .setMarginTop(1);
                Cell anneeCell = celluleSansBord()
                                .setPaddingLeft(5)
                                .setVerticalAlignment(VerticalAlignment.MIDDLE);
                anneeCell.add(texte("ANNEE ACADEMIQUE: " + libelleAnneeAcademique(inscription, universite), 6.6f, true, ColorConstants.BLACK));
                anneeTable.addCell(anneeCell);

                Cell signatureCell = celluleSansBord()
                                .setTextAlignment(TextAlignment.RIGHT)
                                .setPaddingRight(5)
                                .setVerticalAlignment(VerticalAlignment.MIDDLE);
                signatureCell.add(new Paragraph("Administrateur")
                                .setFontSize(4.8f)
                                .setFontColor(ColorConstants.BLACK)
                                .setTextAlignment(TextAlignment.RIGHT)
                                .setMargin(0));
                signatureCell.add(new Paragraph(LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                                .setFontSize(3.6f)
                                .setFontColor(GRIS_TEXTE)
                                .setTextAlignment(TextAlignment.RIGHT)
                                .setMargin(0));
                anneeTable.addCell(signatureCell);

                document.add(anneeTable);

        document.close();
        return baos.toByteArray();
    }

        private void dessinerFondCarte(PdfCanvas canvas) {
                canvas.saveState();
                canvas.setFillColor(FOND_CARTE).rectangle(0, 0, 242, 153).fill();
                canvas.setFillColor(BLEU_OFFICIEL).rectangle(0, 118, 242, 35).fill();
                canvas.setFillColor(OR_CARTE).rectangle(0, 116, 242, 2.6f).fill();
                canvas.setFillColor(OR_CARTE).rectangle(0, 0, 242, 18).fill();

                canvas.setStrokeColor(new DeviceRgb(224, 230, 238)).setLineWidth(0.35f);
                for (int i = 0; i < 6; i++) {
                        canvas.circle(37 + (i * 18), 73, 33 + (i * 2)).stroke();
                }
                canvas.setStrokeColor(new DeviceRgb(230, 235, 242)).setLineWidth(0.4f);
                canvas.circle(171, 78, 31).stroke();
                canvas.circle(171, 78, 24).stroke();

                dessinerDrapeauRdc(canvas, 210, 129, 24, 13);
                canvas.restoreState();
        }

        private void dessinerDrapeauRdc(PdfCanvas canvas, float x, float y, float width, float height) {
                canvas.saveState();
                canvas.setFillColor(BLEU_RDC).rectangle(x, y, width, height).fill();
                canvas.setStrokeColor(JAUNE_RDC).setLineWidth(5.2f).moveTo(x - 2, y - 1).lineTo(x + width + 2, y + height + 1).stroke();
                canvas.setStrokeColor(ROUGE_RDC).setLineWidth(2.8f).moveTo(x - 2, y - 1).lineTo(x + width + 2, y + height + 1).stroke();
                canvas.setFillColor(JAUNE_RDC).circle(x + 5.3f, y + height - 4.2f, 2.2f).fill();
                canvas.setStrokeColor(ColorConstants.WHITE).setLineWidth(0.35f).rectangle(x, y, width, height).stroke();
                canvas.restoreState();
        }

        private Cell celluleSansBord() {
                return new Cell().setBorder(Border.NO_BORDER).setPadding(0);
        }

        private Paragraph texte(String valeur, float taille, boolean gras, com.itextpdf.kernel.colors.Color couleur) {
                Paragraph paragraph = new Paragraph(valeur == null ? "" : valeur)
                                .setFontSize(taille)
                                .setFontColor(couleur)
                                .setFixedLeading(taille + 1.1f)
                                .setMargin(0);
                if (gras) {
                        paragraph.setBold();
                }
                return paragraph;
        }

        private void ajouterLigneInfo(Cell cell, String libelle, String valeur, float taille) {
                cell.add(new Paragraph()
                                .add(new Text(libelle + " : ").setBold())
                                .add(new Text(premierNonVide(valeur, "-")))
                                .setFontSize(taille)
                                .setFontColor(GRIS_TEXTE)
                                .setFixedLeading(taille + 1.1f)
                                .setMarginBottom(0));
        }

        private Image chargerImage(String source, float largeurMax, float hauteurMax) {
                if (estVide(source)) {
                        return null;
                }
                try {
                        byte[] data = chargerImageBytes(source.trim());
                        if (data == null || data.length == 0) {
                                return null;
                        }
                        Image image = new Image(ImageDataFactory.create(data));
                        image.scaleToFit(largeurMax, hauteurMax);
                        return image;
                } catch (Exception e) {
                        log.warn("Impossible de charger une image de carte étudiant : {}", e.getMessage());
                        return null;
                }
        }

        private byte[] chargerImageBytes(String source) throws IOException {
                if (source.startsWith("data:image")) {
                        int commaIndex = source.indexOf(',');
                        if (commaIndex >= 0) {
                                return Base64.getDecoder().decode(source.substring(commaIndex + 1));
                        }
                }
                if (source.startsWith("http://") || source.startsWith("https://")) {
                        try (var input = new URL(source).openStream()) {
                                return input.readAllBytes();
                        }
                }

                Path path = Path.of(source).isAbsolute()
                                ? Path.of(source)
                                : Path.of(source.replaceFirst("^/+", "")).normalize();
                if (Files.exists(path)) {
                        return Files.readAllBytes(path);
                }

                try {
                        return Base64.getDecoder().decode(source);
                } catch (IllegalArgumentException ignored) {
                        return null;
                }
        }

        private String nomComplet(Inscription inscription, Etudiant etudiant) {
                String prenom = premierNonVide(inscription.getPrenom(), etudiant.getPrenom(), "");
                String nom = premierNonVide(inscription.getNom(), etudiant.getNom(), "");
                return premierNonVide((prenom + " " + nom).trim(), "ETUDIANT GENUC");
        }

        private String libelleCycle(Inscription inscription) {
                if (inscription.getFiliere() == null || inscription.getFiliere().getNiveau() == null) {
                        return premierNonVide(inscription.getNiveau(), "LMD");
                }
                return switch (inscription.getFiliere().getNiveau()) {
                        case LICENCE -> "Licence (LMD)";
                        case MASTER -> "Master";
                        case DOCTORAT -> "Doctorat";
                        case CYCLE_COURT -> "Cycle court";
                        case SPECIALISATION -> "Specialisation";
                };
        }

        private String libellePromotion(Inscription inscription) {
                if (inscription.getPromotion() == null) {
                        return premierNonVide(inscription.getNiveau(), "-");
                }
                return premierNonVide(inscription.getPromotion().getLibelle(), inscription.getPromotion().getNiveau() != null
                                ? inscription.getPromotion().getNiveau().getDescription()
                                : null, "-");
        }

        private String libelleFiliere(Inscription inscription) {
                return inscription.getFiliere() == null ? "-" : premierNonVide(inscription.getFiliere().getNom(), inscription.getFiliere().getCode(), "-");
        }

        private String libelleDepartement(Inscription inscription) {
                if (inscription.getDepartement() == null) {
                        return "-";
                }
                return premierNonVide(inscription.getDepartement().getNom(), inscription.getDepartement().getCode(), "-");
        }

        private String libelleCampus(Universite universite) {
                return premierNonVide(universite.getVille(), universite.getCommune(), universite.getProvince(), universite.getAdresse(), "Campus principal");
        }

        private String libelleAnneeAcademique(Inscription inscription, Universite universite) {
                if (inscription.getAnneeAcademique() != null) {
                        return premierNonVide(inscription.getAnneeAcademique().getLibelle(), universite.getAnneeAcademique(), "-");
                }
                return premierNonVide(universite.getAnneeAcademique(), "-");
        }

        private String contactEtudiant(Inscription inscription, Etudiant etudiant) {
                return premierNonVide(inscription.getTelephone(), etudiant.getTelephone(), inscription.getEmail(), etudiant.getEmail(), "-");
        }

        private String initiales(String nomComplet) {
                String[] parties = premierNonVide(nomComplet, "GENUC").trim().split("\\s+");
                if (parties.length == 1) {
                        return parties[0].substring(0, Math.min(2, parties[0].length())).toUpperCase();
                }
                return (parties[0].substring(0, 1) + parties[parties.length - 1].substring(0, 1)).toUpperCase();
        }

        private String texteMajuscule(String valeur) {
                return premierNonVide(valeur, "").toUpperCase();
        }

        private boolean estVide(String valeur) {
                return valeur == null || valeur.trim().isEmpty();
        }

        private String premierNonVide(String... valeurs) {
                for (String valeur : valeurs) {
                        if (!estVide(valeur)) {
                                return valeur.trim();
                        }
                }
                return "";
        }

    /**
     * Génère les cartes pour tous les étudiants d'une promotion
     */
        @Transactional(readOnly = true)
    public Map<String, Object> genererCartesPromotion(Long promotionId) {
        List<Inscription> inscriptions = inscriptionRepo.findByPromotionId(promotionId);
        List<Map<String, Object>> resultats = new ArrayList<>();
        int reussites = 0;
        int erreurs = 0;

        for (Inscription ins : inscriptions) {
            try {
                byte[] carte = genererCarteEtudiant(ins.getId());
                // Ici, on pourrait sauvegarder le fichier sur le serveur ou en base de données
                resultats.add(Map.of(
                        "matricule", ins.getMatricule(),
                        "nom", ins.getPrenom() + " " + ins.getNom(),
                        "statut", "OK"
                ));
                reussites++;
            } catch (Exception e) {
                log.error("Erreur génération carte pour {} : {}", ins.getMatricule(), e.getMessage());
                resultats.add(Map.of(
                        "matricule", ins.getMatricule(),
                        "nom", ins.getPrenom() + " " + ins.getNom(),
                        "statut", "ERREUR : " + e.getMessage()
                ));
                erreurs++;
            }
        }

        return Map.of(
                "total", inscriptions.size(),
                "reussites", reussites,
                "erreurs", erreurs,
                "resultats", resultats
        );
    }

    /**
     * Récupère la carte d'un étudiant depuis le système de fichiers (si sauvegardée)
     */
        @Transactional(readOnly = true)
    public byte[] getCarteSauvegardee(Long inscriptionId) throws IOException {
        // Si vous sauvegardez les cartes sur le serveur
        String path = "uploads/cartes/" + inscriptionId + ".pdf";
        File file = new File(path);
        if (file.exists()) {
            return java.nio.file.Files.readAllBytes(file.toPath());
        }
        // Sinon, générer à la volée
        return genererCarteEtudiant(inscriptionId);
    }
}