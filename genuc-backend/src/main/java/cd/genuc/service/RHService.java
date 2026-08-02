package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.model.ValidationPaie.StatutValidation;
import cd.genuc.repository.*;
import cd.genuc.util.PdfGenerateur;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class RHService {

    private final PersonnelRepository personnelRepo;
    private final ContratRepository contratRepo;
    private final PresencePersonnelRepository presenceRepo;
    private final PaieRepository paieRepo;
    private final ValidationPaieRepository validationPaieRepo;
    private final UniversiteRepository universiteRepo;
    private final DepartementRepository departementRepo;
    private final PdfGenerateur pdfGenerateur;

    // ─── 1. PERSONNEL ──────────────────────────────────────────────

    public List<Personnel> getPersonnelParUniversite(Long universiteId) {
        return personnelRepo.findByUniversiteId(universiteId);
    }

    public List<Personnel> getPersonnelParDepartement(Long departementId) {
        return personnelRepo.findByDepartementId(departementId);
    }

    public Personnel getPersonnel(Long id) {
        return personnelRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Personnel introuvable"));
    }

    @Transactional
    public Personnel creerPersonnel(Personnel personnel) {
        if (personnelRepo.existsByEmail(personnel.getEmail())) {
            throw new RuntimeException("Un employé avec cet email existe déjà");
        }
        return personnelRepo.save(personnel);
    }

    /**
     * Rattache un agent à son établissement (et éventuellement à son
     * département) avant de l'enregistrer.
     *
     * <p>{@code Personnel.universite} et {@code Personnel.departement} sont
     * annotés {@code @JsonIgnore} : le rattachement ne peut pas arriver par le
     * corps JSON, alors que la colonne {@code universite_id} est
     * {@code NOT NULL}. Sans cette résolution côté serveur, toute création
     * échouait sur une violation de contrainte, quel que soit le client —
     * portail web compris.
     */
    @Transactional
    public Personnel creerPersonnel(Personnel personnel, Long universiteId, Long departementId) {
        if (universiteId == null) {
            throw new RuntimeException("L'établissement de rattachement est requis");
        }

        personnel.setUniversite(universiteRepo.findById(universiteId)
                .orElseThrow(() -> new RuntimeException("Établissement introuvable")));

        if (departementId != null) {
            personnel.setDepartement(departementRepo.findById(departementId)
                    .orElseThrow(() -> new RuntimeException("Département introuvable")));
        }

        return creerPersonnel(personnel);
    }

    @Transactional
    public Personnel modifierPersonnel(Long id, Personnel details) {
        Personnel existing = getPersonnel(id);
        existing.setNom(details.getNom());
        existing.setPrenom(details.getPrenom());
        existing.setEmail(details.getEmail());
        existing.setTelephone(details.getTelephone());
        existing.setDateNaissance(details.getDateNaissance());
        existing.setLieuNaissance(details.getLieuNaissance());
        existing.setSexe(details.getSexe());
        existing.setAdresse(details.getAdresse());
        existing.setType(details.getType());
        existing.setStatut(details.getStatut());
        existing.setSpecialite(details.getSpecialite());
        existing.setGrade(details.getGrade());
        existing.setDescription(details.getDescription());
        existing.setDateFinContrat(details.getDateFinContrat());
        return personnelRepo.save(existing);
    }

    @Transactional
    public void changerStatut(Long id, Personnel.StatutPersonnel statut) {
        Personnel personnel = getPersonnel(id);
        personnel.setStatut(statut);
        personnelRepo.save(personnel);
    }

    // ─── 2. CONTRATS ──────────────────────────────────────────────

    public List<Contrat> getContratsParPersonnel(Long personnelId) {
        return contratRepo.findByPersonnelId(personnelId);
    }

    @Transactional
    public Contrat creerContrat(Contrat contrat) {
        contrat.setPersonnel(getPersonnel(contrat.getPersonnel().getId()));
        return contratRepo.save(contrat);
    }

    /**
     * Crée un contrat pour un agent désigné explicitement.
     *
     * <p>Même cause que pour la création d'un agent :
     * {@code Contrat.personnel} est {@code @JsonIgnore}, donc
     * {@code contrat.getPersonnel()} est toujours nul à la désérialisation et la
     * variante ci-dessus levait un {@code NullPointerException} avant même
     * d'atteindre la base.
     */
    @Transactional
    public Contrat creerContrat(Contrat contrat, Long personnelId) {
        if (personnelId == null) {
            throw new RuntimeException("L'agent concerné est requis");
        }
        contrat.setPersonnel(getPersonnel(personnelId));
        return contratRepo.save(contrat);
    }

    @Transactional
    public void resilierContrat(Long contratId) {
        Contrat contrat = contratRepo.findById(contratId)
                .orElseThrow(() -> new RuntimeException("Contrat introuvable"));
        contrat.setStatut(Contrat.StatutContrat.RESILIE);
        contrat.setDateFin(LocalDate.now());
        contratRepo.save(contrat);
    }

    // ─── 3. PRÉSENCES ─────────────────────────────────────────────

    public List<PresencePersonnel> getPresencesParPersonnel(Long personnelId, LocalDate debut, LocalDate fin) {
        return presenceRepo.findByPersonnelIdAndDatePresenceBetween(personnelId, debut, fin);
    }

    @Transactional
    public PresencePersonnel enregistrerPresence(Long personnelId, PresencePersonnel presence) {
        Personnel personnel = getPersonnel(personnelId);
        presence.setPersonnel(personnel);
        presence.setDatePresence(LocalDate.now());
        presence.setHeureArrivee(LocalTime.now());
        presence.setStatut(PresencePersonnel.StatutPresence.PRESENT);
        return presenceRepo.save(presence);
    }

    @Transactional
    public PresencePersonnel enregistrerDepart(Long presenceId) {
        PresencePersonnel presence = presenceRepo.findById(presenceId)
                .orElseThrow(() -> new RuntimeException("Présence introuvable"));
        presence.setHeureDepart(LocalTime.now());
        return presenceRepo.save(presence);
    }

    @Transactional
    public PresencePersonnel justifierAbsence(Long presenceId, String motif) {
        PresencePersonnel presence = presenceRepo.findById(presenceId)
                .orElseThrow(() -> new RuntimeException("Présence introuvable"));
        presence.setStatut(PresencePersonnel.StatutPresence.JUSTIFIE);
        presence.setMotifAbsence(motif);
        return presenceRepo.save(presence);
    }

    // ─── 4. PAIE ──────────────────────────────────────────────────

    @Transactional
    public Paie genererBulletinPaie(Long personnelId, String mois, Integer annee) {
        Personnel personnel = getPersonnel(personnelId);

        Contrat contrat = contratRepo.findByPersonnelIdAndStatut(personnelId, Contrat.StatutContrat.ACTIF)
                .orElseThrow(() -> new RuntimeException("Aucun contrat actif pour cet employé"));

        double salaireBase = contrat.getSalaireBase();
        double prime = calculerPrime(personnel);
        double heuresSup = calculerHeuresSupplementaires(personnelId, mois, annee);
        double indemnite = calculerIndemnite(personnel);

        double totalBrut = salaireBase + prime + heuresSup + indemnite;

        double retenueCnss = totalBrut * 0.05;
        double retenueImpots = totalBrut * 0.10;
        double retenueMutuelle = totalBrut * 0.02;
        double totalRetenues = retenueCnss + retenueImpots + retenueMutuelle;
        double netAPayer = totalBrut - totalRetenues;

        Paie paie = Paie.builder()
                .personnel(personnel)
                .mois(mois)
                .annee(annee)
                .salaireBase(salaireBase)
                .prime(prime)
                .heuresSupplementaires(heuresSup)
                .indemnite(indemnite)
                .totalBrut(totalBrut)
                .retenueCnss(retenueCnss)
                .retenueImpots(retenueImpots)
                .retenueMutuelle(retenueMutuelle)
                .totalRetenues(totalRetenues)
                .netAPayer(netAPayer)
                .statut(Paie.StatutPaie.EN_ATTENTE)
                .build();

        paie = paieRepo.save(paie);

        ValidationPaie validation = ValidationPaie.builder()
                .paie(paie)
                .creeParId(personnelId)
                .statut(StatutValidation.EN_ATTENTE)
                .build();
        validationPaieRepo.save(validation);

        // ✅ Correction ici : remplacement de getNomComplet()
        log.info("Bulletin de paie généré pour {} (ID: {})", personnel.getPrenom() + " " + personnel.getNom(), paie.getId());
        return paie;
    }

    @Transactional
    public Paie validerBulletinPaie(Long paieId, Long comptableId, String commentaire) {
        Paie paie = paieRepo.findById(paieId)
                .orElseThrow(() -> new RuntimeException("Bulletin introuvable"));

        ValidationPaie validation = validationPaieRepo.findByPaieId(paieId)
                .orElseThrow(() -> new RuntimeException("Validation introuvable"));

        if (validation.getStatut() != StatutValidation.EN_ATTENTE) {
            throw new RuntimeException("Ce bulletin n'est plus en attente de validation");
        }

        validation.setStatut(StatutValidation.VALIDE);
        validation.setValideParId(comptableId);
        validation.setDateValidation(LocalDateTime.now());
        validation.setCommentaire(commentaire);
        validationPaieRepo.save(validation);

        paie.setStatut(Paie.StatutPaie.PAYE);
        return paieRepo.save(paie);
    }

    @Transactional
    public Paie rejeterBulletinPaie(Long paieId, Long comptableId, String motif) {
        Paie paie = paieRepo.findById(paieId)
                .orElseThrow(() -> new RuntimeException("Bulletin introuvable"));

        ValidationPaie validation = validationPaieRepo.findByPaieId(paieId)
                .orElseThrow(() -> new RuntimeException("Validation introuvable"));

        if (validation.getStatut() != StatutValidation.EN_ATTENTE) {
            throw new RuntimeException("Ce bulletin n'est plus en attente de validation");
        }

        validation.setStatut(StatutValidation.REJETE);
        validation.setValideParId(comptableId);
        validation.setDateValidation(LocalDateTime.now());
        validation.setCommentaire(motif);
        validationPaieRepo.save(validation);

        paie.setStatut(Paie.StatutPaie.EN_ATTENTE);
        return paieRepo.save(paie);
    }

    @Transactional
    public Paie marquerPaiePayee(Long paieId) {
        Paie paie = paieRepo.findById(paieId)
                .orElseThrow(() -> new RuntimeException("Bulletin introuvable"));

        ValidationPaie validation = validationPaieRepo.findByPaieId(paieId)
                .orElseThrow(() -> new RuntimeException("Validation introuvable"));

        if (validation.getStatut() != StatutValidation.VALIDE) {
            throw new RuntimeException("Le bulletin doit d'abord être validé par la comptabilité");
        }

        paie.setStatut(Paie.StatutPaie.PAYE);
        paie.setDatePaiement(LocalDate.now());
        return paieRepo.save(paie);
    }

    public List<Paie> getPaiesParPersonnel(Long personnelId) {
        return paieRepo.findByPersonnelIdOrderByAnneeDescMoisDesc(personnelId);
    }

    public List<ValidationPaie> getBulletinsEnAttenteValidation(Long universiteId) {
        if (universiteId != null) {
            return validationPaieRepo.findByStatut(StatutValidation.EN_ATTENTE).stream()
                    .filter(v -> v.getPaie().getPersonnel().getUniversite().getId().equals(universiteId))
                    .toList();
        }
        return validationPaieRepo.findByStatut(StatutValidation.EN_ATTENTE);
    }

    // ─── 5. PDF ────────────────────────────────────────────────────

    public byte[] genererBulletinPdf(Long paieId) throws Exception {
        Paie paie = paieRepo.findById(paieId)
                .orElseThrow(() -> new RuntimeException("Bulletin introuvable"));

        Personnel personnel = paie.getPersonnel();
        Universite universite = personnel.getUniversite();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        com.itextpdf.kernel.pdf.PdfWriter writer = new com.itextpdf.kernel.pdf.PdfWriter(baos);
        com.itextpdf.kernel.pdf.PdfDocument pdfDoc = new com.itextpdf.kernel.pdf.PdfDocument(writer);
        com.itextpdf.layout.Document document = new com.itextpdf.layout.Document(pdfDoc, com.itextpdf.kernel.geom.PageSize.A4);
        document.setMargins(40, 40, 40, 40);

        com.itextpdf.kernel.font.PdfFont bold = com.itextpdf.kernel.font.PdfFontFactory
                .createFont(com.itextpdf.io.font.constants.StandardFonts.HELVETICA_BOLD);
        com.itextpdf.kernel.font.PdfFont regular = com.itextpdf.kernel.font.PdfFontFactory
                .createFont(com.itextpdf.io.font.constants.StandardFonts.HELVETICA);

        document.add(new com.itextpdf.layout.element.Paragraph("BULLETIN DE PAIE – " + paie.getMois() + " " + paie.getAnnee())
                .setFont(bold).setFontSize(16).setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER));
        document.add(new com.itextpdf.layout.element.Paragraph("GENUC – " + universite.getNom())
                .setFont(regular).setFontSize(12).setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER));
        document.add(new com.itextpdf.layout.element.Paragraph("N° " + paie.getNumeroBulletin())
                .setFont(regular).setFontSize(10).setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER));
        document.add(new com.itextpdf.layout.element.Paragraph("\n"));

        com.itextpdf.layout.element.Table infoTable = new com.itextpdf.layout.element.Table(
                com.itextpdf.layout.properties.UnitValue.createPercentArray(new float[]{30, 70}))
                .setWidth(com.itextpdf.layout.properties.UnitValue.createPercentValue(100))
                .setMarginBottom(20);

        addInfoRow(infoTable, "Employé", personnel.getPrenom() + " " + personnel.getNom(), bold, regular);
        addInfoRow(infoTable, "Matricule", personnel.getMatriculePersonnel(), bold, regular);
        addInfoRow(infoTable, "Département", personnel.getDepartement() != null ? personnel.getDepartement().getNom() : "-", bold, regular);
        addInfoRow(infoTable, "Type", personnel.getType().name(), bold, regular);
        addInfoRow(infoTable, "Grade", personnel.getGrade() != null ? personnel.getGrade() : "-", bold, regular);

        document.add(infoTable);

        com.itextpdf.layout.element.Table salaryTable = new com.itextpdf.layout.element.Table(
                com.itextpdf.layout.properties.UnitValue.createPercentArray(new float[]{60, 40}))
                .setWidth(com.itextpdf.layout.properties.UnitValue.createPercentValue(100))
                .setMarginBottom(20);

        addRow(salaryTable, "Salaire de base", String.format("%.2f USD", paie.getSalaireBase()), bold, regular);
        addRow(salaryTable, "Prime", String.format("%.2f USD", paie.getPrime()), bold, regular);
        addRow(salaryTable, "Heures supplémentaires", String.format("%.2f USD", paie.getHeuresSupplementaires()), bold, regular);
        addRow(salaryTable, "Indemnités", String.format("%.2f USD", paie.getIndemnite()), bold, regular);
        addRow(salaryTable, "TOTAL BRUT", String.format("%.2f USD", paie.getTotalBrut()), bold, regular);
        addRow(salaryTable, "Retenue CNSS", String.format("%.2f USD", paie.getRetenueCnss()), bold, regular);
        addRow(salaryTable, "Retenue Impôts", String.format("%.2f USD", paie.getRetenueImpots()), bold, regular);
        addRow(salaryTable, "Retenue Mutuelle", String.format("%.2f USD", paie.getRetenueMutuelle()), bold, regular);
        addRow(salaryTable, "TOTAL RETENUES", String.format("%.2f USD", paie.getTotalRetenues()), bold, regular);
        addRow(salaryTable, "NET À PAYER", String.format("%.2f USD", paie.getNetAPayer()), bold, regular);

        document.add(salaryTable);

        document.add(new com.itextpdf.layout.element.Paragraph("Statut : " + paie.getStatut().name())
                .setFont(regular).setFontSize(10).setFontColor(com.itextpdf.kernel.colors.ColorConstants.GRAY));
        document.add(new com.itextpdf.layout.element.Paragraph("Généré le " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))
                .setFont(regular).setFontSize(9).setFontColor(com.itextpdf.kernel.colors.ColorConstants.GRAY)
                .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.CENTER));

        document.close();
        return baos.toByteArray();
    }

    // ─── MÉTHODES PRIVÉES ──────────────────────────────────────────

    private void addInfoRow(com.itextpdf.layout.element.Table table, String label, String value,
                            com.itextpdf.kernel.font.PdfFont bold, com.itextpdf.kernel.font.PdfFont regular) {
        table.addCell(new com.itextpdf.layout.element.Cell()
                .add(new com.itextpdf.layout.element.Paragraph(label).setFont(bold).setFontSize(10))
                .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                .setPadding(3));
        table.addCell(new com.itextpdf.layout.element.Cell()
                .add(new com.itextpdf.layout.element.Paragraph(value).setFont(regular).setFontSize(10))
                .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                .setPadding(3));
    }

    private void addRow(com.itextpdf.layout.element.Table table, String label, String value,
                        com.itextpdf.kernel.font.PdfFont bold, com.itextpdf.kernel.font.PdfFont regular) {
        table.addCell(new com.itextpdf.layout.element.Cell()
                .add(new com.itextpdf.layout.element.Paragraph(label).setFont(regular).setFontSize(10))
                .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                .setPadding(3));
        boolean isTotal = label.contains("TOTAL") || label.contains("NET");
        table.addCell(new com.itextpdf.layout.element.Cell()
                .add(new com.itextpdf.layout.element.Paragraph(value).setFont(isTotal ? bold : regular).setFontSize(10))
                .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                .setTextAlignment(com.itextpdf.layout.properties.TextAlignment.RIGHT)
                .setPadding(3));
    }

    private double calculerPrime(Personnel personnel) {
        if (personnel.getGrade() != null) {
            return switch (personnel.getGrade()) {
                case "Professeur" -> 200.0;
                case "Maître-Assistant" -> 150.0;
                case "Assistant" -> 100.0;
                default -> 0.0;
            };
        }
        return 0.0;
    }

    private double calculerHeuresSupplementaires(Long personnelId, String mois, Integer annee) {
        return 50.0;
    }

    private double calculerIndemnite(Personnel personnel) {
        return 50.0;
    }

    // ─── 6. STATISTIQUES ───────────────────────────────────────────

    public Map<String, Object> getStatistiquesRH(Long universiteId) {
        long totalPersonnel = personnelRepo.countByUniversiteId(universiteId);
        long totalEnseignants = personnelRepo.countByUniversiteIdAndType(universiteId, Personnel.TypePersonnel.ENSEIGNANT);
        long totalAdministratifs = personnelRepo.countByUniversiteIdAndType(universiteId, Personnel.TypePersonnel.ADMINISTRATIF);
        long totalActifs = personnelRepo.countByUniversiteIdAndStatut(universiteId, Personnel.StatutPersonnel.ACTIF);
        long totalContratsActifs = contratRepo.countByPersonnelUniversiteIdAndStatut(universiteId, Contrat.StatutContrat.ACTIF);

        // SUM() renvoie NULL quand aucune paie n'existe : ne pas auto-unboxer
        Double sommePaie = paieRepo.sumNetAPayerByUniversiteIdAndMois(universiteId,
                LocalDate.now().getMonth().name(), LocalDate.now().getYear());
        double masseSalarialeMois = sommePaie != null ? sommePaie : 0d;

        long enAttenteValidation = validationPaieRepo.findByStatut(StatutValidation.EN_ATTENTE).stream()
                .filter(v -> v.getPaie().getPersonnel().getUniversite().getId().equals(universiteId))
                .count();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalPersonnel", totalPersonnel);
        stats.put("totalEnseignants", totalEnseignants);
        stats.put("totalAdministratifs", totalAdministratifs);
        stats.put("totalActifs", totalActifs);
        stats.put("totalContratsActifs", totalContratsActifs);
        stats.put("masseSalarialeMois", masseSalarialeMois);
        stats.put("bulletinsEnAttenteValidation", enAttenteValidation);
        return stats;
    }
}