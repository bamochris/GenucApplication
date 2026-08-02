package cd.genuc.service;

import cd.genuc.model.Cours;
import cd.genuc.model.Inscription;
import cd.genuc.model.Note;
import cd.genuc.model.Note.StatutNote;
import cd.genuc.repository.CoursRepository;
import cd.genuc.repository.InscriptionRepository;
import cd.genuc.repository.NoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImportExportService {

    private final NoteRepository noteRepo;
    private final CoursRepository coursRepo;
    private final InscriptionRepository inscriptionRepo;

    @Transactional
    public Map<String, Object> importerNotes(MultipartFile file, Long coursId, String anneeAcademique, Long professeurId) throws IOException {
        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.endsWith(".xlsx") && !filename.endsWith(".xls"))) {
            throw new RuntimeException("Format de fichier non supporté. Utilisez .xlsx ou .xls");
        }

        Cours cours = coursRepo.findById(coursId)
                .orElseThrow(() -> new RuntimeException("Cours introuvable"));

        List<Map<String, Object>> resultats = new ArrayList<>();
        int ligneImportees = 0;
        int erreurs = 0;
        List<String> erreursMessages = new ArrayList<>();

        try (InputStream inputStream = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(inputStream)) {

            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(0);

            if (headerRow == null) {
                throw new RuntimeException("Fichier vide ou mal formaté (aucune ligne d'en-tête)");
            }

            Map<String, Integer> colonnes = detecterColonnes(headerRow);

            if (!colonnes.containsKey("MATRICULE")) {
                throw new RuntimeException("Colonne 'MATRICULE' obligatoire non trouvée");
            }

            List<String> matricules = new ArrayList<>();
            Map<Integer, String> matriculeParLigne = new HashMap<>();
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                String matricule = getCellValueAsString(row.getCell(colonnes.get("MATRICULE")));
                if (matricule != null && !matricule.trim().isEmpty()) {
                    matricules.add(matricule.trim());
                    matriculeParLigne.put(i, matricule.trim());
                }
            }

            List<Inscription> inscriptionsTrouvees = inscriptionRepo.findByMatriculeIn(matricules);
            Map<String, Inscription> mapInscriptions = inscriptionsTrouvees.stream()
                    .collect(Collectors.toMap(Inscription::getMatricule, ins -> ins));

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                try {
                    String matricule = matriculeParLigne.get(i);
                    if (matricule == null) {
                        erreurs++;
                        erreursMessages.add("Ligne " + (i + 1) + " : Matricule manquant");
                        continue;
                    }

                    Inscription inscription = mapInscriptions.get(matricule);
                    if (inscription == null) {
                        erreurs++;
                        erreursMessages.add("Ligne " + (i + 1) + " : Matricule '" + matricule + "' introuvable");
                        continue;
                    }

                    Note note = noteRepo.findByInscriptionIdAndCoursIdAndAnneeAcademique(
                                    inscription.getId(), coursId, anneeAcademique)
                            .orElse(Note.builder()
                                    .inscription(inscription)
                                    .cours(cours)
                                    .universite(inscription.getUniversite())
                                    .anneeAcademique(anneeAcademique)
                                    .session(1)
                                    .credits(cours.getCredits())
                                    .noteMax(20.0)
                                    .statut(StatutNote.EN_COURS)
                                    .build());

                    if (colonnes.containsKey("NOTE_TP")) {
                        String val = getCellValueAsString(row.getCell(colonnes.get("NOTE_TP")));
                        if (val != null && !val.isEmpty()) {
                            note.setNoteTP(Double.parseDouble(val));
                        }
                    }
                    if (colonnes.containsKey("NOTE_INTERRO")) {
                        String val = getCellValueAsString(row.getCell(colonnes.get("NOTE_INTERRO")));
                        if (val != null && !val.isEmpty()) {
                            note.setNoteInterrogation(Double.parseDouble(val));
                        }
                    }
                    if (colonnes.containsKey("NOTE_EXAMEN")) {
                        String val = getCellValueAsString(row.getCell(colonnes.get("NOTE_EXAMEN")));
                        if (val != null && !val.isEmpty()) {
                            note.setNoteExamen(Double.parseDouble(val));
                        }
                    }
                    if (colonnes.containsKey("APPRECIATION")) {
                        String val = getCellValueAsString(row.getCell(colonnes.get("APPRECIATION")));
                        if (val != null && !val.isEmpty()) {
                            note.setAppreciation(val);
                        }
                    }

                    note.setProfesseurId(professeurId);
                    note.calculerNoteFinale();
                    note.setStatut(StatutNote.SOUMISE);

                    noteRepo.save(note);
                    ligneImportees++;

                    Map<String, Object> resultat = new LinkedHashMap<>();
                    resultat.put("matricule", matricule);
                    resultat.put("nom", inscription.getPrenom() + " " + inscription.getNom());
                    resultat.put("noteFinale", note.getNoteFinale());
                    resultat.put("mention", note.getMention() != null ? note.getMention().name() : "—");
                    resultat.put("statut", "IMPORTEE");
                    resultats.add(resultat);

                } catch (Exception e) {
                    erreurs++;
                    erreursMessages.add("Ligne " + (i + 1) + " : " + e.getMessage());
                    log.error("Erreur import ligne {} : {}", i + 1, e.getMessage());
                }
            }
        }

        return Map.of(
                "ligneImportees", ligneImportees,
                "erreurs", erreurs,
                "erreursMessages", erreursMessages,
                "resultats", resultats,
                "totalLignes", ligneImportees + erreurs
        );
    }

    public byte[] exporterNotesCours(Long coursId, String anneeAcademique) throws IOException {
        Cours cours = coursRepo.findById(coursId)
                .orElseThrow(() -> new RuntimeException("Cours introuvable"));

        List<Note> notes = noteRepo.findByCoursIdAndAnneeAcademique(coursId, anneeAcademique);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Notes");

            Row header = sheet.createRow(0);
            String[] columns = {"Matricule", "Nom", "Prénom", "TP", "Interrogation", "Examen", "Finale", "Mention"};
            CellStyle headerStyle = getHeaderStyle(workbook);
            for (int i = 0; i < columns.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            for (Note note : notes) {
                Inscription ins = note.getInscription();
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(ins.getMatricule());
                row.createCell(1).setCellValue(ins.getNom());
                row.createCell(2).setCellValue(ins.getPrenom());
                row.createCell(3).setCellValue(note.getNoteTP() != null ? note.getNoteTP() : 0);
                row.createCell(4).setCellValue(note.getNoteInterrogation() != null ? note.getNoteInterrogation() : 0);
                row.createCell(5).setCellValue(note.getNoteExamen() != null ? note.getNoteExamen() : 0);
                row.createCell(6).setCellValue(note.getNoteFinale() != null ? note.getNoteFinale() : 0);
                row.createCell(7).setCellValue(note.getMention() != null ? note.getMention().name() : "-");
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exporterNotesEtudiant(Long inscriptionId, String anneeAcademique) throws IOException {
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

        List<Note> notes = noteRepo.findByInscriptionIdAndAnneeAcademique(inscriptionId, anneeAcademique);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Notes " + inscription.getMatricule());

            Row header = sheet.createRow(0);
            String[] columns = {"Cours", "Crédits", "TP", "Interrogation", "Examen", "Finale", "Mention"};
            CellStyle headerStyle = getHeaderStyle(workbook);
            for (int i = 0; i < columns.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            for (Note note : notes) {
                Cours cours = note.getCours();
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(cours != null ? cours.getTitre() : "-");
                row.createCell(1).setCellValue(cours != null && cours.getCredits() != null ? cours.getCredits() : 0);
                row.createCell(2).setCellValue(note.getNoteTP() != null ? note.getNoteTP() : 0);
                row.createCell(3).setCellValue(note.getNoteInterrogation() != null ? note.getNoteInterrogation() : 0);
                row.createCell(4).setCellValue(note.getNoteExamen() != null ? note.getNoteExamen() : 0);
                row.createCell(5).setCellValue(note.getNoteFinale() != null ? note.getNoteFinale() : 0);
                row.createCell(6).setCellValue(note.getMention() != null ? note.getMention().name() : "-");
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exporterModeleImport() throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Modele_Import_Notes");

            Row header = sheet.createRow(0);
            String[] columns = {"MATRICULE", "NOTE_TP", "NOTE_INTERRO", "NOTE_EXAMEN", "APPRECIATION"};
            CellStyle headerStyle = getHeaderStyle(workbook);
            for (int i = 0; i < columns.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            Row example = sheet.createRow(1);
            example.createCell(0).setCellValue("UNI202600001");
            example.createCell(1).setCellValue(12.5);
            example.createCell(2).setCellValue(14.0);
            example.createCell(3).setCellValue(16.0);
            example.createCell(4).setCellValue("Bon travail");

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

    private Map<String, Integer> detecterColonnes(Row headerRow) {
        Map<String, Integer> colonnes = new LinkedHashMap<>();
        for (Cell cell : headerRow) {
            String valeur = getCellValueAsString(cell);
            if (valeur == null) continue;
            String upper = valeur.toUpperCase().trim();
            if (upper.contains("MATRICULE")) {
                colonnes.put("MATRICULE", cell.getColumnIndex());
            } else if (upper.contains("TP") || upper.contains("CONTINU")) {
                colonnes.put("NOTE_TP", cell.getColumnIndex());
            } else if (upper.contains("INTERRO") || upper.contains("ORAL")) {
                colonnes.put("NOTE_INTERRO", cell.getColumnIndex());
            } else if (upper.contains("EXAMEN") || upper.contains("SESSION")) {
                colonnes.put("NOTE_EXAMEN", cell.getColumnIndex());
            } else if (upper.contains("APPRECIATION") || upper.contains("COMMENTAIRE") || upper.contains("OBSERVATION")) {
                colonnes.put("APPRECIATION", cell.getColumnIndex());
            }
        }
        return colonnes;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                double val = cell.getNumericCellValue();
                yield val == Math.floor(val) ? String.valueOf((long) val) : String.valueOf(val);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try {
                    yield String.valueOf(cell.getNumericCellValue());
                } catch (Exception e) {
                    yield cell.getStringCellValue();
                }
            }
            default -> null;
        };
    }
}