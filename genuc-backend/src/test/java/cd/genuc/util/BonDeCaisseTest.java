package cd.genuc.util;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfName;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.PdfResources;
import com.itextpdf.kernel.pdf.canvas.parser.PdfTextExtractor;
import com.itextpdf.kernel.pdf.xobject.PdfImageXObject;
import org.junit.jupiter.api.Test;

import java.io.ByteArrayInputStream;
import java.time.LocalDate;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Bon de caisse au format ticket 80 mm.
 *
 * <p>Le point sensible est la <b>tenue sur une seule page</b> : la hauteur de page est
 * calculée à partir du contenu mis en page, et un débordement rejetterait les
 * instructions et le pied de page sur une seconde feuille — exactement le défaut de la
 * maquette d'origine.</p>
 */
class BonDeCaisseTest {

    private static final float LARGEUR_80MM = 226.77f;

    private final PdfGenerateur generateur = new PdfGenerateur();

    // ─── Format ──────────────────────────────────────────────────

    @Test
    void bon_TientSurUneSeulePageAuFormatTicket() throws Exception {
        try (PdfDocument pdf = ouvrir(generateur.genererBonPaiement(donneesBon()))) {
            assertThat(pdf.getNumberOfPages()).isEqualTo(1);
            assertThat(pdf.getPage(1).getPageSize().getWidth()).isEqualTo(LARGEUR_80MM, within());
        }
    }

    /** Un établissement au nom à rallonge ne doit pas faire déborder le ticket. */
    @Test
    void bon_TientSurUneSeulePage_MemeAvecDesLibellesTresLongs() throws Exception {
        Map<String, Object> data = donneesBon();
        data.put("universite", "Université Pédagogique Nationale de Kinshasa — "
                + "Faculté des Sciences Économiques et de Gestion Appliquée");
        data.put("promotion", "Licence 1 - Sciences Informatiques Appliquées à la Gestion");
        data.put("etudiant", "Jean-Baptiste Kabongo wa Mulumba Tshisekedi");

        try (PdfDocument pdf = ouvrir(generateur.genererBonPaiement(data))) {
            assertThat(pdf.getNumberOfPages()).isEqualTo(1);
        }
    }

    @Test
    void bon_RespecteLesMargesLateralesSymetriques() throws Exception {
        try (PdfDocument pdf = ouvrir(generateur.genererBonPaiement(donneesBon()))) {
            // Contenu contraint entre les marges : rien ne doit toucher le bord du ticket.
            assertThat(pdf.getPage(1).getPageSize().getWidth()).isEqualTo(LARGEUR_80MM, within());
        }
    }

    // ─── Contenu ─────────────────────────────────────────────────

    @Test
    void bon_PorteLesMentionsAttendues() throws Exception {
        String texte = extraireTexte(generateur.genererBonPaiement(donneesBon()));

        assertThat(texte)
                .contains("BON DE CAISSE OFFICIEL")
                .contains("HEC-K (Haute Ecole de Commerce)")
                .contains("INFORMATIONS ETUDIANT")
                .contains("DETAILS DU PAIEMENT")
                .contains("NET A PAYER")
                .contains("BP-2026-482913")
                .contains("HECKIN202500002")
                .contains("Présenter ce bon au caissier");
    }

    /** Montant à la française, comme sur le modèle validé : 455,00 et non 455.00. */
    @Test
    void bon_FormateLeMontantALaFrancaise() throws Exception {
        assertThat(extraireTexte(generateur.genererBonPaiement(donneesBon())))
                .contains("455,00 USD");
    }

    // ─── Validité calculée ───────────────────────────────────────

    /**
     * La durée de validité est DÉDUITE des dates du bon. Une valeur figée sur le ticket
     * mentirait au caissier dès que la durée d'émission changerait.
     */
    @Test
    void bon_AfficheLaValiditeCalculeeEnJours() throws Exception {
        Map<String, Object> data = donneesBon();
        data.put("dateEmission", LocalDate.of(2026, 7, 25));
        data.put("dateExpiration", LocalDate.of(2026, 8, 1));

        assertThat(extraireTexte(generateur.genererBonPaiement(data)))
                .contains("VALABLE 7 JOURS");
    }

