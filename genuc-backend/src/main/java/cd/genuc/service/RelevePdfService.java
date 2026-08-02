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
import cd.genuc.util.PdfGenerateur;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RelevePdfService {

    private final InscriptionRepository inscriptionRepo;
    private final NoteRepository noteRepo;
    private final DeliberationRepository deliberationRepo;
    private final PaiementRepository paiementRepo;
    private final AffectationFraisRepository affectationFraisRepository;
    private final EmailService emailService;
    private final PdfGenerateur pdfGenerateur;

    private static final double PRIX_RELEVE_USD = 5.0;
    private static final List<String> CODES_FRAIS_RELEVE = List.of(
            "RELEVE_SEMESTRIEL",
            "RELEVE_ANNUEL",
            "RELEVE_FINAL",
            "FRAIS_RELEVE"
    );

    // ═══════════════════════════════════════════════════════════════
    // MÉTHODES PUBLIQUES
    // ═══════════════════════════════════════════════════════════════

    public boolean aPayeReleve(Long inscriptionId, String annee) {
        List<Paiement> paiements = paiementRepo.findByInscriptionId(inscriptionId);
        boolean paiementHistorique = paiements.stream()
                .filter(p -> p.getStatut() == Paiement.StatutPaiement.VALIDE)
                .filter(p -> p.getType() == Paiement.TypePaiement.FRAIS_RELEVE)
                .anyMatch(p -> p.getDateValidation() != null || p.getDatePaiement() != null);

        if (paiementHistorique) {
            return true;
        }

        return affectationFraisRepository.existsByInscriptionIdAndFraisCodesAndStatut(
                inscriptionId,
                CODES_FRAIS_RELEVE,
                StatutAffectation.PAYE
        );
    }

    public double getPrixReleve() {
        return PRIX_RELEVE_USD;
    }

    public Map<String, Object> getStatutPaiementReleve(Long inscriptionId, String annee) {
        boolean paye = aPayeReleve(inscriptionId, annee);
        String datePaiement = null;
        if (paye) {
            datePaiement = paiementRepo.findByInscriptionId(inscriptionId).stream()
                    .filter(p -> p.getStatut() == Paiement.StatutPaiement.VALIDE)
                    .filter(p -> p.getType() == Paiement.TypePaiement.FRAIS_RELEVE)
                    .findFirst()
                    .map(p -> p.getDateValidation() != null ? p.getDateValidation().toString() : p.getDatePaiement().toString())
                    .orElse(null);
                    if (datePaiement == null) {
                    datePaiement = affectationFraisRepository.findByInscriptionId(inscriptionId).stream()
                        .filter(af -> af.getStatut() == StatutAffectation.PAYE)
                        .filter(af -> CODES_FRAIS_RELEVE.contains(af.getFrais().getCode()))
                        .findFirst()
                        .map(af -> af.getModifieLe() != null ? af.getModifieLe().toLocalDate().toString() : "")
                        .orElse("");
                    }
        }
        return Map.of(
                "paye", paye,
                "prix", PRIX_RELEVE_USD,
                "devise", "USD",
                "datePaiement", datePaiement != null ? datePaiement : ""
        );
    }

    public Map<String, Object> getDisponibiliteReleve(Long inscriptionId, String annee) {
        boolean paye = aPayeReleve(inscriptionId, annee);
        boolean notesDisponibles = noteRepo.notesValideesPourDeliberation(inscriptionId, annee).size() > 0;
        String datePaiement = null;
        if (paye) {
            datePaiement = paiementRepo.findByInscriptionId(inscriptionId).stream()
                    .filter(p -> p.getStatut() == Paiement.StatutPaiement.VALIDE)
                    .filter(p -> p.getType() == Paiement.TypePaiement.FRAIS_RELEVE)
                    .findFirst()
                    .map(p -> p.getDateValidation() != null ? p.getDateValidation().toString() : p.getDatePaiement().toString())
                    .orElse(null);
        }
        return Map.of(
                "disponible", paye && notesDisponibles,
                "paye", paye,
                "notesDisponibles", notesDisponibles,
                "prix", PRIX_RELEVE_USD,
                "devise", "USD",
                "datePaiement", datePaiement != null ? datePaiement : "",
                "message", paye ? "✅ Relevé disponible au téléchargement"
                    : (notesDisponibles ? "💰 Paiement du frais de relevé requis avant téléchargement"
                        : "⏳ Aucune note disponible pour cette année")
        );
    }

    public byte[] genererRelevePdf(Long inscriptionId, String annee) {
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

        if (!aPayeReleve(inscriptionId, annee)) {
            throw new RuntimeException(
                    "Veuillez d'abord payer les frais de relevé (" + PRIX_RELEVE_USD + " USD) " +
                            "via la rubrique 'Mes paiements' avant de télécharger votre relevé."
            );
        }

        List<Note> notes = noteRepo.notesValideesPourDeliberation(inscriptionId, annee);
        if (notes.isEmpty()) {
            throw new RuntimeException("Aucune note disponible pour l'année " + annee);
        }

        Deliberation delib = deliberationRepo
                .findByInscriptionIdAndAnneeAcademique(inscriptionId, annee)
                .orElse(null);

        return genererPdf(inscription, notes, delib, annee);
    }

    public void envoyerReleveParEmailApresPaiement(Long inscriptionId, String annee) {
        Inscription inscription = inscriptionRepo.findById(inscriptionId)
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));

        if (!aPayeReleve(inscriptionId, annee)) {
            throw new RuntimeException("Impossible d'envoyer le relevé : paiement non effectué");
        }

        byte[] pdf = genererRelevePdf(inscriptionId, annee);
        String email = inscription.getEmail();
        String nomEtudiant = inscription.getEtudiant() != null
                ? inscription.getEtudiant().getPrenom() + " " + inscription.getEtudiant().getNom().toUpperCase()
                : inscription.getPrenom() + " " + inscription.getNom().toUpperCase();

        // ✅ Utilisation de EmailService au lieu de MailService
        emailService.envoyerReleveParEmail(email, nomEtudiant, pdf, annee, inscription.getUniversite());
    }

    // ─── GÉNÉRATION PDF AVEC iText7 ──────────────────────────

    private byte[] genererPdf(Inscription ins, List<Note> notes, Deliberation delib, String annee) {
        List<Map<String, Object>> lignesNotes = new ArrayList<>();
        for (Note n : notes) {
            Map<String, Object> ligne = new LinkedHashMap<>();
            ligne.put("cours", n.getCours().getTitre());
            ligne.put("credits", n.getCredits());
            ligne.put("noteTP", n.getNoteTP());
            ligne.put("noteInterro", n.getNoteInterrogation());
            ligne.put("noteExamen", n.getNoteExamen());
            ligne.put("noteFinale", n.getNoteRetenue() != null ? n.getNoteRetenue() : n.getNoteFinale());
            ligne.put("mention", n.getMention() != null ? n.getMention().name() : "—");
            double noteMax = n.getNoteMax() != null ? n.getNoteMax() : 20.0;
            double noteFinale = n.getNoteRetenue() != null ? n.getNoteRetenue() : (n.getNoteFinale() != null ? n.getNoteFinale() : 0);
            ligne.put("statut", noteFinale >= noteMax * 0.5 ? "REUSSI" : "AJOURNE");
            lignesNotes.add(ligne);
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("universite", ins.getUniversite().getNom());
        data.put("anneeAcademique", annee);
        data.put("matricule", ins.getMatricule());
        data.put("nom", ins.getNom());
        data.put("prenom", ins.getPrenom());
        data.put("niveau", ins.getNiveau());
        data.put("departement", ins.getDepartement().getNom());
        data.put("typeVacation", "—");
        data.put("genereA", LocalDateTime.now().toString());
        data.put("notes", lignesNotes);

        if (delib != null) {
            data.put("moyenneGenerale", delib.getMoyenneGenerale());
            data.put("creditsValides", delib.getCreditsValides());
            data.put("creditsRequis", delib.getCreditsRequis());
            data.put("coursReussis", delib.getCoursReussis());
            data.put("coursTotaux", delib.getCoursTotaux());
            data.put("decision", delib.getDecision() != null ? delib.getDecision().name() : "—");
            data.put("mention", delib.getMention() != null ? delib.getMention().name() : "—");
            data.put("presidentJury", delib.getPresidentJuryNom());
            data.put("dateDeliberation", delib.getDateDeliberation());
            data.put("uuidVerification", delib.getUuidVerification());
            data.put("urlVerification", delib.getUuidVerification() != null
                    ? "https://genuc.cd/verifier/" + delib.getUuidVerification() : null);
        }

        try {
            return pdfGenerateur.genererReleveNotes(data);
        } catch (IOException e) {
            throw new RuntimeException("Impossible de générer le relevé PDF : " + e.getMessage(), e);
        }
    }
}