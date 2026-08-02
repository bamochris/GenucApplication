package cd.genuc.service;

import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.Tesseract;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.image.BufferedImage;
import java.io.File;

/**
 * OCR 100 % LOCAL via Tesseract (hors-ligne, sur la machine — aucune IA en ligne, aucun réseau).
 * S'active seulement si les données de langue (tessdata) sont présentes ; sinon l'analyse
 * continue avec les seuls contrôles déterministes.
 *
 * Installation (une fois) :
 *   1. Récupérer un dossier `tessdata` contenant `fra.traineddata` (+ `eng.traineddata`)
 *      → https://github.com/tesseract-ocr/tessdata_fast
 *   2. Le placer dans le dossier de travail du backend, ou définir ocr.tessdata-path.
 */
@Slf4j
@Service
public class OcrLocalService {

    @Value("${ocr.tessdata-path:tessdata}")
    private String tessdataPath;

    @Value("${ocr.langue:fra+eng}")
    private String langue;

    @Value("${ocr.actif:true}")
    private boolean actif;

    private volatile Boolean disponible;

    public boolean estDisponible() {
        if (disponible == null) {
            synchronized (this) {
                if (disponible == null) {
                    disponible = actif && new File(tessdataPath).isDirectory();
                    log.info("OCR local : {} (tessdata='{}', langue='{}')",
                        disponible ? "ACTIF" : "désactivé", tessdataPath, langue);
                }
            }
        }
        return disponible;
    }

    /** Texte extrait localement, ou null si OCR indisponible / échec. */
    public String lireTexte(BufferedImage image) {
        if (image == null || !estDisponible()) return null;
        try {
            Tesseract t = new Tesseract();
            t.setDatapath(tessdataPath);
            t.setLanguage(langue);
            return t.doOCR(image);
        } catch (Throwable e) {   // Throwable : couvre aussi UnsatisfiedLinkError (natif absent)
            log.warn("OCR local indisponible ({}). Analyse poursuivie sans OCR.", e.getMessage());
            disponible = false;   // on ne réessaie pas en boucle
            return null;
        }
    }
}
