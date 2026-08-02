package cd.genuc.service;

import cd.genuc.model.DocumentAnalyse;
import cd.genuc.model.DossierInscription;
import cd.genuc.repository.DocumentAnalyseRepository;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Analyse machine LOCALE et déterministe des pièces d'un dossier (aucune IA en ligne).
 * Contrôles : type réel (magic bytes), taille, résolution, page blanche, netteté,
 * intégrité PDF, détection de doublons par empreinte SHA-256, et — si l'OCR local est
 * disponible — vérification de contenu (présence du nom, mots-clés, n° de document).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyseDocumentService {

    private final DocumentAnalyseRepository analyseRepo;
    private final OcrLocalService ocr;

    private static final Pattern NUM = Pattern.compile("\\b\\d{6,}\\b");

    /** clé de document → mots-clés attendus dans le texte (OCR). */
    private static final Map<String, String[]> MOTS_CLES = Map.of(
        "urlDiplomeEtat", new String[]{"DIPLOME", "ETAT"},
        "urlAttestationReussite", new String[]{"ATTESTATION", "REUSSITE"},
        "urlReleveNotes", new String[]{"RELEVE", "BULLETIN", "NOTES"},
        "urlActeNaissance", new String[]{"NAISSANCE", "ACTE"},
        "urlAttestationNationalite", new String[]{"NATIONALITE"},
        "urlCarteIdentite", new String[]{"IDENTITE", "CARTE", "PASSEPORT"}
    );

    public Map<String, Object> analyser(DossierInscription dossier) {
        Map<String, Object> resultat = new LinkedHashMap<>();
        resultat.put("ocrDisponible", ocr.estDisponible());
        Map<String, Object> docs = new LinkedHashMap<>();
        urls(dossier).forEach((cle, url) -> {
            if (url != null && !url.isBlank()) {
                docs.put(cle, analyserFichier(dossier, cle, url));
            }
        });
        resultat.put("documents", docs);
        return resultat;
    }

    @Transactional
    protected Map<String, Object> analyserFichier(DossierInscription dossier, String cle, String url) {
        Map<String, Object> r = new LinkedHashMap<>();
        List<String> alertes = new ArrayList<>();
        int score = 100;

        Path path = Paths.get(url.startsWith("/") ? url.substring(1) : url);
        byte[] bytes;
        try {
            if (!Files.exists(path)) {
                r.put("niveau", "PROBLEME");
                r.put("alertes", List.of("Fichier introuvable sur le serveur"));
                r.put("score", 0);
                return r;
            }
            bytes = Files.readAllBytes(path);
        } catch (Exception e) {
            r.put("niveau", "PROBLEME");
            r.put("alertes", List.of("Lecture du fichier impossible : " + e.getMessage()));
            r.put("score", 0);
            return r;
        }

        long tailleKo = bytes.length / 1024;
        r.put("tailleKo", tailleKo);
        if (bytes.length < 3 * 1024) { alertes.add("Fichier très petit — probablement vide"); score -= 50; }

        String type = typeMagique(bytes);
        r.put("typeDetecte", type);
        if ("INCONNU".equals(type)) { alertes.add("Format non reconnu (ni PDF, ni image)"); score -= 60; }

        // ── Empreinte + détection de doublons ──────────────────────────
        String sha = sha256(bytes);
        if (sha != null) {
            Set<Long> autresDossiers = new LinkedHashSet<>();
            boolean autrePieceMemeDossier = false;
            for (DocumentAnalyse da : analyseRepo.findBySha256(sha)) {
                if (!Objects.equals(da.getDossierId(), dossier.getId())) autresDossiers.add(da.getDossierId());
                else if (!Objects.equals(da.getCleDocument(), cle)) autrePieceMemeDossier = true;
            }
            for (Long autre : autresDossiers) {
                alertes.add("⚠ Doublon : fichier identique déjà soumis (dossier #" + autre + ")");
                score -= 45;
            }
            if (autrePieceMemeDossier) {
                alertes.add("Identique à une autre pièce du même dossier");
                score -= 15;
            }
        }

        // ── Images (JPEG/PNG) : résolution, page blanche, netteté, OCR ──
        if ("JPEG".equals(type) || "PNG".equals(type)) {
            BufferedImage img = null;
            try { img = ImageIO.read(new ByteArrayInputStream(bytes)); } catch (Exception ignore) {}
            if (img == null) {
                alertes.add("Image illisible / corrompue"); score -= 60;
            } else {
                int w = img.getWidth(), h = img.getHeight();
                r.put("largeur", w); r.put("hauteur", h);
                if (Math.min(w, h) < 150) { alertes.add("Résolution très faible — illisible"); score -= 40; }
                else if (Math.min(w, h) < 400) { alertes.add("Résolution faible"); score -= 10; }

                if (fractionBlanche(img) > 0.985) { alertes.add("Page quasi vide / blanche"); score -= 50; }
                if (nettete(img) < 6.0) { alertes.add("Image possiblement floue (à vérifier)"); score -= 10; }

                String texte = ocr.lireTexte(img);
                if (texte != null) {
                    score += analyserTexte(texte, cle, dossier, r, alertes);
                }
            }
        }
        // ── PDF : intégrité + nombre de pages (via iText) ──────────────
        else if ("PDF".equals(type)) {
            try (PdfDocument pdf = new PdfDocument(new PdfReader(new ByteArrayInputStream(bytes)))) {
                r.put("pages", pdf.getNumberOfPages());
            } catch (Exception e) {
                alertes.add("PDF illisible, corrompu ou protégé par mot de passe"); score -= 40;
            }
        }

        score = Math.max(0, Math.min(100, score));
        r.put("score", score);
        r.put("niveau", score >= 80 ? "OK" : score >= 50 ? "ATTENTION" : "PROBLEME");
        r.put("alertes", alertes);

        if (sha != null) upsert(dossier.getId(), cle, sha, type, score, String.join(" | ", alertes));
        return r;
    }

    /** Vérifications de contenu via le texte OCR. Renvoie un ajustement de score. */
    private int analyserTexte(String texte, String cle, DossierInscription d,
                              Map<String, Object> r, List<String> alertes) {
        int delta = 0;
        String t = normaliser(texte);
        r.put("ocr", "OK");

        boolean nomTrouve = (d.getNom() != null && t.contains(normaliser(d.getNom())))
                         || (d.getPrenom() != null && t.contains(normaliser(d.getPrenom())));
        r.put("nomTrouve", nomTrouve);
        if (nomTrouve) delta += 5;
        else { alertes.add("Le nom du dossier n'apparaît pas dans le document (OCR)"); delta -= 15; }

        String[] cles = MOTS_CLES.get(cle);
        if (cles != null) {
            boolean ok = Arrays.stream(cles).anyMatch(m -> t.contains(normaliser(m)));
            r.put("typeConfirme", ok);
            if (!ok) { alertes.add("Mots-clés attendus absents du texte — type de pièce douteux"); delta -= 15; }
        }

        Matcher m = NUM.matcher(texte);
        if (m.find()) r.put("numeroDetecte", m.group());
        return delta;
    }

    @Transactional
    protected void upsert(Long dossierId, String cle, String sha, String type, int score, String alertes) {
        DocumentAnalyse da = analyseRepo.findByDossierIdAndCleDocument(dossierId, cle)
            .orElseGet(() -> DocumentAnalyse.builder().dossierId(dossierId).cleDocument(cle).build());
        da.setSha256(sha);
        da.setTypeDetecte(type);
        da.setScoreQualite(score);
        da.setAlertes(alertes);
        analyseRepo.save(da);
    }

    // ─── Contrôles bas niveau (déterministes) ───────────────────────

    private Map<String, String> urls(DossierInscription d) {
        Map<String, String> m = new LinkedHashMap<>();
        m.put("urlPhoto", d.getUrlPhoto());
        m.put("urlPhotoPasseport", d.getUrlPhotoPasseport());
        m.put("urlDiplomeEtat", d.getUrlDiplomeEtat());
        m.put("urlAttestationReussite", d.getUrlAttestationReussite());
        m.put("urlReleveNotes", d.getUrlReleveNotes());
        m.put("urlActeNaissance", d.getUrlActeNaissance());
        m.put("urlAttestationNationalite", d.getUrlAttestationNationalite());
        m.put("urlCarteIdentite", d.getUrlCarteIdentite());
        m.put("urlLettreRecommandation", d.getUrlLettreRecommandation());
        m.put("urlAttestationPhysique", d.getUrlAttestationPhysique());
        m.put("urlAttestationConduite", d.getUrlAttestationConduite());
        return m;
    }

    private static String typeMagique(byte[] b) {
        if (b.length >= 4 && b[0] == 0x25 && b[1] == 0x50 && b[2] == 0x44 && b[3] == 0x46) return "PDF";
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) return "JPEG";
        if (b.length >= 4 && (b[0] & 0xFF) == 0x89 && b[1] == 0x50 && b[2] == 0x4E && b[3] == 0x47) return "PNG";
        return "INCONNU";
    }

    private static String sha256(byte[] b) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            StringBuilder sb = new StringBuilder();
            for (byte x : md.digest(b)) sb.append(String.format("%02x", x));
            return sb.toString();
        } catch (Exception e) { return null; }
    }

    private static String normaliser(String s) {
        if (s == null) return "";
        return Normalizer.normalize(s, Normalizer.Form.NFD)
            .replaceAll("\\p{M}+", "").toUpperCase().replaceAll("[^A-Z0-9]", "");
    }

    private static double fractionBlanche(BufferedImage img) {
        int w = img.getWidth(), h = img.getHeight();
        int step = Math.max(1, Math.min(w, h) / 300);
        long total = 0, blanc = 0;
        for (int y = 0; y < h; y += step) for (int x = 0; x < w; x += step) {
            int rgb = img.getRGB(x, y);
            int lum = (((rgb >> 16) & 0xFF) * 299 + ((rgb >> 8) & 0xFF) * 587 + (rgb & 0xFF) * 114) / 1000;
            total++; if (lum >= 245) blanc++;
        }
        return total == 0 ? 0 : (double) blanc / total;
    }

    /** Variance du Laplacien (netteté) sur une grille échantillonnée. */
    private static double nettete(BufferedImage img) {
        int w = img.getWidth(), h = img.getHeight();
        int step = Math.max(1, Math.min(w, h) / 400);
        int gw = w / step, gh = h / step;
        if (gw < 3 || gh < 3) return 999;
        int[][] g = new int[gh][gw];
        for (int y = 0; y < gh; y++) for (int x = 0; x < gw; x++) {
            int rgb = img.getRGB(x * step, y * step);
            g[y][x] = (((rgb >> 16) & 0xFF) * 299 + ((rgb >> 8) & 0xFF) * 587 + (rgb & 0xFF) * 114) / 1000;
        }
        double sum = 0, sum2 = 0; int n = 0;
        for (int y = 1; y < gh - 1; y++) for (int x = 1; x < gw - 1; x++) {
            int lap = 4 * g[y][x] - g[y - 1][x] - g[y + 1][x] - g[y][x - 1] - g[y][x + 1];
            sum += lap; sum2 += (double) lap * lap; n++;
        }
        if (n == 0) return 999;
        double mean = sum / n;
        return sum2 / n - mean * mean;
    }
}