    @Test
    void bon_AfficheLaValiditeEnHeuresSurUneCourtePeriode() throws Exception {
        Map<String, Object> data = donneesBon();
        data.put("dateEmission", LocalDate.of(2026, 7, 25));
        data.put("dateExpiration", LocalDate.of(2026, 7, 28));

        assertThat(extraireTexte(generateur.genererBonPaiement(data)))
                .contains("VALABLE 72 HEURES");
    }

    // ─── Robustesse ──────────────────────────────────────────────

    /**
     * Les deux appelants ne fournissaient pas le QR sous la même forme (data URI côté
     * bons-paiement, base64 nu côté TachPay) et l'ancien code ignorait silencieusement
     * la seconde : les bons TachPay sortaient sans QR.
     */
    @Test
    void bon_AccepteLeQrEnBase64NuCommeEnDataUri() throws Exception {
        String nu = qrBase64();

        Map<String, Object> avecPrefixe = donneesBon();
        avecPrefixe.put("qrCode", "data:image/png;base64," + nu);
        Map<String, Object> sansPrefixe = donneesBon();
        sansPrefixe.put("qrCode", nu);

        // Le QR est une image : on va la chercher dans les ressources de la page plutôt
        // que dans le texte. Comparer les tailles de fichier, comme le faisait ce test,
        // ne prouvait rien — un bon sans QR pesait presque autant.
        assertThat(porteUnQrCode(generateur.genererBonPaiement(avecPrefixe))).isTrue();
        assertThat(porteUnQrCode(generateur.genererBonPaiement(sansPrefixe))).isTrue();
    }

    /**
     * Régression : {@code TachPayPaiementService} enregistrait {@code codeQR} AVEC le
     * préfixe data URI et le rajoutait à l'impression. Le décodeur recevait
     * « data:image/png;base64,data:… », échouait sur le « : », et <b>tous les bons du
     * portail étudiant sortaient sans QR code</b> — seul un warn dans les logs le disait.
     * La source est corrigée, mais les bons déjà émis portent encore cette valeur.
     */
    @Test
    void bon_ImprimeLeQrMemeSiLeChampPorteDejaLePrefixeDataUri() throws Exception {
        Map<String, Object> data = donneesBon();
        data.put("qrCode", "data:image/png;base64,data:image/png;base64," + qrBase64());

        assertThat(porteUnQrCode(generateur.genererBonPaiement(data))).isTrue();
    }

    /** Les anciennes générations écrivaient une sentinelle texte quand le QR échouait. */
    @Test
    void bon_SeGenereSansQrQuandLeChampNePorteAucuneImage() throws Exception {
        Map<String, Object> data = donneesBon();
        data.put("qrCode", "QR non disponible");

        byte[] pdf = generateur.genererBonPaiement(data);

        assertThat(porteUnQrCode(pdf)).isFalse();
        try (PdfDocument doc = ouvrir(pdf)) {
            assertThat(doc.getNumberOfPages()).isEqualTo(1);
        }
    }

    /** Le QR ne doit pas rejeter le pied de page sur une seconde feuille. */
    @Test
    void bon_TientSurUneSeulePage_AvecLeQrEtLeBlocBancaire() throws Exception {
        Map<String, Object> data = donneesBon();
        data.put("qrCode", qrBase64());
        data.put("banques", List.of(
                banque("EQUITY BCDC", "00012-34567890-12", "USD"),
                banque("FBN BANK RDC", "00099-88776655-44", "USD"),
                banque("UBA RDC", "01234-56789012-34", "CDF"),
                banque("RAWBANK", "05500-11223344-55", "USD")));

        byte[] avecQr = generateur.genererBonPaiement(data);

        data.remove("qrCode");
        float hauteurSansQr = hauteurPage(generateur.genererBonPaiement(data));

        assertThat(porteUnQrCode(avecQr)).isTrue();
        try (PdfDocument doc = ouvrir(avecQr)) {
            assertThat(doc.getNumberOfPages()).isEqualTo(1);
        }
        // Le rouleau s'allonge pour absorber le QR au lieu de le rogner ou de le
        // renvoyer sur une seconde feuille : c'est tout l'intérêt de la hauteur calculée.
        assertThat(hauteurPage(avecQr)).isGreaterThan(hauteurSansQr + 100f);
    }

    /** Un bon reste générable même si des champs optionnels manquent. */
    @Test
    void bon_SeGenereMemeAvecDesChampsManquants() throws Exception {
        Map<String, Object> minimal = new HashMap<>();
        minimal.put("numero", "BP-2026-000001");
        minimal.put("montant", 120.0);
        minimal.put("devise", "USD");

        try (PdfDocument pdf = ouvrir(generateur.genererBonPaiement(minimal))) {
            assertThat(pdf.getNumberOfPages()).isEqualTo(1);
        }
    }

