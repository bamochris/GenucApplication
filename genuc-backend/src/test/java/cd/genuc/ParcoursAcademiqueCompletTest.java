package cd.genuc;

import cd.genuc.model.*;
import cd.genuc.model.Deliberation.DecisionJury;
import cd.genuc.model.Deliberation.StatutDeliberation;
import cd.genuc.model.Note.StatutNote;
import cd.genuc.repository.*;
import cd.genuc.service.DeliberationService;
import cd.genuc.service.TransitionAnneeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Parcours académique complet d'un étudiant, de la première année au diplôme.
 *
 * <p>Chaîne de fin d'année : notes publiées → préparation de la délibération →
 * tenue du jury → publication → passage de classe. Chaque maillon exige l'état
 * produit par le précédent, si bien qu'une garde mal posée sur un seul d'entre
 * eux verrouille tout l'aval sans qu'aucun test unitaire ne s'en aperçoive —
 * c'est précisément ce qui était arrivé.</p>
 *
 * <p>Le cycle retenu est le graduat congolais (G1 → G2 → G3), le plus répandu
 * dans les établissements desservis, et celui dont l'année terminale manquait
 * aux règles de décision du jury.</p>
 */
@SpringBootTest
class ParcoursAcademiqueCompletTest extends IntegrationTestBase {

    @Autowired private UniversiteRepository universiteRepo;
    @Autowired private FaculteRepository faculteRepo;
    @Autowired private DepartementRepository departementRepo;
    @Autowired private FiliereRepository filiereRepo;
    @Autowired private PromotionRepository promotionRepo;
    @Autowired private AnneeAcademiqueRepository anneeRepo;
    @Autowired private EtudiantRepository etudiantRepo;
    @Autowired private InscriptionRepository inscriptionRepo;
    @Autowired private CoursRepository coursRepo;
    @Autowired private NoteRepository noteRepo;
    @Autowired private DeliberationRepository deliberationRepo;

    @Autowired private DeliberationService deliberationService;
    @Autowired private TransitionAnneeService transitionService;

    private Universite universite;
    private Departement departement;
    private Filiere filiere;
    private Etudiant etudiant;
    private Cours cours;

    /** Suffixe unique : le conteneur PostgreSQL est partagé entre classes de test. */
    private final String uid = Long.toString(System.nanoTime()).substring(9);

    @BeforeEach
    void preparerEtablissement() {
        universite = universiteRepo.save(Universite.builder()
                .nom("Haute École de Commerce " + uid)
                .code("HEC" + uid)
                .ville("Kinshasa")
                .typeEtablissement("INSTITUT")
                .actif(true)
                .build());

        Faculte faculte = faculteRepo.save(Faculte.builder()
                .nom("Sciences commerciales")
                .code("FSC" + uid)
                .universite(universite)
                .build());

        departement = departementRepo.save(Departement.builder()
                .nom("Gestion")
                .code("DGE" + uid)
                .faculte(faculte)
                .universite(universite)
                .build());

        filiere = filiereRepo.save(Filiere.builder()
                .nom("Comptabilité")
                .code("FCPTA" + uid)
                .departement(departement)
                .build());

        // Les trois niveaux du graduat, déclinés pour CHAQUE année académique —
        // comme le fait un établissement réel, puisqu'une promotion est rattachée
        // à une année. C'est ce qui fait coexister plusieurs lignes « G2 » et
        // qui mettait en défaut une recherche par (filière, libellé) seuls.
        for (String libelleAnnee : List.of("2024-2025", "2025-2026", "2026-2027", "2027-2028")) {
            AnneeAcademique a = annee(libelleAnnee);
            for (String niveau : List.of("G1", "G2", "G3")) {
                promotionRepo.save(Promotion.builder()
                        .libelle(niveau)
                        .code(niveau + "_CPTA_" + uid + "_" + libelleAnnee)
                        .filiere(filiere)
                        .anneeAcademique(a)
                        .creditsRequis(60)
                        .actif(true)
                        .build());
            }
        }

        etudiant = etudiantRepo.save(Etudiant.builder()
                .nom("MBEMBA")
                .prenom("Jean")
                .email("zztest.parcours+" + uid + "@example.invalid")
                .matriculePermanent("HECGRD" + uid)
                .build());

        cours = coursRepo.save(Cours.builder()
                .titre("Comptabilité générale")
                .code("CPTA" + uid)
                .credits(60)
                .niveau("G1")
                .universite(universite)
                .departement(departement)
                .build());
    }

