package cd.genuc.service;

import cd.genuc.model.*;
import cd.genuc.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class BibliothequeService {

    // ─── Repositories existants ─────────────────────────────────
    private final LivreRepository livreRepository;
    private final EmpruntRepository empruntRepository;
    private final EtudiantRepository etudiantRepository;

    // ─── Nouveaux repositories (bibliothèque avancée) ─────────
    private final OuvrageRepository ouvrageRepository;
    private final ReservationRepository reservationRepository;
    private final CategorieOuvrageRepository categorieRepository;

    // ════════════════════════════════════════════════════════════
    // 1. MÉTHODES EXISTANTES (inchangées pour compatibilité)
    // ════════════════════════════════════════════════════════════

    public List<Livre> listerLivresParUniversite(Long universiteId) {
        return livreRepository.findByUniversiteIdAndActifTrue(universiteId);
    }

    public Livre obtenirLivre(Long id) {
        return livreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Livre introuvable"));
    }

    @Transactional
    public Livre creerLivre(Livre livre) {
        livre.setQuantiteDisponible(livre.getQuantiteTotale());
        return livreRepository.save(livre);
    }

    @Transactional
    public Livre modifierLivre(Long id, Livre details) {
        Livre livre = obtenirLivre(id);
        livre.setTitre(details.getTitre());
        livre.setAuteur(details.getAuteur());
        livre.setIsbn(details.getIsbn());
        livre.setEditeur(details.getEditeur());
        livre.setAnneePublication(details.getAnneePublication());
        livre.setDescription(details.getDescription());
        livre.setCategorie(details.getCategorie());
        livre.setEmplacement(details.getEmplacement());
        livre.setCouvertureUrl(details.getCouvertureUrl());
        livre.setFichierPdfUrl(details.getFichierPdfUrl());
        livre.setQuantiteTotale(details.getQuantiteTotale());
        livre.setQuantiteDisponible(details.getQuantiteDisponible());
        return livreRepository.save(livre);
    }

    @Transactional
    public void desactiverLivre(Long id) {
        Livre livre = obtenirLivre(id);
        livre.setActif(false);
        livreRepository.save(livre);
    }

    @Transactional
    public Emprunt emprunterLivre(Long livreId, Long etudiantId) {
        Livre livre = obtenirLivre(livreId);
        if (!livre.isDisponible()) {
            throw new RuntimeException("Ce livre n'est pas disponible");
        }
        Etudiant etudiant = etudiantRepository.findById(etudiantId)
                .orElseThrow(() -> new RuntimeException("Étudiant introuvable"));

        long actifs = empruntRepository.countEmpruntsActifsByEtudiant(etudiantId);
        if (actifs >= 5) {
            throw new RuntimeException("Vous avez déjà 5 emprunts en cours. Veuillez en rendre avant d'en emprunter un nouveau.");
        }

        Emprunt emprunt = Emprunt.builder()
                .livre(livre)
                .etudiant(etudiant)
                .statut(Emprunt.StatutEmprunt.EN_COURS)
                .build();
        livre.setQuantiteDisponible(livre.getQuantiteDisponible() - 1);
        livreRepository.save(livre);
        return empruntRepository.save(emprunt);
    }

    @Transactional
    public Emprunt retournerLivre(Long empruntId) {
        Emprunt emprunt = empruntRepository.findById(empruntId)
                .orElseThrow(() -> new RuntimeException("Emprunt introuvable"));
        if (emprunt.getStatut() == Emprunt.StatutEmprunt.RENDU) {
            throw new RuntimeException("Ce livre est déjà rendu");
        }
        emprunt.setDateRetourReelle(LocalDate.now());
        emprunt.setStatut(Emprunt.StatutEmprunt.RENDU);
        emprunt.calculerPenalite();

        Livre livre = emprunt.getLivre();
        livre.setQuantiteDisponible(livre.getQuantiteDisponible() + 1);
        livreRepository.save(livre);

        return empruntRepository.save(emprunt);
    }

    @Transactional
    public Emprunt prolongerEmprunt(Long empruntId, int jours) {
        Emprunt emprunt = empruntRepository.findById(empruntId)
                .orElseThrow(() -> new RuntimeException("Emprunt introuvable"));
        if (emprunt.getStatut() != Emprunt.StatutEmprunt.EN_COURS) {
            throw new RuntimeException("Seul un emprunt en cours peut être prolongé");
        }
        if (emprunt.isEnRetard()) {
            throw new RuntimeException("Impossible de prolonger un emprunt en retard. Veuillez d'abord payer la pénalité.");
        }
        emprunt.setDateRetourPrevue(emprunt.getDateRetourPrevue().plusDays(jours));
        return empruntRepository.save(emprunt);
    }

    public List<Emprunt> getEmpruntsEtudiant(Long etudiantId) {
        return empruntRepository.findByEtudiantId(etudiantId);
    }

    // ════════════════════════════════════════════════════════════
    // 2. NOUVELLES MÉTHODES (bibliothèque avancée)
    // ════════════════════════════════════════════════════════════

    // ─── Catégories ─────────────────────────────────────────────

    public List<CategorieOuvrage> getCategories(Long universiteId) {
        return categorieRepository.findByUniversiteIdAndActifTrue(universiteId);
    }

    @Transactional
    public CategorieOuvrage creerCategorie(CategorieOuvrage categorie) {
        return categorieRepository.save(categorie);
    }

    @Transactional
    public void desactiverCategorie(Long id) {
        CategorieOuvrage categorie = categorieRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));
        categorie.setActif(false);
        categorieRepository.save(categorie);
    }

    // ─── Ouvrages (avec types) ──────────────────────────────────

    public List<Ouvrage> listerOuvragesParUniversite(Long universiteId) {
        return ouvrageRepository.findByUniversiteIdAndActifTrue(universiteId);
    }

    public List<Ouvrage> listerOuvragesParType(Long universiteId, Ouvrage.TypeOuvrage type) {
        return ouvrageRepository.findByUniversiteIdAndTypeOuvrage(universiteId, type);
    }

    public Ouvrage obtenirOuvrage(Long id) {
        return ouvrageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ouvrage introuvable"));
    }

    @Transactional
    public Ouvrage creerOuvrage(Ouvrage ouvrage) {
        ouvrage.setQuantiteDisponible(ouvrage.getQuantiteTotale());
        return ouvrageRepository.save(ouvrage);
    }

    @Transactional
    public Ouvrage modifierOuvrage(Long id, Ouvrage details) {
        Ouvrage existing = obtenirOuvrage(id);
        existing.setTitre(details.getTitre());
        existing.setAuteur(details.getAuteur());
        existing.setIsbn(details.getIsbn());
        existing.setDescription(details.getDescription());
        existing.setCategorie(details.getCategorie());
        existing.setQuantiteTotale(details.getQuantiteTotale());
        existing.setQuantiteDisponible(details.getQuantiteDisponible());
        existing.setTypeOuvrage(details.getTypeOuvrage());
        existing.setEditeur(details.getEditeur());
        existing.setLangue(details.getLangue());
        existing.setNbPages(details.getNbPages());
        existing.setResume(details.getResume());
        return ouvrageRepository.save(existing);
    }

    @Transactional
    public void supprimerOuvrage(Long id) {
        Ouvrage ouvrage = obtenirOuvrage(id);
        ouvrage.setActif(false);
        ouvrageRepository.save(ouvrage);
    }

    // ─── Recherche avancée ──────────────────────────────────────

    public List<Ouvrage> rechercherOuvrages(String motCle, String categorie, String type, Long universiteId) {
        List<Ouvrage> resultats = ouvrageRepository.rechercherParMotCle(motCle);

        if (universiteId != null) {
            resultats = resultats.stream()
                    .filter(o -> o.getUniversite().getId().equals(universiteId))
                    .toList();
        }

        if (categorie != null && !categorie.isEmpty()) {
            resultats = resultats.stream()
                    .filter(o -> categorie.equals(o.getCategorie()))
                    .toList();
        }

        if (type != null && !type.isEmpty()) {
            try {
                Ouvrage.TypeOuvrage typeEnum = Ouvrage.TypeOuvrage.valueOf(type);
                resultats = resultats.stream()
                        .filter(o -> o.getTypeOuvrage() == typeEnum)
                        .toList();
            } catch (IllegalArgumentException ignored) {}
        }

        return resultats;
    }

    // ─── Réservations ───────────────────────────────────────────

    @Transactional
    public Reservation reserverLivre(Long livreId, Long etudiantId) {
        Livre livre = livreRepository.findById(livreId)
                .orElseThrow(() -> new RuntimeException("Livre introuvable"));

        if (!livre.isDisponible()) {
            throw new RuntimeException("Ce livre n'est pas disponible");
        }

        Etudiant etudiant = etudiantRepository.findById(etudiantId)
                .orElseThrow(() -> new RuntimeException("Étudiant introuvable"));

        // Vérifier si l'étudiant a déjà une réservation active pour ce livre
        boolean dejaReserve = reservationRepository.existsByLivreIdAndEtudiantIdAndStatut(
                livreId, etudiantId, Reservation.StatutReservation.ACTIVE);
        if (dejaReserve) {
            throw new RuntimeException("Vous avez déjà une réservation active pour ce livre");
        }

        // Vérifier le nombre de réservations actives (max 3)
        long actives = reservationRepository.findByEtudiantId(etudiantId).stream()
                .filter(r -> r.getStatut() == Reservation.StatutReservation.ACTIVE)
                .count();
        if (actives >= 3) {
            throw new RuntimeException("Vous avez déjà 3 réservations actives");
        }

        Reservation reservation = Reservation.builder()
                .livre(livre)
                .etudiant(etudiant)
                .statut(Reservation.StatutReservation.ACTIVE)
                .build();

        return reservationRepository.save(reservation);
    }

    @Transactional
    public void annulerReservation(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable"));
        reservation.setStatut(Reservation.StatutReservation.ANNULEE);
        reservationRepository.save(reservation);
    }

    @Transactional
    public Emprunt transformerReservationEnEmprunt(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Réservation introuvable"));

        if (reservation.getStatut() != Reservation.StatutReservation.ACTIVE) {
            throw new RuntimeException("Cette réservation n'est plus active");
        }

        if (reservation.getDateExpiration().isBefore(LocalDate.now())) {
            reservation.setStatut(Reservation.StatutReservation.EXPIREE);
            reservationRepository.save(reservation);
            throw new RuntimeException("La réservation a expiré");
        }

        Livre livre = reservation.getLivre();
        if (!livre.isDisponible()) {
            throw new RuntimeException("Le livre n'est plus disponible");
        }

        // Créer un emprunt
        Emprunt emprunt = Emprunt.builder()
                .livre(livre)
                .etudiant(reservation.getEtudiant())
                .statut(Emprunt.StatutEmprunt.EN_COURS)
                .build();

        livre.setQuantiteDisponible(livre.getQuantiteDisponible() - 1);
        livreRepository.save(livre);

        reservation.setStatut(Reservation.StatutReservation.TRANSFORMEE_EN_EMPRUNT);
        reservationRepository.save(reservation);

        return empruntRepository.save(emprunt);
    }

    public List<Reservation> getReservationsEtudiant(Long etudiantId) {
        return reservationRepository.findByEtudiantId(etudiantId);
    }

    public List<Reservation> getReservationsParUniversite(Long universiteId) {
        return reservationRepository.findByUniversiteId(universiteId);
    }

    public List<Reservation> getReservationsActivesParUniversite(Long universiteId) {
        return reservationRepository.findActivesByUniversite(universiteId);
    }

    public List<Emprunt> getEmpruntsActifsParUniversite(Long universiteId) {
        return empruntRepository.findActifsByUniversite(universiteId);
    }

    // ─── Statistiques ───────────────────────────────────────────

    public Map<String, Object> getStatistiquesBibliotheque(Long universiteId) {
        long totalOuvrages = ouvrageRepository.count();
        long totalDisponibles = ouvrageRepository.countDisponiblesByUniversite(universiteId);
        long totalEmpruntsEnCours = empruntRepository.findByStatut(Emprunt.StatutEmprunt.EN_COURS).size();
        long totalReservations = reservationRepository.findByStatut(Reservation.StatutReservation.ACTIVE).size();

        long totalLivres = ouvrageRepository.findByUniversiteIdAndTypeOuvrage(universiteId, Ouvrage.TypeOuvrage.LIVRE).size();
        long totalRevues = ouvrageRepository.findByUniversiteIdAndTypeOuvrage(universiteId, Ouvrage.TypeOuvrage.REVUE).size();
        long totalMemoires = ouvrageRepository.findByUniversiteIdAndTypeOuvrage(universiteId, Ouvrage.TypeOuvrage.MEMOIRE).size();
        long totalTheses = ouvrageRepository.findByUniversiteIdAndTypeOuvrage(universiteId, Ouvrage.TypeOuvrage.THESE).size();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalOuvrages", totalOuvrages);
        stats.put("totalDisponibles", totalDisponibles);
        stats.put("totalEmpruntsEnCours", totalEmpruntsEnCours);
        stats.put("totalReservations", totalReservations);
        stats.put("repartition", Map.of(
                "LIVRE", totalLivres,
                "REVUE", totalRevues,
                "MEMOIRE", totalMemoires,
                "THESE", totalTheses
        ));

        return stats;
    }

    // ─── Gestion des retards ────────────────────────────────────

    @Transactional
    public void gererRetards() {
        List<Emprunt> retards = empruntRepository.findByStatutAndDateRetourPrevueBefore(
                Emprunt.StatutEmprunt.EN_COURS, LocalDate.now());

        for (Emprunt emprunt : retards) {
            emprunt.calculerPenalite();
            empruntRepository.save(emprunt);
            log.info("Pénalité calculée pour l'emprunt {} : {}", emprunt.getId(), emprunt.getPenalite());
        }
    }

    public List<Emprunt> getEmpruntsEcheanceProche(Long universiteId, int jours) {
        LocalDate date = LocalDate.now().plusDays(jours);
        return empruntRepository.findAll().stream()
                .filter(e -> e.getStatut() == Emprunt.StatutEmprunt.EN_COURS)
                .filter(e -> e.getLivre().getUniversite().getId().equals(universiteId))
                .filter(e -> e.getDateRetourPrevue().isBefore(date))
                .toList();
    }
}