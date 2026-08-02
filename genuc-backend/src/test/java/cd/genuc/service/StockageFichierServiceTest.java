package cd.genuc.service;

import cd.genuc.exception.BusinessException;
import cd.genuc.service.StockageFichierService.Categorie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Durcissement du stockage des fichiers téléversés.
 *
 * <p>Avant, chaque service construisait son chemin avec
 * {@code UUID + "_" + file.getOriginalFilename()} : le nom fourni par le client
 * atteignait le disque, sans validation d'extension ni de contenu, et le fichier était
 * ensuite servi en statique depuis l'origine de l'API.</p>
 */
class StockageFichierServiceTest {

    private StockageFichierService stockage;
    private Path racine;

    private static final byte[] ENTETE_PDF = "%PDF-1.7\n...".getBytes(StandardCharsets.UTF_8);
    private static final byte[] ENTETE_PNG = new byte[] {
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };

    @BeforeEach
    void setUp(@TempDir Path tempDir) {
        racine = tempDir;
        stockage = new StockageFichierService();
        ReflectionTestUtils.setField(stockage, "racine", tempDir.toString());
        ReflectionTestUtils.setField(stockage, "tailleMaxMo", 25L);
    }

    // ─── Nom de fichier généré côté serveur ──────────────────────

    @Test
    void enregistrer_NeReprendJamaisLeNomFourniParLeClient() {
        var fichier = new MockMultipartFile("f", "bulletin scolaire.pdf", "application/pdf", ENTETE_PDF);

        var resultat = stockage.enregistrer(fichier, "dossiers", Categorie.DOCUMENT);

        assertThat(resultat.url()).matches("/uploads/dossiers/[0-9a-f-]{36}\\.pdf");
        assertThat(resultat.url()).doesNotContain("bulletin");
        // Le nom d'origine reste disponible comme métadonnée d'affichage.
        assertThat(resultat.nomOriginal()).isEqualTo("bulletin scolaire.pdf");
        assertThat(Files.exists(resultat.chemin())).isTrue();
    }

    /**
     * Le préfixe UUID ne neutralisait PAS la traversée : "uuid_../../x" se normalise
     * un cran plus haut. Le nom étant désormais généré, les segments ".." du nom
     * client n'atteignent plus le système de fichiers.
     */
    @Test
    void enregistrer_NeutraliseLaTraverseeDeChemin() {
        var fichier = new MockMultipartFile("f", "../../../evil.pdf", "application/pdf", ENTETE_PDF);

        var resultat = stockage.enregistrer(fichier, "dossiers", Categorie.DOCUMENT);

        assertThat(resultat.chemin().normalize()).startsWith(racine.toAbsolutePath().normalize());
        assertThat(resultat.chemin().getParent().getFileName().toString()).isEqualTo("dossiers");
        assertThat(resultat.url()).doesNotContain("..");
    }

    // ─── Liste blanche d'extensions ──────────────────────────────

    @Test
    void enregistrer_RefuseUnExecutableDeguiseEnPieceJointe() {
        var fichier = new MockMultipartFile("f", "payload.exe", "application/octet-stream", ENTETE_PDF);

        assertThatThrownBy(() -> stockage.enregistrer(fichier, "dossiers", Categorie.DOCUMENT))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Type de fichier non autorisé");
    }

    /**
     * Le SVG peut contenir du script. Servi depuis l'origine de l'API, il donnerait
     * un XSS stocké — il est donc absent de la liste blanche des images.
     */
    @Test
    void enregistrer_RefuseUnSvgCommeImage() {
        var fichier = new MockMultipartFile("f", "logo.svg", "image/svg+xml",
                "<svg onload=\"alert(1)\"></svg>".getBytes(StandardCharsets.UTF_8));

        assertThatThrownBy(() -> stockage.enregistrer(fichier, "logos", Categorie.IMAGE))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Type de fichier non autorisé");
    }

    @Test
    void enregistrer_RefuseUnFichierSansExtension() {
        var fichier = new MockMultipartFile("f", "sans_extension", "application/pdf", ENTETE_PDF);

        assertThatThrownBy(() -> stockage.enregistrer(fichier, "dossiers", Categorie.DOCUMENT))
                .isInstanceOf(BusinessException.class);
    }

    // ─── Cohérence contenu / extension ───────────────────────────

    @Test
    void enregistrer_RefuseDuHtmlRenommeEnPdf() {
        var fichier = new MockMultipartFile("f", "innocent.pdf", "application/pdf",
                "<html><script>fetch('//attaquant')</script></html>".getBytes(StandardCharsets.UTF_8));

        assertThatThrownBy(() -> stockage.enregistrer(fichier, "dossiers", Categorie.DOCUMENT))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ne correspond pas à son extension");
    }

    @Test
    void enregistrer_RefuseDuHtmlRenommeEnPng() {
        var fichier = new MockMultipartFile("f", "avatar.png", "image/png",
                "<html><script>alert(1)</script></html>".getBytes(StandardCharsets.UTF_8));

        assertThatThrownBy(() -> stockage.enregistrer(fichier, "photos", Categorie.IMAGE))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("ne correspond pas à son extension");
    }

    @Test
    void enregistrer_AccepteUnPngValide() {
        var fichier = new MockMultipartFile("f", "photo.png", "image/png", ENTETE_PNG);

        var resultat = stockage.enregistrer(fichier, "photos", Categorie.IMAGE);

        assertThat(resultat.extension()).isEqualTo("png");
        assertThat(Files.exists(resultat.chemin())).isTrue();
    }

    // ─── Taille et fichier vide ──────────────────────────────────

    @Test
    void enregistrer_RefuseUnFichierVide() {
        var fichier = new MockMultipartFile("f", "vide.pdf", "application/pdf", new byte[0]);

        assertThatThrownBy(() -> stockage.enregistrer(fichier, "dossiers", Categorie.DOCUMENT))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void enregistrer_RefuseUnFichierTropVolumineux() {
        ReflectionTestUtils.setField(stockage, "tailleMaxMo", 1L);
        byte[] gros = new byte[2 * 1024 * 1024];
        System.arraycopy(ENTETE_PDF, 0, gros, 0, ENTETE_PDF.length);
        var fichier = new MockMultipartFile("f", "gros.pdf", "application/pdf", gros);

        assertThatThrownBy(() -> stockage.enregistrer(fichier, "dossiers", Categorie.DOCUMENT))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("trop volumineux");
    }

    // ─── Résolution d'une URL stockée ────────────────────────────

    @Test
    void resoudre_RefuseUneUrlQuiSortDeLaRacine() {
        assertThat(stockage.resoudre("/uploads/../../../etc/passwd")).isNull();
        assertThat(stockage.resoudre("/uploads/dossiers/../../../../secret.txt")).isNull();
    }

    @Test
    void resoudre_AccepteUneUrlLegitime() {
        var resultat = stockage.enregistrer(
                new MockMultipartFile("f", "piece.pdf", "application/pdf", ENTETE_PDF),
                "dossiers", Categorie.DOCUMENT);

        assertThat(stockage.resoudre(resultat.url())).isEqualTo(resultat.chemin());
    }

    @Test
    void resoudre_RenvoieNullSurUrlAbsente() {
        assertThat(stockage.resoudre(null)).isNull();
        assertThat(stockage.resoudre("  ")).isNull();
    }
}
