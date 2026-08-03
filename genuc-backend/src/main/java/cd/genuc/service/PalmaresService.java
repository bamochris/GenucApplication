package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.model.MeilleurEtudiant.StatutPalmares;
import cd.genuc.repository.*;
import cd.genuc.util.PdfGenerateur;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.HorizontalAlignment;
import com.itextpdf.layout.properties.TextAlignment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PalmaresService {

    private final MeilleurEtudiantRepository meilleurRepo;
    private final ParametrePalmaresRepository parametreRepo;
    private final DeliberationRepository deliberationRepo;
    private final InscriptionRepository inscriptionRepo;
    private final NoteRepository noteRepo;
    private final UtilisateurRepository utilisateurRepo;
    private final UniversiteRepository universiteRepo;
    private final EmailService emailService;
    private final PdfGenerateur pdfGenerateur;

    @Value("${app.base-url:http://localhost:3000}")
    private String baseUrl;

    public ParametrePalmares getParametres(Long universiteId, String annee) {
        return parametreRepo.findByUniversite_IdAndAnneeAcademique(universiteId, annee)
                .orElseThrow(() -> new RuntimeException("Paramètres Palmares introuvables"));
    }

    @Transactional
    public ParametrePalmares creerOuModifierParametres(ParametrePalmares parametres) {
        Optional<ParametrePalmares> existing = parametreRepo
                .findByUniversite_IdAndAnneeAcademique(parametres.getUniversite().getId(), parametres.getAnneeAcademique());
        if (existing.isPresent()) {
            ParametrePalmares p = existing.get();
            p.setNiveauxCibles(parametres.getNiveauxCibles());
            p.setSeuilMoyenne(parametres.getSeuilMoyenne());
            p.setTopNParFiliere(parametres.getTopNParFiliere());
            p.setDateGeneration(parametres.getDateGeneration());
            p.setAutoGeneration(parametres.getAutoGeneration());
            p.setEmailTemplate(parametres.getEmailTemplate());
            return parametreRepo.save(p);
        }
        return parametreRepo.save(parametres);
    }

    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void genererPalmaresAutomatique() {
        log.info("Début de la génération automatique du palmarès...");
        LocalDate today = LocalDate.now();
        List<ParametrePalmares> parametres = parametreRepo.findByAutoGenerationTrueAndDateGenerationBefore(today);
        for (ParametrePalmares p : parametres) {
            try {
                log.info("Génération du palmarès pour l'université {} - année {}",
                        p.getUniversite().getNom(), p.getAnneeAcademique());
                genererPalmares(p);
            } catch (Exception e) {
                log.error("Erreur lors de la génération du palmarès pour {} : {}",
                        p.getUniversite().getNom(), e.getMessage());
            }
        }
        log.info("Fin de la génération automatique du palmarès.");
    }

    @Transactional
    public Map<String, Object> genererPalmares(ParametrePalmares param) {
        String annee = param.getAnneeAcademique();
        Long universiteId = param.getUniversite().getId();
        double seuil = param.getSeuilMoyenne();
        int topN = param.getTopNParFiliere();
        String niveaux = param.getNiveauxCibles();
        List<String> niveauxList = Arrays.asList(niveaux.split(","));

        List<Inscription> inscriptionsCibles = new ArrayList<>();
        for (String niveau : niveauxList) {
            inscriptionsCibles.addAll(
                    inscriptionRepo.findByStatutAndNiveauAndAnneeAcademique(StatutInscription.VALIDE, niveau, annee)
            );
        }

        Map<Filiere, List<Inscription>> parFiliere = inscriptionsCibles.stream()
                .filter(ins -> ins.getFiliere() != null)
                .collect(Collectors.groupingBy(Inscription::getFiliere));

        List<MeilleurEtudiant> nouveaux = new ArrayList<>();

        for (Map.Entry<Filiere, List<Inscription>> entry : parFiliere.entrySet()) {
            Filiere filiere = entry.getKey();
            List<Inscription> etudiants = entry.getValue();

            List<EtudiantMoyenne> moyennes = new ArrayList<>();
            for (Inscription ins : etudiants) {
                Deliberation delib = deliberationRepo
                        .findByInscriptionIdAndAnneeAcademique(ins.getId(), annee)
                        .orElse(null);
                if (delib == null || delib.getStatut() != Deliberation.StatutDeliberation.PUBLIEE) {
                    continue;
                }
                Double moyenne = noteRepo.calculerMoyenneGenerale(ins.getId(), annee);
                if (moyenne != null && moyenne >= seuil) {
                    if (delib.getMention() != null) {
                        String mention = delib.getMention().name();
                        if (mention.equals("DISTINCTION") || mention.equals("GRANDE_DISTINCTION")
                                || mention.equals("TRES_GRANDE_DISTINCTION")) {
                            moyennes.add(new EtudiantMoyenne(ins, moyenne, delib.getMention()));
                        }
                    }
                }
            }

            moyennes.sort((a, b) -> Double.compare(b.moyenne, a.moyenne));

            int rang = 1;
            for (EtudiantMoyenne em : moyennes) {
                if (rang > topN) break;
                Inscription ins = em.inscription;
                Etudiant etudiant = ins.getEtudiant();

                Optional<MeilleurEtudiant> existing = meilleurRepo
                        .findByEmailAndAnneeObtentionAndStatut(etudiant.getEmail(), annee, StatutPalmares.EN_ATTENTE);
                if (existing.isEmpty()) {
                    MeilleurEtudiant me = MeilleurEtudiant.builder()
                            .nomComplet(etudiant.getPrenom() + " " + etudiant.getNom())
                            .email(etudiant.getEmail())
                            .telephone(etudiant.getTelephone())
                            .biographie(genererBiographie(etudiant, ins, em.moyenne, em.mention))
                            .photoUrl(etudiant.getPhotoUrl())
                            .universiteNom(ins.getUniversite().getNom())
                            .filiereNom(filiere.getNom())
                            .niveau(ins.getNiveau())
                            .anneeObtention(annee)
                            .moyenneGenerale(em.moyenne)
                            .mention(em.mention.name())
                            .rang(rang)
                            .statut(StatutPalmares.EN_ATTENTE)
                            .publie(false)
                            .build();
                    nouveaux.add(me);
                }
                rang++;
            }
        }

        if (!nouveaux.isEmpty()) {
            meilleurRepo.saveAll(nouveaux);
            log.info("{} nouveaux lauréats en attente de validation", nouveaux.size());
        }

        return Map.of(
                "message", "Palmares généré avec succès",
                "total", nouveaux.size(),
                "annee", annee,
                "statut", "EN_ATTENTE_VALIDATION"
        );
    }

    @Transactional
    public MeilleurEtudiant validerLauréat(Long id, Long adminId) {
        MeilleurEtudiant me = obtenir(id);
        if (me.getStatut() != StatutPalmares.EN_ATTENTE) {
            throw new RuntimeException("Ce lauréat n'est plus en attente de validation.");
        }
        me.setStatut(StatutPalmares.VALIDE);
        me.setPublie(true);
        me.setDateValidation(LocalDate.now());
        me.setValideParId(adminId);
        if (adminId != null) {
            utilisateurRepo.findById(adminId).ifPresent(u -> me.setValideParNom(u.getNomComplet()));
        }
        meilleurRepo.save(me);

        try {
            genererCertificat(me.getId());
        } catch (Exception e) {
            log.error("Erreur lors de la génération du certificat : {}", e.getMessage());
        }
        notifierLauréat(me);

        return me;
    }

    @Transactional
    public MeilleurEtudiant rejeterLauréat(Long id, String motif) {
        MeilleurEtudiant me = obtenir(id);
        if (me.getStatut() != StatutPalmares.EN_ATTENTE) {
            throw new RuntimeException("Ce lauréat n'est plus en attente de validation.");
        }
        me.setStatut(StatutPalmares.REJETE);
        me.setPublie(false);
        me.setMotifRejet(motif);
        return meilleurRepo.save(me);
    }

    @Transactional
    public MeilleurEtudiant validerLot(List<Long> ids, Long adminId) {
        for (Long id : ids) {
            validerLauréat(id, adminId);
        }
        return null;
    }

    @Transactional
    public String genererCertificat(Long id) throws Exception {
        MeilleurEtudiant me = obtenir(id);
        if (me.getStatut() != StatutPalmares.VALIDE) {
            throw new RuntimeException("Seul un lauréat validé peut recevoir un certificat.");
        }

        byte[] pdfBytes = genererPdfCertificat(me);
        String filename = "certificat_" + me.getId() + "_" + System.currentTimeMillis() + ".pdf";
        String path = "uploads/certificats/" + filename;
        java.nio.file.Files.write(java.nio.file.Paths.get(path), pdfBytes);

        me.setCertificatUrl("/uploads/certificats/" + filename);
        meilleurRepo.save(me);

        return me.getCertificatUrl();
    }

    private byte[] genererPdfCertificat(MeilleurEtudiant me) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdfDoc = new PdfDocument(writer);
        Document document = new Document(pdfDoc, PageSize.A4);

        DeviceRgb bleu = new DeviceRgb(11, 31, 74);
        DeviceRgb or = new DeviceRgb(212, 175, 55);

        PdfFont bold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
        PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);
        PdfFont italic = PdfFontFactory.createFont(StandardFonts.HELVETICA_OBLIQUE);

        document.add(new Paragraph("CERTIFICAT DE MÉRITE")
                .setFont(bold).setFontSize(24).setFontColor(or)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(10));

        document.add(new Paragraph("GENUC — Académie Intégrale")
                .setFont(bold).setFontSize(14).setFontColor(bleu)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(20));

        document.add(new Paragraph("République Démocratique du Congo")
                .setFont(regular).setFontSize(12)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(30));

        document.add(new Paragraph("Le présent certificat est décerné à")
                .setFont(regular).setFontSize(12)
                .setTextAlignment(TextAlignment.CENTER));

        document.add(new Paragraph(me.getNomComplet().toUpperCase())
                .setFont(bold).setFontSize(18).setFontColor(bleu)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(10));

        document.add(new Paragraph("pour son excellence académique")
                .setFont(regular).setFontSize(12)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(10));

        String mention = me.getMention().replace("_", " ");
        document.add(new Paragraph(
                String.format("Avec une moyenne de %.2f/20 et une mention %s", me.getMoyenneGenerale(), mention))
                .setFont(regular).setFontSize(12)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(10));

        document.add(new Paragraph(
                String.format("%s - %s", me.getFiliereNom(), me.getUniversiteNom()))
                .setFont(regular).setFontSize(11)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(5));

        document.add(new Paragraph(
                String.format("Année académique %s - Rang %d", me.getAnneeObtention(), me.getRang()))
                .setFont(italic).setFontSize(10)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(5));

        try {
            String qrContent = baseUrl + "/verifier/" + me.getEmail() + "/" + me.getAnneeObtention();
            byte[] qrBytes = pdfGenerateur.genererQrCode(qrContent, 80);
            Image qrImage = new Image(ImageDataFactory.create(qrBytes));
            qrImage.setWidth(80).setHeight(80);
            qrImage.setHorizontalAlignment(HorizontalAlignment.CENTER);
            document.add(qrImage);
        } catch (Exception e) {
            log.warn("Impossible de générer le QR code : {}", e.getMessage());
        }

        document.add(new Paragraph("Délivré le " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                .setFont(regular).setFontSize(9).setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(20));

        document.add(new Paragraph(
                "Vérifiable sur " + baseUrl + "/verifier/" + me.getEmail() + "/" + me.getAnneeObtention())
                .setFont(italic).setFontSize(8).setFontColor(ColorConstants.GRAY)
                .setTextAlignment(TextAlignment.CENTER));

        document.close();
        return baos.toByteArray();
    }

    @Transactional
    public void notifierLauréat(MeilleurEtudiant me) {
        if (me.getNotifie()) return;

        try {
            String subject = "🏆 Félicitations ! Vous faites partie du palmarès GENUC !";
            String body = String.format("""
                    Cher(e) %s,

                    Nous avons le plaisir de vous annoncer que vous avez été sélectionné(e)
                    parmi les meilleurs étudiants de l'année académique %s.

                    Mention obtenue : %s
                    Moyenne : %.2f/20
                    Rang : %d

                    Vous pouvez télécharger votre certificat de mérite depuis votre espace étudiant.

                    Consultez le palmarès complet : %s/palmares

                    Toutes nos félicitations !

                    L'équipe GENUC
                    """,
                    me.getNomComplet(),
                    me.getAnneeObtention(),
                    me.getMention(),
                    me.getMoyenneGenerale(),
                    me.getRang(),
                    baseUrl
            );

            emailService.envoyerEmail(me.getEmail(), subject, body);

            me.setNotifie(true);
            me.setDateNotification(LocalDate.now());
            meilleurRepo.save(me);

        } catch (Exception e) {
            log.error("Erreur lors de la notification du lauréat {} : {}", me.getEmail(), e.getMessage());
        }
    }

    @Transactional
    public void notifierTousLesLauréats() {
        List<MeilleurEtudiant> laureats = meilleurRepo.findByStatut(StatutPalmares.VALIDE);
        for (MeilleurEtudiant me : laureats) {
            if (!me.getNotifie()) {
                notifierLauréat(me);
            }
        }
    }

    public List<MeilleurEtudiant> getPalmaresPublic() {
        return meilleurRepo.findByPublieTrueAndStatutOrderByAnneeObtentionDescRangAsc(StatutPalmares.VALIDE);
    }

    public List<MeilleurEtudiant> getEnAttente() {
        return meilleurRepo.findByStatut(StatutPalmares.EN_ATTENTE);
    }

    public List<MeilleurEtudiant> getPalmaresParFiltres(String annee, String universite, String filiere) {
        List<MeilleurEtudiant> resultats = meilleurRepo.findByAnneeObtentionAndStatutOrderByRangAsc(annee, StatutPalmares.VALIDE);
        if (universite != null && !universite.isEmpty()) {
            resultats = resultats.stream()
                    .filter(m -> m.getUniversiteNom().equalsIgnoreCase(universite))
                    .collect(Collectors.toList());
        }
        if (filiere != null && !filiere.isEmpty()) {
            resultats = resultats.stream()
                    .filter(m -> m.getFiliereNom().equalsIgnoreCase(filiere))
                    .collect(Collectors.toList());
        }
        return resultats;
    }

    public List<String> getAnneesDisponibles() {
        return meilleurRepo.findAll().stream()
                .map(MeilleurEtudiant::getAnneeObtention)
                .distinct()
                .sorted((a, b) -> b.compareTo(a))
                .collect(Collectors.toList());
    }

    public Map<String, Object> getStatistiquesPalmares(Long universiteId) {
        String uniNom = universiteRepo.findById(universiteId)
                .map(Universite::getNom)
                .orElse("");

        List<MeilleurEtudiant> laureats = meilleurRepo.findAll().stream()
                .filter(m -> m.getUniversiteNom().equals(uniNom))
                .filter(m -> m.getStatut() == StatutPalmares.VALIDE)
                .collect(Collectors.toList());

        Map<String, Long> parAnnee = laureats.stream()
                .collect(Collectors.groupingBy(MeilleurEtudiant::getAnneeObtention, Collectors.counting()));

        Map<String, Long> parMention = laureats.stream()
                .collect(Collectors.groupingBy(MeilleurEtudiant::getMention, Collectors.counting()));

        Map<String, Long> parFiliere = laureats.stream()
                .collect(Collectors.groupingBy(MeilleurEtudiant::getFiliereNom, Collectors.counting()));

        return Map.of(
                "totalLaureats", laureats.size(),
                "parAnnee", parAnnee,
                "parMention", parMention,
                "parFiliere", parFiliere,
                "dernieresAnnees", laureats.stream()
                        .limit(5)
                        .map(m -> Map.of(
                                "nom", m.getNomComplet(),
                                "annee", m.getAnneeObtention(),
                                "mention", m.getMention()
                        ))
                        .collect(Collectors.toList())
        );
    }

    public byte[] exporterPalmaresExcel(String annee, Long universiteId) throws Exception {
        List<MeilleurEtudiant> laureats = getPalmaresParFiltres(annee, null, null);
        if (universiteId != null) {
            String uniNom = universiteRepo.findById(universiteId).map(Universite::getNom).orElse("");
            laureats = laureats.stream()
                    .filter(m -> m.getUniversiteNom().equals(uniNom))
                    .collect(Collectors.toList());
        }

        try (XSSFWorkbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Palmares");
            Row header = sheet.createRow(0);
            String[] columns = {"Rang", "Nom complet", "Université", "Filière", "Niveau", "Moyenne", "Mention", "Année"};
            CellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            for (int i = 0; i < columns.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            for (MeilleurEtudiant m : laureats) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(m.getRang());
                row.createCell(1).setCellValue(m.getNomComplet());
                row.createCell(2).setCellValue(m.getUniversiteNom());
                row.createCell(3).setCellValue(m.getFiliereNom());
                row.createCell(4).setCellValue(m.getNiveau());
                row.createCell(5).setCellValue(m.getMoyenneGenerale());
                row.createCell(6).setCellValue(m.getMention());
                row.createCell(7).setCellValue(m.getAnneeObtention());
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public MeilleurEtudiant obtenir(Long id) {
        return meilleurRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Lauréat introuvable"));
    }

    private String genererBiographie(Etudiant etudiant, Inscription ins, double moyenne, Note.MentionNote mention) {
        return String.format("%s %s a obtenu son diplôme de %s avec une mention %s (moyenne %.2f/20). " +
                "Issu de l'université %s, il/elle s'est distingué(e) par son excellence académique.",
                etudiant.getPrenom(), etudiant.getNom(), ins.getFiliere().getNom(),
                mention.name().replace("_", " "), moyenne, ins.getUniversite().getNom());
    }

    private static class EtudiantMoyenne {
        Inscription inscription;
        double moyenne;
        Note.MentionNote mention;
        EtudiantMoyenne(Inscription i, double m, Note.MentionNote mention) {
            this.inscription = i; this.moyenne = m; this.mention = mention;
        }
    }
}