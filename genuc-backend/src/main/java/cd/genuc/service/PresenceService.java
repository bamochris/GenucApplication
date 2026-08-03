package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.repository.*;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PresenceService {

    private final PresenceRepository presenceRepository;
    private final CoursRepository coursRepository;
    private final SeanceLiveRepository seanceLiveRepository;
    private final InscriptionRepository inscriptionRepository;
    private final EtudiantRepository etudiantRepository;

    public byte[] genererQrCode(Long coursId, Long seanceId) throws WriterException, IOException {
        String uuid = UUID.randomUUID().toString();
        LocalDateTime expiration = LocalDateTime.now().plusMinutes(5);
        String payload = String.format("GENUC:PRESENCE:%d:%d:%s:%s", coursId, seanceId != null ? seanceId : 0, uuid, expiration.toString());
        QRCodeWriter qrWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrWriter.encode(payload, BarcodeFormat.QR_CODE, 300, 300);
        ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
        return pngOutputStream.toByteArray();
    }

    @Transactional
    public Presence enregistrerPresence(String payload, Long etudiantId) {
        String[] parts = payload.split(":");
        if (parts.length < 5 || !parts[0].equals("GENUC") || !parts[1].equals("PRESENCE")) {
            throw new RuntimeException("QR code invalide");
        }
        Long coursId = Long.parseLong(parts[2]);
        Long seanceId = parts[3].equals("0") ? null : Long.parseLong(parts[3]);
        LocalDateTime expiration = LocalDateTime.parse(parts[4]);

        if (LocalDateTime.now().isAfter(expiration)) {
            throw new RuntimeException("QR code expiré");
        }

        Cours cours = coursRepository.findById(coursId)
                .orElseThrow(() -> new RuntimeException("Cours introuvable"));

        // ✅ Correction : utilisation de l'enum StatutInscription.VALIDE
        Inscription inscription = inscriptionRepository.findByEtudiantIdAndStatut(etudiantId, StatutInscription.VALIDE)
                .orElseThrow(() -> new RuntimeException("Étudiant non inscrit ou dossier non validé"));

        SeanceLive seance = null;
        if (seanceId != null) {
            seance = seanceLiveRepository.findById(seanceId)
                    .orElseThrow(() -> new RuntimeException("Séance introuvable"));
        }

        boolean dejaPresent = presenceRepository.existsByCoursIdAndEtudiantIdAndDateCours(coursId, etudiantId, LocalDate.now());
        if (dejaPresent) {
            throw new RuntimeException("Présence déjà enregistrée pour ce cours aujourd'hui");
        }

        Presence presence = Presence.builder()
                .cours(cours)
                .etudiant(inscription.getEtudiant())
                .seance(seance)
                .dateCours(LocalDate.now())
                .heureArrivee(LocalTime.now())
                .present(true)
                .codeQrScanne(parts[4])
                .scanTimestamp(LocalDateTime.now())
                .build();

        return presenceRepository.save(presence);
    }

    public List<Presence> getPresencesEtudiant(Long etudiantId, Long coursId) {
        if (coursId != null) {
            return presenceRepository.findByEtudiantIdAndCoursId(etudiantId, coursId);
        }
        return presenceRepository.findByEtudiantId(etudiantId);
    }

    public List<Presence> getPresencesCours(Long coursId, LocalDate date) {
        if (date != null) {
            return presenceRepository.findByCoursIdAndDateCours(coursId, date);
        }
        return presenceRepository.findByCoursId(coursId);
    }

    public List<Map<String, Object>> getTableauPresences(Long coursId, LocalDate date) {
        Cours cours = coursRepository.findById(coursId)
                .orElseThrow(() -> new RuntimeException("Cours introuvable"));

        List<Inscription> inscriptions = inscriptionRepository.findByPromotionId(cours.getPromotion().getId());

        List<Presence> presences = presenceRepository.findByCoursIdAndDateCours(coursId, date);
        Map<Long, Presence> presenceMap = presences.stream()
                .collect(Collectors.toMap(p -> p.getEtudiant().getId(), Function.identity()));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Inscription ins : inscriptions) {
            Etudiant etudiant = ins.getEtudiant();
            Presence p = presenceMap.get(etudiant.getId());
            Map<String, Object> row = new HashMap<>();
            row.put("etudiantId", etudiant.getId());
            row.put("nom", etudiant.getNom());
            row.put("prenom", etudiant.getPrenom());
            row.put("present", p != null && p.isPresent());
            row.put("justifie", p != null && p.isJustifie());
            row.put("heureArrivee", p != null ? p.getHeureArrivee().toString() : null);
            row.put("presenceId", p != null ? p.getId() : null);
            result.add(row);
        }
        return result;
    }

    /** Saisie manuelle groupée des présences d'un cours pour une date donnée (upsert) */
    @Transactional
    public List<Presence> saisirPresences(Long coursId, LocalDate date, List<Map<String, Object>> presences) {
        Cours cours = coursRepository.findById(coursId)
                .orElseThrow(() -> new RuntimeException("Cours introuvable"));

        List<Presence> resultats = new ArrayList<>();
        for (Map<String, Object> entry : presences) {
            Long etudiantId = Long.valueOf(entry.get("etudiantId").toString());
            boolean present = Boolean.TRUE.equals(entry.get("present"));
            boolean justifie = Boolean.TRUE.equals(entry.get("justifie"));

            Etudiant etudiant = etudiantRepository.findById(etudiantId)
                    .orElseThrow(() -> new RuntimeException("Étudiant introuvable : id=" + etudiantId));

            Presence presence = presenceRepository.findByEtudiantIdAndCoursIdAndDateCours(etudiantId, coursId, date)
                    .orElse(Presence.builder()
                            .cours(cours)
                            .etudiant(etudiant)
                            .dateCours(date)
                            .build());

            presence.setPresent(present);
            presence.setJustifie(justifie);
            if (present && presence.getHeureArrivee() == null) {
                presence.setHeureArrivee(LocalTime.now());
            }

            resultats.add(presenceRepository.save(presence));
        }
        return resultats;
    }

    @Transactional
    public Presence justifierPresence(Long presenceId) {
        Presence p = presenceRepository.findById(presenceId)
                .orElseThrow(() -> new RuntimeException("Présence introuvable"));
        p.setJustifie(true);
        return presenceRepository.save(p);
    }
}