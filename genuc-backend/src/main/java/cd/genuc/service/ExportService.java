package cd.genuc.service;

import cd.genuc.model.Inscription;
import cd.genuc.model.StatutInscription;
import cd.genuc.repository.InscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final InscriptionRepository inscriptionRepository;

    public byte[] exporterInscriptionsExcel(Long universiteId) throws IOException {
        List<Inscription> inscriptions = inscriptionRepository.findByUniversiteId(universiteId);
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Inscriptions");
            Row header = sheet.createRow(0);
            String[] columns = {"ID", "Matricule", "Nom", "Prénom", "Email", "Niveau", "Statut", "Date"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(getHeaderStyle(workbook));
            }
            int rowNum = 1;
            for (Inscription ins : inscriptions) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(ins.getId());
                row.createCell(1).setCellValue(ins.getMatricule());
                row.createCell(2).setCellValue(ins.getNom());
                row.createCell(3).setCellValue(ins.getPrenom());
                row.createCell(4).setCellValue(ins.getEmail());
                row.createCell(5).setCellValue(ins.getNiveau());
                row.createCell(6).setCellValue(ins.getStatut() != null ? ins.getStatut().name() : "");
                row.createCell(7).setCellValue(ins.getCreeLe() != null ? ins.getCreeLe().toString() : "");
            }
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }
            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exporterInscriptionsValidees(Long universiteId) throws IOException {
        List<Inscription> inscriptions = inscriptionRepository.findByUniversiteIdAndStatut(universiteId, StatutInscription.VALIDE);
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Inscriptions validées");
            Row header = sheet.createRow(0);
            String[] columns = {"ID", "Matricule", "Nom", "Prénom", "Email", "Téléphone", "Filière", "Promotion", "Date inscription"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(getHeaderStyle(workbook));
            }
            int rowNum = 1;
            for (Inscription ins : inscriptions) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(ins.getId());
                row.createCell(1).setCellValue(ins.getMatricule());
                row.createCell(2).setCellValue(ins.getNom());
                row.createCell(3).setCellValue(ins.getPrenom());
                row.createCell(4).setCellValue(ins.getEmail());
                row.createCell(5).setCellValue(ins.getTelephone());
                row.createCell(6).setCellValue(ins.getFiliere() != null ? ins.getFiliere().getNom() : "");
                row.createCell(7).setCellValue(ins.getPromotion() != null ? ins.getPromotion().getLibelle() : "");
                row.createCell(8).setCellValue(ins.getCreeLe() != null ? ins.getCreeLe().toString() : "");
            }
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private CellStyle getHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }
}