    @Test
    @DisplayName("De la première année au diplôme : G1 → G2 → G3 → DIPLOME")
    void parcoursCompletJusquAuDiplome() {
        AnneeAcademique annee1 = annee("2024-2025");
        Inscription inscription = inscrire(etudiant, promotion("G1", "2024-2025"), annee1);

        // ── Année 1 : G1 ────────────────────────────────────────────
        Deliberation delibG1 = deroulerFinDAnnee(inscription, annee1.getLibelle(), 14.0);
        assertThat(delibG1.getDecision())
                .as("un G1 réussi passe en G2, il n'est pas encore diplômé")
                .isEqualTo(DecisionJury.ADMIS);

        Map<String, Object> passage1 = passerLaClasse(annee1, annee("2025-2026"));
        assertThat(passage1.get("erreurs")).as("aucune erreur au passage G1→G2").isEqualTo(0);
        assertThat(passage1.get("reinscrits")).isEqualTo(1);

        // ── Année 2 : G2 ────────────────────────────────────────────
        Inscription enG2 = derniereInscription();
        assertThat(niveau(enG2)).isEqualTo("G2");

        deroulerFinDAnnee(enG2, "2025-2026", 13.0);
        Map<String, Object> passage2 = passerLaClasse(annee("2025-2026"), annee("2026-2027"));
        assertThat(passage2.get("erreurs")).isEqualTo(0);
        assertThat(passage2.get("reinscrits")).isEqualTo(1);

        // ── Année 3 : G3, année terminale ───────────────────────────
        Inscription enG3 = derniereInscription();
        assertThat(niveau(enG3)).isEqualTo("G3");

        Deliberation delibG3 = deroulerFinDAnnee(enG3, "2026-2027", 15.0);
        assertThat(delibG3.getDecision())
                .as("G3 est la fin du graduat : le jury prononce le diplôme, "
                  + "condition exigée par la délivrance du titre")
                .isEqualTo(DecisionJury.DIPLOME);

        Map<String, Object> passage3 = passerLaClasse(annee("2026-2027"), annee("2027-2028"));
        assertThat(passage3.get("diplomes")).isEqualTo(1);
        assertThat(passage3.get("reinscrits")).as("un diplômé n'est pas réinscrit").isEqualTo(0);
    }

    @Test
    @DisplayName("Le passage de classe refuse une délibération non publiée")
    void passageRefuseUneDeliberationNonPubliee() {
        AnneeAcademique annee = annee("2024-2025");
        Inscription inscription = inscrire(etudiant, promotion("G1", "2024-2025"), annee);
        publierNotes(inscription, annee.getLibelle(), 14.0);

        // Préparée mais jamais soumise au jury ni publiée.
        deliberationService.preparer(inscription.getId(), annee.getLibelle());

        Map<String, Object> resultat = passerLaClasse(annee, annee("2025-2026"));
        assertThat(resultat.get("reinscrits")).isEqualTo(0);
        assertThat(resultat.get("erreurs")).isEqualTo(1);
        assertThat((List<?>) resultat.get("erreursDetails")).first().asString()
                .contains("délibération non publiée");
    }

    @Test
    @DisplayName("Un brouillon reste recalculable après correction d'une note")
    void brouillonRecalculableApresCorrection() {
        AnneeAcademique annee = annee("2024-2025");
        Inscription inscription = inscrire(etudiant, promotion("G1", "2024-2025"), annee);
        publierNotes(inscription, annee.getLibelle(), 9.0);

        // 9/20 sur l'unique cours : aucun crédit validé (il en faut 10/20),
        // donc redoublement — et non rattrapage, qui exige la moitié des crédits.
        Deliberation premier = deliberationService.preparer(inscription.getId(), annee.getLibelle());
        assertThat(premier.getDecision()).isEqualTo(DecisionJury.REDOUBLE);

        // La note est corrigée après coup : le jury doit pouvoir repartir des
        // données à jour plutôt que d'être figé sur un calcul périmé.
        Note note = noteRepo.findAll().stream()
                .filter(n -> n.getInscription().getId().equals(inscription.getId()))
                .findFirst().orElseThrow();
        note.setNoteRetenue(16.0);
        noteRepo.save(note);

        Deliberation recalcule = deliberationService.preparer(inscription.getId(), annee.getLibelle());
        assertThat(recalcule.getId()).as("mise à jour en place, pas de doublon").isEqualTo(premier.getId());
        assertThat(recalcule.getDecision()).isEqualTo(DecisionJury.ADMIS);
        assertThat(deliberationRepo.findAll().stream()
                .filter(d -> d.getInscription().getId().equals(inscription.getId()))
                .count()).isEqualTo(1);
    }

