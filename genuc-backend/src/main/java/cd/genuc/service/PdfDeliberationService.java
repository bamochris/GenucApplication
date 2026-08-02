package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.repository.*;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PdfDeliberationService {

    private final DeliberationWorkflowService workflow;
    private final PromotionRepository promotionRepo;
    private final InscriptionRepository inscriptionRepo;
    private final NoteRepository noteRepo;
    private final DeliberationRepository deliberationRepo;

    /**
     * PV global pour l'admin (tous les étudiants d'une promotion)
     */
    public byte[] genererPvGlobal(Long promotionId, String anneeAcademique) throws Exception {
        List<Map<String, Object>> resultats = workflow.premiereDeliberation(promotionId, anneeAcademique);
        Promotion promo = promotionRepo.findById(promotionId)
                .orElseThrow(() -> new RuntimeException("Promotion introuvable"));

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdfDoc = new PdfDocument(writer);
        Document document = new Document(pdfDoc, PageSize.A4.rotate());
        document.setMargins(30, 30, 30, 30);

        PdfFont bold = PdfFontFactory.createFont(com.itextpdf.io.font.constants.StandardFonts.HELVETICA_BOLD);
        PdfFont normal = PdfFontFactory.createFont(com.itextpdf.io.font.constants.StandardFonts.HELVETICA);

        // Titre
        Paragraph title = new Paragraph("PROCÈS-VERBAL DE DÉLIBÉRATION – " + anneeAcademique)
                .setFont(bold)
                .setFontSize(16)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(title);
        document.add(new Paragraph("\n"));

        // Informations promotion
        document.add(new Paragraph("Promotion : " + promo.getLibelle()).setFont(normal).setFontSize(11));
        document.add(new Paragraph("Filière : " + promo.getFiliere().getNom()).setFont(normal).setFontSize(11));
        document.add(new Paragraph("Département : " + promo.getFiliere().getDepartement().getNom()).setFont(normal).setFontSize(11));
        document.add(new Paragraph("Université : " + promo.getFiliere().getDepartement().getUniversite().getNom()).setFont(normal).setFontSize(11));
        document.add(new Paragraph("\n"));

        // Tableau
        float[] columnWidths = {30, 200, 120, 80, 80, 100, 100};
        Table table = new Table(UnitValue.createPercentArray(columnWidths))
                .setWidth(UnitValue.createPercentValue(100));

        // En-têtes
        String[] headers = {"N°", "Étudiant", "Matricule", "Moyenne", "Crédits", "Mention", "Décision"};
        for (String h : headers) {
            Cell headerCell = new Cell()
                    .add(new Paragraph(h).setFont(bold).setFontSize(10).setFontColor(ColorConstants.WHITE))
                    .setBackgroundColor(ColorConstants.BLUE)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setBorder(Border.NO_BORDER)
                    .setPadding(6);
            table.addCell(headerCell);
        }

        int i = 1;
        for (Map<String, Object> r : resultats) {
            table.addCell(new Cell().add(new Paragraph(String.valueOf(i++)).setFont(normal).setFontSize(9)).setTextAlignment(TextAlignment.CENTER));
            table.addCell(new Cell().add(new Paragraph((String) r.get("etudiant")).setFont(normal).setFontSize(9)));
            table.addCell(new Cell().add(new Paragraph((String) r.get("matricule")).setFont(normal).setFontSize(9)));
            table.addCell(new Cell().add(new Paragraph(String.format("%.2f", r.get("moyenne"))).setFont(normal).setFontSize(9)).setTextAlignment(TextAlignment.CENTER));
            table.addCell(new Cell().add(new Paragraph((String) r.get("credits")).setFont(normal).setFontSize(9)).setTextAlignment(TextAlignment.CENTER));
            table.addCell(new Cell().add(new Paragraph((String) r.get("mention")).setFont(normal).setFontSize(9)).setTextAlignment(TextAlignment.CENTER));
            table.addCell(new Cell().add(new Paragraph((String) r.get("decision")).setFont(normal).setFontSize(9)).setTextAlignment(TextAlignment.CENTER));
        }

        document.add(table);
        document.close();
        return baos.toByteArray();
    }

    /**
     * Relevé individuel pour l'étudiant
     */
    public byte[] genererReleveIndividuel(Long inscriptionId, String anneeAcademique) throws Exception {
        Deliberation delib = deliberationRepo.findByInscriptionIdAndAnneeAcademique(inscriptionId, anneeAcademique)
                .orElseThrow(() -> new RuntimeException("Délibération non trouvée"));
        Inscription ins = delib.getInscription();
        List<Note> notes = noteRepo.findByInscriptionIdAndAnneeAcademique(inscriptionId, anneeAcademique);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdfDoc = new PdfDocument(writer);
        Document document = new Document(pdfDoc, PageSize.A4);
        document.setMargins(40, 40, 40, 40);

        PdfFont bold = PdfFontFactory.createFont(com.itextpdf.io.font.constants.StandardFonts.HELVETICA_BOLD);
        PdfFont normal = PdfFontFactory.createFont(com.itextpdf.io.font.constants.StandardFonts.HELVETICA);

        // Titre
        Paragraph title = new Paragraph("RELEVÉ DE NOTES – " + anneeAcademique)
                .setFont(bold)
                .setFontSize(16)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(title);
        document.add(new Paragraph("\n"));

        // Infos étudiant
        document.add(new Paragraph("Étudiant : " + ins.getPrenom() + " " + ins.getNom()).setFont(normal).setFontSize(11));
        document.add(new Paragraph("Matricule : " + ins.getMatricule()).setFont(normal).setFontSize(11));
        document.add(new Paragraph("\n"));

        // Tableau des notes
        float[] colWidths = {200, 80, 80, 80, 60};
        Table table = new Table(UnitValue.createPercentArray(colWidths))
                .setWidth(UnitValue.createPercentValue(100));

        String[] headers = {"Cours", "Session 1", "Rattrapage", "Retenue", "Crédits"};
        for (String h : headers) {
            Cell headerCell = new Cell()
                    .add(new Paragraph(h).setFont(bold).setFontSize(10).setFontColor(ColorConstants.WHITE))
                    .setBackgroundColor(ColorConstants.BLUE)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setPadding(5);
            table.addCell(headerCell);
        }

        for (Note note : notes) {
            table.addCell(new Cell().add(new Paragraph(note.getCours().getTitre()).setFont(normal).setFontSize(9)));
            table.addCell(new Cell().add(new Paragraph(note.getNoteExamen() != null ? note.getNoteExamen().toString() : "-").setFont(normal).setFontSize(9)).setTextAlignment(TextAlignment.CENTER));
            table.addCell(new Cell().add(new Paragraph(note.getNoteRattrapage() != null ? note.getNoteRattrapage().toString() : "-").setFont(normal).setFontSize(9)).setTextAlignment(TextAlignment.CENTER));
            table.addCell(new Cell().add(new Paragraph(note.getNoteRetenue() != null ? note.getNoteRetenue().toString() : "-").setFont(normal).setFontSize(9)).setTextAlignment(TextAlignment.CENTER));
            table.addCell(new Cell().add(new Paragraph(String.valueOf(note.getCredits())).setFont(normal).setFontSize(9)).setTextAlignment(TextAlignment.CENTER));
        }

        document.add(table);
        document.add(new Paragraph("\n"));

        // Résultats
        document.add(new Paragraph("Moyenne générale : " + delib.getMoyenneGenerale()).setFont(normal).setFontSize(11));
        document.add(new Paragraph("Crédits validés : " + delib.getCreditsValides()).setFont(normal).setFontSize(11));
        document.add(new Paragraph("Mention : " + delib.getMention()).setFont(normal).setFontSize(11));
        document.add(new Paragraph("Décision : " + delib.getDecision()).setFont(normal).setFontSize(11));

        document.close();
        return baos.toByteArray();
    }
}