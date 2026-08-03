package cd.genuc.service;

import cd.genuc.repository.CoursRepository;
import cd.genuc.repository.EtudiantRepository;
import cd.genuc.repository.InscriptionRepository;
import cd.genuc.repository.PresenceRepository;
import cd.genuc.repository.SeanceLiveRepository;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.DecodeHintType;
import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
import com.google.zxing.qrcode.QRCodeReader;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.EnumMap;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

/**
 * Aller-retour du QR code d'émargement.
 *
 * <p>Le générateur et le lecteur vivent dans le même service mais ne partagent
 * aucun code : rien ne garantit que le format écrit soit celui qui est lu. Une
 * expiration sérialisée via {@code LocalDateTime.toString()} a ainsi introduit
 * des « : » supplémentaires dans un payload découpé sur « : », décalant tous
 * les champs — chaque scan échouait, sans que la compilation ni le reste de la
 * suite ne le signalent. Ce test relit réellement l'image produite.</p>
 */
@ExtendWith(MockitoExtension.class)
class PresenceQrCodeTest {

    @Mock private PresenceRepository presenceRepository;
    @Mock private CoursRepository coursRepository;
    @Mock private SeanceLiveRepository seanceLiveRepository;
    @Mock private InscriptionRepository inscriptionRepository;
    @Mock private EtudiantRepository etudiantRepository;

    @InjectMocks private PresenceService presenceService;

    /**
     * Décode l'image PNG produite et rend le texte encodé.
     *
     * <p>Les indices sont indispensables : l'image est un code pur, sans photo
     * ni perspective. Sans {@code PURE_BARCODE}, la binarisation générique
     * échoue par intermittence selon la densité du motif — laquelle varie avec
     * l'UUID tiré à chaque appel.</p>
     */
    private String lireQrCode(byte[] png) throws Exception {
        var image = ImageIO.read(new ByteArrayInputStream(png));
        var bitmap = new BinaryBitmap(new HybridBinarizer(new BufferedImageLuminanceSource(image)));
        var indices = new EnumMap<DecodeHintType, Object>(DecodeHintType.class);
        indices.put(DecodeHintType.PURE_BARCODE, Boolean.TRUE);
        indices.put(DecodeHintType.TRY_HARDER, Boolean.TRUE);
        return new QRCodeReader().decode(bitmap, indices).getText();
    }

    @Test
    @DisplayName("Le payload généré reste découpable : l'expiration n'introduit pas de séparateur")
    void payloadGenere_resteDecoupable() throws Exception {
        String payload = lireQrCode(presenceService.genererQrCode(7L, 42L));

        String[] parts = payload.split(":");
        assertThat(parts).hasSize(6);
        assertThat(parts[0]).isEqualTo("GENUC");
        assertThat(parts[1]).isEqualTo("PRESENCE");
        assertThat(parts[2]).isEqualTo("7");
        assertThat(parts[3]).isEqualTo("42");
        // parts[4] = UUID ; parts[5] = expiration, qui doit rester un entier.
        assertThat(Long.parseLong(parts[5]))
                .isGreaterThan(LocalDateTime.now().toEpochSecond(ZoneOffset.UTC));
    }

    @Test
    @DisplayName("Un QR fraîchement généré est accepté par le lecteur")
    void qrFraichementGenere_estRelu() throws Exception {
        String payload = lireQrCode(presenceService.genererQrCode(7L, 42L));
        when(coursRepository.findById(anyLong())).thenReturn(Optional.empty());

        // Le service doit dépasser l'analyse du payload et buter sur le cours
        // absent — preuve que ni « QR code invalide » ni « QR code expiré »
        // n'ont été déclenchés à tort.
        assertThatThrownBy(() -> presenceService.enregistrerPresence(payload, 1L))
                .hasMessage("Cours introuvable");
    }

    @Test
    @DisplayName("Une séance à 0 est relue comme absente de séance")
    void seanceZero_estRelueCommeNulle() throws Exception {
        String payload = lireQrCode(presenceService.genererQrCode(7L, null));

        assertThat(payload.split(":")[3]).isEqualTo("0");
    }

    @Test
    @DisplayName("Un QR expiré est refusé")
    void qrExpire_estRefuse() {
        long expire = LocalDateTime.now().minusMinutes(1).toEpochSecond(ZoneOffset.UTC);
        String payload = "GENUC:PRESENCE:7:42:" + java.util.UUID.randomUUID() + ":" + expire;

        assertThatThrownBy(() -> presenceService.enregistrerPresence(payload, 1L))
                .hasMessage("QR code expiré");
    }

    @Test
    @DisplayName("Un payload étranger est rejeté comme invalide, sans erreur technique")
    void payloadEtranger_estRejete() {
        assertThatThrownBy(() -> presenceService.enregistrerPresence("https://exemple.cd/x", 1L))
                .hasMessage("QR code invalide");

        // Bon préfixe mais champs non numériques : refus métier, pas de
        // NumberFormatException remontée en 500.
        assertThatThrownBy(() -> presenceService.enregistrerPresence("GENUC:PRESENCE:a:b:uuid:zzz", 1L))
                .hasMessage("QR code invalide");
    }
}