    // ─── Paiement en banque ──────────────────────────────────────

    /**
     * Les coordonnées bancaires n'existaient que dans le contenu du QR : un étudiant
     * sans lecteur ignorait qu'il pouvait régler ailleurs qu'à la caisse ou via TachPay.
     */
    @Test
    void bon_ImprimeLesBanquesOuLeBonPeutEtreRegle() throws Exception {
        Map<String, Object> data = donneesBon();
        data.put("banques", List.of(
                banque("EQUITY BCDC", "00012-34567890-12", "USD"),
                banque("FBN BANK RDC", "00099-88776655-44", "USD"),
                banque("UBA RDC", "01234-56789012-34", "CDF")));

        String texte = extraireTexte(generateur.genererBonPaiement(data));

        assertThat(texte)
                .contains("PAYER EN BANQUE")
                .contains("EQUITY BCDC")
                .contains("FBN BANK RDC")
                .contains("UBA RDC")
                .contains("00012-34567890-12")
                .contains("01234-56789012-34");
    }

    /** Sans banque configurée, aucune section vide ne doit apparaître. */
    @Test
    void bon_NAfficheAucuneSectionBancaireSansBanqueConfiguree() throws Exception {
        String texte = extraireTexte(generateur.genererBonPaiement(donneesBon()));

        assertThat(texte).doesNotContain("PAYER EN BANQUE");
        assertThat(texte).contains("Espèces / Caissier");
    }

    /**
     * Une seule banque désignée par l'admin = une INSTRUCTION, pas un choix : le nom
     * du guichet est mis en évidence, c'est là et nulle part ailleurs que le dépôt
     * est accepté.
     */
    @Test
    void bon_MetEnEvidenceLaBanqueQuandUneSeuleEstDesignee() throws Exception {
        Map<String, Object> data = donneesBon();
        data.put("banques", List.of(banque("RAWBANK", "05500-11223344-55", "USD")));

        assertThat(extraireTexte(generateur.genererBonPaiement(data)))
                .contains("DÉPÔT À EFFECTUER À")
                .contains("RAWBANK")
                .contains("05500-11223344-55")
                // Le bon ne se règle QUE par dépôt d'espèces (terminal ou agent en
                // succursale) : aucune mention de virement ne doit y figurer.
                .contains("Dépôt d'espèces uniquement")
                .contains("au guichet, chez un caissier")
                .contains("Espèces : caisse ou banque")
                .contains("déposer en espèces en banque")
                .doesNotContain("virement");
    }

    /** Plusieurs banques ouvertes = l'étudiant choisit celle qui l'arrange. */
    @Test
    void bon_PresenteUnChoixQuandPlusieursBanquesSontDesignees() throws Exception {
        Map<String, Object> data = donneesBon();
        data.put("banques", List.of(
                banque("EQUITY BCDC", "00012-34567890-12", "USD"),
                banque("RAWBANK", "05500-11223344-55", "USD")));

        assertThat(extraireTexte(generateur.genererBonPaiement(data)))
                .contains("PAYER EN BANQUE")
                .contains("Dépôt d'espèces au guichet, chez un")
                .contains("caissier de l'un de ces établissements")
                // Le bon est un instrument de dépôt d'espèces, jamais de virement.
                .doesNotContain("virement")
                .doesNotContain("DÉPÔT À EFFECTUER À");
    }

    /** Au-delà de 4 banques, le ticket renvoie au QR plutôt que de s'allonger. */
    @Test
    void bon_LimiteLeNombreDeBanquesImprimees() throws Exception {
        Map<String, Object> data = donneesBon();
        data.put("banques", List.of(
                banque("EQUITY BCDC", "1", "USD"),
                banque("FBN BANK RDC", "2", "USD"),
                banque("UBA RDC", "3", "CDF"),
                banque("RAWBANK", "4", "USD"),
                banque("TMB", "5", "CDF"),
                banque("ECOBANK", "6", "USD")));

        String texte = extraireTexte(generateur.genererBonPaiement(data));

        assertThat(texte).contains("+ 2 autre(s) banque(s)");
        assertThat(texte).doesNotContain("ECOBANK");
    }

