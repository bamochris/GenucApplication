package cd.genuc.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.itextpdf.barcodes.BarcodeQRCode;
import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.xobject.PdfFormXObject;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.TextAlignment;
import cd.genuc.model.Departement;
import cd.genuc.model.DossierInscription;
import cd.genuc.model.Filiere;
import cd.genuc.model.Universite;
import cd.genuc.model.Utilisateur;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.io.ByteArrayOutputStream;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Locale;
import org.springframework.scheduling.annotation.Async;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;
    private final ParametresUniversiteService parametresUniversiteService;

    @Value("${app.base-url:http://localhost:3000}")
    private String baseUrl;

    @Value("${spring.mail.username:campusgenuc@gmail.com}")
    private String defaultFromAddress;

    /**
     * Envoie un email simple (texte brut)
     */
    @Async
    public void envoyerEmail(String destinataire, String sujet, String message) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, "UTF-8");
            helper.setTo(destinataire);
            helper.setSubject(sujet);
            helper.setText(message, false);
            mailSender.send(mimeMessage);
            log.info("Email envoyé à {}", destinataire);
        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email à {} : {}", destinataire, e.getMessage());
            throw new RuntimeException("Échec de l'envoi de l'email à " + destinataire, e);
        }
    }

    /**
     * Envoie un email avec une pièce jointe (PDF, etc.)
     */
    @Async
    public void envoyerAvecPieceJointe(String destinataire, String sujet, String corps,
                                       byte[] pieceJointe, String nomFichier) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setTo(destinataire);
            helper.setSubject(sujet);
            helper.setText(corps, false);

            if (pieceJointe != null && pieceJointe.length > 0) {
                ByteArrayResource resource = new ByteArrayResource(pieceJointe);
                helper.addAttachment(nomFichier, resource);
            }

            mailSender.send(mimeMessage);
            log.info("Email avec pièce jointe envoyé à {}", destinataire);
        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email avec pièce jointe à {} : {}", destinataire, e.getMessage());
        }
    }

    @Async
    public void envoyerAvecPieceJointe(String destinataire, String sujet, String corps,
                                       byte[] pieceJointe, String nomFichier,
                                       Universite universite) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setTo(destinataire);
            helper.setSubject(sujet);
            helper.setText(corps, false);
            appliquerIdentiteMessagerieUniversite(helper, universite);

            if (pieceJointe != null && pieceJointe.length > 0) {
                ByteArrayResource resource = new ByteArrayResource(pieceJointe);
                helper.addAttachment(nomFichier, resource);
            }

            mailSender.send(mimeMessage);
            log.info("Email avec pièce jointe envoyé à {}", destinataire);
        } catch (MessagingException e) {
            log.error("Erreur lors de l'envoi de l'email avec pièce jointe à {} : {}", destinataire, e.getMessage());
        }
    }

        @Async
        /** @return vrai si l'accusé est parti, faux si l'envoi a échoué (non bloquant). */
        public boolean envoyerAccuseReceptionDossier(DossierInscription dossier,
                                                                                            Universite universite,
                                                                                            String lienPaiement,
                                                                                            LocalDateTime expirationPaiement) {
                try {
                        MimeMessage mimeMessage = mailSender.createMimeMessage();
                        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, false, "UTF-8");
                        helper.setTo(dossier.getEmail());
                        helper.setSubject("Accuse de reception de votre dossier - " + valeur(universite != null ? universite.getNom() : "GENUC"));
                        if (universite != null) {
                                appliquerIdentiteMessagerieUniversite(helper, universite);
                        }

                        String montant = dossier.getMontantInscription() != null
                                ? formatMontant(dossier.getMontantInscription()) + " " + valeur(dossier.getDeviseInscription() != null ? dossier.getDeviseInscription() : "USD")
                                : "a confirmer par l'universite";
                        String dateExpiration = expirationPaiement != null
                                ? expirationPaiement.format(java.time.format.DateTimeFormatter.ofPattern("dd MMMM yyyy 'a' HH:mm", Locale.FRENCH))
                                : "dans 72 heures";

                        String html = """
                                <div style="font-family:Arial,sans-serif;background:#f5f7fb;padding:24px;color:#1f2937;">
                                    <div style="max-width:720px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #dbe4f0;">
                                        <div style="background:#0B1F4A;color:#ffffff;padding:24px 28px;">
                                            <h2 style="margin:0 0 6px;font-size:24px;">Accuse de reception</h2>
                                            <p style="margin:0;font-size:14px;opacity:0.92;">Votre dossier a ete enregistre avec succes sur GENUC.</p>
                                        </div>
                                        <div style="padding:24px 28px;line-height:1.65;">
                                            <p>Bonjour <strong>%s %s</strong>,</p>
                                            <p>Nous confirmons la reception de votre dossier d'inscription pour <strong>%s</strong>.</p>
                                            <div style="background:#eef4ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px 18px;margin:18px 0;">
                                                <p style="margin:0 0 8px;"><strong>Numero de dossier :</strong> %s</p>
                                                <p style="margin:0 0 8px;"><strong>Niveau vise :</strong> %s</p>
                                                <p style="margin:0;"><strong>Frais d'inscription :</strong> %s</p>
                                            </div>
                                            <p>Pour que votre dossier soit traite, vous devez regler les frais d'inscription via TachPay en utilisant le lien ci-dessous :</p>
                                            <p style="margin:24px 0;">
                                                <a href="%s" style="display:inline-block;background:#1D9E75;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:700;">Payer les frais d'inscription</a>
                                            </p>
                                            <p style="margin:0 0 12px;color:#92400e;"><strong>Attention :</strong> ce lien expire le <strong>%s</strong>.</p>
                                            <p style="margin:0 0 12px;">Si vous n'effectuez pas le paiement avant cette echeance, vous devrez reprendre la procedure de paiement a partir de votre numero de dossier.</p>
                                            <p style="margin:0 0 8px;">Lien direct :</p>
                                            <p style="margin:0;word-break:break-all;"><a href="%s">%s</a></p>
                                        </div>
                                    </div>
                                </div>
                                """.formatted(
                                valeur(dossier.getPrenom()),
                                valeur(dossier.getNom()),
                                valeur(universite != null ? universite.getNom() : "votre universite"),
                                valeur(dossier.getNumeroDossier()),
                                valeur(dossier.getNiveauVise()),
                                montant,
                                lienPaiement,
                                dateExpiration,
                                lienPaiement,
                                lienPaiement
                        );

                        helper.setText(html, true);
                        mailSender.send(mimeMessage);
                        log.info("Accuse de reception envoye a {} pour le dossier {}", dossier.getEmail(), dossier.getNumeroDossier());
                        return true;
                } catch (Exception e) {
                        // Reste NON bloquant : le dossier est déjà enregistré, faire échouer la
                        // requête ferait perdre au candidat une saisie complète et ses pièces.
                        // Mais l'issue est désormais REMONTÉE, car l'accusé de réception porte le
                        // numéro de dossier : sans e-mail et sans avertissement, le candidat repart
                        // sans rien pour suivre ni payer son inscription.
                        log.error("Accuse de reception non envoye a {} pour le dossier {} : {}",
                                dossier.getEmail(), dossier.getNumeroDossier(), e.getMessage());
                        return false;
                }
        }

    /**
     * Envoie un email d'activation de compte (HTML)
     */
    @Async
    public void envoyerEmailActivation(Utilisateur utilisateur, String token, String matricule) {
        try {
            String lienActivation = baseUrl + "/activer-compte?token=" + token;

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(utilisateur.getEmail());
            helper.setSubject("GENUC - Activez votre compte étudiant");

            Context context = new Context();
            context.setVariable("nom", utilisateur.getPrenom() + " " + utilisateur.getNom());
            context.setVariable("lienActivation", lienActivation);
            context.setVariable("expiration", "48 heures");
            context.setVariable("matricule", matricule);

            String html = templateEngine.process("email-activation", context);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Email d'activation envoyé à {}", utilisateur.getEmail());
        } catch (Exception e) {
            log.error("Erreur lors de l'envoi de l'email d'activation à {}: {}", utilisateur.getEmail(), e.getMessage());
            // L'email d'activation est critique : on propage pour que l'appelant sache que le lien n'a pas été livré
            throw new RuntimeException("Impossible d'envoyer le lien d'activation à " + utilisateur.getEmail(), e);
        }
    }

    /**
     * Envoie un email de bienvenue (HTML). Échec non bloquant : le compte est déjà activé.
     */
    @Async
    public void envoyerEmailBienvenue(Utilisateur utilisateur) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(utilisateur.getEmail());
            helper.setSubject("Bienvenue sur GENUC !");

            Context context = new Context();
            context.setVariable("nom", utilisateur.getPrenom() + " " + utilisateur.getNom());
            context.setVariable("email", utilisateur.getEmail());

            String html = templateEngine.process("email-bienvenue", context);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Email de bienvenue envoyé à {}", utilisateur.getEmail());
        } catch (Exception e) {
            log.warn("Email de bienvenue non envoyé à {} (non bloquant) : {}", utilisateur.getEmail(), e.getMessage());
        }
    }

    /**
     * Email de bienvenue pour un membre du personnel créé par un administrateur.
     * Inclut les identifiants et le rôle. Non bloquant.
     */
    @Async
    public void envoyerEmailBienvenueStaff(Utilisateur utilisateur, String motDePasseClair) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(utilisateur.getEmail());
            helper.setSubject("🎓 Bienvenue sur GENUC — vos identifiants de connexion");
            appliquerIdentiteMessagerieUniversite(helper, utilisateur.getUniversiteId(), null);

            String html = """
                <!DOCTYPE html>
                <html><head><meta charset="UTF-8"><style>
                  body{font-family:Arial,sans-serif;background:#f4f6fb;margin:0;padding:20px}
                  .card{background:#fff;border-radius:12px;padding:32px;max-width:520px;margin:auto;box-shadow:0 2px 12px rgba(0,0,0,.08)}
                  .header{background:#0b1f4a;color:#fff;padding:18px 24px;border-radius:8px;margin-bottom:24px}
                  .header h2{margin:0;font-size:18px}
                  .field{display:flex;gap:12px;margin-bottom:12px;align-items:center}
                  .lbl{min-width:130px;color:#64748b;font-size:13px;font-weight:600}
                  .val{font-family:monospace;font-size:14px;color:#0b1f4a;font-weight:700}
                  .warn{background:#fff7ed;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;font-size:12.5px;color:#92400e;margin-top:20px}
                  .footer{margin-top:24px;font-size:12px;color:#94a3b8;text-align:center}
                </style></head><body>
                <div class="card">
                  <div class="header"><h2>🎓 Bienvenue sur la plateforme GENUC</h2></div>
                  <p>Bonjour <strong>%s %s</strong>,</p>
                  <p>Un compte vous a été créé sur la plateforme GENUC. Voici vos identifiants de connexion :</p>
                  <div class="field"><span class="lbl">Adresse email</span><span class="val">%s</span></div>
                  <div class="field"><span class="lbl">Mot de passe</span><span class="val">%s</span></div>
                  <div class="field"><span class="lbl">Rôle</span><span class="val">%s</span></div>
                  <div class="warn">⚠️ Pour des raisons de sécurité, veuillez changer votre mot de passe dès votre première connexion.</div>
                  <div class="footer">GENUC — Plateforme Nationale de Gestion Universitaire · RDC</div>
                </div></body></html>
                """.formatted(
                    utilisateur.getPrenom(), utilisateur.getNom(),
                    utilisateur.getEmail(),
                    motDePasseClair,
                    utilisateur.getRole().name()
                );

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Email bienvenue staff envoyé à {}", utilisateur.getEmail());
        } catch (Exception e) {
            log.warn("Email bienvenue staff non envoyé à {} (non bloquant) : {}", utilisateur.getEmail(), e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // Lettre d'acceptation / admission
    // ─────────────────────────────────────────────────────────────────

    /**
     * Convertit un chemin de fichier local (ex: /uploads/universites/logo.jpg) en data URI base64,
     * pour que le logo/sceau s'affiche dans la lettre ouverte hors-ligne ou reçue par email
     * (une URL relative ne se résout pas dans un onglet blob ni dans un client mail).
     */
    private String toDataUri(String chemin) {
        if (chemin == null || chemin.isBlank()) return null;
        if (chemin.startsWith("data:") || chemin.startsWith("http")) return chemin;
        try {
            Path p = Paths.get(chemin.startsWith("/") ? chemin.substring(1) : chemin);
            if (!Files.exists(p)) return null;
            byte[] bytes = Files.readAllBytes(p);
            String ext = chemin.contains(".") ? chemin.substring(chemin.lastIndexOf('.') + 1).toLowerCase() : "";
            String mime = switch (ext) {
                case "png" -> "image/png";
                case "gif" -> "image/gif";
                case "svg" -> "image/svg+xml";
                case "webp" -> "image/webp";
                default -> "image/jpeg";
            };
            return "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(bytes);
        } catch (Exception e) {
            log.warn("Logo/sceau introuvable ou illisible ({}) : {}", chemin, e.getMessage());
            return null;
        }
    }

    /**
     * Génère un vrai QR code (PNG, base64 data URI) encodant l'URL de vérification,
     * pour affichage dans la lettre HTML (même rendu que le placeholder, mais scannable).
     */
    private String qrCodeDataUri(String contenu) {
        if (contenu == null || contenu.isBlank()) return null;
        try {
            QRCodeWriter qrWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrWriter.encode(contenu, BarcodeFormat.QR_CODE, 200, 200);
            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(pngOutputStream.toByteArray());
        } catch (Exception e) {
            log.warn("QR code de vérification non généré : {}", e.getMessage());
            return null;
        }
    }

    /**
     * Génère le HTML de la lettre d'admission à partir du template Thymeleaf.
     * Utilisé aussi bien pour l'envoi email que pour l'affichage web.
     */
    public String genererHtmlLettre(DossierInscription dossier, Universite universite,
                                     Departement departement, Filiere filiere,
                                     String matricule, String anneeAcademique,
                                     String dateRentree, String numeroLettre) {
        double totalFrais = 0.0;
        if (universite.getFraisInscription() != null)  totalFrais += universite.getFraisInscription();
        if (universite.getFraisAcademiques() != null)  totalFrais += universite.getFraisAcademiques();
        if (universite.getFraisBibliotheque() != null) totalFrais += universite.getFraisBibliotheque();
        if (universite.getFraisLabo() != null)         totalFrais += universite.getFraisLabo();

        Double fraisFiliere = null;
        if (filiere != null && filiere.getFraisAnnee1() != null) {
            fraisFiliere = filiere.getFraisAnnee1();
            totalFrais += fraisFiliere;
        }

        Context ctx = new Context(new Locale("fr", "CD"));
        ctx.setVariable("dossier",         dossier);
        ctx.setVariable("universite",      universite);
        ctx.setVariable("departement",     departement);
        ctx.setVariable("filiere",         filiere);
        ctx.setVariable("matricule",       matricule);
        ctx.setVariable("anneeAcademique", anneeAcademique);
        ctx.setVariable("dateRentree",     dateRentree != null ? dateRentree : "À confirmer par l'université");
        ctx.setVariable("numeroLettre",    numeroLettre);
        ctx.setVariable("dateEmission",    LocalDate.now());
        ctx.setVariable("dateValidite",    LocalDate.now().plusDays(60));
        ctx.setVariable("couleurPrincipale", universite.getCouleurPrincipale() != null
                                              ? universite.getCouleurPrincipale() : "#0B1F4A");
        ctx.setVariable("totalFrais",      totalFrais);
        ctx.setVariable("fraisFiliere",    fraisFiliere);
        ctx.setVariable("logoSrc",         toDataUri(universite.getLogo()));
        ctx.setVariable("sceauSrc",        toDataUri(universite.getSceau()));
        String verificationUrl = buildAdmissionVerificationUrl(dossier, universite, matricule);
        ctx.setVariable("verificationUrl", verificationUrl);
        ctx.setVariable("qrCodeSrc",       qrCodeDataUri(verificationUrl));

        return templateEngine.process("lettre-acceptation", ctx);
    }

    /**
     * Envoie la lettre d'admission par email (non bloquant — l'activation a déjà été envoyée).
     */
    @Async
    public void envoyerLettreAcceptation(DossierInscription dossier, Universite universite,
                                          Departement departement, Filiere filiere,
                                          String matricule, String anneeAcademique,
                                          String dateRentree, String numeroLettre) {
        try {
            String html = genererHtmlLettre(dossier, universite, departement, filiere,
                                            matricule, anneeAcademique, dateRentree, numeroLettre);
            byte[] pdf = genererPdfLettreAdmission(dossier, universite, departement, filiere,
                matricule, anneeAcademique, dateRentree, numeroLettre);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(dossier.getEmail());
            helper.setSubject("🎓 Lettre d'admission — " + universite.getNom() + " · " + anneeAcademique);
            appliquerIdentiteMessagerieUniversite(helper, universite);

            // Corps de l'email (chapeau)
            String intro = """
                <div style="font-family:Arial,sans-serif;padding:20px;color:#333;">
                  <div style="background:#0B1F4A;color:white;padding:16px 24px;border-radius:8px 8px 0 0;">
                    <h2 style="margin:0;">🎓 Félicitations, vous êtes admis(e) !</h2>
                  </div>
                  <div style="border:1px solid #ddd;border-top:none;padding:20px;border-radius:0 0 8px 8px;">
                    <p>Bonjour <strong>%s %s</strong>,</p>
                    <p>Votre dossier d'inscription a été <strong style="color:#16a34a;">validé</strong>.
                       Vous trouverez ci-dessous votre <strong>lettre d'admission officielle</strong>
                       pour l'année académique <strong>%s</strong>.</p>
                    <p>Votre matricule étudiant : <strong style="font-size:15px;color:#0B1F4A;">%s</strong></p>
                    <p style="color:#555;font-size:13px;">
                       Cette lettre fait foi de votre admission. Imprimez-la et présentez-la
                       à la Direction des Affaires Académiques lors de votre inscription définitive.
                    </p>
                    <hr style="margin:20px 0;border-color:#eee;"/>
                  </div>
                </div>
                """.formatted(dossier.getPrenom(), dossier.getNom(),
                              anneeAcademique, matricule);

            helper.setText(intro + html, true);

            if (pdf != null && pdf.length > 0) {
                String nomFichier = "Lettre_Admission_" + matricule + ".pdf";
                helper.addAttachment(nomFichier, new ByteArrayResource(pdf));
            }

            mailSender.send(message);
            log.info("Lettre d'admission envoyée à {}", dossier.getEmail());
        } catch (Exception e) {
            log.warn("Lettre d'admission non envoyée à {} (non bloquant) : {}", dossier.getEmail(), e.getMessage());
        }
    }

    private byte[] genererPdfLettreAdmission(DossierInscription dossier, Universite universite,
                                             Departement departement, Filiere filiere,
                                             String matricule, String anneeAcademique,
                                             String dateRentree, String numeroLettre) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            PdfDocument pdf = new PdfDocument(new PdfWriter(baos));
            Document document = new Document(pdf, PageSize.A4);

            PdfFont bold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            DeviceRgb primary = parseColor(universite.getCouleurPrincipale(), new DeviceRgb(11, 31, 74));
            DeviceRgb accent = new DeviceRgb(201, 161, 94);
            DeviceRgb soft = new DeviceRgb(245, 247, 251);
            DeviceRgb textMuted = new DeviceRgb(92, 100, 112);
            String verificationUrl = buildAdmissionVerificationUrl(dossier, universite, matricule);

            document.setMargins(34, 34, 34, 34);
            addWatermark(document, bold, new DeviceRgb(231, 236, 243));

            Table banner = new Table(UnitValue.createPercentArray(new float[]{2.4f, 5.2f, 2.4f}))
                .setWidth(UnitValue.createPercentValue(100))
                .setBorder(new SolidBorder(primary, 1));
            banner.addCell(emblemCell(universite.getLogo(), "REPUBLIQUE\nDEMOCRATIQUE\nDU CONGO", bold, primary, true));
            banner.addCell(new Cell()
                .setBorder(Border.NO_BORDER)
                .setPaddingTop(10)
                .setPaddingBottom(10)
                .setTextAlignment(TextAlignment.CENTER)
                .add(new Paragraph("MINISTERE DE L'ENSEIGNEMENT SUPERIEUR ET UNIVERSITAIRE")
                    .setFont(regular)
                    .setFontSize(9)
                    .setFontColor(textMuted))
                .add(new Paragraph(valeur(universite.getNom()).toUpperCase())
                    .setFont(bold)
                    .setFontSize(16)
                    .setFontColor(primary)
                    .setMarginTop(4))
                .add(new Paragraph(valeur(universite.getTypeEtablissement() != null ? universite.getTypeEtablissement() : "Universite") )
                    .setFont(regular)
                    .setFontSize(10)
                    .setFontColor(textMuted)
                    .setMarginTop(2))
                .add(new Paragraph(buildContactLine(universite))
                    .setFont(regular)
                    .setFontSize(8.5f)
                    .setFontColor(textMuted)
                    .setMarginTop(6)));
            banner.addCell(emblemCell(universite.getSceau(), "EXCELLENCE\nDISCIPLINE\nMERITE", bold, primary, false));
            document.add(banner);

            document.add(new Paragraph("Excellence · Integrite · Service")
                .setFont(regular)
                .setFontSize(9)
                .setItalic()
                .setFontColor(primary)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(8)
                .setMarginBottom(10));

            document.add(new Paragraph("Lettre d'Admission")
                .setFont(bold)
                .setFontSize(18)
                .setFontColor(primary)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(18));
            document.add(new Paragraph("Annee academique " + valeur(anneeAcademique))
                .setFont(regular)
                .setFontSize(10)
                .setFontColor(textMuted)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(2));

            document.add(sectionTitle("Destinataire", bold, primary, soft));
            document.add(recipientBox(dossier, bold, regular, primary));

            Table refTable = new Table(UnitValue.createPercentArray(new float[]{1f, 1f}))
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginTop(18);
            refTable.addCell(infoPanelCell("Reference", "N° " + valeur(numeroLettre), bold, regular, primary, soft));
            refTable.addCell(infoPanelCell("Date d'emission", formatDateLongFr(LocalDate.now()), bold, regular, primary, soft));
            document.add(refTable);

            document.add(new Paragraph(
                "Nous avons l'honneur de vous informer que votre dossier de candidature, reference "
                    + valeur(dossier.getNumeroDossier()) + ", a ete examine par la Commission d'Admission de "
                    + valeur(universite.getNom()) + ".")
                .setFont(regular)
                .setFontSize(11)
                .setMultipliedLeading(1.4f)
                .setTextAlignment(TextAlignment.JUSTIFIED)
                .setMarginTop(12));
            document.add(new Paragraph(
                "A l'issue de cet examen, nous avons le plaisir de vous notifier votre admission officielle pour l'annee academique "
                    + valeur(anneeAcademique) + ".")
                .setFont(regular)
                .setFontSize(11)
                .setMultipliedLeading(1.4f)
                .setTextAlignment(TextAlignment.JUSTIFIED)
                .setMarginTop(6));
            document.add(new Paragraph("Matricule etudiant : " + valeur(matricule))
                .setFont(bold)
                .setFontSize(13.5f)
                .setFontColor(primary)
                .setBackgroundColor(new DeviceRgb(240, 243, 250))
                .setBorder(new SolidBorder(primary, 1f))
                .setPadding(8)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(8));

            document.add(sectionTitle("I. Identite de l'etudiant(e)", bold, primary, soft));
            Table identite = new Table(UnitValue.createPercentArray(new float[]{1.1f, 1.9f, 1.1f, 1.9f}))
                .setWidth(UnitValue.createPercentValue(100));
            addInfoRow(identite, "Matricule attribue", valeur(matricule), "N° dossier", valeur(dossier.getNumeroDossier()), bold, regular, primary, soft);
            addInfoRow(identite, "Nom", valeur(dossier.getNom()), "Prenom", valeur(dossier.getPrenom()), bold, regular, primary, soft);
            addInfoRow(identite, "Sexe", valeur(dossier.getSexe()), "Nationalite", valeur(dossier.getNationalite() != null ? dossier.getNationalite() : "Congolaise"), bold, regular, primary, soft);
            addInfoRow(identite, "Date de naissance", formatDate(dossier.getDateNaissance()), "Lieu de naissance", valeur(dossier.getLieuNaissance()), bold, regular, primary, soft);
            addInfoRow(identite, "Email", valeur(dossier.getEmail()), "Telephone", valeur(dossier.getTelephone()), bold, regular, primary, soft);
            document.add(identite);

            document.add(sectionTitle("II. Programme et filiere d'admission", bold, primary, soft));
            String corps = "Nous avons l'honneur de vous notifier que "
                + valeur(dossier.getPrenom()) + " " + valeur(dossier.getNom())
                + " est declare(e) admis(e) a " + valeur(universite.getNom()) + ". Cette admission est prononcee pour la filiere "
                + (filiere != null ? valeur(filiere.getNom()) : "-") + ", au sein du departement de "
                + (departement != null ? valeur(departement.getNom()) : "-") + ", au niveau "
                + valeur(dossier.getNiveauVise()) + ", pour l'annee academique " + valeur(anneeAcademique)
                + ". La presente lettre constitue une preuve officielle d'admission et doit etre conservee avec soin pour toutes les formalites administratives et academiques.";
            document.add(new Paragraph(corps)
                .setFont(regular)
                .setFontSize(11.5f)
                .setMultipliedLeading(1.45f)
                .setTextAlignment(TextAlignment.JUSTIFIED)
                .setMarginTop(8));

            Table admission = new Table(UnitValue.createPercentArray(new float[]{1.15f, 1.85f, 1.15f, 1.85f}))
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginTop(16);
            addInfoRow(admission, "Universite", valeur(universite.getNom()), "Departement", departement != null ? valeur(departement.getNom()) : "-", bold, regular, primary, soft);
            addInfoRow(admission, "Filiere", filiere != null ? valeur(filiere.getNom()) : "-", "Niveau d'inscription", valeur(dossier.getNiveauVise()), bold, regular, primary, soft);
            addInfoRow(admission, "Duree du programme", filiere != null && filiere.getDureeAnnees() != null ? filiere.getDureeAnnees() + " an(s)" : "-", "Type d'inscription", valeur(dossier.getTypeInscription() != null ? dossier.getTypeInscription() : "Nouvelle inscription"), bold, regular, primary, soft);
            addInfoRow(admission, "Annee academique", valeur(anneeAcademique), "Date de rentree", valeur(dateRentree != null && !dateRentree.isBlank() ? dateRentree : "A confirmer par l'universite"), bold, regular, primary, soft);
            document.add(admission);

            document.add(sectionTitle("III. Frais academiques", bold, primary, soft));
            Table fees = new Table(UnitValue.createPercentArray(new float[]{4.2f, 1.7f, 1f}))
                .setWidth(UnitValue.createPercentValue(100));
            addFeeHeader(fees, bold, primary);
            addFeeRow(fees, "Frais d'inscription", universite.getFraisInscription(), universite.getDevise(), regular, primary, soft);
            addFeeRow(fees, "Frais academiques (minerale)", universite.getFraisAcademiques(), universite.getDevise(), regular, primary, soft);
            addFeeRow(fees, "Frais de bibliotheque", universite.getFraisBibliotheque(), universite.getDevise(), regular, primary, soft);
            addFeeRow(fees, "Frais de laboratoire", universite.getFraisLabo(), universite.getDevise(), regular, primary, soft);
            addFeeRow(fees, "Frais specifiques filiere", filiere != null ? filiere.getFraisAnnee1() : null, universite.getDevise(), regular, primary, soft);
            addFeeTotalRow(fees, calculerTotalFrais(universite, filiere), universite.getDevise(), bold, primary);
            document.add(fees);
            document.add(new Paragraph("Les frais peuvent etre regles par Mobile Money, virement bancaire ou au guichet de la caisse universitaire. Des facilites de paiement echelonne peuvent etre accordees sur demande a la Direction Financiere.")
                .setFont(regular)
                .setFontSize(9.5f)
                .setFontColor(textMuted)
                .setMultipliedLeading(1.3f)
                .setMarginTop(6));

            document.add(sectionTitle("IV. Documents a deposer lors de la rentree", bold, primary, soft));
            Table documents = new Table(UnitValue.createPercentArray(new float[]{1f, 1f}))
                .setWidth(UnitValue.createPercentValue(100));
            addDocumentsRows(documents, regular, textMuted);
            document.add(documents);

            document.add(sectionTitle("Validite et consignes administratives", bold, primary, soft));
            document.add(noticeBox(
                "Cette lettre d'admission est valable jusqu'au " + formatDateLongFr(LocalDate.now().plusDays(60)) + ". Passe ce delai, sans presentation a l'universite ni paiement des frais d'inscription, votre admission pourra etre annulee.",
                regular,
                primary,
                accent,
                new DeviceRgb(255, 249, 237)
            ));
            document.add(noticeBox(
                "Le candidat admis est tenu de se presenter au secretariat academique avec cette lettre, les originaux des pieces requises et la preuve de paiement des frais fixes par l'universite.",
                regular,
                primary,
                new DeviceRgb(63, 148, 99),
                new DeviceRgb(239, 249, 242)
            ));
            document.add(noticeBox(
                "Prochaines etapes : activez votre compte via le lien recu par email, connectez-vous au portail etudiant GENUC, presentez-vous a la Direction des Affaires Academiques avec tous les documents requis et effectuez le paiement avant la date limite.",
                regular,
                primary,
                new DeviceRgb(39, 108, 176),
                new DeviceRgb(240, 246, 255)
            ));

            document.add(new Paragraph("Nous vous felicitons pour votre admission et vous souhaitons une excellente annee academique au sein de " + valeur(universite.getNom()) + ". Notre equipe pedagogique reste a votre disposition pour tout renseignement complementaire.")
                .setFont(regular)
                .setFontSize(11)
                .setMultipliedLeading(1.4f)
                .setTextAlignment(TextAlignment.JUSTIFIED)
                .setMarginTop(14));

            Table verifyBlock = new Table(UnitValue.createPercentArray(new float[]{1.8f, 1f}))
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginTop(18);
            verifyBlock.addCell(new Cell()
                .setBackgroundColor(new DeviceRgb(247, 250, 255))
                .setBorder(new SolidBorder(primary, 1f))
                .setPadding(12)
                .add(new Paragraph("Verification et authenticite")
                    .setFont(bold)
                    .setFontSize(10)
                    .setFontColor(primary))
                .add(new Paragraph("Reference lettre : " + valeur(numeroLettre))
                    .setFont(regular)
                    .setFontSize(9.5f)
                    .setMarginTop(6))
                .add(new Paragraph("Code institutionnel : " + valeur(matricule))
                    .setFont(regular)
                    .setFontSize(9.5f)
                    .setMarginTop(2))
                .add(new Paragraph("Verification publique : " + valeur(verificationUrl))
                    .setFont(regular)
                    .setFontSize(8.5f)
                    .setFontColor(textMuted)
                    .setMarginTop(6))
                .add(new Paragraph("Ce QR code ouvre la page officielle de verification du document.")
                    .setFont(regular)
                    .setFontSize(9)
                    .setFontColor(textMuted)
                    .setMarginTop(8)));
            verifyBlock.addCell(qrCell(createQrImage(
                verificationUrl,
                pdf,
                primary
            )));
            document.add(verifyBlock);

            Table signature = new Table(UnitValue.createPercentArray(new float[]{1.25f, 1f}))
                .setWidth(UnitValue.createPercentValue(100))
                .setMarginTop(24);
            signature.addCell(new Cell()
                .setBorder(Border.NO_BORDER)
                .add(new Paragraph("Pour toute information complementaire :")
                    .setFont(bold)
                    .setFontSize(9.5f)
                    .setFontColor(primary))
                .add(new Paragraph("Tel : " + valeur(universite.getTelephone()))
                    .setFont(regular)
                    .setFontSize(9)
                    .setFontColor(textMuted)
                    .setMarginTop(4))
                .add(new Paragraph("Email : " + valeur(universite.getEmail()))
                    .setFont(regular)
                    .setFontSize(9)
                    .setFontColor(textMuted)
                    .setMarginTop(2))
                .add(new Paragraph("Document genere automatiquement par la plateforme GENUC.")
                    .setFont(regular)
                    .setFontSize(9)
                    .setFontColor(textMuted))
                .add(new Paragraph("Verification interne : " + valeur(numeroLettre))
                    .setFont(regular)
                    .setFontSize(9)
                    .setFontColor(textMuted)
                    .setMarginTop(4)));
            Cell signatureCell = new Cell()
                .setBorder(Border.NO_BORDER)
                .setTextAlignment(TextAlignment.CENTER)
                .add(new Paragraph("Fait a " + valeur(universite.getVille()) + ", le " + formatDateLongFr(LocalDate.now()))
                    .setFont(regular)
                    .setFontSize(10.5f))
                .add(new Paragraph(resolveSignatureTitle(universite))
                    .setFont(bold)
                    .setFontSize(11)
                    .setFontColor(primary)
                    .setMarginTop(30))
                .add(new Paragraph(resolveSignatureName(universite))
                    .setFont(regular)
                    .setFontSize(10f)
                    .setFontColor(textMuted)
                    .setMarginTop(4))
                .add(new Paragraph(valeur(universite.getNom()))
                    .setFont(regular)
                    .setFontSize(9f)
                    .setFontColor(textMuted)
                    .setMarginTop(4));
            Image signatureImage = createVisualImage(universite.getSignature(), 130f, 52f);
            if (signatureImage != null) {
                signatureCell.add(signatureImage.setMarginTop(10).setAutoScale(false));
            } else {
                signatureCell.add(new Paragraph("____________________________")
                    .setFont(regular)
                    .setFontSize(12)
                    .setMarginTop(12)
                    .setFontColor(primary));
            }
            signature.addCell(signatureCell);

            document.add(signature);
            document.add(buildFooter(primary, regular, bold, universite, numeroLettre, matricule, createQrImage(
                verificationUrl,
                pdf,
                primary
            )));

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Impossible de générer le PDF de la lettre d'admission", e);
        }
    }

    private void addWatermark(Document document, PdfFont bold, DeviceRgb watermarkColor) {
        document.showTextAligned(
            new Paragraph("ADMISSION")
                .setFont(bold)
                .setFontSize(62)
                .setFontColor(watermarkColor),
            297.5f,
            430f,
            TextAlignment.CENTER
        );
    }

    private Cell emblemCell(String imageSource, String fallback, PdfFont bold, DeviceRgb primary, boolean leftAligned) {
        Cell cell = new Cell()
            .setBorder(Border.NO_BORDER)
            .setBackgroundColor(new DeviceRgb(246, 248, 252))
            .setPaddingTop(12)
            .setPaddingBottom(12)
            .setPaddingLeft(10)
            .setPaddingRight(10);
        Image image = createVisualImage(imageSource, 72f, 72f);
        if (image != null) {
            cell.setTextAlignment(TextAlignment.CENTER).add(image);
            return cell;
        }

        return cell.add(new Paragraph(fallback)
            .setFont(bold)
            .setFontSize(8.5f)
            .setFontColor(primary)
            .setTextAlignment(leftAligned ? TextAlignment.LEFT : TextAlignment.RIGHT));
    }

    private Table recipientBox(DossierInscription dossier, PdfFont bold, PdfFont regular, DeviceRgb primary) {
        Table box = new Table(UnitValue.createPercentArray(new float[]{1f}))
            .setWidth(UnitValue.createPercentValue(100))
            .setMarginTop(10);
        box.addCell(new Cell()
            .setBorderLeft(new SolidBorder(primary, 4))
            .setBorderTop(Border.NO_BORDER)
            .setBorderRight(Border.NO_BORDER)
            .setBorderBottom(Border.NO_BORDER)
            .setBackgroundColor(new DeviceRgb(248, 249, 255))
            .setPadding(12)
            .add(new Paragraph("A l'attention de : " + valeur(dossier.getPrenom()) + " " + valeur(dossier.getNom()))
                .setFont(bold)
                .setFontSize(10.5f)
                .setFontColor(primary))
            .add(new Paragraph(valeur(dossier.getAdresse()))
                .setFont(regular)
                .setFontSize(9.5f)
                .setMarginTop(4))
            .add(new Paragraph("Email : " + valeur(dossier.getEmail()) + " · Tel : " + valeur(dossier.getTelephone()))
                .setFont(regular)
                .setFontSize(9.5f)
                .setMarginTop(2)));
        return box;
    }

    private void addFeeHeader(Table table, PdfFont bold, DeviceRgb primary) {
        table.addCell(tableHeaderCell("Designation", bold, primary));
        table.addCell(tableHeaderCell("Montant", bold, primary));
        table.addCell(tableHeaderCell("Devise", bold, primary));
    }

    private void addFeeRow(Table table, String label, Double amount, String devise, PdfFont regular, DeviceRgb primary, DeviceRgb soft) {
        if (amount == null || amount <= 0) {
            return;
        }
        table.addCell(valueTableCell(label, regular, soft, TextAlignment.LEFT));
        table.addCell(valueTableCell(formatMontant(amount), regular, soft, TextAlignment.RIGHT));
        table.addCell(valueTableCell(valeur(devise != null ? devise : "USD"), regular, soft, TextAlignment.CENTER));
    }

    private void addFeeTotalRow(Table table, Double total, String devise, PdfFont bold, DeviceRgb primary) {
        table.addCell(new Cell().setBackgroundColor(new DeviceRgb(238, 241, 248)).setPadding(8)
            .add(new Paragraph("TOTAL A PAYER").setFont(bold).setFontSize(9.5f).setFontColor(primary)));
        table.addCell(new Cell().setBackgroundColor(new DeviceRgb(238, 241, 248)).setPadding(8)
            .add(new Paragraph(formatMontant(total)).setFont(bold).setFontSize(9.5f).setTextAlignment(TextAlignment.RIGHT).setFontColor(primary)));
        table.addCell(new Cell().setBackgroundColor(new DeviceRgb(238, 241, 248)).setPadding(8)
            .add(new Paragraph(valeur(devise != null ? devise : "USD")).setFont(bold).setFontSize(9.5f).setTextAlignment(TextAlignment.CENTER).setFontColor(primary)));
    }

    private Cell tableHeaderCell(String text, PdfFont bold, DeviceRgb primary) {
        return new Cell().setBackgroundColor(primary).setPadding(8)
            .add(new Paragraph(text).setFont(bold).setFontSize(9f).setFontColor(ColorConstants.WHITE));
    }

    private Cell valueTableCell(String text, PdfFont regular, DeviceRgb soft, TextAlignment alignment) {
        return new Cell().setBackgroundColor(soft).setPadding(8)
            .setBorder(new SolidBorder(new DeviceRgb(220, 225, 235), 0.8f))
            .add(new Paragraph(valeur(text)).setFont(regular).setFontSize(9.5f).setTextAlignment(alignment));
    }

    private Double calculerTotalFrais(Universite universite, Filiere filiere) {
        double total = 0.0;
        if (universite.getFraisInscription() != null) total += universite.getFraisInscription();
        if (universite.getFraisAcademiques() != null) total += universite.getFraisAcademiques();
        if (universite.getFraisBibliotheque() != null) total += universite.getFraisBibliotheque();
        if (universite.getFraisLabo() != null) total += universite.getFraisLabo();
        if (filiere != null && filiere.getFraisAnnee1() != null) total += filiere.getFraisAnnee1();
        return total;
    }

    private void addDocumentsRows(Table table, PdfFont regular, DeviceRgb textMuted) {
        String[] docs = new String[]{
            "Diplome d'Etat (original + 2 copies)",
            "Releve de notes du secondaire (original)",
            "Acte de naissance (original + 2 copies)",
            "4 photos passeport recentes fond blanc",
            "Carte nationale d'identite ou passeport (copie)",
            "Attestation de bonne conduite",
            "Certificat medical d'aptitude physique",
            "Recu de paiement des frais d'inscription"
        };
        for (int index = 0; index < docs.length; index += 2) {
            table.addCell(documentCell(docs[index], regular, textMuted));
            table.addCell(documentCell(index + 1 < docs.length ? docs[index + 1] : "", regular, textMuted));
        }
    }

    private Cell documentCell(String text, PdfFont regular, DeviceRgb textMuted) {
        return new Cell().setBorder(Border.NO_BORDER).setPaddingTop(4).setPaddingBottom(4)
            .add(new Paragraph((text == null || text.isBlank() ? "" : "• " + text))
                .setFont(regular)
                .setFontSize(9.5f)
                .setFontColor(textMuted));
    }

    private String formatDate(LocalDate date) {
        return date != null ? date.toString() : "-";
    }

    private String formatDateLongFr(LocalDate date) {
        if (date == null) {
            return "-";
        }
        return date.format(java.time.format.DateTimeFormatter.ofPattern("dd MMMM yyyy", Locale.FRENCH));
    }

    private String formatMontant(Double amount) {
        return amount == null ? "0.00" : String.format(java.util.Locale.US, "%,.2f", amount);
    }

    private String resolveSignatureName(Universite universite) {
        String prenom = universite.getRecteurPrenom() != null ? universite.getRecteurPrenom().trim() : "";
        String nom = universite.getRecteurNom() != null ? universite.getRecteurNom().trim() : "";
        String fullName = (prenom + " " + nom).trim();
        return fullName.isBlank() ? "Le Recteur" : fullName;
    }

    private String resolveSignatureTitle(Universite universite) {
        return "Recteur / Directeur General";
    }

    private Table buildFooter(DeviceRgb primary, PdfFont regular, PdfFont bold, Universite universite,
                              String numeroLettre, String matricule, Image qrImage) {
        Table footer = new Table(UnitValue.createPercentArray(new float[]{1.6f, 0.8f, 1.4f}))
            .setWidth(UnitValue.createPercentValue(100))
            .setMarginTop(20)
            .setBorderTop(new SolidBorder(primary, 2));
        footer.addCell(new Cell().setBorder(Border.NO_BORDER).setPaddingTop(8)
            .add(new Paragraph(valeur(universite.getNom())).setFont(bold).setFontSize(8.5f).setFontColor(primary))
            .add(new Paragraph(valeur(universite.getAdresse())).setFont(regular).setFontSize(8f))
            .add(new Paragraph(valeur(universite.getVille()) + ", RDC").setFont(regular).setFontSize(8f)));
        Cell qrContainer = new Cell().setBorder(Border.NO_BORDER).setPaddingTop(8).setTextAlignment(TextAlignment.CENTER);
        if (qrImage != null) {
            qrContainer.add(qrImage.scaleToFit(52f, 52f));
        }
        footer.addCell(qrContainer);
        footer.addCell(new Cell().setBorder(Border.NO_BORDER).setPaddingTop(8).setTextAlignment(TextAlignment.RIGHT)
            .add(new Paragraph("Ref : " + valeur(numeroLettre)).setFont(regular).setFontSize(8f))
            .add(new Paragraph("Matricule : " + valeur(matricule)).setFont(regular).setFontSize(8f))
            .add(new Paragraph("Document officiel - " + valeur(universite.getNom())).setFont(regular).setFontSize(8f))
            .add(new Paragraph("Ne pas alterer ce document").setFont(regular).setFontSize(8f).setFontColor(new DeviceRgb(160, 160, 160))));
        return footer;
    }

    private String buildAdmissionVerificationUrl(DossierInscription dossier, Universite universite, String matricule) {
        // Route frontend (SPA) qui appelle GET /api/public/admission/verifier — même convention
        // que /verifier-lettre/:uuid, /verifier-attestation/:uuid, etc. (jamais un chemin /api direct,
        // qui ne serait joignable que derrière le reverse-proxy Nginx du déploiement complet).
        return baseUrl + "/verifier-admission?numeroDossier=" + encodeUrlParam(dossier.getNumeroDossier())
            + "&matricule=" + encodeUrlParam(matricule)
            + "&universiteCode=" + encodeUrlParam(universite.getCode());
    }

    private String encodeUrlParam(String value) {
        return URLEncoder.encode(valeur(value), StandardCharsets.UTF_8);
    }

    private Cell qrCell(Image qrImage) {
        Cell cell = new Cell()
            .setBorder(new SolidBorder(new DeviceRgb(220, 225, 235), 1f))
            .setBackgroundColor(ColorConstants.WHITE)
            .setTextAlignment(TextAlignment.CENTER)
            .setPadding(10);
        if (qrImage != null) {
            cell.add(qrImage);
        }
        return cell;
    }

    private Image createQrImage(String content, PdfDocument pdf, DeviceRgb color) {
        try {
            BarcodeQRCode code = new BarcodeQRCode(content);
            PdfFormXObject form = code.createFormXObject(color, pdf);
            return new Image(form).scaleToFit(108f, 108f).setMarginTop(6).setMarginBottom(6);
        } catch (Exception e) {
            return null;
        }
    }

    private Image createVisualImage(String source, float maxWidth, float maxHeight) {
        try {
            byte[] bytes = readBinaryAsset(source);
            if (bytes == null || bytes.length == 0) {
                return null;
            }
            Image image = new Image(ImageDataFactory.create(bytes));
            image.scaleToFit(maxWidth, maxHeight);
            return image;
        } catch (Exception e) {
            return null;
        }
    }

    private byte[] readBinaryAsset(String source) {
        if (source == null || source.isBlank()) {
            return null;
        }
        try {
            if (source.startsWith("data:")) {
                int commaIndex = source.indexOf(',');
                if (commaIndex > 0) {
                    return Base64.getDecoder().decode(source.substring(commaIndex + 1));
                }
            }
            if (source.startsWith("http://") || source.startsWith("https://")) {
                return null;
            }
            Path path = Paths.get(source.startsWith("/") ? source.substring(1) : source);
            if (!Files.exists(path)) {
                return null;
            }
            return Files.readAllBytes(path);
        } catch (Exception e) {
            return null;
        }
    }

    private Cell headerCell(String text, PdfFont bold, DeviceRgb primary, boolean leftAligned) {
        return new Cell()
            .setBorder(Border.NO_BORDER)
            .setBackgroundColor(new DeviceRgb(246, 248, 252))
            .setPaddingTop(12)
            .setPaddingBottom(12)
            .setPaddingLeft(10)
            .setPaddingRight(10)
            .add(new Paragraph(text)
                .setFont(bold)
                .setFontSize(8.5f)
                .setFontColor(primary)
                .setTextAlignment(leftAligned ? TextAlignment.LEFT : TextAlignment.RIGHT));
    }

    private Paragraph sectionTitle(String title, PdfFont bold, DeviceRgb primary, DeviceRgb soft) {
        return new Paragraph(title)
            .setFont(bold)
            .setFontSize(10.5f)
            .setFontColor(primary)
            .setBackgroundColor(soft)
            .setBorderLeft(new SolidBorder(primary, 4))
            .setPaddingLeft(10)
            .setPaddingTop(7)
            .setPaddingBottom(7)
            .setMarginTop(18)
            .setMarginBottom(8)
            .setTextAlignment(TextAlignment.LEFT);
    }

    private Cell infoPanelCell(String label, String value, PdfFont bold, PdfFont regular,
                               DeviceRgb primary, DeviceRgb soft) {
        return new Cell()
            .setPadding(12)
            .setBackgroundColor(soft)
            .setBorder(new SolidBorder(primary, 1))
            .add(new Paragraph(label)
                .setFont(bold)
                .setFontSize(9)
                .setFontColor(primary)
                .setMarginBottom(4))
            .add(new Paragraph(valeur(value))
                .setFont(regular)
                .setFontSize(11)
                .setFontColor(ColorConstants.BLACK));
    }

    private void addInfoRow(Table table, String label1, String value1, String label2, String value2,
                            PdfFont bold, PdfFont regular, DeviceRgb primary, DeviceRgb soft) {
        table.addCell(labelCell(label1, bold, primary));
        table.addCell(valueCell(value1, regular, soft));
        table.addCell(labelCell(label2, bold, primary));
        table.addCell(valueCell(value2, regular, soft));
    }

    private Cell labelCell(String label, PdfFont bold, DeviceRgb primary) {
        return new Cell()
            .setBackgroundColor(primary)
            .setBorder(Border.NO_BORDER)
            .setPadding(8)
            .add(new Paragraph(valeur(label))
                .setFont(bold)
                .setFontSize(9)
                .setFontColor(ColorConstants.WHITE));
    }

    private Cell valueCell(String value, PdfFont regular, DeviceRgb soft) {
        return new Cell()
            .setBackgroundColor(soft)
            .setBorder(new SolidBorder(new DeviceRgb(220, 225, 235), 0.8f))
            .setPadding(8)
            .add(new Paragraph(valeur(value))
                .setFont(regular)
                .setFontSize(9.5f)
                .setFontColor(ColorConstants.BLACK));
    }

    private Table noticeBox(String text, PdfFont regular, DeviceRgb primary, DeviceRgb border, DeviceRgb background) {
        Table box = new Table(UnitValue.createPercentArray(new float[]{1f}))
            .setWidth(UnitValue.createPercentValue(100))
            .setMarginTop(8);
        box.addCell(new Cell()
            .setBorder(new SolidBorder(border, 1.2f))
            .setBackgroundColor(background)
            .setPadding(12)
            .add(new Paragraph(text)
                .setFont(regular)
                .setFontSize(10)
                .setFontColor(primary)
                .setMultipliedLeading(1.35f)
                .setTextAlignment(TextAlignment.JUSTIFIED)));
        return box;
    }

    private DeviceRgb parseColor(String hex, DeviceRgb fallback) {
        if (hex == null || hex.isBlank()) {
            return fallback;
        }
        String normalized = hex.trim().replace("#", "");
        if (normalized.length() != 6) {
            return fallback;
        }
        try {
            int red = Integer.parseInt(normalized.substring(0, 2), 16);
            int green = Integer.parseInt(normalized.substring(2, 4), 16);
            int blue = Integer.parseInt(normalized.substring(4, 6), 16);
            return new DeviceRgb(red, green, blue);
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private String buildContactLine(Universite universite) {
        String adresse = valeur(universite.getAdresse());
        String ville = valeur(universite.getVille());
        String telephone = valeur(universite.getTelephone());
        String email = valeur(universite.getEmail());
        return adresse + " · " + ville + " · Tel: " + telephone + " · Email: " + email;
    }

    private String valeur(String texte) {
        return texte == null || texte.isBlank() ? "-" : texte.trim();
    }

    /** Convocation au test d'admission (candidat < 60% au diplôme). Non bloquant. */
    @Async
    public void envoyerConvocationTest(DossierInscription dossier, Universite universite, String messageSecretaire) {
        try {
            String nomUni = universite != null ? universite.getNom() : "l'université";
            String extra = (messageSecretaire != null && !messageSecretaire.isBlank())
                ? "<p style=\"background:#f8f9fa;padding:12px;border-radius:6px;white-space:pre-wrap;\">" + messageSecretaire + "</p>" : "";
            String html = """
                <div style="font-family:Arial,sans-serif;padding:20px;color:#333;">
                  <div style="background:#C07A2B;color:white;padding:16px 24px;border-radius:8px 8px 0 0;">
                    <h2 style="margin:0;">📝 Test d'admission requis</h2>
                  </div>
                  <div style="border:1px solid #ddd;border-top:none;padding:20px;border-radius:0 0 8px 8px;">
                    <p>Bonjour <strong>%s %s</strong>,</p>
                    <p>Votre dossier d'inscription à <strong>%s</strong> (n° <strong>%s</strong>) a bien été reçu.</p>
                    <p>Votre pourcentage au diplôme d'État étant <strong>inférieur à 60%%</strong>, vous devez
                       <strong>passer et réussir le test d'admission</strong> avant que votre admission ne soit prononcée.</p>
                    %s
                    <p>Le secrétariat académique vous communiquera la date et le lieu du test. Restez attentif(ve) à vos emails.</p>
                    <hr style="margin:20px 0;border-color:#eee;"/>
                    <p style="color:#555;font-size:13px;">Secrétariat académique — %s</p>
                  </div>
                </div>
                """.formatted(dossier.getPrenom(), dossier.getNom(), nomUni,
                              dossier.getNumeroDossier(), extra, nomUni);
            envoyerHtml(dossier.getEmail(), "📝 Test d'admission requis — " + nomUni, html);
            log.info("Convocation test d'admission envoyée à {}", dossier.getEmail());
        } catch (Exception e) {
            log.warn("Convocation test non envoyée à {} (non bloquant) : {}", dossier.getEmail(), e.getMessage());
        }
    }

    /** Message libre du secrétariat à un candidat (info pendant la période d'inscription). Non bloquant. */
    @Async
    public void envoyerMessageSecretariat(String email, String nomCandidat, String sujet, String message, Universite universite) {
        try {
            String nomUni = universite != null ? universite.getNom() : "l'université";
            String html = """
                <div style="font-family:Arial,sans-serif;padding:20px;color:#333;">
                  <div style="background:#0B1F4A;color:white;padding:16px 24px;border-radius:8px 8px 0 0;">
                    <h2 style="margin:0;">✉️ %s</h2>
                  </div>
                  <div style="border:1px solid #ddd;border-top:none;padding:20px;border-radius:0 0 8px 8px;">
                    <p>Bonjour <strong>%s</strong>,</p>
                    <div style="white-space:pre-wrap;">%s</div>
                    <hr style="margin:20px 0;border-color:#eee;"/>
                    <p style="color:#555;font-size:13px;">Secrétariat académique — %s</p>
                  </div>
                </div>
                """.formatted(sujet, nomCandidat, message, nomUni);
            envoyerHtml(email, sujet + " — " + nomUni, html);
            log.info("Message du secrétariat envoyé à {}", email);
        } catch (Exception e) {
            // Ce message est une ACTION DÉLIBÉRÉE de l'agent, pas une notification
            // de fond : l'avaler faisait répondre « Message envoyé au candidat par
            // email » alors que rien ne partait. Le secrétariat croyait avoir
            // communiqué. On propage pour que l'appelant réponde un échec.
            log.error("Message secrétariat non envoyé à {} : {}", email, e.getMessage());
            throw new RuntimeException(
                "L'email n'a pas pu être envoyé à " + email + " : " + e.getMessage(), e);
        }
    }

    /** Envoi HTML simple (helper interne). */
    private void envoyerHtml(String destinataire, String sujet, String htmlBody) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setTo(destinataire);
        helper.setSubject(sujet);
        helper.setText(htmlBody, true);
        mailSender.send(message);
    }

    /**
     * Envoie le relevé de notes par email (fusion avec MailService)
     */
    @Async
    public void envoyerReleveParEmail(String destinataire, String nomEtudiant,
                                      byte[] pdfContent, String anneeAcademique) {
        envoyerReleveParEmail(destinataire, nomEtudiant, pdfContent, anneeAcademique, null);
    }

    @Async
    public void envoyerReleveParEmail(String destinataire, String nomEtudiant,
                                      byte[] pdfContent, String anneeAcademique,
                                      Universite universite) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setTo(destinataire);
            helper.setSubject("📄 Votre relevé de notes GENUC - " + anneeAcademique);
            appliquerIdentiteMessagerieUniversite(helper, universite);

            String htmlContent = """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .header { background: #0B1F4A; color: white; padding: 20px; text-align: center; }
                        .content { padding: 20px; }
                        .footer { background: #f0f4ff; padding: 15px; text-align: center; font-size: 12px; color: #666; }
                        .info { background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>📄 GENUC - Académie Intégrale</h2>
                        <p>Relevé de notes officiel</p>
                    </div>
                    <div class="content">
                        <h3>Bonjour %s,</h3>
                        <p>Vous trouverez ci-joint votre relevé de notes officiel pour l'année académique <strong>%s</strong>.</p>
                        <div class="info">
                            <strong>ℹ️ Informations importantes :</strong><br/>
                            • Ce document est officiel et authentique<br/>
                            • Il contient un code de vérification unique<br/>
                            • Conservez-le précieusement pour vos dossiers administratifs
                        </div>
                        <p>Vous pouvez également le télécharger directement depuis votre espace étudiant.</p>
                        <p style="margin-top: 30px;">
                            Cordialement,<br/>
                            <strong>L'équipe GENUC</strong>
                        </p>
                    </div>
                    <div class="footer">
                        <p>GENUC - Plateforme académique intégrée du Congo<br/>
                        Ce message est généré automatiquement, merci de ne pas y répondre.</p>
                    </div>
                </body>
                </html>
                """.formatted(nomEtudiant, anneeAcademique);

            helper.setText(htmlContent, true);
            helper.addAttachment("Releve_Notes_" + anneeAcademique + ".pdf",
                new ByteArrayResource(pdfContent));

            mailSender.send(message);

        } catch (MessagingException e) {
            throw new RuntimeException("Erreur lors de l'envoi de l'email", e);
        }
    }

    private void appliquerIdentiteMessagerieUniversite(MimeMessageHelper helper, Universite universite) {
        Long universiteId = universite != null ? universite.getId() : null;
        String fallbackNom = universite != null ? universite.getNom() : null;
        appliquerIdentiteMessagerieUniversite(helper, universiteId, fallbackNom);
    }

    private void appliquerIdentiteMessagerieUniversite(MimeMessageHelper helper,
                                                       Long universiteId,
                                                       String fallbackNom) {
        try {
            String nomExpediteur = fallbackNom;
            String replyTo = null;

            if (universiteId != null) {
                var parametres = parametresUniversiteService.getParametresParUniversite(universiteId);
                if (parametres.getNomExpediteurMessagerie() != null && !parametres.getNomExpediteurMessagerie().isBlank()) {
                    nomExpediteur = parametres.getNomExpediteurMessagerie().trim();
                }
                if (parametres.getEmailMessagerie() != null && !parametres.getEmailMessagerie().isBlank()) {
                    replyTo = parametres.getEmailMessagerie().trim();
                }
            }

            if (nomExpediteur != null && !nomExpediteur.isBlank()) {
                helper.setFrom(defaultFromAddress, nomExpediteur);
            } else {
                helper.setFrom(defaultFromAddress);
            }

            if (replyTo != null && !replyTo.isBlank()) {
                helper.setReplyTo(replyTo);
            }
        } catch (UnsupportedEncodingException | MessagingException e) {
            throw new RuntimeException("Impossible d'appliquer l'identité email de l'université", e);
        }
    }
}