    // ══════════════════════════════════════════════════════════════
    // Utilitaires
    // ══════════════════════════════════════════════════════════════

    /** Notes publiées → préparation → tenue du jury → publication. */
    private Deliberation deroulerFinDAnnee(Inscription inscription, String annee, double moyenne) {
        publierNotes(inscription, annee, moyenne);

        Deliberation prete = deliberationService.preparer(inscription.getId(), annee);
        assertThat(prete.getStatut()).isEqualTo(StatutDeliberation.PRÊTE);

        Deliberation tenue = deliberationService.tenuePar(prete.getId(), Map.of());
        assertThat(tenue.getStatut())
                .as("le jury doit pouvoir siéger sur une délibération PRÊTE")
                .isEqualTo(StatutDeliberation.TENUE);

        Deliberation publiee = deliberationService.publier(tenue.getId());
        assertThat(publiee.getStatut()).isEqualTo(StatutDeliberation.PUBLIEE);
        return publiee;
    }

    private void publierNotes(Inscription inscription, String annee, double moyenne) {
        noteRepo.save(Note.builder()
                .inscription(inscription)
                .cours(cours)
                .universite(universite)
                .anneeAcademique(annee)
                .session(1)
                .credits(60)
                .noteMax(20.0)
                .noteRetenue(moyenne)
                .noteFinale(moyenne)
                // La délibération se fonde sur les notes PUBLIEE.
                .statut(StatutNote.PUBLIEE)
                .build());
    }

    private Map<String, Object> passerLaClasse(AnneeAcademique courante, AnneeAcademique suivante) {
        return transitionService.executerPassageClasse(
                universite.getId(), courante.getLibelle(), suivante.getLibelle(), 1.0);
    }

    private Inscription derniereInscription() {
        return inscriptionRepo.findByEtudiant_Id(etudiant.getId()).stream()
                .max((a, b) -> Long.compare(a.getId(), b.getId()))
                .orElseThrow();
    }

    /**
     * Libellé de la promotion, relu par son identifiant.
     *
     * <p>{@code inscription.getPromotion()} rend un proxy paresseux : le lire
     * hors session lèverait une {@code LazyInitializationException}. Appeler
     * {@code getId()} n'initialise pas le proxy, on peut donc recharger.</p>
     */
    private String niveau(Inscription inscription) {
        return promotionRepo.findById(inscription.getPromotion().getId())
                .orElseThrow().getLibelle();
    }

    private Promotion promotion(String libelle, String annee) {
        return promotionRepo.findByFiliereIdAndLibelleAndAnneeAcademiqueId(
                filiere.getId(), libelle, annee(annee).getId()).orElseThrow();
    }

    /** Année propre à CET établissement : l'unicité porte sur (libelle, universite). */
    private AnneeAcademique annee(String libelle) {
        return anneeRepo.findByLibelleAndUniversite(libelle, universite)
                .orElseGet(() -> anneeRepo.save(new AnneeAcademique(libelle, true, universite)));
    }

    private Inscription inscrire(Etudiant etudiant, Promotion promotion, AnneeAcademique annee) {
        return inscriptionRepo.save(Inscription.builder()
                .etudiant(etudiant)
                .universite(universite)
                .departement(departement)
                .filiere(filiere)
                .promotion(promotion)
                .anneeAcademique(annee)
                .niveau(promotion.getLibelle())
                .matricule("HEC" + uid + promotion.getLibelle())
                .nom(etudiant.getNom())
                .prenom(etudiant.getPrenom())
                .email(etudiant.getEmail())
                .statut(StatutInscription.VALIDE)
                .build());
    }
}