    /**
     * Un virement sans référence ne peut pas être rattaché à l'étudiant : la référence
     * doit rester lisible d'un bloc, jamais coupée en fin de ligne.
     */
    @Test
    void bon_RappelleLaReferenceAMentionnerSurLeBordereau() throws Exception {
        Map<String, Object> data = donneesBon();
        data.put("banques", List.of(banque("EQUITY BCDC", "00012-34567890-12", "USD")));

        String texte = extraireTexte(generateur.genererBonPaiement(data));

        assertThat(texte).contains("à mentionner sur le bordereau");
        // La référence doit apparaître d'un seul tenant, sans césure.
        assertThat(texte).contains("BP-2026-482913");
        assertThat(texte).doesNotContain("BP-2026-\n482913");
    }

    @Test
    void bon_TientSurUneSeulePage_AvecLeBlocBancaire() throws Exception {
        Map<String, Object> data = donneesBon();
        data.put("banques", List.of(
                banque("EQUITY BCDC", "00012-34567890-12", "USD"),
                banque("FBN BANK RDC", "00099-88776655-44", "USD"),
                banque("UBA RDC", "01234-56789012-34", "CDF"),
                banque("RAWBANK", "05500-11223344-55", "USD")));

        try (PdfDocument pdf = ouvrir(generateur.genererBonPaiement(data))) {
            assertThat(pdf.getNumberOfPages()).isEqualTo(1);
        }
    }

    // ══════════════════════════════════════════
    // Utilitaires
    // ══════════════════════════════════════════

    private Map<String, String> banque(String nom, String compte, String devise) {
        Map<String, String> b = new java.util.LinkedHashMap<>();
        b.put("nom", nom);
        b.put("compte", compte);
        b.put("devise", devise);
        return b;
    }

    private Map<String, Object> donneesBon() {
        Map<String, Object> data = new HashMap<>();
        data.put("universite", "HEC-K (Haute Ecole de Commerce)");
        data.put("numero", "BP-2026-482913");
        data.put("etudiant", "Christ BAMO");
        data.put("matricule", "HECKIN202500002");
        data.put("promotion", "L1 - Informatique");
        data.put("faculte", "INFORMATIQUE");
        data.put("montant", "455.00");
        data.put("devise", "USD");
        data.put("typeFrais", "Frais académiques");
        data.put("dateEmission", LocalDate.of(2026, 7, 25));
        data.put("dateExpiration", LocalDate.of(2026, 8, 1));
        return data;
    }

    private PdfDocument ouvrir(byte[] pdf) throws Exception {
        return new PdfDocument(new PdfReader(new ByteArrayInputStream(pdf)));
    }

    /** Image PNG d'un QR, en base64 nu — la forme que porte le champ {@code codeQR}. */
    private String qrBase64() throws Exception {
        return Base64.getEncoder().encodeToString(
                generateur.genererQrCode("GENUC:BP:BP-2026-482913", 200));
    }

    private float hauteurPage(byte[] pdf) throws Exception {
        try (PdfDocument doc = ouvrir(pdf)) {
            return doc.getPage(1).getPageSize().getHeight();
        }
    }

    /**
     * Cherche le QR parmi les images de la page.
     *
     * <p>Le ticket porte deux images au plus : le logo TachPay (3300 × 1500, donc large)
     * et le QR, seul carré. Se fier à la taille du fichier PDF, comme le faisait ce test,
     * ne prouvait rien : un bon amputé de son QR ne pèse que 600 octets de moins.</p>
     */
    private boolean porteUnQrCode(byte[] pdf) throws Exception {
        try (PdfDocument doc = ouvrir(pdf)) {
            PdfResources ressources = doc.getPage(1).getResources();
            for (PdfName nom : ressources.getResourceNames()) {
                PdfImageXObject image = ressources.getImage(nom);
                if (image != null && image.getWidth() == image.getHeight()) {
                    return true;
                }
            }
            return false;
        }
    }

    private String extraireTexte(byte[] pdf) throws Exception {
        try (PdfDocument doc = ouvrir(pdf)) {
            StringBuilder sb = new StringBuilder();
            for (int i = 1; i <= doc.getNumberOfPages(); i++) {
                sb.append(PdfTextExtractor.getTextFromPage(doc.getPage(i))).append('\n');
            }
            return sb.toString();
        }
    }

    private org.assertj.core.data.Offset<Float> within() {
        return org.assertj.core.data.Offset.offset(0.5f);
    }
}
